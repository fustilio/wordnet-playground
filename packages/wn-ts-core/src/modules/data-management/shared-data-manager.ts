/**
 * Shared Data Management System
 * 
 * This module provides environment-agnostic data management functionality
 * that can be used by both wn-ts-web and wn-ts-node implementations.
 */

import type { Database } from '../../types/database.js';
import type { LMFDocument } from 'wn-ts-core';
import type { Kysely } from 'kysely';
import {
  prepareLexiconData,
  prepareWordData,
  prepareSynsetData,
  prepareSenseData,
  prepareDefinitionData,
  insertLMFDataInTransaction,
  clearConflictingLexiconData
} from '../database-operations/mutations/index.js';

export interface DataManagerOptions {
  force?: boolean;
  progress?: (progress: number, message?: string) => void;
  dryRun?: boolean;
  parser?: string;
}

export interface DataManagerLogger {
  info(message: string, data?: any): void;
  debug(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  step(message: string, data?: any): void;
  start(message: string): void;
  end(message: string): void;
  fail(message: string, data?: any): void;
}

export interface DataManagerAdapter {
  // Database operations
  getQueryService(): any;
  getDatabase(): Kysely<Database>;
  
  // File operations
  downloadFile(url: string, progress?: (progress: number) => void): Promise<ArrayBuffer>;
  loadFile(path: string): Promise<string>;
  saveFile(path: string, data: ArrayBuffer): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  
  // Archive operations
  extractArchive(path: string, destination: string): Promise<string>;
  decompressFile(path: string, destination: string): Promise<void>;
  findLMFiles(directory: string): Promise<string[]>;
  
  // Parsing operations
  parseLMF(content: string, options?: any): Promise<LMFDocument>;
  parseILI(content: string): Promise<any[]>;
  
  // Logging
  getLogger(): DataManagerLogger;
}

export interface ProjectInfo {
  id: string;
  label: string;
  language: string;
  version?: string;
  license?: string;
  url?: string;
  citation?: string;
  allUrls: string[];
  primaryUrl: string;
  fallbackUrls: string[];
  error?: string;
}

/**
 * Shared Data Manager
 * 
 * Provides common data management functionality that works across environments
 */
export class SharedDataManager {
  protected adapter: DataManagerAdapter;
  protected logger: DataManagerLogger;

  constructor(adapter: DataManagerAdapter) {
    this.adapter = adapter;
    this.logger = adapter.getLogger();
  }

  /**
   * Download and load a project
   */
  async downloadAndLoad(
    projectId: string,
    options: DataManagerOptions = {}
  ): Promise<void> {
    const { progress } = options;
    
    this.logger.info(`📥 Downloading project: ${projectId}`);

    // Get project information
    const project = await this.getProjectInfo(projectId);
    
    // Check for project version errors
    if (project.error) {
      throw new Error(`Project version error: ${project.error}`);
    }

    // Check dependencies
    await this.ensureDependenciesLoaded(projectId);

    // Get URLs
    const urls = project.allUrls;
    if (!urls || urls.length === 0) {
      throw new Error(`No download URL found for project ${projectId}`);
    }

    this.logger.info(`🔗 URL information for ${projectId}:`, {
      urlCount: urls.length,
      primaryUrl: project.primaryUrl,
      allUrls: urls,
      fallbackUrls: project.fallbackUrls,
    });

    let lastError: Error | null = null;

    // Try each URL until one works
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue; // Skip undefined URLs
      
      const isFallback = i >= (project.primaryUrl ? 1 : 0);
      const urlType = isFallback ? "fallback" : "primary";

      try {
        this.logger.info(
          `🌐 [${urlType.toUpperCase()}] Attempt ${i + 1}/${urls.length}: ${url}...`
        );

        const data = await this.adapter.downloadFile(url, progress);

        // Additional check: verify we actually got data
        if (data.byteLength === 0) {
          this.logger.warn(
            `⚠️ URL ${url} returned empty response (0 bytes) - trying next URL`
          );
          continue;
        }

        // Load the data into the database
        this.logger.info(
          `📊 Loading data (${data.byteLength} bytes) into database...`
        );

        await this.loadData(data, projectId, progress);
        
        this.logger.info(`✅ Successfully loaded ${projectId}`);
        return; // Success, exit early
      } catch (error) {
        this.logger.warn(`⚠️ Failed to download from ${url}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
        lastError = error as Error;
        // Continue to next URL
      }
    }

    // If we get here, all URLs failed
    this.logger.error(`❌ All URLs failed for ${projectId}:`, {
      totalAttempts: urls.length,
      primaryUrls: [project.primaryUrl],
      fallbackUrls: project.fallbackUrls,
      lastError: lastError?.message,
    });
    throw new Error(
      `❌ Failed to download/load project ${projectId} from all URLs. Last error: ${lastError?.message}`
    );
  }

  /**
   * Load data from a buffer
   */
  async loadFromBuffer(
    data: ArrayBuffer,
    projectId: string,
    options: DataManagerOptions = {}
  ): Promise<void> {
    const { progress } = options;
    await this.loadData(data, projectId, progress);
  }

  /**
   * Add a lexical resource from a file path
   */
  async addFromFile(
    path: string,
    options: DataManagerOptions = {}
  ): Promise<boolean> {
    const { progress } = options;
    
    this.logger.info(`Adding lexical resource: ${path}`);

    try {
      // Process the file (extract archives, etc.)
      const processedPath = await this.processFile(path, progress);
      
      // Determine file type and load accordingly
      const isLmfFile = await this.isLMF(processedPath);
      const isIliFile = await this.isILI(processedPath);
      
      if (isLmfFile) {
        return await this.addLMF(processedPath, { ...options, parser: options.parser || "" });
      } else if (isIliFile) {
        return await this.addILI(processedPath, options);
      } else {
        throw new Error(`File is not a valid LMF or ILI file: ${processedPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to add lexical resource:`, error);
      throw error;
    }
  }

  /**
   * Remove a lexical resource
   */
  async remove(lexiconId: string): Promise<boolean> {
    this.logger.info(`Removing lexicon: ${lexiconId}`);

    try {
      const queryService = this.adapter.getQueryService();
      
      // Check if lexicon exists
      const existing = await queryService.getLexiconById(lexiconId);
      if (!existing) {
        throw new Error(`Lexicon ${lexiconId} does not exist.`);
      }

      // Delete the lexicon and all related data
      await queryService.deleteLexicon(lexiconId);
      
      this.logger.info(`Lexicon ${lexiconId} removed successfully.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove lexicon ${lexiconId}:`, error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    const queryService = this.adapter.getQueryService();
    if (queryService && queryService.getStatistics) {
      return queryService.getStatistics();
    }
    throw new Error("Query service not available for statistics");
  }

  /**
   * Check if any data exists in the database
   */
  async hasData(): Promise<boolean> {
    try {
      const stats = await this.getStatistics();
      return stats.totalWords > 0 || stats.totalSynsets > 0;
    } catch (error) {
      this.logger.warn("Failed to check if data exists:", error);
      return false;
    }
  }

  /**
   * Ensure data is loaded (load if not present)
   */
  async ensureDataLoaded(projectId: string = "oewn:2024"): Promise<void> {
    const hasData = await this.hasData();
    if (!hasData) {
      this.logger.info("📥 No data found, loading automatically...");
      await this.downloadAndLoad(projectId);
    } else {
      this.logger.info("📊 Data already loaded");
    }
  }

  // Private methods

  /**
   * Load data into the database
   */
  private async loadData(
    data: ArrayBuffer,
    projectId: string,
    progress?: (progress: number, message?: string) => void
  ): Promise<void> {
    this.logger.debug(`🔍 Loading data for ${projectId}`);

    if (progress) {
      progress(0.05, 'Starting data processing...');
    }

    // Use WordNet processor to handle decompression and format detection
    const wordnetResult = await this.processWordNetData(data, projectId, progress);
    
    if (!wordnetResult.success) {
      throw new Error(`WordNet processing failed: ${wordnetResult.error}`);
    }

    this.logger.info(`✅ WordNet processing completed successfully`, {
      projectId: wordnetResult.projectId,
      language: wordnetResult.language,
      version: wordnetResult.version,
      contentType: wordnetResult.contentType,
      confidence: wordnetResult.confidence,
    });

    if (progress) progress(0.3, 'Analyzing content type...');
    const xmlText = wordnetResult.xmlContent!;

    // Handle different content types
    if (wordnetResult.contentType === "ili" || wordnetResult.contentType === "cili-data") {
      await this.loadILIData(xmlText, projectId, progress);
    } else if (wordnetResult.contentType === "lmf" || wordnetResult.contentType === "omw-package" || wordnetResult.contentType === "own-package") {
      await this.loadLMFData(xmlText, projectId, progress);
    } else {
      // Default to LMF XML processing for unknown types
      this.logger.warn(
        `⚠️ Unknown content type '${wordnetResult.contentType}', attempting XML processing`
      );
      
      if (!xmlText.includes("<LexicalResource")) {
        throw new Error(
          "Unknown content type does not contain LexicalResource element - file may be corrupted or in unsupported format"
        );
      }
      
      await this.loadLMFData(xmlText, projectId, progress);
    }

    this.logger.info(`✅ Successfully loaded ${projectId}`);
  }

  /**
   * Load ILI data
   */
  private async loadILIData(
    content: string,
    projectId: string,
    progress?: (progress: number, message?: string) => void
  ): Promise<void> {
    this.logger.info(`📝 Loading ILI data for ${projectId}`);

    if (progress) progress(0.35, 'Parsing ILI data...');
    
    const iliData = await this.parseILIData(content);
    this.logger.info(`📊 Loaded ${iliData.length} ILI records`);

    if (progress) progress(0.5, 'Inserting ILI data...');

    // Insert ILI data
    await this.insertILIData(iliData, projectId);

    if (progress) progress(1.0, 'ILI data loaded successfully');
    this.logger.info(`✅ ILI data loaded successfully for ${projectId}`);
  }

  /**
   * Load LMF data
   */
  private async loadLMFData(
    content: string,
    projectId: string,
    progress?: (progress: number, message?: string) => void
  ): Promise<void> {
    this.logger.info(`📝 Loading LMF data for ${projectId}`);

    if (progress) progress(0.35, 'XML content verified');

    this.logger.start(`processing LMF data for ${projectId}`);

    try {
      if (progress) progress(0.4, 'Starting LMF parsing...');

      const lmfDocument = await this.adapter.parseLMF(content, { debug: false });

      this.logger.step(`LMF parsing completed successfully`, {
        lexicons: lmfDocument.lexicons?.length || 0,
        words: lmfDocument.words?.length || 0,
        synsets: lmfDocument.synsets?.length || 0,
        senses: lmfDocument.senses?.length || 0,
      });

      if (progress) progress(0.7, 'LMF parsing completed, preparing database insertion...');

      // Insert the parsed data into the database
      this.logger.step(`inserting parsed data into database`);
      if (progress) progress(0.8, 'Inserting data into database...');
      
      await this.insertLMFData(lmfDocument, projectId, progress);

      if (progress) progress(1.0, 'LMF data loaded successfully');

      this.logger.info(`LMF data loaded successfully`, {
        projectId: projectId,
      });
    } catch (error) {
      this.logger.fail(`LMF parsing failed`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Insert LMF data into the database with conflict resolution
   */
  protected async insertLMFData(
    lmfDocument: LMFDocument,
    projectId: string,
    _progress?: (progress: number, message?: string) => void
  ): Promise<void> {
    this.logger.start(`inserting LMF data for ${projectId}`);

    const queryService = this.adapter.getQueryService();
    if (!queryService) {
      throw new Error("Query service not available for batch insert.");
    }

    try {
      // Clear any conflicting data first
      await this.clearConflictingData(projectId);

      // Use the refactored functions to prepare data
      const lexiconsToInsert = prepareLexiconData(lmfDocument, projectId);
      const wordsToInsert = prepareWordData(lmfDocument, projectId);
      const synsetsToInsert = prepareSynsetData(lmfDocument, projectId);

      // Prepare sense data with validation
      const validWordIds = new Set(wordsToInsert.map((w: any) => w.id));
      const validSynsetIds = new Set(synsetsToInsert.map((s: any) => s.id));
      const sensesToInsert = prepareSenseData(lmfDocument, validWordIds, validSynsetIds);

      // Prepare definition data
      const definitionsToInsert = prepareDefinitionData(lmfDocument);

      this.logger.step(`preparing final insertion data`, {
        lexicons: lexiconsToInsert.length,
        words: wordsToInsert.length,
        synsets: synsetsToInsert.length,
        senses: sensesToInsert.length,
        definitions: definitionsToInsert.length,
      });

      // Use the refactored transaction function
      await insertLMFDataInTransaction(
        this.adapter.getDatabase(),
        {
          lexicons: lexiconsToInsert,
          words: wordsToInsert,
          synsets: synsetsToInsert,
          senses: sensesToInsert,
          definitions: definitionsToInsert,
        },
        this.logger
      );

      this.logger.info(`LMF data inserted successfully`, {
        projectId: projectId,
        lexicons: lexiconsToInsert.length,
        words: wordsToInsert.length,
        synsets: synsetsToInsert.length,
        senses: sensesToInsert.length,
        definitions: definitionsToInsert.length,
      });

      this.logger.end(`inserting LMF data for ${projectId}`);
    } catch (error) {
      this.logger.fail(`failed to insert LMF data`, {
        projectId: projectId,
        error: error instanceof Error ? error.message : String(error),
      });

      this.logger.end(`inserting LMF data for ${projectId}`);
      throw error;
    }
  }

  /**
   * Insert ILI data into the database
   */
  protected async insertILIData(
    iliData: any[],
    projectId: string
  ): Promise<void> {
    this.logger.debug(`📝 Inserting ILI data for ${projectId}...`);

    try {
      // Insert lexicon information first
      await this.insertLexicon(projectId);

      // Insert ILI records
      const iliRecords: Database["ilis"][] = iliData.map((record) => ({
        id: record.id,
        definition: record.definition || null,
        status: record.status || "active",
        meta: null,
      }));

      const queryService = this.adapter.getQueryService();
      if (queryService) {
        this.logger.debug(`📝 Inserting ${iliRecords.length} ILI records...`);
        await queryService.batchInsert("ilis", iliRecords);
        this.logger.debug(`✅ ILI data inserted for ${projectId}`);
      } else {
        throw new Error("Query service not available for ILI insertion");
      }
    } catch (error) {
      this.logger.error(`❌ Failed to insert ILI data for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Clear conflicting data before insertion
   */
  private async clearConflictingData(projectId: string): Promise<void> {
    this.logger.debug(`🧹 Clearing conflicting data for ${projectId}`);
    
    try {
      const queryService = this.adapter.getQueryService();
      if (!queryService) {
        this.logger.warn("Query service not available for conflict clearing");
        return;
      }

      // Parse project ID to get base ID and version
      const [baseId] = projectId.split(':');
      if (!baseId) {
        this.logger.warn(`Invalid project ID format: ${projectId}`);
        return;
      }

      // Clear conflicting data using the shared function
      await clearConflictingLexiconData(
        this.adapter.getDatabase(),
        [baseId, projectId],
        this.logger
      );

      this.logger.debug(`✅ Conflicting data cleared for ${projectId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear conflicting data for ${projectId}:`, error);
      // Don't throw - this is not critical for the operation
    }
  }

  /**
   * Insert lexicon information
   */
  private async insertLexicon(projectId: string): Promise<void> {
    try {
      const project = await this.getProjectInfo(projectId);
      
      const lexiconData = {
        id: projectId,
        label: project.label,
        language: project.language,
        version: project.version ?? null,
        license: project.license ?? null,
        url: project.url ?? null,
        citation: project.citation ?? null,
        email: null,
        logo: null,
        metadata: null,
      };

      const queryService = this.adapter.getQueryService();
      if (queryService) {
        await queryService.insertLexicon(lexiconData);
      } else {
        throw new Error("Query service not available for lexicon insertion");
      }
      
      this.logger.debug(`✅ Lexicon inserted: ${projectId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to insert lexicon ${projectId}:`, error);
      throw error;
    }
  }

  // Abstract methods that need to be implemented by environment-specific adapters

  protected async getProjectInfo(_projectId: string): Promise<ProjectInfo> {
    throw new Error("getProjectInfo must be implemented by environment-specific adapter");
  }

  protected async processWordNetData(
    data: ArrayBuffer,
    projectId: string,
    progress?: (progress: number, message?: string) => void
  ): Promise<any> {
    // Suppress unused parameter warnings
    void data;
    void projectId;
    void progress;
    throw new Error("processWordNetData must be implemented by environment-specific adapter");
  }

  protected async parseILIData(content: string): Promise<any[]> {
    // Suppress unused parameter warnings
    void content;
    throw new Error("parseILIData must be implemented by environment-specific adapter");
  }

  protected async processFile(
    path: string,
    progress?: (progress: number) => void
  ): Promise<string> {
    // Suppress unused parameter warnings
    void path;
    void progress;
    throw new Error("processFile must be implemented by environment-specific adapter");
  }

  protected async isLMF(path: string): Promise<boolean> {
    // Suppress unused parameter warnings
    void path;
    throw new Error("isLMF must be implemented by environment-specific adapter");
  }

  protected async isILI(path: string): Promise<boolean> {
    // Suppress unused parameter warnings
    void path;
    throw new Error("isILI must be implemented by environment-specific adapter");
  }

  protected async addLMF(
    path: string,
    options: DataManagerOptions & { parser?: string }
  ): Promise<boolean> {
    // Suppress unused parameter warnings
    void path;
    void options;
    throw new Error("addLMF must be implemented by environment-specific adapter");
  }

  protected async addILI(
    path: string,
    options: DataManagerOptions
  ): Promise<boolean> {
    // Suppress unused parameter warnings
    void path;
    void options;
    throw new Error("addILI must be implemented by environment-specific adapter");
  }

  protected async ensureDependenciesLoaded(projectId: string): Promise<void> {
    // Default implementation - can be overridden by environment-specific adapters
    this.logger.debug(`📦 No dependencies for ${projectId}`);
  }

  // Core utility methods

  /**
   * Sanitize lexicon ID to ensure consistent format
   */
  protected sanitizeLexiconId(lexiconId: string): string {
    // Remove any double colons or malformed IDs
    if (lexiconId.includes('::')) {
      return lexiconId.replace(/::+/g, ':');
    }
    
    // Ensure proper format: base:version or just base
    const parts = lexiconId.split(':');
    if (parts.length > 2) {
      // Take only the first two parts (base:version)
      return `${parts[0]}:${parts[1]}`;
    }
    
    return lexiconId;
  }

  /**
   * Format package ID from base and version
   */
  protected formatPackageId(baseId: string, version: string): string {
    return `${baseId}:${version}`;
  }

  /**
   * Validate project ID format
   */
  protected validateProjectId(projectId: string): { isValid: boolean; baseId?: string; version?: string } {
    const parts = projectId.split(':');
    
    if (parts.length === 1) {
      return { isValid: false };
    }
    
    if (parts.length === 2) {
      const [baseId, version] = parts;
      if (baseId && version) {
        return { isValid: true, baseId, version };
      }
    }
    
    return { isValid: false };
  }

  /**
   * Check if a lexicon ID is malformed (e.g., oewn:2024:2024)
   */
  protected isMalformedLexiconId(lexiconId: string): boolean {
    const parts = lexiconId.split(':');
    return parts.length > 2 || (parts.length === 2 && parts[0] === parts[1]);
  }

  /**
   * Get statistics with detailed breakdown
   */
  async getDetailedStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
    lexiconBreakdown: Array<{
      id: string;
      label: string;
      wordCount: number;
      synsetCount: number;
      senseCount: number;
    }>;
  }> {
    const queryService = this.adapter.getQueryService();
    if (!queryService || !queryService.getDetailedStatistics) {
      // Fallback to basic statistics
      const basicStats = await this.getStatistics();
      return {
        ...basicStats,
        lexiconBreakdown: []
      };
    }
    
    return queryService.getDetailedStatistics();
  }
}

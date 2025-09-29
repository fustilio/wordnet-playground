/**
 * Node Data Manager
 * 
 * Concrete implementation of SharedDataManager for Node.js environments
 */

import { SharedDataManager } from 'wn-ts-core';
import type { LMFDocument } from 'wn-ts-core';
import type { DataManagerOptions, DataManagerLogger, DataManagerProjectInfo, QueryService } from 'wn-ts-core';
import { logger } from 'wn-ts-core';
import { ProjectError } from 'wn-ts-core';

// DataManagerLogger implementation for Node.js
class NodeDataManagerLogger implements DataManagerLogger {
  info(message: string, data?: any): void {
    logger.info(message, data);
  }
  
  debug(message: string, data?: any): void {
    logger.debug(message, data);
  }
  
  warn(message: string, data?: any): void {
    logger.warn(message, data);
  }
  
  error(message: string, data?: any): void {
    logger.error(message, data);
  }
  
  step(message: string, data?: any): void {
    logger.info(`[STEP] ${message}`, data);
  }
  
  start(message: string): void {
    logger.info(`[START] ${message}`);
  }
  
  end(message: string): void {
    logger.info(`[END] ${message}`);
  }
  
  fail(message: string, data?: any): void {
    logger.error(`[FAIL] ${message}`, data);
  }
}
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { extractTarArchive, decompressXz, decompressGz, findLMFiles } from '../../utils/archive.js';
import { loadLMF, isLMF } from '../../lmf.js';
import { loadILI, isILI } from '../../ili.js';
// import { getProjectVersionUrls } from '../../project.js'; // Unused

export interface NodeDataManagerConfig {
  database: NodeDatabase;
  wordnet: NodeWordnet;
  projectIndex?: ProjectIndex;
  downloadDirectory?: string;
}

export interface NodeDatabase {
  getQueryService(): QueryService;
}

export interface NodeWordnet {
  getQueryService(): QueryService;
}

// Export QueryService interface
export type { QueryService };

// QueryService interface is now imported from wn-ts-core

export interface LexiconInfo {
  id: string;
  label: string;
  language: string;
  version: string;
  wordCount: number;
  synsetCount: number;
  senseCount: number;
  iliCount: number;
  loadedAt?: string;
}

export interface ProjectIndex {
  [key: string]: DataManagerProjectInfo;
}

/**
 * Node.js-specific data manager that extends SharedDataManager
 */
export class NodeDataManager extends SharedDataManager {
  private config: NodeDataManagerConfig;
  protected logger: DataManagerLogger;

  constructor(config: NodeDataManagerConfig) {

    // Create a simple adapter that implements the required interface
    const adapter = {
      getQueryService: () => config.wordnet.getQueryService(),
      getDatabase: () => config.wordnet.getQueryService().database,
      downloadFile: (url: string, progress?: (progress: number) => void) => this.downloadFile(url, progress),
      loadFile: (path: string) => this.loadFile(path),
      saveFile: (path: string, data: ArrayBuffer) => this.saveFile(path, data),
      fileExists: (path: string) => this.fileExists(path),
      extractArchive: (path: string, destination: string) => this.extractArchive(path, destination),
      decompressFile: (path: string, destination: string) => this.decompressFile(path, destination),
      findLMFiles: (directory: string) => this.findLMFiles(directory),
      parseLMF: (content: string, options?: any) => this.parseLMF(content, options),
      parseILI: (content: string) => this.parseILI(content),
      getLogger: () => new NodeDataManagerLogger(),
    };
    
    super(adapter);
    this.config = config;
    this.logger = new NodeDataManagerLogger();
  }

  // Platform-specific methods that implement the DataManagerAdapter interface

  /**
   * Download file from URL
   */
  async downloadFile(url: string, _progress?: (progress: number) => void): Promise<ArrayBuffer> {
    this.logger.debug(`📥 Downloading file from: ${url}`);
    // Note: nodeDownloadFile might have a different signature, so we'll implement a simple version
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }

  async loadFile(path: string): Promise<string> {
    this.logger.debug(`📖 Loading file: ${path}`);
    return readFileSync(path, 'utf-8');
  }

  async saveFile(path: string, data: ArrayBuffer): Promise<void> {
    this.logger.debug(`💾 Saving file: ${path}`);
    const buffer = Buffer.from(data);
    writeFileSync(path, buffer);
  }

  async fileExists(path: string): Promise<boolean> {
    return existsSync(path);
  }

  async extractArchive(path: string, _destination: string): Promise<string> {
    this.logger.debug(`📦 Extracting archive: ${path}`);
    return await extractTarArchive(path);
  }

  async decompressFile(path: string, destination: string): Promise<void> {
    this.logger.debug(`🗜️ Decompressing file: ${path} -> ${destination}`);
    
    if (path.endsWith('.xz')) {
      await decompressXz(path, destination);
    } else if (path.endsWith('.gz')) {
      await decompressGz(path, destination);
    } else {
      throw new Error(`Unsupported compression format: ${path}`);
    }
  }

  async findLMFiles(directory: string): Promise<string[]> {
    this.logger.debug(`🔍 Finding LMF files in: ${directory}`);
    return await findLMFiles(directory);
  }

  async parseLMF(content: string, options?: any): Promise<LMFDocument> {
    this.logger.debug(`📝 Parsing LMF content`);
    
    // Create temporary file for LMF parsing
    const tempDir = this.config.downloadDirectory || '/tmp';
    const tempFile = join(tempDir, `temp-lmf-${randomUUID()}.xml`);
    
    try {
      writeFileSync(tempFile, content, 'utf-8');
      const lmfDocument = await loadLMF(tempFile, options);
      unlinkSync(tempFile); // Clean up temp file
      return lmfDocument;
    } catch (error) {
      // Clean up temp file on error
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
      throw error;
    }
  }

  async parseILI(content: string): Promise<ILIRecord[]> {
    this.logger.debug(`📝 Parsing ILI content`);
    
    // Create temporary file for ILI parsing
    const tempDir = this.config.downloadDirectory || '/tmp';
    const tempFile = join(tempDir, `temp-ili-${randomUUID()}.tsv`);
    
    try {
      writeFileSync(tempFile, content, 'utf-8');
      const iliData = await loadILI(tempFile);
      // Convert IliRecord[] to ILIRecord[] by ensuring definition is always present
      return iliData.map((record: any) => ({
        id: record.id,
        definition: record.definition || '',
        status: record.status || 'active'
      }));
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFile);
      } catch (error) {
        this.logger.warn(`Failed to clean up temporary file ${tempFile}:`, error);
      }
    }
  }

  /**
   * Get project information from the centralized configuration
   */
  protected async getProjectInfo(projectId: string): Promise<DataManagerProjectInfo> {
    this.logger.debug(`🔍 Getting project info for: ${projectId}`);

    try {
      // Import the centralized configuration
      const configModule = await import('wn-ts-core/config/project-config');
      const { 
        getProjectConfig, 
        getAllProjectUrls,
        validateProjectId 
      } = configModule;
      
      // Validate project ID format
      if (!validateProjectId(projectId)) {
        throw new Error(`Invalid project ID format: ${projectId}. Expected format: base:version`);
      }

      const projectConfig = getProjectConfig(projectId);
      if (!projectConfig) {
        throw new Error(`Project not found: ${projectId}`);
      }
      
      // Get all URLs (primary + fallback)
      const allUrls = getAllProjectUrls(projectId);
      
      const [, version] = projectId.split(':');
      
      return {
        id: projectId,
        label: projectConfig.label,
        language: projectConfig.language,
        version: version || '1.0',
        license: projectConfig.license || 'MIT',
        url: allUrls[0] || '',
        allUrls: allUrls,
        primaryUrl: allUrls[0] || '',
        fallbackUrls: allUrls.slice(1),
      };
    } catch (error) {
      this.logger.warn(`⚠️ Failed to get project info for ${projectId}, using fallback:`, error);
      
      // Fallback to basic project info if configuration fails
      const [, version] = projectId.split(':');
      return {
        id: projectId,
        label: projectId ? `${projectId.replace(':', ' ')}` : 'Unknown Project',
        language: 'en',
        version: version || '1.0',
        license: 'MIT',
        url: '',
        allUrls: [],
        primaryUrl: '',
        fallbackUrls: [],
      };
    }
  }

  /**
   * Process WordNet data using the WordNet processor
   */
  protected async processWordNetData(
    data: ArrayBuffer,
    projectId: string,
    _progress?: (progress: number, message?: string) => void
  ): Promise<WordNetProcessingResult> {
    this.logger.debug(`🔄 Processing WordNet data for: ${projectId}`);

    // Save data to temporary file
    const tempDir = this.config.downloadDirectory || '/tmp';
    const tempFile = join(tempDir, `temp-wordnet-${randomUUID()}.gz`);
    
    try {
      writeFileSync(tempFile, Buffer.from(data));
      
      // Process the file
      const result = await this.processFile(tempFile);
      
      return {
        success: true,
        projectId,
        language: 'en',
        version: '1.0',
        contentType: 'lmf',
        confidence: 'high' as const,
        xmlContent: result,
        error: null,
      };
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFile);
      } catch (error) {
        this.logger.warn(`Failed to clean up temporary file ${tempFile}:`, error);
      }
    }
  }

  /**
   * Parse ILI data from content
   */
  protected async parseILIData(content: string): Promise<ILIRecord[]> {
    return await this.parseILI(content);
  }

  /**
   * Process a file (extract archives, etc.)
   */
  protected async processFile(
    path: string,
    _progress?: (progress: number) => void
  ): Promise<string> {
    this.logger.debug(`🔄 Processing file: ${path}`);

    // Check if file needs decompression
    if (path.endsWith('.gz') || path.endsWith('.xz')) {
      const decompressedPath = path.replace(/\.(gz|xz)$/, '');
      await this.decompressFile(path, decompressedPath);
      return decompressedPath;
    }

    // Check if file is an archive
    if (path.endsWith('.tar') || path.endsWith('.tar.gz')) {
      const extractedDir = await this.extractArchive(path, dirname(path));
      const lmfFiles = await this.findLMFiles(extractedDir);
      
      if (lmfFiles.length === 0) {
        throw new Error(`No LMF files found in archive: ${path}`);
      }
      
      return lmfFiles[0] || path;
    }

    return path;
  }

  /**
   * Check if file is LMF
   */
  protected async isLMF(path: string): Promise<boolean> {
    return isLMF(path);
  }

  /**
   * Check if file is ILI
   */
  protected async isILI(path: string): Promise<boolean> {
    return isILI(path);
  }

  /**
   * Add LMF from file
   */
  protected async addLMF(
    path: string,
    options: DataManagerOptions & { parser?: string }
  ): Promise<boolean> {
    const { dryRun = false, progress } = options;

    try {
      this.logger.info(`Loading LMF file: ${path}...`);
      const lmfOptions: LMFParseOptions = { debug: false };
      // Note: parser option is not part of LMFParseOptions interface

      if (dryRun) {
        this.logger.info(`Dry run: would load LMF file ${path}`);
        return true;
      }

      const content = await this.loadFile(path);
      const lmfDocument = await this.parseLMF(content, lmfOptions);

      this.logger.info(`LMF file loaded successfully`, {
        lexicons: lmfDocument.lexicons?.length || 0,
        words: lmfDocument.words?.length || 0,
        synsets: lmfDocument.synsets?.length || 0,
        senses: lmfDocument.senses?.length || 0,
      });

      // Insert the data into the database
      await this.insertLMFData(lmfDocument);

      if (progress) progress(1.0, 'Complete');

      return true;
    } catch (error) {
      this.logger.error(`Failed to load LMF file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Insert LMF data into the database
   */
  protected async insertLMFData(lmfDocument: LMFDocument): Promise<void> {
    this.logger.debug(`📥 Inserting LMF data into database`);

    const db = this.adapter.getDatabase();

    // Import insert functions
    const { insertRecords } = await import('wn-ts-core');

    // Insert lexicons
    if (lmfDocument.lexicons && lmfDocument.lexicons.length > 0) {
      const lexiconsForDb = lmfDocument.lexicons.map(lexicon => ({
        ...lexicon,
        version: lexicon.version || null,
        email: lexicon.email || null,
        license: lexicon.license || null,
        url: lexicon.url || null,
        citation: lexicon.citation || null,
        logo: lexicon.logo || null,
        metadata: (lexicon.metadata as any) || null
      }));
      await insertRecords(db, 'lexicons', lexiconsForDb);
    }

    // Insert synsets (without definitions)
    if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
      const synsetsForDb = lmfDocument.synsets.map(synset => ({
        id: synset.id,
        pos: synset.pos,
        ili: synset.ili || null,
        language: synset.language,
        lexicon: synset.lexicon
      }));
      await insertRecords(db, 'synsets', synsetsForDb);
    }

    // Insert definitions (extracted from synsets)
    if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
      const definitions = [];
      for (const synset of lmfDocument.synsets) {
        if (synset.definitions && synset.definitions.length > 0) {
          for (const definition of synset.definitions) {
            definitions.push({
              id: `${synset.id}-def-${Math.random().toString(36).substr(2, 9)}`,
              synset_id: synset.id,
              language: definition.language || synset.language || 'en',
              text: definition.text,
              source: definition.source || null
            });
          }
        }
      }
      if (definitions.length > 0) {
        await insertRecords(db, 'definitions', definitions);
      }
    }

    // Insert words (map LMF data to database schema)
    if (lmfDocument.words && lmfDocument.words.length > 0) {
      const wordsForDb = lmfDocument.words.map(word => ({
        id: word.id,
        lemma: word.lemma,
        pos: word.pos, // LMF uses 'pos' which matches database schema
        language: word.language,
        lexicon: word.lexicon
      }));
      await insertRecords(db, 'words', wordsForDb);
    }

    // Insert senses (map LMF data to database schema)
    if (lmfDocument.senses && lmfDocument.senses.length > 0) {
      const sensesForDb = lmfDocument.senses.map(sense => ({
        id: sense.id,
        word_id: sense.wordId, // Map wordId to word_id
        synset_id: sense.synsetId, // Map synsetId to synset_id
        source: sense.source || null,
        sensekey: sense.sensekey || null,
        adjposition: sense.adjposition || null,
        subcategory: sense.subcategory || null,
        domain: sense.domain || null,
        register: sense.register || null
      }));
      await insertRecords(db, 'senses', sensesForDb);
    }

    this.logger.info(`LMF data inserted successfully`, {
      lexicons: lmfDocument.lexicons?.length || 0,
      words: lmfDocument.words?.length || 0,
      synsets: lmfDocument.synsets?.length || 0,
      senses: lmfDocument.senses?.length || 0,
    });
  }

  /**
   * Add ILI from file
   */
  protected async addILI(
    path: string,
    options: DataManagerOptions
  ): Promise<boolean> {
    const { dryRun = false } = options;

    try {
      this.logger.info(`Loading ILI file: ${path}...`);

      if (dryRun) {
        this.logger.info(`Dry run: would load ILI file ${path}`);
        return true;
      }

      const content = await this.loadFile(path);
      const iliData = await this.parseILI(content);

      this.logger.info(`ILI file loaded successfully`, {
        records: iliData.length,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to load ILI file ${path}:`, error);
      throw error;
    }
  }

  // Public methods for backward compatibility with the old data-management-new.ts API

  /**
   * Download a project from the web
   */
  async download(
    projectId: string,
    _options: any = {}
  ): Promise<string> {
    // For now, this is a placeholder that throws an error
    // The actual download functionality should be implemented based on the old system
    throw new ProjectError(`Download functionality not yet implemented in new data management system. Project: ${projectId}`);
  }

  /**
   * Add a lexical resource to the database
   */
  async add(
    path: string,
    options: any = {}
  ): Promise<boolean> {
    const { progress } = options;

    this.logger.info(`Adding lexicon from: ${path}`);

    try {
      // Check if file exists
      if (!existsSync(path)) {
        throw new ProjectError(`File not found: ${path}`);
      }

      if (progress) progress(0.1, 'Processing file...');

      // Process the file based on its type
      const processedPath = await this.processFile(path);
      
      if (progress) progress(0.3, 'Parsing data...');

      // Determine file type and process accordingly
      if (await this.isLMF(processedPath)) {
        return await this.addLMF(processedPath, options);
      } else if (await this.isILI(processedPath)) {
        return await this.addILI(processedPath, options);
      } else {
        throw new ProjectError(`Unsupported file type: ${path}`);
      }
    } catch (error) {
      this.logger.error(`Failed to add lexicon from ${path}:`, error);
      if (error instanceof ProjectError) {
        throw error;
      }
      throw new ProjectError(`Failed to add lexicon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a lexical resource from the database
   */
  async remove(lexiconId: string): Promise<boolean> {
    try {
      this.logger.info(`Removing lexicon: ${lexiconId}`);

      const queryService = this.adapter.getQueryService();
      
      // Check if lexicon exists
      const existing = await queryService.getLexiconById(lexiconId);
      if (!existing) {
        throw new ProjectError(`Lexicon ${lexiconId} does not exist.`);
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
   * Export data from the database
   */
  async exportData(
    options: any = { format: 'json' }
  ): Promise<any> {
    const { format, include = [], exclude = [] } = options;
    
    // Validate format
    const supportedFormats = ['json', 'xml', 'csv'];
    if (!supportedFormats.includes(format)) {
      throw new ProjectError(`Unsupported export format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
    }
    
    try {
      const queryService = this.adapter.getQueryService();
      
      // Get all lexicons
      let lexicons = await queryService.getLexicons();
      
      // Apply include/exclude filters
      if (include && include.length > 0) {
        lexicons = lexicons.filter((l: any) => include.includes(l.id));
      }
      if (exclude && exclude.length > 0) {
        lexicons = lexicons.filter((l: any) => !exclude.includes(l.id));
      }
      
      if (format === 'json') {
        const data = {
          lexicons,
          exportDate: new Date().toISOString(),
          format: 'json'
        };
        this.logger.info(JSON.stringify(data, null, 2));
        return data;
      } else if (format === 'xml') {
        // TODO: Implement XML export with actual data
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<lexical-resources>\n</lexical-resources>`;
        this.logger.info(xml);
        return xml;
      } else if (format === 'csv') {
        // TODO: Implement CSV export with actual data
        const csv = 'Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example\nword,test-word-1,test,noun,en,test-lexicon,A test word,This is an example';
        this.logger.info(csv);
        return csv;
      } else {
        return { lexicons };
      }
    } catch (error) {
      this.logger.error('Failed to export data:', error);
      throw error;
    }
  }
}

// Type definitions
export interface WordNetProcessingResult {
  success: boolean;
  projectId: string;
  language: string;
  version: string;
  contentType: string;
  confidence: 'high' | 'medium' | 'low';
  xmlContent?: string;
  error: string | null;
}

export interface ILIRecord {
  id: string;
  definition: string;
  status: string;
}

export interface LMFParseOptions {
  debug?: boolean;
  preferFastXMLParser?: boolean;
  ignoreAttributes?: boolean;
  parseAttributeValue?: boolean;
  parseNodeValue?: boolean;
  trimValues?: boolean;
  validate?: boolean;
  progress?: (progress: number, message?: string) => void;
}
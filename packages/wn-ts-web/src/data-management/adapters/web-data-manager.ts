/**
 * Web Data Manager
 * 
 * Concrete implementation of SharedDataManager for web/browser environments
 */

import { SharedDataManager } from 'wn-ts-core';
import type { Database } from 'wn-ts-core';
import type { Kysely } from 'kysely';
import type { LMFDocument } from 'wn-ts-core';
import type { DataManagerOptions, ProjectInfo, DataManagerProjectInfo, DataManagerLogger, QueryService } from 'wn-ts-core';
import { Logger } from 'wn-ts-core';
import type { WordNetProcessingResult } from 'wn-data-loader';
import { WordNetProcessor } from 'wn-data-loader';

export interface WebDataManagerConfig {
  database: WebDatabase;
  wordnet: WebWordnet;
  projectIndex?: ProjectIndex;
}

export interface WebDatabase {
  getQueryService(): QueryService;
}

export interface WebWordnet {
  getQueryService(): QueryService;
}

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
  [key: string]: ProjectInfo;
}

/**
 * Web-specific data manager that extends SharedDataManager
 */
export class WebDataManager extends SharedDataManager {
  private config: WebDataManagerConfig;
  protected logger: DataManagerLogger;

  constructor(config: WebDataManagerConfig) {
    // Create logger first
    const baseLogger = new Logger();
    const logger = {
      info: (message: string, data?: unknown) => baseLogger.info(`[WebDataManager] ${message}`, data),
      debug: (message: string, data?: unknown) => baseLogger.debug(`[WebDataManager] ${message}`, data),
      warn: (message: string, data?: unknown) => baseLogger.warn(`[WebDataManager] ${message}`, data),
      error: (message: string, data?: unknown) => baseLogger.error(`[WebDataManager] ${message}`, data),
      step: (message: string, data?: unknown) => baseLogger.info(`[WebDataManager] 📍 ${message}`, data),
      start: (message: string) => baseLogger.info(`[WebDataManager] 🚀 ${message}`),
      end: (message: string) => baseLogger.info(`[WebDataManager] ✅ ${message}`),
      fail: (message: string, data?: unknown) => baseLogger.error(`[WebDataManager] ❌ ${message}`, data),
    };

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
      getLogger: () => logger,
    };
    
    super(adapter);
    this.config = config;
    this.logger = logger;
  }

  // Platform-specific methods that implement the DataManagerAdapter interface

  /**
   * Download file from URL
   */
  async downloadFile(url: string, progress?: (progress: number) => void): Promise<ArrayBuffer> {
    this.logger.debug(`📥 Downloading file from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Unable to read error response");
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    this.logger.debug(`🔍 Content-Type: ${contentType}`);
    this.logger.debug(`🔍 Content-Length: ${contentLength || "unknown"}`);

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (progress && total > 0) {
        progress(receivedLength / total);
      }

      // Yield to UI thread every 1MB to prevent freezing during download
      if (receivedLength % 1000000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    // Combine chunks into a single ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    this.logger.debug(`🔍 Downloaded ${totalLength} bytes`);

    // Basic validation
    if (totalLength === 0) {
      throw new Error("Downloaded file is empty (0 bytes)");
    }

    // Check if this looks like an error page (HTML) instead of XML
    const firstBytes = result.slice(0, Math.min(100, totalLength));
    const firstChars = new TextDecoder().decode(firstBytes);
    if (
      firstChars.toLowerCase().includes("<!doctype html>") ||
      firstChars.toLowerCase().includes("<html")
    ) {
      this.logger.error(`❌ Downloaded content appears to be HTML, not XML:`, {
        firstChars: firstChars.substring(0, 200),
      });
      throw new Error(
        "Downloaded content is HTML, not XML. This usually indicates a server error page."
      );
    }

    return result.buffer;
  }

  async loadFile(_path: string): Promise<string> {
    throw new Error("loadFile not supported in web environment - use downloadFile instead");
  }

  async saveFile(_path: string, _data: ArrayBuffer): Promise<void> {
    throw new Error("saveFile not supported in web environment");
  }

  async fileExists(_path: string): Promise<boolean> {
    throw new Error("fileExists not supported in web environment");
  }

  async extractArchive(_path: string, _destination: string): Promise<string> {
    throw new Error("extractArchive not supported in web environment");
  }

  async decompressFile(_path: string, _destination: string): Promise<void> {
    throw new Error("decompressFile not supported in web environment");
  }

  async findLMFiles(_directory: string): Promise<string[]> {
    throw new Error("findLMFiles not supported in web environment");
  }

  async parseLMF(content: string, options?: any): Promise<LMFDocument> {
    this.logger.debug(`📝 Parsing LMF content`);
    
    // Import the LMF parser from the web environment
    const { parseLMFXML } = await import('../../parsers/lmf/lmf-parser.js');
    
    return await parseLMFXML(content, options);
  }

  async parseILI(content: string): Promise<ILIRecord[]> {
    const lines = content.split(/\r?\n/);
    const records: ILIRecord[] = [];

    // CILI data file typically doesn't have a header, but some might
    const dataLines = lines.filter((line) => line.trim());

    for (const line of dataLines) {
      if (!line.trim()) continue;
      const values = line.split("\t");
      if (values.length >= 2) {
        const record: ILIRecord = {
          id: values[0]?.trim() || '',
          definition: values[1]?.trim() || '',
          status: values[2]?.trim() || "active",
        };

        // Skip records with empty IDs or definitions
        if (
          record.id &&
          record.definition &&
          !record.id.toLowerCase().includes("definition") &&
          !record.id.toLowerCase().includes("status") &&
          !record.id.toLowerCase().includes("id")
        ) {
          records.push(record);
        }
      }
    }

    this.logger.debug(
      `📊 Parsed ${records.length} valid ILI records from ${dataLines.length} total lines`
    );
    
    return records;
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
        getProjectUrls, 
        getFallbackUrls, 
        getAllProjectUrls,
        getProxyUrl 
      } = configModule;
      
      const projectConfig = getProjectConfig(projectId);
      if (!projectConfig) {
        throw new Error(`Project not found: ${projectId}`);
      }
      
      // Get all URLs (primary + fallback)
      const allUrls = getAllProjectUrls(projectId);
      const primaryUrl = allUrls[0] || '';
      
      this.logger.debug(`🔍 Project URLs for ${projectId}:`, { allUrls, primaryUrl });
      
      // Convert URLs to proxy URLs to bypass CORS
      const proxyUrls = allUrls.map((url: string) => this.toProxyUrl(url));
      const proxyPrimaryUrl = this.toProxyUrl(primaryUrl);
      
      this.logger.debug(`🔍 Proxy URLs for ${projectId}:`, { proxyUrls, proxyPrimaryUrl });
      
      const [baseId, version] = projectId.split(':');
      
      const projectInfo: DataManagerProjectInfo = {
        id: projectId,
        label: projectConfig.label,
        language: projectConfig.language,
        version: version || '1.0',
        url: proxyPrimaryUrl,
        license: projectConfig.license,
        citation: `WordNet Project: ${projectConfig.label}`,
        allUrls: proxyUrls,
        primaryUrl: proxyPrimaryUrl,
        fallbackUrls: proxyUrls.slice(1), // All URLs except the first one
      };

      this.logger.debug(`🔍 Final project info for ${projectId}:`, projectInfo);
      return projectInfo;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to get project info for ${projectId}, using fallback:`, error);
      
      // Fallback to basic project info if configuration fails
      const projectInfo: DataManagerProjectInfo = {
        id: projectId,
        label: projectId,
        language: 'en',
        version: '1.0',
        url: `https://example.com/${projectId}`,
        license: 'MIT',
        citation: `WordNet Project: ${projectId}`,
        allUrls: [`https://example.com/${projectId}`],
        primaryUrl: `https://example.com/${projectId}`,
        fallbackUrls: [],
      };

      return projectInfo;
    }
  }

  /**
   * Process WordNet data using the WordNet processor
   */
  protected async processWordNetData(
    data: ArrayBuffer,
    projectId: string,
    progress?: (progress: number, message?: string) => void
  ): Promise<WordNetProcessingResult> {
    this.logger.debug(`🔄 Processing WordNet data for: ${projectId}`);

    try {
      if (progress) progress(0.05, 'Starting WordNet processing...');

      // Use wn-data-loader for proper gzip decompression and processing
      if (progress) progress(0.1, 'Initializing WordNet processor...');
      
      const processor = new WordNetProcessor();
      
      if (progress) progress(0.15, 'Processing with WordNet processor...');
      
      // Use the WordNet processor which handles gzip decompression properly
      const result = await processor.processWordNetData(data, {
        projectId,
        enableTarExtraction: true,
        extractMetadata: true,
        validateLMF: true,
        onProgress: progress
      });
      
      if (progress) progress(0.9, 'WordNet processing completed...');
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process WordNet data:', error);
      return {
        success: false,
        projectId,
        language: 'en',
        version: '1.0',
        contentType: 'lmf' as any,
        confidence: 'low' as const,
        xmlContent: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingSteps: ['WordNet processing failed'],
        totalProcessingTime: 0,
        originalSize: data.byteLength,
        finalSize: 0
      };
    }
  }

  /**
   * Parse ILI data from content
   */
  protected async parseILIData(content: string): Promise<ILIRecord[]> {
    return await this.parseILI(content);
  }

  /**
   * Process a file (extract archives, etc.) - not applicable in web environment
   */
  protected async processFile(
    _path: string,
    _progress?: (progress: number) => void
  ): Promise<string> {
    throw new Error("processFile not supported in web environment - files are processed in memory");
  }

  /**
   * Check if file is LMF - not applicable in web environment
   */
  protected async isLMF(_path: string): Promise<boolean> {
    throw new Error("isLMF not supported in web environment - content type is determined during processing");
  }

  /**
   * Check if file is ILI - not applicable in web environment
   */
  protected async isILI(_path: string): Promise<boolean> {
    throw new Error("isILI not supported in web environment - content type is determined during processing");
  }

  /**
   * Add LMF from file - not applicable in web environment
   */
  protected async addLMF(
    _path: string,
    _options: DataManagerOptions & { parser?: string }
  ): Promise<boolean> {
    throw new Error("addLMF from file not supported in web environment - use loadFromBuffer instead");
  }

  /**
   * Add ILI from file - not applicable in web environment
   */
  protected async addILI(
    _path: string,
    _options: DataManagerOptions
  ): Promise<boolean> {
    throw new Error("addILI from file not supported in web environment - use loadFromBuffer instead");
  }

  /**
   * Ensure dependencies are loaded
   */
  protected async ensureDependenciesLoaded(projectId: string): Promise<void> {
    // Check if this is a dependent lexicon that needs English WordNet
    const isDependentLexicon = this.isDependentLexicon(projectId);
    
    if (!isDependentLexicon) {
      this.logger.debug(`📦 No dependencies for ${projectId}`);
      return;
    }

    this.logger.info(`🔗 Checking dependencies for ${projectId}`);

    // Check if English WordNet is already loaded
    const loadedDeps = await this.getLoadedDependencies();
    const needsEnglish = !loadedDeps.has('omw-en') && !loadedDeps.has('oewn:2024');

    if (!needsEnglish) {
      this.logger.info(`✅ All dependencies already loaded for ${projectId}`);
      return;
    }

    this.logger.warn(`⚠️ Missing English WordNet dependency for ${projectId}`);
    this.logger.info(`🔄 Loading English WordNet first...`);

    try {
      const englishProjectId = 'oewn:2024';
      this.logger.info(`📥 Loading dependency: ${englishProjectId}`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Dependency loading timeout after 10 minutes')), 600000);
      });
      
      const loadPromise = this.downloadAndLoad(englishProjectId);
      
      // Race between loading and timeout
      await Promise.race([loadPromise, timeoutPromise]);
      
      this.logger.info(`✅ Dependency loaded: ${englishProjectId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to load English WordNet dependency:`, error);
      this.logger.warn(`⚠️ Continuing without English dependency - cross-lingual functionality will be limited`);
    }

    this.logger.info(`✅ Dependency loading completed for ${projectId}`);
  }

  /**
   * Check if a lexicon is dependent on other lexicons
   */
  private isDependentLexicon(projectId: string): boolean {
    const dependentLexicons = [
      'omw-fr:1.4',  // French WordNet
      'omw-de:1.4',  // German WordNet
      'omw-ja:1.4',  // Japanese WordNet
      'omw-zh:1.4',  // Chinese WordNet
      'omw-es:1.4',  // Spanish WordNet
      'omw-it:1.4',  // Italian WordNet
      'omw-pt:1.4',  // Portuguese WordNet
      'omw-ru:1.4',  // Russian WordNet
    ];
    
    return dependentLexicons.includes(projectId);
  }

  /**
   * Get a set of currently loaded dependency IDs
   */
  private async getLoadedDependencies(): Promise<Set<string>> {
    try {
      const queryService = this.adapter.getQueryService();
      if (!queryService) {
        return new Set();
      }

      // Get all loaded lexicons
      const lexicons = await queryService.getLexicons();
      return new Set(lexicons.map((l: LexiconInfo) => l.id));
    } catch (error) {
      this.logger.warn("Failed to get loaded dependencies:", error);
      return new Set();
    }
  }

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    this.logger.info(`🧹 Clearing all data from database`);
    
    try {
      const queryService = this.adapter.getQueryService();
      const db = queryService.database;
      
      // Clear all tables in the correct order to respect foreign key constraints
      await db.deleteFrom('senses').execute();
      await db.deleteFrom('words').execute();
      await db.deleteFrom('definitions').execute();
      await db.deleteFrom('synsets').execute();
      await db.deleteFrom('lexicons').execute();
      await db.deleteFrom('ilis').execute();
      
      this.logger.info(`✅ All data cleared successfully`);
    } catch (error) {
      this.logger.error(`❌ Failed to clear data:`, error);
      throw error;
    }
  }

  /**
   * Convert external URLs to proxy URLs to bypass CORS
   */
  toProxyUrl(url: string): string {
    this.logger.debug(`🔍 Original URL: ${url}`);

    // Convert external URLs to proxy URLs
    if (url.includes("en-word.net")) {
      const proxyUrl = url.replace("https://en-word.net", "/api/wordnet");
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("raw.githubusercontent.com")) {
      const proxyUrl = url.replace(
        "https://raw.githubusercontent.com",
        "/api/raw-github"
      );
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("github.com/globalwordnet")) {
      // Special handling for CILI packages
      if (url.includes("/cili/")) {
        if (url.includes("raw.githubusercontent.com")) {
          // Raw GitHub content for CILI
          const proxyUrl = url.replace(
            "https://raw.githubusercontent.com/globalwordnet/cili",
            "/api/raw-github/globalwordnet/cili"
          );
          this.logger.debug(`🔍 Proxied CILI raw content to: ${proxyUrl}`);
          return proxyUrl;
        } else if (url.includes("/releases/download/")) {
          // GitHub releases for CILI - use the dedicated CILI proxy
          const proxyUrl = url.replace(
            "https://github.com/globalwordnet/cili/releases/download",
            "/api/globalwordnet-cili"
          );
          this.logger.debug(`🔍 Proxied CILI release to: ${proxyUrl}`);
          return proxyUrl;
        }
      }

      // Default handling for other globalwordnet repositories
      const proxyUrl = url.replace(
        "https://github.com/globalwordnet",
        "/api/globalwordnet-ewn"
      );
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    // Handle release assets that GitHub redirects to
    if (url.includes("release-assets.githubusercontent.com")) {
      const proxyUrl = url.replace(
        "https://release-assets.githubusercontent.com",
        "/api/release-assets"
      );
      this.logger.debug(`🔍 Proxied release asset to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("github.com/omwn")) {
      // Special handling for OMW packages
      if (url.includes("/releases/download/")) {
        const proxyUrl = url.replace(
          "https://github.com/omwn/omw-data/releases/download",
          "/api/omwn-releases"
        );
        this.logger.debug(`🔍 Proxied OMW release to: ${proxyUrl}`);
        return proxyUrl;
      }
    }

    if (url.includes("github.com")) {
      const proxyUrl = url.replace("https://github.com", "/api/github");
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    // For any other external URL, use the generic proxy
    if (url.startsWith("https://")) {
      const proxyUrl = url.replace("https://", "/api/external/");
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    this.logger.debug(`🔍 No proxy needed: ${url}`);
    return url;
  }
}

// Type definitions

export interface ILIRecord {
  id: string;
  definition: string;
  status: string;
}

// Re-export types that are imported from other packages
export type { QueryService, ProjectInfo, WordNetProcessingResult };

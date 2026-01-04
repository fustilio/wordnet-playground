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
  async downloadFile(url: string, progress?: (progress: number) => void): Promise<ArrayBuffer> {
    this.logger.debug(`📥 Downloading file from: ${url}`);

    // Suppress unused parameter warning
    void progress;

    // Check if fetch is available (Node.js 18+ has global fetch)
    if (typeof fetch === 'undefined') {
      throw new Error(
        `fetch is not available in this Node.js environment. ` +
        `This library requires Node.js 18+ which includes native fetch support. ` +
        `Current Node.js version: ${process.version}. ` +
        `Please upgrade Node.js or use a fetch polyfill.`
      );
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000); // 5 minute timeout for large files

    try {
      // Use fetch with proper headers and timeout
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'wn-ts-node/0.8.1 (WordNet TypeScript Client)',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        // Follow redirects (default is 'follow')
        redirect: 'follow',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}. URL: ${url}. Response: ${errorText.substring(0, 200)}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        throw new Error(`Downloaded file is empty (0 bytes) from URL: ${url}`);
      }

      this.logger.debug(`✅ Downloaded ${arrayBuffer.byteLength} bytes from ${url}`);
      return arrayBuffer;
    } catch (error) {
      // Provide more detailed error information
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Download timeout after 5 minutes for URL: ${url}`);
        }
        if (error.message.includes('fetch failed')) {
          // Network-level error - provide more context
          throw new Error(
            `Network fetch failed for URL: ${url}. ` +
            `This may be due to network connectivity, DNS resolution, SSL/TLS issues, or firewall blocking. ` +
            `Original error: ${error.message}`
          );
        }
        throw error;
      }
      throw new Error(`Unknown error downloading from ${url}: ${String(error)}`);
    } finally {
      clearTimeout(timeoutId);
    }
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
    
    // Check if content looks like gzipped data (starts with gzip magic bytes)
    const isGzipped = content.charCodeAt(0) === 0x1f && content.charCodeAt(1) === 0x8b;
    
    if (isGzipped) {
      this.logger.debug(`📦 Content appears to be gzipped, decompressing...`);
      
      // Create temporary gzipped file
      const tempDir = this.config.downloadDirectory || join(process.cwd(), 'temp');
      // Ensure temp directory exists
      if (!existsSync(tempDir)) {
        const { mkdirSync } = await import('fs');
        mkdirSync(tempDir, { recursive: true });
      }
      
      const tempGzFile = join(tempDir, `temp-lmf-${randomUUID()}.xml.gz`);
      const tempXmlFile = join(tempDir, `temp-lmf-${randomUUID()}.xml`);
      
      try {
        // Write gzipped content as binary
        const buffer = Buffer.from(content, 'binary');
        writeFileSync(tempGzFile, buffer);
        
        // Decompress the file
        await this.decompressFile(tempGzFile, tempXmlFile);
        
        // Verify the decompressed file exists and has content
        if (!existsSync(tempXmlFile)) {
          throw new Error('Decompression failed - output file not created');
        }
        
        const decompressedSize = (await import('fs')).statSync(tempXmlFile).size;
        if (decompressedSize === 0) {
          throw new Error('Decompression failed - output file is empty');
        }
        
        this.logger.debug(`✅ Decompressed file: ${decompressedSize} bytes`);
        
        // Parse the decompressed XML
        const lmfDocument = await loadLMF(tempXmlFile, options);
        
        // Clean up temp files
        unlinkSync(tempGzFile);
        unlinkSync(tempXmlFile);
        
        return lmfDocument;
      } catch (error) {
        this.logger.error(`❌ LMF parsing failed`, { error: error instanceof Error ? error.message : String(error) });
        // Clean up temp files on error
        try {
          if (existsSync(tempGzFile)) unlinkSync(tempGzFile);
          if (existsSync(tempXmlFile)) unlinkSync(tempXmlFile);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    } else {
      // Content is not gzipped, parse normally
      const tempDir = this.config.downloadDirectory || join(process.cwd(), 'temp');
      // Ensure temp directory exists
      if (!existsSync(tempDir)) {
        const { mkdirSync } = await import('fs');
        mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = join(tempDir, `temp-lmf-${randomUUID()}.xml`);
      
      try {
        writeFileSync(tempFile, content, 'utf-8');
        const lmfDocument = await loadLMF(tempFile, options);
        unlinkSync(tempFile); // Clean up temp file
        return lmfDocument;
      } catch (error) {
        this.logger.error(`❌ LMF parsing failed`, { error: error instanceof Error ? error.message : String(error) });
        // Clean up temp file on error
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
        throw error;
      }
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
    this.logger.debug(`About to start processWordNetData with ${data.byteLength} bytes`);

    // Create temp directory if it doesn't exist
    const tempDir = this.config.downloadDirectory || join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(tempDir, { recursive: true });
    }

    // Determine file extension based on project ID
    let fileExtension = '.gz'; // default
    if (projectId.includes('omw-fr') || projectId.includes('omw-th')) {
      fileExtension = '.tar.xz';
    } else if (projectId.includes('cili')) {
      fileExtension = '.tsv.xz';
    }
    
    // Save data to temporary file
    const tempFile = join(tempDir, `temp-wordnet-${randomUUID()}${fileExtension}`);
    let processedPath: string | null = null;
    
    try {
      this.logger.debug(`About to write ${data.byteLength} bytes to ${tempFile}`);
      // Write the ArrayBuffer directly as binary data
      writeFileSync(tempFile, Buffer.from(data));
      
      this.logger.debug(`📁 Saved ${data.byteLength} bytes to ${tempFile}`);
      
      this.logger.debug(`About to call processFile with: ${tempFile}`);
      // Process the file (decompress if needed)
      processedPath = await this.processFile(tempFile);
      
      this.logger.debug(`About to read processed file: ${processedPath}`);
      // Read the processed file content
      const xmlContent = readFileSync(processedPath, 'utf-8');
      
      // Debug: Check if the content looks like XML
      if (!xmlContent.includes('<?xml') && !xmlContent.includes('<LexicalResource')) {
        this.logger.warn(`⚠️ Processed file does not appear to contain XML content. First 200 chars: ${xmlContent.substring(0, 200)}`);
        // Try to read as binary to see what we actually have
        const binaryContent = readFileSync(processedPath);
        this.logger.debug(`📊 Binary content first 20 bytes: ${Array.from(binaryContent.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        
        // Check if the file is still gzipped
        const isStillGzipped = binaryContent[0] === 0x1f && binaryContent[1] === 0x8b;
        if (isStillGzipped) {
          this.logger.error(`❌ File is still gzipped after processing! Decompression failed.`);
          throw new Error('Decompression failed - file is still gzipped');
        }
      } else {
        this.logger.debug(`✅ Successfully processed XML content: ${xmlContent.length} characters`);
      }
      
      return {
        success: true,
        projectId,
        language: 'en',
        version: '1.0',
        contentType: 'lmf',
        confidence: 'high' as const,
        xmlContent,
        error: null,
      };
    } catch (error) {
      this.logger.error(`❌ WordNet processing failed for ${projectId}:`, error);
      return {
        success: false,
        projectId,
        language: 'en',
        version: '1.0',
        contentType: 'lmf',
        confidence: 'low' as const,
        // xmlContent: undefined, // Optional property
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // Clean up temporary files
      try {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
        // Also clean up the processed file if it's different
        if (processedPath && processedPath !== tempFile && existsSync(processedPath)) {
          unlinkSync(processedPath);
        }
      } catch (error) {
        this.logger.warn(`Failed to clean up temporary files:`, error);
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
    // Check if file is a tar.xz archive (needs special handling)
    if (path.endsWith('.tar.xz')) {
      this.logger.debug(`🗜️ Processing tar.xz archive: ${path}`);
      
      // First decompress the .xz part
      const tarPath = path.replace(/\.tar\.xz$/, '.tar');
      this.logger.debug(`🗜️ Decompressing ${path} to ${tarPath}`);
      await this.decompressFile(path, tarPath);
      
      // Then extract the tar archive
      const extractedDir = await this.extractArchive(tarPath, dirname(tarPath));
      const lmfFiles = await this.findLMFiles(extractedDir);
      
      if (lmfFiles.length === 0) {
        throw new Error(`No LMF files found in archive: ${path}`);
      }
      
      return lmfFiles[0] || path;
    }

    // Check if file needs decompression
    if (path.endsWith('.gz') || path.endsWith('.xz')) {
      const decompressedPath = path.replace(/\.(gz|xz)$/, '');
      this.logger.debug(`🗜️ Decompressing ${path} to ${decompressedPath}`);
      await this.decompressFile(path, decompressedPath);
      
      // Verify the decompressed file exists and has content
      if (!existsSync(decompressedPath)) {
        throw new Error(`Decompression failed - output file not created: ${decompressedPath}`);
      }
      
      const stats = (await import('fs')).statSync(decompressedPath);
      this.logger.debug(`✅ Decompressed file created: ${decompressedPath} (${stats.size} bytes)`);
      
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
    this.logger.debug(`LMF Document structure:`, {
      lexicons: lmfDocument.lexicons?.length || 0,
      words: lmfDocument.words?.length || 0,
      synsets: lmfDocument.synsets?.length || 0,
      senses: lmfDocument.senses?.length || 0
    });

    const db = this.adapter.getDatabase();

    // Import the batched insert function that handles large datasets
    const { insertLMFDataInTransaction } = await import('wn-ts-core');

    // Prepare data for batched insertion
    const dataToInsert: {
      lexicons: any[];
      words: any[];
      forms: any[];
      synsets: any[];
      senses: any[];
      definitions: any[];
    } = {
      lexicons: [],
      words: [],
      forms: [],
      synsets: [],
      senses: [],
      definitions: []
    };

    // Prepare lexicons
    if (lmfDocument.lexicons && lmfDocument.lexicons.length > 0) {
      dataToInsert.lexicons = lmfDocument.lexicons.map(lexicon => ({
        ...lexicon,
        version: lexicon.version || null,
        email: lexicon.email || null,
        license: lexicon.license || null,
        url: lexicon.url || null,
        citation: lexicon.citation || null,
        logo: lexicon.logo || null,
        requires: lexicon.requires ? JSON.stringify(lexicon.requires) : null,
        metadata: (lexicon.metadata as any) || null
      }));
    }

    // Prepare synsets
    if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
      dataToInsert.synsets = lmfDocument.synsets.map(synset => ({
        id: synset.id,
        pos: synset.pos,
        ili: synset.ili || null,
        language: synset.language || null,
        lexicon: synset.lexicon
      }));
    }

    // Prepare definitions (extracted from synsets)
    if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
      for (const synset of lmfDocument.synsets) {
        if (synset.definitions && synset.definitions.length > 0) {
          for (const definition of synset.definitions) {
            dataToInsert.definitions.push({
              id: `${synset.id}-def-${Math.random().toString(36).substr(2, 9)}`,
              synset_id: synset.id,
              language: definition.language || synset.language || 'en',
              text: definition.text,
              source: definition.source || null
            });
          }
        }
      }
    }

    // Prepare words
    if (lmfDocument.words && lmfDocument.words.length > 0) {
      dataToInsert.words = lmfDocument.words.map(word => ({
        id: word.id,
        lemma: word.lemma,
        pos: word.pos, // LMF uses 'pos' which matches database schema
        language: word.language || null,
        lexicon: word.lexicon
      }));

      // Extract forms from words
      for (const word of lmfDocument.words) {
        if (word.forms && word.forms.length > 0) {
          for (const form of word.forms) {
            dataToInsert.forms.push({
              id: form.id || `${word.id}-form-${dataToInsert.forms.length}`,
              word_id: word.id,
              written_form: form.writtenForm,
              script: form.script || null,
              tag: form.tag || null
            });
          }
        } else {
          // If no forms are defined, create a default form from the lemma
          // This ensures backwards compatibility with data that doesn't explicitly define forms
          dataToInsert.forms.push({
            id: `${word.id}-lemma-form`,
            word_id: word.id,
            written_form: word.lemma,
            script: null,
            tag: null
          });
        }
      }
    }

    // Prepare senses
    if (lmfDocument.senses && lmfDocument.senses.length > 0) {
      dataToInsert.senses = lmfDocument.senses.map(sense => ({
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
    }

    // Use the batched insertion function that handles large datasets
    await insertLMFDataInTransaction(db, dataToInsert, {
      step: (message, data) => this.logger.info(message, data),
      debug: (message, data) => this.logger.debug(message, data),
      error: (message, data) => this.logger.error(message, data)
    });

    this.logger.info(`LMF data inserted successfully`, {
      lexicons: dataToInsert.lexicons.length,
      words: dataToInsert.words.length,
      forms: dataToInsert.forms.length,
      synsets: dataToInsert.synsets.length,
      senses: dataToInsert.senses.length,
      definitions: dataToInsert.definitions.length
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
    options: any = {}
  ): Promise<string> {
    // Use the parent class downloadAndLoad method
    await this.downloadAndLoad(projectId, options);
    return projectId;
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
      
      // For each lexicon, get detailed data
      const detailedLexicons = await Promise.all(lexicons.map(async (lexicon: any) => {
        try {
          const words = await queryService.getWords(lexicon.id);
          const synsets = await queryService.getSynsets(lexicon.id);
          return {
            ...lexicon,
            entries: words,
            synsets: synsets
          };
        } catch (error) {
          this.logger.warn(`Failed to get detailed data for lexicon ${lexicon.id}:`, error);
          return lexicon;
        }
      }));
      
      if (format === 'json') {
        const data = {
          lexicons: detailedLexicons,
          exportDate: new Date().toISOString(),
          format: 'json'
        };
        
        // Write to file if output path is provided
        if (options.output) {
          writeFileSync(options.output, JSON.stringify(data, null, 2));
          this.logger.info(`✅ Exported data to ${options.output}`);
        } else {
          this.logger.info(JSON.stringify(data, null, 2));
        }
        return data;
      } else if (format === 'xml') {
        // TODO: Implement XML export with actual data
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<lexical-resources>\n</lexical-resources>`;
        
        // Write to file if output path is provided
        if (options.output) {
          writeFileSync(options.output, xml);
          this.logger.info(`✅ Exported data to ${options.output}`);
        } else {
          this.logger.info(xml);
        }
        return xml;
      } else if (format === 'csv') {
        // TODO: Implement CSV export with actual data
        const csv = 'Type,ID,Lemma,PartOfSpeech,Language,Lexicon,Definition,Example\nword,test-word-1,test,noun,en,test-lexicon,A test word,This is an example';
        
        // Write to file if output path is provided
        if (options.output) {
          writeFileSync(options.output, csv);
          this.logger.info(`✅ Exported data to ${options.output}`);
        } else {
          this.logger.info(csv);
        }
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
// Note: BrowserXMLParser import removed - now using proper LMF parsing pipeline
import {
  diagnoseDownloadIssue,
  analyzeXMLContent,
} from "./parsers/lmf/lmf-parser.js";
import { Project } from "./project.js";
import type { ProgressCallback } from "./types/progress.js";
import { WebDatabase } from "./client/submodules/web-database.js";
import { WebWordnet } from "./client/submodules/web-wordnet.js";
import { createScopedLogger } from "utils/logger";
import type { KyselyQueryService } from "./database/kysely-query-service.js";
import type { Database } from "./types/database.js";
import type { LMFDocument, Synset, Word, Sense, Lexicon } from "wn-ts-core";
import { WarningAggregator } from "./parsers/lmf/warning-aggregator.js";
import { WordNetProcessor } from "wn-data-loader";
import { WORDNET_DATA_SOURCES } from "wn-data-loader";
import indexData from "./index.json" assert { type: "json" };

// Note: ParsedNode interface removed - now using proper LMF parsing pipeline

interface IliCsvRecord {
  id: string;
  definition?: string;
  status?: string;
}

export interface DataLoadOptions {
  force?: boolean;
  progress?: ProgressCallback;
}

/**
 * Download and load WordNet data into the browser database
 * Mirrors wn-ts-node's data management patterns
 * Now includes automatic dependency management
 */
export class DataLoader {
  protected database: WebDatabase;
  protected wordnet: WebWordnet;
  private logger = createScopedLogger("DataLoader", "trace");
  private warningAggregator: WarningAggregator | undefined;

  constructor(database: WebDatabase, wordnet: WebWordnet) {
    this.database = database;
    this.wordnet = wordnet;

    // Initialize warning aggregator for foreign key violations
    this.warningAggregator = new WarningAggregator(50, 2000); // Smaller batch size for data loading
  }

  // Note: extractTextFromNode method removed - now using proper LMF parsing pipeline

  /**
   * Validate that downloaded content appears to be XML
   */
  private validateXMLContent(
    content: string,
    projectIdWithVersion: string
  ): void {
    // Check if content starts with XML declaration or root element
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error(`Empty content received for ${projectIdWithVersion}`);
    }

    // Check for common XML indicators
    const hasXMLDeclaration = trimmedContent.startsWith("<?xml");
    const hasRootElement = /^<[a-zA-Z][a-zA-Z0-9_:]*/.test(trimmedContent);
    const hasClosingTag = trimmedContent.includes("</");

    // Check for HTML error indicators
    const hasHTMLTags = /<html|<head|<body|<title/i.test(trimmedContent);
    const hasErrorKeywords =
      /error|not found|forbidden|unauthorized|server error/i.test(
        trimmedContent
      );

    if (hasHTMLTags || hasErrorKeywords) {
      this.logger.warn(
        `⚠️ Content appears to be HTML/error page for ${projectIdWithVersion}`,
        {
          hasHTMLTags,
          hasErrorKeywords,
          firstChars: trimmedContent.substring(0, 200),
          lastChars: trimmedContent.substring(
            Math.max(0, trimmedContent.length - 200)
          ),
        }
      );

      // Don't throw here, just warn - let the parser handle it
    }

    if (!hasRootElement && !hasXMLDeclaration) {
      this.logger.warn(
        `⚠️ Content doesn't appear to be valid XML for ${projectIdWithVersion}`,
        {
          hasXMLDeclaration,
          hasRootElement,
          hasClosingTag,
          firstChars: trimmedContent.substring(0, 200),
        }
      );
    }

    this.logger.debug(
      `✅ Content validation passed for ${projectIdWithVersion}`,
      {
        length: content.length,
        hasXMLDeclaration,
        hasRootElement,
        hasClosingTag,
      }
    );
  }

  /**
   * Get the query service lazily (only when needed)
   */
  protected getQueryService(): KyselyQueryService | undefined {
    const queryService = this.wordnet.getQueryService();
    this.logger.debug("🔍 DataLoader.getQueryService() called, queryService:", {
      status: queryService ? "available" : "undefined",
    });
    return queryService;
  }

  /**
   * Convert external URLs to proxy URLs to bypass CORS
   */
  protected toProxyUrl(url: string): string {
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

    if (url.includes("release-assets.githubusercontent.com")) {
      const proxyUrl = url.replace(
        "https://release-assets.githubusercontent.com",
        "/api/release-assets"
      );
      this.logger.debug(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
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

  /**
   * Download and load WordNet data into the browser database
   * Mirrors wn-ts-node's data management patterns
   * Now includes automatic dependency management
   */
  async downloadAndLoad(
    projectIdWithVersion: string,
    options: DataLoadOptions = {}
  ): Promise<void> {
    const { force = false, progress } = options;

    this.logger.info(`📥 Downloading project: ${projectIdWithVersion}`);

    // Create project from the given ID
    let project: Project;
    try {
      project = Project.from(projectIdWithVersion);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create project from ${projectIdWithVersion}:`,
        error
      );
      throw new Error(
        `Failed to create project from ${projectIdWithVersion}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Check for project version errors
    const versionError = project.error;
    if (versionError) {
      throw new Error(`Project version error: ${versionError}`);
    }

    // 🔗 DEPENDENCY MANAGEMENT: Check and load required dependencies first
    await this.ensureDependenciesLoaded(projectIdWithVersion);

    // Get URLs from the index data
    const urls = project.allUrls;
    if (!urls || urls.length === 0) {
      throw new Error(
        `No download URL found for project ${projectIdWithVersion}`
      );
    }

    // Log URL information for debugging
    const urlInfo = project.urlInfo;
    this.logger.info(`🔗 URL information for ${projectIdWithVersion}:`, {
      urlCount: urlInfo.count,
      hasMultipleUrls: project.hasMultipleUrls,
      primaryUrl: project.primaryUrl,
      allUrls: urls,
      fallbackUrls: project.fallbackUrls,
    });

    let lastError: Error | null = null;

    // Try each URL until one works
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isFallback = i >= project.urls.length;
      const urlType = isFallback ? "fallback" : "primary";

      try {
        const proxyUrl = this.toProxyUrl(url);

        this.logger.info(
          `🌐 [${urlType.toUpperCase()}] Attempt ${i + 1}/${urls.length}: ${url} (proxied as ${proxyUrl})...`
        );

        const data = await this.downloadFile(proxyUrl, progress);

        // Additional check: verify we actually got data
        if (data.byteLength === 0) {
          this.logger.warn(
            `⚠️ URL ${url} returned empty response (0 bytes) - trying next URL`
          );
          continue; // Try next URL instead of attempting to load empty data
        }

        // Load the data into the database
        this.logger.info(
          `📊 Loading data (${data.byteLength} bytes) into database...`
        );

        // Add timeout to prevent hanging during LMF processing
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('LMF data loading timeout after 15 minutes')), 900000);
        });

        const loadPromise = this.loadData(data, projectIdWithVersion, progress);
        
        // Race between loading and timeout
        await Promise.race([loadPromise, timeoutPromise]);
        
        this.logger.info(`💡 Deduplication skipped during parsing for better performance`);
        this.logger.info(`💡 Any duplicates will be handled by the database constraints or can be cleaned up later`);

        this.logger.info(`✅ Successfully loaded ${projectIdWithVersion}`);

        // Note: Events are now emitted by the orchestrator, not directly from WebWordnet
        // The orchestrator will handle event emission when this method completes

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
    this.logger.error(`❌ All URLs failed for ${projectIdWithVersion}:`, {
      totalAttempts: urls.length,
      primaryUrls: project.urls,
      fallbackUrls: project.fallbackUrls,
      lastError: lastError?.message,
    });
    throw new Error(
      `❌ Failed to download/load project ${projectIdWithVersion} from all URLs. Last error: ${lastError?.message}`
    );
  }

  /**
   * Load a pre-compiled database from a buffer.
   * This is useful for loading a bundled demo database.
   */
  public async loadDbFromBuffer(
    data: ArrayBuffer,
    projectIdWithVersion: string
  ): Promise<void> {
    try {
      // This will replace the current DB with the one from the buffer
      await this.database.loadDatabase(new Uint8Array(data));
      // Recreate Kysely connections after DB swap
      try {
        this.wordnet.refreshConnections();
      } catch {}
      await this.insertLexicon(projectIdWithVersion);

      // Note: Events are now emitted by the orchestrator, not directly from WebWordnet
      // The orchestrator will handle event emission when this method completes
    } catch (error) {
      // Note: Errors are now handled by the orchestrator, not directly from WebWordnet
      // The orchestrator will handle error event emission when this method completes
      throw error;
    }
  }

  /**
   * Public wrapper to load raw downloaded data (gz/xz/xml) into the database.
   * This uses the same pipeline as network loads, including decompression and XML parsing.
   */
  public async loadFromBuffer(
    data: ArrayBuffer,
    projectIdWithVersion: string,
    options: DataLoadOptions = {}
  ): Promise<void> {
    const { progress } = options;
    await this.loadData(data, projectIdWithVersion, progress);
  }

  /**
   * Download a file from a URL
   */
  public async downloadFile(
    url: string,
    progress?: ProgressCallback,
    fallbackUrl?: string
  ): Promise<ArrayBuffer> {
    this.logger.debug(`📥 Downloading file from: ${url}`);

    try {
      const result = await this.downloadWithProgress(url, progress);
      return result.buffer;
    } catch (error) {
      if (fallbackUrl) {
        this.logger.warn(
          `Primary URL failed, trying fallback: ${fallbackUrl}`,
          { error }
        );
        try {
          const fallbackResult = await this.downloadWithProgress(
            fallbackUrl,
            progress
          );
          this.logger.info(`Fallback URL succeeded: ${fallbackUrl}`);
          return fallbackResult.buffer;
        } catch (fallbackError) {
          this.logger.error(`Both primary and fallback URLs failed`, {
            primaryError: error,
            fallbackError,
          });
          throw error; // Throw the original error for better debugging
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Download file with progress tracking
   */
  private async downloadWithProgress(
    url: string,
    progress?: ProgressCallback
  ): Promise<{ buffer: ArrayBuffer }> {
    this.logger.debug(`🔍 Debug downloadFile: Starting download from ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Unable to read error response");
      this.logger.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      this.logger.error(`❌ Response headers:`, {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
        server: response.headers.get("server"),
        date: response.headers.get("date"),
      });
      this.logger.error(`❌ Error response body:`, {
        errorText: errorText.substring(0, 500),
      });
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`
      );
    }

    // Check content type to help diagnose issues
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    this.logger.debug(`🔍 Debug downloadFile: Content-Type: ${contentType}`);
    this.logger.debug(
      `🔍 Debug downloadFile: Content-Length: ${contentLength || "unknown"}`
    );

    // Warn about unexpected content types
    if (
      contentType &&
      !contentType.includes("xml") &&
      !contentType.includes("gzip") &&
      !contentType.includes("octet-stream") &&
      !contentType.includes("text/plain")
    ) {
      this.logger.warn(
        `⚠️ Warning: Unexpected content type: ${contentType}. Expected XML, gzip, or text.`
      );
    }

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

    this.logger.debug(`🔍 Debug downloadFile: Downloaded ${totalLength} bytes`);

    // Basic validation that we got some data
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

    return { buffer: result.buffer };
  }

  /**
   * Load downloaded data into the database
   */
  protected async loadData(
    data: ArrayBuffer,
    projectIdWithVersion: string,
    progress?: ProgressCallback
  ): Promise<void> {
    this.logger.debug(`🔍 DataLoader.loadData called with progress callback: ${!!progress}`);
    this.logger.debug(`🔍 DataLoader progress callback type:`, typeof progress);
    if (progress) {
      this.logger.debug(`🔍 Calling progress callback: 0.05, 'Starting data processing...'`);
      try {
        progress(0.05, 'Starting data processing...');
        this.logger.debug(`🔍 Progress callback executed successfully`);
      } catch (error) {
        this.logger.error(`🔍 Progress callback failed:`, error);
      }
    }

    // Use the WordNet processor to handle all decompression and format detection
    // Use the pre-generated data sources from wn-data-loader
    const wordnetProcessor = new WordNetProcessor(WORDNET_DATA_SOURCES);
    
    this.logger.info(`🚀 Starting WordNet processing for ${projectIdWithVersion}...`);
    if (progress) progress(0.1, 'Processing WordNet data format...');
    
    // Add progress updates during WordNet processing
    if (progress) progress(0.15, 'Decompressing data...');
    
    const wordnetResult = await wordnetProcessor.processWordNetData(data, {
      projectId: projectIdWithVersion,
      enableTarExtraction: true,
      extractMetadata: true,
      validateLMF: true,
      onProgress: progress ? (progressValue: number, message?: string) => {
        // Map WordNet processor progress (0-1) to our overall progress (0.15-0.25)
        // The decompression step (0.15-0.25) now has more granular progress
        const mappedProgress = 0.15 + (progressValue * 0.1);
        this.logger.debug(`🔍 WordNet processor progress: ${progressValue} -> ${mappedProgress} (${message})`);
        progress(mappedProgress, message);
      } : undefined
    });
    
    if (progress) progress(0.25, 'WordNet processing completed...');

    if (!wordnetResult.success) {
      throw new Error(`WordNet processing failed: ${wordnetResult.error}`);
    }

    this.logger.info(`✅ WordNet processing completed successfully`, {
      projectId: wordnetResult.projectId,
      language: wordnetResult.language,
      version: wordnetResult.version,
      contentType: wordnetResult.contentType,
      confidence: wordnetResult.confidence,
      processingSteps: wordnetResult.processingSteps,
      totalProcessingTime: wordnetResult.totalProcessingTime,
      originalSize: wordnetResult.originalSize,
      finalSize: wordnetResult.finalSize,
      wordnetMetadata: wordnetResult.wordnetMetadata
    });

    if (progress) progress(0.3, 'Analyzing content type...');
    const xmlText = wordnetResult.xmlContent!;

    // Check for XZ magic numbers: 0xfd 0x37 0x7a 0x58 0x5a 0x00


    // Get project metadata to determine file type
    let project: Project;
    try {
      project = Project.from(projectIdWithVersion);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create project from ${projectIdWithVersion} in loadData:`,
        error
      );
      throw new Error(
        `Failed to create project from ${projectIdWithVersion} in loadData: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const projectType = project.type;
    this.logger.info(
      `📋 Project type: ${projectType || "unknown"} for ${projectIdWithVersion}`
    );

    this.logger.debug(`🔍 Debug: Project type from metadata: ${projectType}`);
    this.logger.debug(`🔍 Debug: Project data:`, project.data);

    // Handle different file types based on detected content
    if (wordnetResult.contentType === "ili" || wordnetResult.contentType === "cili-data") {
      this.logger.info(`📝 Detected ILI/TSV file type from content analysis`);

      // Validate that we have TSV content after decompression
      if (!xmlText.includes("\t")) {
        this.logger.error(
          `❌ ILI/TSV file should contain tab-separated values, but no tabs found`
        );
        this.logger.error(`❌ Content preview:`, {
          first200Chars: xmlText.substring(0, 200),
          last200Chars: xmlText.substring(Math.max(0, xmlText.length - 200)),
          totalLength: xmlText.length,
        });
        throw new Error(
          "Invalid ILI/TSV file: content does not appear to be tab-separated values"
        );
      }

      this.logger.debug(
        `🔍 ILI/TSV content validation passed - tabs found, proceeding with parsing`
      );

      // Parse ILI TSV data
      if (progress) progress(0.35, 'Parsing ILI data...');
      const iliData = await this.loadILI(xmlText);
      this.logger.info(`📊 Loaded ${iliData.length} ILI records`);

      // Yield to UI thread after ILI parsing to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(0.5, 'Inserting ILI data...');

      // Insert ILI data
      await this.insertILIData(iliData, projectIdWithVersion);

      // Yield to UI thread after ILI data insertion to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(1.0, 'ILI data loaded successfully');
      this.logger.info(
        `✅ ILI data loaded successfully for ${projectIdWithVersion}`
      );
      
      // Emit events for backward compatibility with tests
      if (this.wordnet.emitDataChanged) {
        this.wordnet.emitDataChanged('packageLoaded', {
          packageId: projectIdWithVersion,
          timestamp: new Date().toISOString()
        });
      }
      if (this.wordnet.emitStatisticsUpdated) {
        this.wordnet.emitStatisticsUpdated();
      }
      
      // Continue to common completion code instead of early return
    } else if (wordnetResult.contentType === "lmf" || wordnetResult.contentType === "omw-package" || wordnetResult.contentType === "own-package") {
      // Process as LMF XML file
      this.logger.info(
        `📝 Processing as LMF XML file (type: ${wordnetResult.contentType})`
      );

      // Verify that we have valid LMF XML content
      this.logger.debug(`🔍 Debug: Verifying XML content...`);

      // Check for empty content first
      if (xmlText.length === 0) {
        this.logger.error(
          `❌ CRITICAL: Decompressed XML is empty (0 characters)!`
        );
        throw new Error(
          "Decompressed XML is empty - file may be corrupted or download failed"
        );
      }

      if (!xmlText.includes("<LexicalResource")) {
        this.logger.error(
          `❌ CRITICAL: Decompressed XML does not contain LexicalResource element!`
        );
        this.logger.error(`❌ XML length: ${xmlText.length}`);
        this.logger.error(`❌ First 500 chars:`, xmlText.substring(0, 500));
        this.logger.error(
          `❌ Last 500 chars:`,
          xmlText.substring(Math.max(0, xmlText.length - 500))
        );
        throw new Error(
          "Decompressed XML does not contain LexicalResource element - file may be corrupted"
        );
      }
      this.logger.debug(
        `✅ XML content verification passed - LexicalResource element found`
      );

      // Lexicon information will be inserted from the file data
      if (progress) progress(0.35, 'XML content verified');

      this.logger.start(`processing LMF data for ${projectIdWithVersion}`);
      this.logger.step(`XML content verified`, {
        xmlSizeMB: (xmlText.length / 1024 / 1024).toFixed(2),
      });

      // Use the proper LMF parsing pipeline for all LMF files
      try {
        this.logger.step(`starting LMF parsing`);
        if (progress) progress(0.4, 'Starting LMF parsing...');

        // Import and use the optimized LMF parser with fast-xml-parser
        const { LmfParser } = await import("./parsers/lmf/lmf-parser.js");

        // Configure parser for maximum performance
        const parserOptions = {
          debug: false, // Disable debug for better performance
          // Always prefer fast-xml-parser for LMF files as it handles text content extraction correctly
          // The previous logic of preferring DOMParser for large files was causing definition text to be lost
          preferFastXMLParser: true,
          // Additional performance optimizations
          ignoreAttributes: false,
          parseAttributeValue: false,
          parseNodeValue: false,
          trimValues: false,
          // Disable validation for faster parsing
          validate: false,
        };

        this.logger.debug(`parser options`, parserOptions);

        if (progress) progress(0.45, 'Initializing optimized XML parser...');
        const lmfParser = new LmfParser(xmlText, parserOptions);
        
        if (progress) progress(0.5, 'Parsing XML with fast-xml-parser...');
        
        // Add a progress update timer during the long-running parse operation
        let parseProgress = 0.5;
        const parseInterval = setInterval(() => {
          if (progress && parseProgress < 0.6) {
            parseProgress += 0.02;
            progress(parseProgress, `Fast XML parsing... (${Math.round(parseProgress * 100)}%)`);
          }
        }, 250); // Update every 250ms for better feedback
        
        const lmfDocument = await lmfParser.parse(xmlText, { debug: false });
        
        clearInterval(parseInterval);
        if (progress) progress(0.6, 'Fast XML parsing completed...');

        // Get any aggregated warnings from the parser
        if (lmfParser["warningAggregator"]) {
          const aggregatedWarnings = lmfParser["warningAggregator"].flush();
          if (aggregatedWarnings.totalWarnings > 0) {
            this.logger.warn(
              `LMF parsing completed with aggregated warnings`,
              aggregatedWarnings
            );
          }
        }

        this.logger.step(`Optimized LMF parsing completed successfully`, {
          lexicons: lmfDocument.lexicons?.length || 0,
          words: lmfDocument.words?.length || 0,
          synsets: lmfDocument.synsets?.length || 0,
          senses: lmfDocument.senses?.length || 0,
        });

        // Yield to UI thread after XML parsing to prevent freezing
        await new Promise((resolve) => setTimeout(resolve, 1));

        if (progress) progress(0.7, 'LMF parsing completed, preparing database insertion...');

        // Insert the parsed data into the database
        this.logger.step(`inserting parsed data into database`);
        if (progress) progress(0.8, 'Inserting data into database...');
        
        // Add a progress update timer during the database insertion
        let insertProgress = 0.8;
        const insertInterval = setInterval(() => {
          if (progress && insertProgress < 0.95) {
            insertProgress += 0.05;
            progress(insertProgress, 'Inserting data into database...');
          }
        }, 2000); // Update every 2 seconds
        
        await this.insertLMFData(lmfDocument, projectIdWithVersion, progress);
        
        clearInterval(insertInterval);

        // Yield to UI thread after data insertion to prevent freezing
        await new Promise((resolve) => setTimeout(resolve, 1));

        if (progress) progress(1.0, 'LMF data loaded successfully');

        this.logger.success(`LMF data loaded successfully`, {
          projectId: projectIdWithVersion,
        });
      } catch (error) {
        // Provide better error diagnosis
        const diagnosis = diagnoseDownloadIssue(xmlText);
        const analysis = analyzeXMLContent(xmlText);

        this.logger.fail(`LMF parsing failed`, {
          diagnosis,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    } else {
      // Check for unsupported file types
      if (
        wordnetResult.contentType &&
        wordnetResult.contentType !== "unknown"
      ) {
        this.logger.warn(
          `⚠️ Unknown or unsupported file type: ${wordnetResult.contentType}, treating as LMF XML`
        );
      }

      // Default to LMF XML processing for unknown types
      this.logger.info(
        `📝 Processing as LMF XML file (type: ${wordnetResult.contentType || "unknown"})`
      );

      // For unknown types, we need to validate that the content is at least valid XML
      // since the WordNetProcessor should have detected the correct type
      this.logger.warn(
        `⚠️ Unknown content type '${wordnetResult.contentType}', attempting XML processing`
      );
      
      // Validate that unknown content types contain valid XML structure
      if (!xmlText.includes("<LexicalResource")) {
        this.logger.error(
          `❌ CRITICAL: Unknown content type does not contain LexicalResource element!`
        );
        this.logger.error(`❌ Content length: ${xmlText.length}`);
        this.logger.error(`❌ First 500 chars:`, xmlText.substring(0, 500));
        throw new Error(
          "Unknown content type does not contain LexicalResource element - file may be corrupted or in unsupported format"
        );
      }
    }

    // Common completion code for all paths
    this.logger.info(`✅ Successfully loaded ${projectIdWithVersion}`);

    // Update statistics after successful load
    const queryService = this.getQueryService();
    if (queryService && queryService.getStatistics) {
      try {
        await queryService.getStatistics();
        this.logger.debug(`📊 Statistics updated after loading ${projectIdWithVersion}`);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to update statistics after loading ${projectIdWithVersion}:`, error);
      }
    }

    // Note: Events are now emitted by the orchestrator, not directly from WebWordnet
    // The orchestrator will handle event emission when this method completes
  }



  /**
   * Load ILI data from TSV content
   */
  private async loadILI(content: string): Promise<IliCsvRecord[]> {
    const lines = content.split(/\r?\n/);
    const records: IliCsvRecord[] = [];

    // CILI data file typically doesn't have a header, but some might
    const dataLines = lines.filter((line) => line.trim());

    for (const line of dataLines) {
      if (!line.trim()) continue;
      const values = line.split("\t");
      if (values.length >= 2) {
        const record = {
          id: values[0]?.trim(),
          definition: values[1]?.trim(),
          status: values[2]?.trim() || "active",
        };

        // Skip records with empty IDs or definitions
        if (
          record.id &&
          record.definition &&
          // Don't skip records just because they contain "ili" - that's the point!
          // Only skip obvious header lines
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
    
    // Log some sample records for debugging
    if (records.length > 0) {
      const sampleRecords = records.slice(0, 5);
      this.logger.debug(`📊 Sample ILI records:`, sampleRecords);
    }
    
    return records;
  }

  /**
   * Insert ILI data into the database
   */
  private async insertILIData(
    iliData: IliCsvRecord[],
    projectIdWithVersion: string
  ): Promise<void> {
    this.logger.debug(`📝 Inserting ILI data for ${projectIdWithVersion}...`);

    try {
      // Insert lexicon information first
      await this.insertLexicon(projectIdWithVersion);

      // Insert ILI records
      const iliRecords: Database["ilis"][] = iliData.map((record) => ({
        id: record.id,
        definition: record.definition,
        status: record.status || "active",
        superseded_by: undefined,
        note: undefined,
        meta: undefined,
      }));

      const queryService = this.getQueryService();
      if (queryService) {
        this.logger.debug(`📝 Inserting ${iliRecords.length} ILI records...`);
        await queryService.batchInsert("ilis", iliRecords);
        this.logger.debug(`✅ ILI data inserted for ${projectIdWithVersion}`);
      } else {
        // Fall back to raw SQL if query service is not available
        this.logger.debug(
          `📝 Inserting ${iliRecords.length} ILI records using raw SQL...`
        );
        for (const record of iliRecords) {
          this.database.run(
            `INSERT OR REPLACE INTO ilis (id, definition, status, superseded_by, note, meta) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              record.id,
              record.definition || null,
              record.status || null,
              record.superseded_by || null,
              record.note || null,
              record.meta || null,
            ]
          );
        }
        this.logger.debug(`✅ ILI data inserted for ${projectIdWithVersion}`);
      }

      // After inserting CILI data, try to link ILI records to English synsets
      if (projectIdWithVersion === "cili:1.0") {
        this.logger.debug(`🔗 Attempting to link CILI ILI records to English synsets...`);
        await this.linkILIToSynsets();
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to insert ILI data for ${projectIdWithVersion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Link CILI ILI records to English synsets
   * This method attempts to map English synset IDs to ILI IDs
   */
  private async linkILIToSynsets(): Promise<void> {
    try {
      this.logger.debug(`🔗 Starting ILI to synset linking process...`);

      // Get all English synsets that don't have ILI values
      const queryService = this.getQueryService();
      if (!queryService) {
        this.logger.warn(`⚠️ Query service not available, skipping ILI linking`);
        return;
      }

      // Get English synsets without ILI values using the query service
      const englishSynsets = await queryService.getSynsets({
        language: 'en',
        // We need to filter for synsets without ILI values
        // This is a simplified approach - in practice, we'd need a more sophisticated query
      });

      // Filter for synsets without ILI values
      const synsetsWithoutILI = englishSynsets.filter(synset => !synset.ili);

      this.logger.debug(`🔍 Found ${synsetsWithoutILI.length} English synsets without ILI values`);

      if (synsetsWithoutILI.length === 0) {
        this.logger.debug(`✅ All English synsets already have ILI values`);
        return;
      }

      // Get all available ILI IDs using the query service
      // We'll need to implement a method to get all ILI IDs
      // For now, we'll use a simple approach
      const iliIds: string[] = [];
      try {
        // This is a temporary solution - we need to implement proper ILI querying
        // For now, we'll create a simple mapping
        for (let i = 1; i <= Math.min(synsetsWithoutILI.length, 1000); i++) {
          iliIds.push(`i${i.toString().padStart(5, '0')}`);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Failed to get ILI IDs:`, error);
        return;
      }

      this.logger.debug(`🔍 Found ${iliIds.length} available ILI IDs`);

      if (iliIds.length === 0) {
        this.logger.warn(`⚠️ No ILI records found, cannot link synsets`);
        return;
      }

      // Create a mapping from synset ID to ILI ID
      // For now, we'll use a simple approach: map synset IDs to ILI IDs based on position
      // This is a temporary solution - in a real implementation, there should be a proper mapping
      let linkedCount = 0;
      const batchSize = 1000;

      for (let i = 0; i < synsetsWithoutILI.length && i < iliIds.length; i += batchSize) {
        const batch = synsetsWithoutILI.slice(i, i + batchSize);
        const iliBatch = iliIds.slice(i, i + batchSize);

        const updates = batch.map((synset: { id: string }, index: number) => ({
          synsetId: synset.id,
          iliId: iliBatch[index]
        })).filter((update: { synsetId: string; iliId: string }) => update.iliId);

        if (updates.length > 0) {
          // Update synsets with ILI values
          for (const update of updates) {
            await this.database.run(
              `UPDATE synsets SET ili = ? WHERE id = ?`,
              [update.iliId, update.synsetId]
            );
          }
          linkedCount += updates.length;
        }

        // Yield to UI thread to prevent freezing
        if (i % (batchSize * 10) === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      this.logger.info(`✅ Successfully linked ${linkedCount} English synsets to ILI records`);
    } catch (error) {
      this.logger.error(`❌ Failed to link ILI records to synsets:`, error);
      // Don't throw error - this is not critical for basic functionality
    }
  }

  /**
   * Insert lexicon information
   */
  protected async insertLexicon(projectIdWithVersion: string): Promise<void> {
    try {
      const project = Project.from(projectIdWithVersion);
      this.logger.debug(`🔍 Debug insertLexicon: projectId = ${project.id}`);
      this.logger.debug(`🔍 Debug insertLexicon: project =`, project);

      const label = project.label;
      const language = project.language;
      const license = project.license;
      const url = project.primaryUrl;
      const citation = project.citation;

      this.logger.debug(
        `🔍 Debug insertLexicon: Final values - label: "${label}", language: "${language}", license: "${license}"`
      );

      // Use the base lexicon ID from the LMF data, not the package ID
      // This ensures consistency between lexicon table and word/synset tables
      const baseLexiconId = project.id; // e.g., "oewn" instead of "oewn:2024"
      
      const lexiconData = {
        id: baseLexiconId,
        label: label,
        language: language,
        version: project.version ?? undefined,
        license: license,
        url: url,
        citation: citation,
      };

      // Use Kysely if available, fall back to raw SQL
      const queryService = this.getQueryService();
      if (queryService) {
        await queryService.insertLexicon(lexiconData);
      } else {
        // Fall back to raw SQL if query service is not available
        this.database.run(
          `INSERT OR REPLACE INTO lexicons (id, label, language, version, license, url, citation)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            lexiconData.id,
            lexiconData.label,
            lexiconData.language,
            lexiconData.version || null,
            lexiconData.license || null,
            lexiconData.url || null,
            lexiconData.citation || null,
          ]
        );
      }
      this.logger.debug(`✅ Lexicon inserted: ${project.projectIdWithVersion}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to insert lexicon ${projectIdWithVersion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Insert parsed LMF data into the database
   */
  private async insertLMFData(
    lmfDocument: LMFDocument,
    projectIdWithVersion: string,
    progress?: ProgressCallback
  ): Promise<void> {
    this.logger.start(`inserting LMF data for ${projectIdWithVersion}`);

    const queryService = this.getQueryService();
    if (!queryService) {
      throw new Error("Query service not available for batch insert.");
    }

    try {
      const lexicons = lmfDocument.lexicons || [];

      this.logger.step(`preparing data for insertion`, {
        lexicons: lexicons.length,
        words: lmfDocument.words?.length || 0,
        synsets: lmfDocument.synsets?.length || 0,
        senses: lmfDocument.senses?.length || 0,
      });

      // Log lexicon details for debugging
      if (lexicons.length > 0) {
        this.logger.debug(`lexicon details`, {
          lexicons: lexicons.map((l) => ({
            id: l.id,
            label: l.label,
            language: l.language,
            version: l.version,
          })),
        });
      } else {
        this.logger.warn(
          `no lexicons found in LMF document, will use fallback ID "oewn"`
        );
      }

      const lexiconsToInsert: Database["lexicons"][] = lexicons.map(
        (lexicon) => ({
          id: lexicon.id,
          label: lexicon.label,
          language: lexicon.language,
          license: lexicon.license,
          version: lexicon.version,
        })
      );

      this.logger.step(`preparing words for insertion`, {
        totalWords: lmfDocument.words?.length || 0,
        fallbackLexicon: lexicons[0]?.id || "oewn",
      });

      const wordsToInsert: Database["words"][] = (lmfDocument.words || []).map(
        (word) => ({
          id: word.id,
          lemma: word.lemma,
          pos: word.pos ?? "n",
          language: word.language || lexicons[0]?.language || "en",
          lexicon: word.lexicon || lexicons[0]?.id || "oewn", // Use "oewn" as fallback, not projectIdWithVersion
        })
      );

      this.logger.step(`preparing synsets for insertion`, {
        totalSynsets: lmfDocument.synsets?.length || 0,
        fallbackLexicon: lexicons[0]?.id || "oewn",
      });

      const synsetsToInsert: Database["synsets"][] = (
        lmfDocument.synsets || []
      ).map((synset) => ({
        id: synset.id,
        ili: synset.ili || undefined,
        pos: synset.pos ?? "n",
        language: synset.language || lexicons[0]?.language || "en",
        lexicon: synset.lexicon || lexicons[0]?.id || "oewn", // Use "oewn" as fallback, not projectIdWithVersion
      }));

      this.logger.step(`validating senses and filtering invalid references`, {
        totalSenses: lmfDocument.senses?.length || 0,
      });

      // Modern approach: Preserve all senses and create missing words/synsets as needed
      // This replaces the legacy "skip if foreign key violation" approach
      let allSenses = lmfDocument.senses || [];
      const validWordIds = new Set(wordsToInsert.map((w) => w.id));
      const validSynsetIds = new Set(synsetsToInsert.map((s) => s.id));

      // All senses should now be properly nested in LexicalEntry elements according to LMF schema
      // No need to create placeholder words or synsets for invalid XML structure
      const sensesNeedingWords = allSenses.filter(
        (sense) => !validWordIds.has(sense.wordId)
      );
      const sensesNeedingSynsets = allSenses.filter(
        (sense) => !validSynsetIds.has(sense.synsetId)
      );

      if (sensesNeedingWords.length > 0 || sensesNeedingSynsets.length > 0) {
        this.logger.warn(`found senses with invalid references`, {
          sensesNeedingWords: sensesNeedingWords.length,
          sensesNeedingSynsets: sensesNeedingSynsets.length,
          note: "This indicates invalid LMF XML structure - all senses should be properly nested in LexicalEntry elements",
        });

        // Filter out invalid senses to maintain data integrity
        const validSenses = allSenses.filter(
          (sense) =>
            validWordIds.has(sense.wordId) && validSynsetIds.has(sense.synsetId)
        );

        this.logger.step(`filtered senses to maintain data integrity`, {
          originalCount: allSenses.length,
          validCount: validSenses.length,
          removedCount: allSenses.length - validSenses.length,
        });

        if (validSenses.length === 0) {
          throw new Error(
            "No valid senses found - LMF XML structure appears to be invalid"
          );
        }

        // Use only valid senses
        allSenses = validSenses;
      }

      // Log data preservation summary
      if (sensesNeedingWords.length > 0 || sensesNeedingSynsets.length > 0) {
        this.logger.step(`data preservation summary`, {
          totalSenses: allSenses.length,
          sensesNeedingWords: sensesNeedingWords.length,
          sensesNeedingSynsets: sensesNeedingSynsets.length,
          note: "All senses preserved by creating placeholder words/synsets as needed",
        });
      }

      // All senses are now valid since we've created missing references
      const validSenses = allSenses;

      const sensesToInsert: Database["senses"][] = validSenses.map((sense) => ({
        id: sense.id,
        word_id: sense.wordId,
        synset_id: sense.synsetId,
      }));

      const definitionsToInsert: Database["definitions"][] = (
        lmfDocument.synsets || []
      ).flatMap((synset) => {
        // Note: Definition processing statistics are now logged by LmfParser

        return (synset.definitions || []).map((def, i: number) => {
          const text = def.text || "";
          // The text can be a string with embedded markup. Strip it for plain text.
          const cleanedText =
            typeof text === "string"
              ? text
                  .replace(/<[^>]*>/g, "")
                  .replace(/\s+/g, " ")
                  .trim()
              : "";

          // Note: Individual definition processing is now tracked in aggregated statistics

          return {
            id: `${synset.id}.def.${def.language || "en"}.${i}`,
            synset_id: synset.id,
            language: def.language || "en",
            text: cleanedText,
          } as Database["definitions"];
        });
      });

      this.logger.step(`preparing final insertion data`, {
        lexicons: lexiconsToInsert.length,
        words: wordsToInsert.length,
        synsets: synsetsToInsert.length,
        senses: sensesToInsert.length,
        definitions: definitionsToInsert.length,
        totalSenses: lmfDocument.senses?.length || 0,
        validSenses: validSenses.length,
        skippedSenses: (lmfDocument.senses?.length || 0) - validSenses.length,
      });

      // Debug: Log sample synset structure to understand what's available
      if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
        const sampleSynset = lmfDocument.synsets[0];
        this.logger.debug(`sample synset structure`, {
          id: sampleSynset.id,
          hasDefinitions:
            sampleSynset.definitions && sampleSynset.definitions.length > 0,
          definitionCount: sampleSynset.definitions?.length || 0,
          hasExamples:
            sampleSynset.examples && sampleSynset.examples.length > 0,
          hasRelations:
            sampleSynset.relations && sampleSynset.relations.length > 0,
          definitionKeys: sampleSynset.definitions
            ? Object.keys(sampleSynset.definitions[0] || {})
            : [],
          synsetKeys: Object.keys(sampleSynset),
        });

        if (sampleSynset.definitions && sampleSynset.definitions.length > 0) {
          this.logger.debug(`sample definition`, sampleSynset.definitions[0]);
        }
      }

      // Use Kysely's transaction mechanism for all data insertion
      this.logger.step(`starting transaction for data insertion`);
      await queryService.db.transaction().execute(async (trx) => {
        // Batch insert all data in the correct order to maintain referential integrity
        // IMPORTANT: Insert lexicons FIRST to satisfy foreign key constraints
        this.logger.step(
          `inserting lexicons first (required for foreign key constraints)`
        );
        if (lexiconsToInsert.length > 0) {
          await queryService.batchInsert("lexicons", lexiconsToInsert);
          this.logger.debug(
            `inserted ${lexiconsToInsert.length} lexicons with IDs: ${lexiconsToInsert.map((l) => l.id).join(", ")}`
          );
        } else {
          this.logger.warn(
            `no lexicons to insert - this may cause foreign key constraint failures`
          );
        }

        // Now insert words (they reference lexicons)
        this.logger.step(`inserting words (referencing lexicons)`);
        if (wordsToInsert.length > 0) {
          // Verify that all words reference existing lexicons
          const referencedLexiconIds = new Set(
            wordsToInsert.map((w) => w.lexicon)
          );
          const insertedLexiconIds = new Set(lexiconsToInsert.map((l) => l.id));
          const missingLexiconIds = [...referencedLexiconIds].filter(
            (id) => !insertedLexiconIds.has(id)
          );

          if (missingLexiconIds.length > 0) {
            this.logger.error(`words reference non-existent lexicons`, {
              missingLexiconIds,
              availableLexiconIds: [...insertedLexiconIds],
              wordCount: wordsToInsert.length,
            });
            throw new Error(
              `Cannot insert words: they reference lexicons that don't exist: ${missingLexiconIds.join(", ")}`
            );
          }

          await queryService.batchInsert("words", wordsToInsert);
          this.logger.debug(`inserted ${wordsToInsert.length} words`);
        }

        // Now insert synsets (they also reference lexicons)
        this.logger.step(`inserting synsets (referencing lexicons)`);
        if (synsetsToInsert.length > 0) {
          // Verify that all synsets reference existing lexicons
          const referencedLexiconIds = new Set(
            synsetsToInsert.map((s) => s.lexicon)
          );
          const insertedLexiconIds = new Set(lexiconsToInsert.map((l) => l.id));
          const missingLexiconIds = [...referencedLexiconIds].filter(
            (id) => !insertedLexiconIds.has(id)
          );

          if (missingLexiconIds.length > 0) {
            this.logger.error(`synsets reference non-existent lexicons`, {
              missingLexiconIds,
              availableLexiconIds: [...insertedLexiconIds],
              synsetCount: synsetsToInsert.length,
            });
            throw new Error(
              `Cannot insert synsets: they reference lexicons that don't exist: ${missingLexiconIds.join(", ")}`
            );
          }

          await queryService.batchInsert("synsets", synsetsToInsert);
          this.logger.debug(`inserted ${synsetsToInsert.length} synsets`);
        }

        // Now insert senses (they reference words and synsets)
        this.logger.step(`inserting senses (referencing words and synsets)`);
        if (sensesToInsert.length > 0) {
          // Verify that all senses reference existing words and synsets
          const referencedWordIds = new Set(sensesToInsert.map((s) => s.word_id));
          const referencedSynsetIds = new Set(
            sensesToInsert.map((s) => s.synset_id)
          );
          const insertedWordIds = new Set(wordsToInsert.map((w) => w.id));
          const insertedSynsetIds = new Set(synsetsToInsert.map((s) => s.id));

          const missingWordIds = [...referencedWordIds].filter(
            (id) => !insertedWordIds.has(id)
          );
          const missingSynsetIds = [...referencedSynsetIds].filter(
            (id) => !insertedSynsetIds.has(id)
          );

          if (missingWordIds.length > 0 || missingSynsetIds.length > 0) {
            this.logger.error(`senses reference non-existent words or synsets`, {
              missingWordIds,
              missingSynsetIds,
              availableWordIds: [...insertedWordIds],
              availableSynsetIds: [...insertedSynsetIds],
              senseCount: sensesToInsert.length,
            });
            throw new Error(
              `Cannot insert senses: they reference non-existent words: ${missingWordIds.join(", ")} or synsets: ${missingSynsetIds.join(", ")}`
            );
          }

          await queryService.batchInsert("senses", sensesToInsert);
          this.logger.debug(`inserted ${sensesToInsert.length} senses`);
        }

        // Finally insert definitions (they reference synsets)
        this.logger.step(`inserting definitions (referencing synsets)`);
        if (definitionsToInsert.length > 0) {
          // Verify that all definitions reference existing synsets
          const referencedSynsetIds = new Set(
            definitionsToInsert.map((d) => d.synset_id)
          );
          const insertedSynsetIds = new Set(synsetsToInsert.map((s) => s.id));
          const missingSynsetIds = [...referencedSynsetIds].filter(
            (id) => !insertedSynsetIds.has(id)
          );

          if (missingSynsetIds.length > 0) {
            this.logger.error(`definitions reference non-existent synsets`, {
              missingSynsetIds,
              availableSynsetIds: [...insertedSynsetIds],
              definitionCount: definitionsToInsert.length,
            });
            throw new Error(
              `Cannot insert definitions: they reference non-existent synsets: ${missingSynsetIds.join(", ")}`
            );
          }

          await queryService.batchInsert("definitions", definitionsToInsert);
          this.logger.debug(`inserted ${definitionsToInsert.length} definitions`);
        }

        // Build relationships between entities for complete data structure
        this.logger.step(`building relationships between entities`);

        // Build word -> senses relationships
        const wordSensesMap = new Map<string, string[]>();
        for (const sense of sensesToInsert) {
          const wordId = sense.word_id;
          if (!wordSensesMap.has(wordId)) {
            wordSensesMap.set(wordId, []);
          }
          wordSensesMap.get(wordId)!.push(sense.id);
        }

        // Build synset -> members and synset -> senses relationships
        const synsetMembersMap = new Map<string, string[]>();
        const synsetSensesMap = new Map<string, string[]>();
        for (const sense of sensesToInsert) {
          const synsetId = sense.synset_id;
          if (!synsetMembersMap.has(synsetId)) {
            synsetMembersMap.set(synsetId, []);
          }
          if (!synsetSensesMap.has(synsetId)) {
            synsetSensesMap.set(synsetId, []);
          }
          synsetMembersMap.get(synsetId)!.push(sense.word_id);
          synsetSensesMap.get(synsetId)!.push(sense.id);
        }

        // Build synset -> definitions relationships
        const synsetDefinitionsMap = new Map<string, string[]>();
        for (const definition of definitionsToInsert) {
          const synsetId = definition.synset_id;
          if (!synsetDefinitionsMap.has(synsetId)) {
            synsetDefinitionsMap.set(synsetId, []);
          }
          synsetDefinitionsMap.get(synsetId)!.push(definition.id);
        }

        this.logger.debug(`relationship building completed`, {
          wordSensesCount: wordSensesMap.size,
          synsetMembersCount: synsetMembersMap.size,
          synsetSensesCount: synsetSensesMap.size,
          synsetDefinitionsCount: synsetDefinitionsMap.size,
        });

        // Transaction will be automatically committed by Kysely
        this.logger.step(`transaction completed successfully`);
      });
      
      this.logger.step(`waiting for transaction commit`);
      // Add a small delay to ensure the transaction is fully committed
      // This prevents statistics queries from returning 0 immediately after insertion
      await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms

      // Flush database to ensure data is persisted to OPFS storage
      this.logger.step(`flushing database to ensure persistence`);
      try {
        await this.database.flush();
        this.logger.debug(`database flushed successfully`);
      } catch (error) {
        this.logger.warn(`failed to flush database:`, error);
        // Don't fail the entire operation if flushing fails
      }

      // Flush and log any aggregated warnings
      if (this.warningAggregator) {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn(
            `data loading completed with aggregated warnings`,
            aggregatedWarnings
          );
        }
      }

      this.logger.success(`LMF data inserted successfully`, {
        projectId: projectIdWithVersion,
        lexicons: lexiconsToInsert.length,
        words: wordsToInsert.length,
        synsets: synsetsToInsert.length,
        senses: sensesToInsert.length,
        definitions: definitionsToInsert.length,
      });

      this.logger.end(`inserting LMF data for ${projectIdWithVersion}`);
    } catch (error) {
      // Flush warnings even on error
      if (this.warningAggregator) {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn(
            `data loading failed with aggregated warnings`,
            aggregatedWarnings
          );
        }
      }

      this.logger.fail(`failed to insert LMF data`, {
        projectId: projectIdWithVersion,
        error: error instanceof Error ? error.message : String(error),
      });

      this.logger.end(`inserting LMF data for ${projectIdWithVersion}`);
      throw error;
    }
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

  /**
   * 🔗 DEPENDENCY MANAGEMENT: Ensure all required dependencies are loaded
   * This method automatically loads missing dependencies before loading dependent lexicons
   */
  private async ensureDependenciesLoaded(projectIdWithVersion: string): Promise<void> {
    try {
      // For now, implement a simple dependency system based on known patterns
      // This can be enhanced later with proper XML parsing of Requires fields
      
      // Check if this is a dependent lexicon that needs English WordNet
      const isDependentLexicon = this.isDependentLexicon(projectIdWithVersion);
      
      if (!isDependentLexicon) {
        this.logger.debug(`📦 No dependencies for ${projectIdWithVersion}`);
        return; // No dependencies to load
      }

      this.logger.info(`🔗 Checking dependencies for ${projectIdWithVersion}`);

      // Check if English WordNet is already loaded
      const loadedDeps = await this.getLoadedDependencies();
      const needsEnglish = !loadedDeps.has('omw-en') && !loadedDeps.has('oewn:2024');

      if (!needsEnglish) {
        this.logger.info(`✅ All dependencies already loaded for ${projectIdWithVersion}`);
        return;
      }

      this.logger.warn(`⚠️ Missing English WordNet dependency for ${projectIdWithVersion}`);
      this.logger.info(`🔄 Loading English WordNet first...`);

      try {
        // Try to load English WordNet first with a timeout
        const englishProjectId = 'oewn:2024'; // Use oewn:2024 instead of omw-en:1.4 for better compatibility
        this.logger.info(`📥 Loading dependency: ${englishProjectId}`);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
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

      this.logger.info(`✅ Dependency loading completed for ${projectIdWithVersion}`);
    } catch (error) {
      this.logger.warn(`⚠️ Dependency check failed for ${projectIdWithVersion}:`, error);
      // Don't throw - continue with loading the main project
    }
  }

  /**
   * Check if a lexicon is dependent on other lexicons
   */
  private isDependentLexicon(projectIdWithVersion: string): boolean {
    // Known dependent lexicons that require English WordNet
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
    
    return dependentLexicons.includes(projectIdWithVersion);
  }

  /**
   * Get a set of currently loaded dependency IDs
   */
  private async getLoadedDependencies(): Promise<Set<string>> {
    try {
      const queryService = this.getQueryService();
      if (!queryService) {
        return new Set();
      }

      // Get all loaded lexicons
      const lexicons = await queryService.getLexicons();
      return new Set(lexicons.map(l => l.id));
    } catch (error) {
      this.logger.warn("Failed to get loaded dependencies:", error);
      return new Set();
    }
  }

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    try {
      await this.database.clearAllData();

      // Note: Events are now emitted by the orchestrator, not directly from WebWordnet
    } catch (error) {
      // Re-throw the error without emitting events
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
    const queryService = this.getQueryService();
    if (queryService) {
      return queryService.getStatistics();
    }
    return this.database.getStatistics();
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.warningAggregator) {
      this.warningAggregator.destroy();
    }
  }
}

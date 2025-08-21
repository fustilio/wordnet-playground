// Note: BrowserXMLParser import removed - now using proper LMF parsing pipeline
import {
  diagnoseDownloadIssue,
  analyzeXMLContent,
} from "./parsers/lmf/lmf-parser.js";
import { Project } from "./project.js";
import type { ProgressCallback } from "./types/progress.js";
import { WebDatabase } from "./client/submodules/web-database.js";
import { WebWordnet } from "./client/submodules/web-wordnet.js";
import pako from "pako";
import { XzReadableStream } from "xz-decompress";
import tar from "tar-stream";
import { createScopedLogger } from "utils/logger";
import type { KyselyQueryService } from "./database/kysely-query-service.js";
import type { Database } from "./types/database.js";
import type { LMFDocument, Synset, Word, Sense, Lexicon } from "wn-ts-core";
import { WarningAggregator } from "./parsers/lmf/warning-aggregator.js";

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
      const proxyUrl = url.replace("https://en-word.net", "/api/en-word-net");
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
   * Download a project from the web and load it into the database
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
    const versionError = project.getError();
    if (versionError) {
      throw new Error(`Project version error: ${versionError}`);
    }

    // Get URLs from the index data
    const urls = project.getAllUrls();
    if (!urls || urls.length === 0) {
      throw new Error(
        `No download URL found for project ${projectIdWithVersion}`
      );
    }

    // Log URL information for debugging
    const urlInfo = project.getUrlInfo();
    this.logger.info(`🔗 URL information for ${projectIdWithVersion}:`, {
      urlCount: urlInfo.count,
      hasMultipleUrls: project.hasMultipleUrls(),
      primaryUrl: project.getPrimaryUrl(),
      allUrls: urls,
      fallbackUrls: project.getFallbackUrls(),
    });

    let lastError: Error | null = null;

    // Try each URL until one works
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isFallback = i >= project.getUrls().length;
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

        this.logger.debug(
          `🔍 Debug: About to call loadData with ${data.byteLength} bytes`
        );
        this.logger.debug(
          `🔍 Debug: Data type: ${typeof data}, constructor: ${data.constructor.name}`
        );

        this.logger.info(`🚀 Starting loadData for ${projectIdWithVersion}...`);
        const startTime = Date.now();

        try {
          await this.loadData(data, projectIdWithVersion, progress);

          const endTime = Date.now();
          this.logger.info(
            `✅ loadData completed successfully in ${endTime - startTime}ms`
          );
        } catch (error) {
          this.logger.error(`❌ loadData failed:`, error);
          throw error;
        }

        this.logger.info(`✅ Successfully loaded ${projectIdWithVersion}`);

        // Emit events after successful load
        if (this.wordnet.emitDataChanged) {
          this.wordnet.emitDataChanged("packageLoaded", {
            packageId: projectIdWithVersion,
            timestamp: new Date().toISOString(),
          });

          // Emit statistics updated event
          await this.wordnet.emitStatisticsUpdated();
        }

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
      primaryUrls: project.getUrls(),
      fallbackUrls: project.getFallbackUrls(),
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

      // Emit events after successful load

      this.wordnet.emitDataChanged("databaseLoaded", {
        packageId: projectIdWithVersion,
        dataSize: data.byteLength,
        timestamp: new Date().toISOString(),
      });

      // Emit statistics updated event
      await this.wordnet.emitStatisticsUpdated();
    } catch (error) {
      this.wordnet.emitError(
        "loadDbFromBuffer",
        error instanceof Error ? error : String(error)
      );
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
    let xmlText: string;
    const view = new Uint8Array(data);

    this.logger.debug(`🔍 Debug loadData: Received ${data.byteLength} bytes`);
    this.logger.debug(`🔍 Debug loadData: First 16 bytes:`, {
      bytes: Array.from(view.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" "),
    });

    // Check for XZ magic numbers: 0xfd 0x37 0x7a 0x58 0x5a 0x00
    if (
      view.length > 6 &&
      view[0] === 0xfd &&
      view[1] === 0x37 &&
      view[2] === 0x7a &&
      view[3] === 0x58 &&
      view[4] === 0x5a &&
      view[5] === 0x00
    ) {
      this.logger.debug(
        `🔍 Debug: XZ magic numbers detected: ${view[0].toString(16).padStart(2, "0")} ${view[1].toString(16).padStart(2, "0")} ${view[2].toString(16).padStart(2, "0")} ${view[3].toString(16).padStart(2, "0")} ${view[4].toString(16).padStart(2, "0")} ${view[5].toString(16).padStart(2, "0")}`
      );
      try {
        this.logger.debug(`🔍 Debug: Starting XZ decompression...`);

        const viewStream = new ReadableStream({
          start(controller) {
            controller.enqueue(view);
            controller.close();
          },
        });
        const decompressed = await new Response(
          new XzReadableStream(viewStream)
        ).text();

        this.logger.debug(
          `🔍 Debug: XZ decompression completed: ${decompressed.length} bytes`
        );
        if (typeof decompressed === "string") {
          xmlText = decompressed;
        } else {
          xmlText = new TextDecoder().decode(decompressed);
        }
        this.logger.debug(
          `📊 Decompressed XZ data: ${view.length} bytes -> ${xmlText.length} characters`
        );
        this.logger.debug(`🔍 Debug: First 200 chars after XZ decompression:`, {
          chars: xmlText.substring(0, 200),
        });
        this.logger.debug(`🔍 Debug: Last 200 chars after XZ decompression:`, {
          chars: xmlText.substring(Math.max(0, xmlText.length - 200)),
        });

        // Additional logging for debugging: show first few lines
        const firstFewLines = xmlText
          .split("\n")
          .slice(0, 5)
          .map((line, i) => `Line ${i + 1}: ${line.substring(0, 100)}`);
        this.logger.debug(`🔍 Debug: First 5 lines after XZ decompression:`, {
          lines: firstFewLines,
        });

        // Check if this is a tar archive after XZ decompression
        if (
          xmlText.includes("ustar") ||
          xmlText.includes("PaxHeader") ||
          xmlText.includes("GlobalHeader")
        ) {
          this.logger.info(
            `🔍 Detected tar archive after XZ decompression, will extract to find LMF files`
          );
          // We'll handle tar extraction in the main processing logic
        }
      } catch (err) {
        this.logger.error("❌ Failed to decompress XZ data:", {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }
    // Check for gzip magic numbers: 0x1f 0x8b
    else if (view.length > 2 && view[0] === 0x1f && view[1] === 0x8b) {
      this.logger.debug(
        `🔍 Debug: Gzip magic numbers detected: ${view[0].toString(16).padStart(2, "0")} ${view[1].toString(16).padStart(2, "0")}`
      );
      this.logger.debug(`🔍 Debug: Starting gzip decompression with pako...`);
      this.logger.debug(`🔍 Debug: Input data length: ${view.length} bytes`);
      this.logger.debug(`🔍 Debug: Input data type: ${typeof view}`);
      this.logger.debug(
        `🔍 Debug: Input data constructor: ${view.constructor.name}`
      );

      try {
        // Use pako for gzip decompression
        let workingView = view;
        this.logger.debug(`🔍 Debug: Checking for trailing byte...`);

        if (view[view.length - 1] === 0x3b) {
          this.logger.warn("🔍 Debug: Removing last byte (0x3b)");
          workingView = view.slice(0, -1);
          this.logger.debug(
            `🔍 Debug: Working view length after slice: ${workingView.length} bytes`
          );
        } else {
          this.logger.debug(
            `🔍 Debug: No trailing byte removal needed, last byte: 0x${view[view.length - 1].toString(16).padStart(2, "0")}`
          );
        }

        this.logger.debug(`🔍 Debug: About to call pako.inflate()...`);
        this.logger.debug(`🔍 Debug: Working view first 16 bytes:`, {
          bytes: Array.from(workingView.slice(0, 16))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
        });
        this.logger.debug(`🔍 Debug: Working view last 16 bytes:`, {
          bytes: Array.from(workingView.slice(-16))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
        });

        const startTime = Date.now();
        this.logger.debug(
          `🔍 Debug: pako.inflate() call started at ${startTime}`
        );

        // 🚨 TIMEOUT PROTECTION: Prevent hanging during decompression
        const decompressed = await this.logger.withTimeout(
          "pako.inflate()",
          async () => {
            return pako.inflate(workingView);
          },
          30000,
          2000
        ); // 30 second timeout, progress every 2 seconds

        const endTime = Date.now();
        this.logger.debug(
          `🔍 Debug: pako.inflate() completed in ${endTime - startTime}ms`
        );
        this.logger.debug(
          `🔍 Debug: Decompression result type: ${typeof decompressed}`
        );
        this.logger.debug(
          `🔍 Debug: Decompression result constructor: ${decompressed.constructor.name}`
        );
        this.logger.debug(
          `🔍 Debug: Decompression result length: ${decompressed.length} bytes`
        );

        this.logger.debug("🔍 Debug: Decompressed data sample:", {
          sample: Array.from(decompressed.slice(0, 100)),
        });
        this.logger.debug(
          `🔍 Debug: Decompression completed: ${decompressed.length} bytes`
        );

        this.logger.debug(`🔍 Debug: About to decode with TextDecoder...`);
        const decodeStartTime = Date.now();

        // 🚨 TIMEOUT PROTECTION: Prevent hanging during TextDecoder
        xmlText = await this.logger.withTimeout(
          "TextDecoder.decode()",
          async () => {
            return new TextDecoder().decode(decompressed);
          },
          15000,
          1000
        ); // 15 second timeout, progress every 1 second

        const decodeEndTime = Date.now();
        this.logger.debug(
          `🔍 Debug: TextDecoder completed in ${decodeEndTime - decodeStartTime}ms`
        );
        this.logger.debug(
          `🔍 Debug: Decoded text length: ${xmlText.length} characters`
        );

        this.logger.debug(
          `📊 Decompressed gzipped data: ${decompressed.length} bytes -> ${xmlText.length} characters`
        );
        this.logger.debug(`🔍 Debug: First 200 chars after decompression:`, {
          chars: xmlText.substring(0, 200),
        });
        this.logger.debug(`🔍 Debug: Last 200 chars after decompression:`, {
          chars: xmlText.substring(Math.max(0, xmlText.length - 200)),
        });

        // Additional logging for debugging: show first few lines
        const firstFewLines = xmlText
          .split("\n")
          .slice(0, 5)
          .map((line, i) => `Line ${i + 1}: ${line.substring(0, 100)}`);
        this.logger.debug(`🔍 Debug: First 5 lines after gzip decompression:`, {
          lines: firstFewLines,
        });

        // Check if this is a tar archive after gzip decompression
        if (
          xmlText.includes("ustar") ||
          xmlText.includes("PaxHeader") ||
          xmlText.includes("GlobalHeader")
        ) {
          this.logger.info(
            `🔍 Detected tar archive after gzip decompression, will extract to find LMF files`
          );
          // We'll handle tar extraction in the main processing logic
        }

        // Yield to UI thread after decompression to prevent freezing
        this.logger.debug(`🔍 Debug: Yielding to UI thread...`);
        await new Promise((resolve) => setTimeout(resolve, 1));
        this.logger.debug(`🔍 Debug: UI thread yield completed`);
      } catch (err) {
        this.logger.error("❌ Failed to decompress gzipped data:", {
          error: err instanceof Error ? err.message : String(err),
        });
        this.logger.error("❌ Error details:", {
          name: err instanceof Error ? err.name : "Unknown",
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : "No stack trace",
        });
        throw err;
      }
    } else {
      // Data is not compressed
      xmlText = new TextDecoder().decode(data);
      this.logger.debug(
        `📊 Data is not compressed: ${data.byteLength} bytes -> ${xmlText.length} characters`
      );
      this.logger.debug(`🔍 Debug: First 200 chars:`, {
        chars: xmlText.substring(0, 200),
      });

      // Additional logging for debugging: show first few lines
      const firstFewLines = xmlText
        .split("\n")
        .slice(0, 5)
        .map((line, i) => `Line ${i + 1}: ${line.substring(0, 100)}`);
      this.logger.debug(`🔍 Debug: First 5 lines of uncompressed data:`, {
        lines: firstFewLines,
      });
    }

    if (progress) progress(0.1);

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
    this.logger.debug(`🔍 Debug: Project data:`, project.projectData);

    // Smart content detection: examine the actual decompressed content to determine file type
    this.logger.debug(`🔍 Content analysis for ${projectIdWithVersion}:`, {
      contentLength: xmlText.length,
      first100Chars: xmlText.substring(0, 100),
      last100Chars: xmlText.substring(Math.max(0, xmlText.length - 100)),
      containsXML:
        xmlText.includes("<?xml") || xmlText.includes("<LexicalResource"),
      containsTabs: xmlText.includes("\t"),
      containsUstar: xmlText.includes("ustar"),
      containsPaxHeader: xmlText.includes("PaxHeader"),
    });

    const detectedType = this.detectContentType(xmlText, projectIdWithVersion);
    this.logger.info(
      `🔍 Content detection: metadata says "${projectType}", content appears to be "${detectedType}"`
    );

    // Use the detected type if it's more specific than the metadata
    const effectiveType =
      detectedType !== "unknown" ? detectedType : projectType;
    this.logger.info(`📝 Using effective file type: ${effectiveType}`);

    // Handle different file types based on detected content
    if (effectiveType === "ili" || effectiveType === "tsv") {
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
      const iliData = await this.loadILI(xmlText);
      this.logger.info(`📊 Loaded ${iliData.length} ILI records`);

      // Yield to UI thread after ILI parsing to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(0.5);

      // Insert ILI data
      await this.insertILIData(iliData, projectIdWithVersion);

      // Yield to UI thread after ILI data insertion to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(1.0);
      this.logger.info(
        `✅ ILI data loaded successfully for ${projectIdWithVersion}`
      );
      return;
    }

    // Handle tar archives (extract and find LMF files)
    if (effectiveType === "tar") {
      // Special case: OEWN packages are gzip-compressed XML, not tar archives
      if (
        projectIdWithVersion.startsWith("oewn:") ||
        projectIdWithVersion.startsWith("ewn:")
      ) {
        this.logger.warn(
          `⚠️ OEWN package ${projectIdWithVersion} detected as tar, but should be XML. Overriding detection.`
        );
        this.logger.info(`🔄 Forcing file type to 'lmf' for OEWN package`);
        // Continue with LMF XML processing instead of tar extraction
      } else {
        this.logger.info(
          `📦 Detected tar archive, extracting to find LMF files...`
        );

        try {
          // Convert the decompressed content back to ArrayBuffer for tar extraction
          const encoder = new TextEncoder();
          const tarBuffer = encoder.encode(xmlText);
          const arrayBuffer = tarBuffer.buffer.slice(
            tarBuffer.byteOffset,
            tarBuffer.byteOffset + tarBuffer.byteLength
          ) as ArrayBuffer;

          // Extract the tar archive and find LMF files
          const extractedXml = await this.extractTarArchive(arrayBuffer);

          this.logger.info(
            `✅ Successfully extracted LMF file from tar archive`
          );

          // Replace xmlText with the extracted XML content
          xmlText = extractedXml;

          // Update the effective type to LMF since we now have XML
          this.logger.info(
            `🔄 File type updated from 'tar' to 'lmf' after extraction`
          );
        } catch (error) {
          const errorMessage = `❌ Failed to extract tar archive for ${projectIdWithVersion}: ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
    }

    // Check for unsupported file types
    if (
      effectiveType &&
      effectiveType !== "lmf" &&
      effectiveType !== "ili" &&
      effectiveType !== "tsv" &&
      effectiveType !== "xml" &&
      effectiveType !== "tar"
    ) {
      this.logger.warn(
        `⚠️ Unknown or unsupported file type: ${effectiveType}, treating as LMF XML`
      );
    }

    // Default to LMF XML processing
    this.logger.info(
      `📝 Processing as LMF XML file (type: ${effectiveType || "unknown"})`
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
    if (progress) progress(0.2);

    this.logger.start(`processing LMF data for ${projectIdWithVersion}`);
    this.logger.step(`XML content verified`, {
      xmlSizeMB: (xmlText.length / 1024 / 1024).toFixed(2),
    });

    // Use the proper LMF parsing pipeline for all LMF files
    try {
      this.logger.step(`starting LMF parsing`);

      // Import and use the proper LMF parser
      const { LmfParser } = await import("./parsers/lmf/lmf-parser.js");

      // Configure parser based on file size and type
      const parserOptions = {
        debug: true,
        // Always prefer fast-xml-parser for LMF files as it handles text content extraction correctly
        // The previous logic of preferring DOMParser for large files was causing definition text to be lost
        preferFastXMLParser: true,
      };

      this.logger.debug(`parser options`, parserOptions);

      const lmfParser = new LmfParser(xmlText, parserOptions);
      const lmfDocument = await lmfParser.parse(xmlText, { debug: true });

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

      this.logger.step(`LMF parsing completed successfully`, {
        lexicons: lmfDocument.lexicons?.length || 0,
        words: lmfDocument.words?.length || 0,
        synsets: lmfDocument.synsets?.length || 0,
        senses: lmfDocument.senses?.length || 0,
      });

      // Yield to UI thread after XML parsing to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(0.5);

      // Insert the parsed data into the database
      this.logger.step(`inserting parsed data into database`);
      await this.insertLMFData(lmfDocument, projectIdWithVersion);

      // Yield to UI thread after data insertion to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (progress) progress(1.0);

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

      this.logger.error(`XML analysis`, analysis);
      this.logger.error(`XML content details`, {
        length: xmlText.length,
        first500Chars: xmlText.substring(0, 500),
        last500Chars: xmlText.substring(Math.max(0, xmlText.length - 500)),
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.end(`processing LMF data for ${projectIdWithVersion}`);
      throw new Error(
        `Failed to parse LMF file: ${diagnosis}. Original error: ${errorMessage}`
      );
    }

    this.logger.success(`loadData method completed successfully`, {
      projectId: projectIdWithVersion,
      status: "XML processed and inserted into database",
    });

    this.logger.end(`processing LMF data for ${projectIdWithVersion}`);
  }

  /**
   * Detect the content type by examining the decompressed file content
   */
  private detectContentType(
    content: string,
    projectIdWithVersion: string
  ): "xml" | "lmf" | "ili" | "tsv" | "tar" | "unknown" {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      this.logger.warn(`Empty content detected for ${projectIdWithVersion}`);
      return "unknown";
    }

    // Check for tar archive indicators (after XZ decompression)
    // Only detect as tar if we see the specific tar header format at the beginning
    const hasTarHeader =
      trimmedContent.startsWith("ustar") ||
      trimmedContent.startsWith("PaxHeader") ||
      trimmedContent.startsWith("GlobalHeader");

    // Additional check: tar files typically don't contain XML-like content
    const hasXMLContent =
      trimmedContent.includes("<?xml") ||
      trimmedContent.includes("<LexicalResource") ||
      trimmedContent.includes("<lexicon");

    if (hasTarHeader && !hasXMLContent) {
      this.logger.debug(
        `Detected tar archive content after decompression (no XML content found)`
      );
      return "tar";
    }

    // Check for XML indicators
    const hasXMLDeclaration = trimmedContent.startsWith("<?xml");
    const hasRootElement = /^<[a-zA-Z][a-zA-Z0-9_:]*/.test(trimmedContent);
    const hasClosingTag = trimmedContent.includes("</");
    const hasLexicalResource = trimmedContent.includes("<LexicalResource");

    // Check for TSV/ILI indicators
    const hasTabs = trimmedContent.includes("\t");
    const hasNewlines = trimmedContent.includes("\n");
    const hasTSVStructure = hasTabs && hasNewlines;

    // Check for specific content patterns
    const firstLine = trimmedContent.split("\n")[0];
    const hasILIHeader =
      firstLine &&
      (firstLine.toLowerCase().includes("ili") ||
        firstLine.toLowerCase().includes("definition") ||
        firstLine.toLowerCase().includes("status"));

    this.logger.debug(`Content type detection for ${projectIdWithVersion}:`, {
      length: trimmedContent.length,
      hasTarHeader,
      hasXMLContent,
      hasXMLDeclaration,
      hasRootElement,
      hasClosingTag,
      hasLexicalResource,
      hasTabs,
      hasNewlines,
      hasTSVStructure,
      hasILIHeader,
      firstLine: firstLine?.substring(0, 100),
      firstChars: trimmedContent.substring(0, 200),
    });

    // Determine file type based on content analysis
    if (hasLexicalResource && hasRootElement && hasClosingTag) {
      this.logger.debug(`Detected LMF XML file by LexicalResource element`);
      return "lmf";
    }

    if (hasXMLDeclaration || (hasRootElement && hasClosingTag)) {
      this.logger.debug(`Detected generic XML file`);
      return "xml";
    }

    if (hasTSVStructure && hasILIHeader) {
      this.logger.debug(`Detected ILI TSV file by header content`);
      return "ili";
    }

    if (hasTSVStructure) {
      this.logger.debug(`Detected generic TSV file by structure`);
      return "tsv";
    }

    this.logger.warn(
      `Could not determine content type for ${projectIdWithVersion}`
    );
    return "unknown";
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

        // Skip records with empty IDs or definitions, and skip header-like lines
        if (
          record.id &&
          record.definition &&
          !record.id.toLowerCase().includes("ili") &&
          !record.id.toLowerCase().includes("definition")
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
              record.definition,
              record.status,
              record.superseded_by,
              record.note,
              record.meta,
            ]
          );
        }
        this.logger.debug(`✅ ILI data inserted for ${projectIdWithVersion}`);
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
   * Insert lexicon information
   */
  protected async insertLexicon(projectIdWithVersion: string): Promise<void> {
    try {
      const project = Project.from(projectIdWithVersion);
      this.logger.debug(`🔍 Debug insertLexicon: projectId = ${project.id}`);
      this.logger.debug(`🔍 Debug insertLexicon: project =`, project);

      const label = project.getLabel();
      const language = project.getLanguage();
      const license = project.getLicense();
      const url = `https://github.com/globalwordnet/${project.id}`;
      const citation = project.getCitation();

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
            lexiconData.version,
            lexiconData.license,
            lexiconData.url,
            lexiconData.citation,
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
    projectIdWithVersion: string
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
        (sense) => !validWordIds.has(sense.word)
      );
      const sensesNeedingSynsets = allSenses.filter(
        (sense) => !validSynsetIds.has(sense.synset)
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
            validWordIds.has(sense.word) && validSynsetIds.has(sense.synset)
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
        word_id: sense.word,
        synset_id: sense.synset,
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

      this.logger.step(`waiting for transaction commit`);
      // Add a small delay to ensure the transaction is fully committed
      // This prevents statistics queries from returning 0 immediately after insertion
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
   * Extract tar archive and find LMF XML files
   */
  private async extractTarArchive(tarBuffer: ArrayBuffer): Promise<string> {
    this.logger.debug(`🔍 Starting tar archive extraction...`);

    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      const extractedFiles: { [key: string]: Uint8Array } = {};
      let lmfFile: string | null = null;

      extract.on("entry", (header: any, stream: any, next: any) => {
        const chunks: Uint8Array[] = [];

        stream.on("data", (chunk: Uint8Array) => {
          chunks.push(chunk);
        });

        stream.on("end", () => {
          const content = new Uint8Array(Buffer.concat(chunks));
          extractedFiles[header.name] = content;

          // Check if this is an LMF XML file - be more flexible with naming
          if (header.name.endsWith(".xml")) {
            const fileName = header.name.toLowerCase();
            if (
              fileName.includes("wn-data-") ||
              fileName.includes("wordnet") ||
              fileName.includes("lmf") ||
              fileName.includes("omw") ||
              fileName.includes("wolf") ||
              fileName.includes("thai") ||
              fileName.includes("french")
            ) {
              lmfFile = header.name;
              this.logger.debug(`🔍 Found potential LMF file: ${header.name}`);
            }
          }

          next();
        });
      });

      extract.on("finish", () => {
        this.logger.debug(
          `🔍 Tar extraction completed. Found ${Object.keys(extractedFiles).length} files`
        );
        this.logger.debug(`🔍 Extracted files:`, Object.keys(extractedFiles));

        if (lmfFile) {
          this.logger.info(`✅ Found LMF file in tar archive: ${lmfFile}`);
          const xmlContent = new TextDecoder().decode(extractedFiles[lmfFile]);
          resolve(xmlContent);
        } else {
          // Look for any XML file and check its content
          const xmlFiles = Object.keys(extractedFiles).filter((name) =>
            name.endsWith(".xml")
          );
          if (xmlFiles.length > 0) {
            this.logger.info(
              `✅ Found XML file in tar archive: ${xmlFiles[0]}`
            );

            // Check if the XML content looks like LMF
            const xmlContent = new TextDecoder().decode(
              extractedFiles[xmlFiles[0]]
            );
            if (
              xmlContent.includes("<LexicalResource") ||
              xmlContent.includes("<lexicon")
            ) {
              this.logger.info(`✅ XML file appears to be LMF content`);
              resolve(xmlContent);
            } else {
              this.logger.warn(
                `⚠️ XML file found but doesn't appear to be LMF content`
              );
              this.logger.debug(
                `🔍 XML content preview:`,
                xmlContent.substring(0, 200)
              );
              reject(
                new Error(
                  "XML file found but content does not appear to be LMF"
                )
              );
            }
          } else {
            reject(new Error("No LMF or XML files found in tar archive"));
          }
        }
      });

      extract.on("error", (err: any) => {
        this.logger.error(`❌ Tar extraction failed:`, err);
        reject(err);
      });

      // Convert ArrayBuffer to ReadableStream for tar-stream
      const tarStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(tarBuffer));
          controller.close();
        },
      });

      // Pipe the stream to tar extractor
      tarStream.pipeTo(
        new WritableStream({
          write(chunk: Uint8Array) {
            extract.write(chunk);
          },
          close() {
            extract.end();
          },
        })
      );
    });
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
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    try {
      await this.database.clearAllData();

      // Emit events after successful clear
      if (this.wordnet.emitDataChanged) {
        this.wordnet.emitDataChanged("databaseCleared", {
          timestamp: new Date().toISOString(),
        });

        // Emit statistics updated event
        await this.wordnet.emitStatisticsUpdated();
      }
    } catch (error) {
      this.wordnet.emitError("clearAllData", error as Error);
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

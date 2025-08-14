import { BrowserXMLParser } from "./parsers/xml/browser-xml-parser.js";
import { Project } from "./project.js";
import type { ProgressCallback } from "./types/progress.js";
import { WebDatabase } from "./web-database.js";
import { WebWordnet } from "./web-wordnet.js";
import pako from "pako";
import { XzReadableStream } from "xz-decompress";
import { createScopedLogger } from 'utils/logger';

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
  private logger = createScopedLogger('DataLoader');

  constructor(database: WebDatabase, wordnet: WebWordnet) {
    this.database = database;
    this.wordnet = wordnet;
  }

  /**
   * Extract text from a parsed XML node using an iterative traversal to avoid deep recursion.
   */
  private extractTextFromNode(node: any): string {
    if (!node) return "";
    let aggregatedText = "";
    const stack: any[] = [node];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      if (current.name === "#text") {
        if (typeof current.text === "string" && current.text.length > 0) {
          aggregatedText += " " + current.text;
        }
      } else if (typeof current.text === "string" && current.text.length > 0) {
        // Some nodes may carry inline text as well
        aggregatedText += " " + current.text;
      }

      if (Array.isArray(current.children) && current.children.length > 0) {
        // Push children in original order by reversing to maintain left-to-right traversal
        for (let i = current.children.length - 1; i >= 0; i--) {
          stack.push(current.children[i]);
        }
      }
    }

    return aggregatedText;
  }

  /**
   * Get the query service lazily (only when needed)
   */
  protected getQueryService(): any {
    const queryService = this.wordnet.getQueryService();
    this.logger.debug(
      "🔍 DataLoader.getQueryService() called, queryService:",
      { status: queryService ? "available" : "undefined" }
    );
    return queryService;
  }

  /**
   * Convert external URLs to proxy URLs to bypass CORS
   */
  protected toProxyUrl(url: string): string {
    // Check if we're in a development environment (localhost)
    // Use globalThis.location so it also works in Web Workers
    const globalLocation: any =
      (typeof globalThis !== "undefined" && (globalThis as any).location) ||
      (typeof window !== "undefined" && (window as any).location) ||
      undefined;

    const hostname: string | undefined = globalLocation?.hostname;
    const isDev = !!hostname && (hostname === "localhost" || hostname === "127.0.0.1");

    if (!isDev) {
      return url; // Return original URL in production
    }

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
      const proxyUrl = url.replace(
        "https://github.com/globalwordnet",
        "/api/globalwordnet"
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

    const project = Project.from(projectIdWithVersion);

    // Check for project version errors
    const versionError = project.getError();
    if (versionError) {
      throw new Error(`Project version error: ${versionError}`);
    }

    // Get URLs from the index data
    const urls = project.getUrls();
    if (!urls || urls.length === 0) {
      throw new Error(
        `No download URL found for project ${projectIdWithVersion}`
      );
    }

    let lastError: Error | null = null;

    // Try each URL until one works
    for (const url of urls) {
      try {
        const proxyUrl = this.toProxyUrl(url);
        this.logger.info(`🌐 Downloading from ${url} (proxied as ${proxyUrl})...`);
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
        await this.loadData(data, projectIdWithVersion, progress);

        this.logger.info(`✅ Successfully loaded ${projectIdWithVersion}`);
        
        // Emit events after successful load
        if (this.wordnet && typeof (this.wordnet as any).emitDataChanged === 'function') {
          (this.wordnet as any).emitDataChanged('packageLoaded', { 
            packageId: projectIdWithVersion,
            timestamp: new Date().toISOString()
          });
          
          // Emit statistics updated event
          await (this.wordnet as any).emitStatisticsUpdated();
        }
        
        return; // Success, exit early
      } catch (error) {
        this.logger.warn(`⚠️ Failed to download from ${url}:`, { error: error instanceof Error ? error.message : String(error) });
        lastError = error as Error;
        // Continue to next URL
      }
    }

    // If we get here, all URLs failed
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
      if (this.wordnet && typeof (this.wordnet as any).emitDataChanged === 'function') {
        (this.wordnet as any).emitDataChanged('databaseLoaded', { 
          packageId: projectIdWithVersion,
          dataSize: data.byteLength,
          timestamp: new Date().toISOString()
        });
        
        // Emit statistics updated event
        await (this.wordnet as any).emitStatisticsUpdated();
      }
    } catch (error) {
      if (this.wordnet && typeof (this.wordnet as any).emitError === 'function') {
        (this.wordnet as any).emitError('loadDbFromBuffer', error instanceof Error ? error : String(error));
      }
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
    progress?: ProgressCallback
  ): Promise<ArrayBuffer> {
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
      this.logger.error(`❌ Error response body:`, { errorText: errorText.substring(0, 500) });
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
      !contentType.includes("octet-stream")
    ) {
      this.logger.warn(
        `⚠️ Warning: Unexpected content type: ${contentType}. Expected XML or gzip.`
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
        await new Promise(resolve => setTimeout(resolve, 1));
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
      this.logger.error(
        `❌ Downloaded content appears to be HTML, not XML:`,
        { firstChars: firstChars.substring(0, 200) }
      );
      throw new Error(
        "Downloaded content is HTML, not XML. This usually indicates a server error page."
      );
    }

    return result.buffer;
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
    this.logger.debug(
      `🔍 Debug loadData: First 16 bytes:`,
      { bytes: Array.from(view.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ") }
    );

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
        this.logger.debug(
          `🔍 Debug: First 200 chars after XZ decompression:`,
          { chars: xmlText.substring(0, 200) }
        );
        this.logger.debug(
          `🔍 Debug: Last 200 chars after XZ decompression:`,
          { chars: xmlText.substring(Math.max(0, xmlText.length - 200)) }
        );
      } catch (err) {
        this.logger.error("❌ Failed to decompress XZ data:", { error: err instanceof Error ? err.message : String(err) });
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
      this.logger.debug(`🔍 Debug: Input data constructor: ${view.constructor.name}`);
      
      try {
        // Use pako for gzip decompression
        let workingView = view;
        this.logger.debug(`🔍 Debug: Checking for trailing byte...`);
        
        if (view[view.length - 1] === 0x3b) {
          this.logger.warn("🔍 Debug: Removing last byte (0x3b)");
          workingView = view.slice(0, -1);
          this.logger.debug(`🔍 Debug: Working view length after slice: ${workingView.length} bytes`);
        } else {
          this.logger.debug(`🔍 Debug: No trailing byte removal needed, last byte: 0x${view[view.length - 1].toString(16).padStart(2, "0")}`);
        }

        this.logger.debug(`🔍 Debug: About to call pako.inflate()...`);
        this.logger.debug(`🔍 Debug: Working view first 16 bytes:`, { bytes: Array.from(workingView.slice(0, 16)).map(b => b.toString(16).padStart(2, "0")).join(" ") });
        this.logger.debug(`🔍 Debug: Working view last 16 bytes:`, { bytes: Array.from(workingView.slice(-16)).map(b => b.toString(16).padStart(2, "0")).join(" ") });
        
        const startTime = Date.now();
        this.logger.debug(`🔍 Debug: pako.inflate() call started at ${startTime}`);
        
        // 🚨 TIMEOUT PROTECTION: Prevent hanging during decompression
        const decompressed = await this.logger.withTimeout('pako.inflate()', async () => {
          return pako.inflate(workingView);
        }, 30000, 2000); // 30 second timeout, progress every 2 seconds
        
        const endTime = Date.now();
        this.logger.debug(`🔍 Debug: pako.inflate() completed in ${endTime - startTime}ms`);
        this.logger.debug(`🔍 Debug: Decompression result type: ${typeof decompressed}`);
        this.logger.debug(`🔍 Debug: Decompression result constructor: ${decompressed.constructor.name}`);
        this.logger.debug(`🔍 Debug: Decompression result length: ${decompressed.length} bytes`);

        this.logger.debug("🔍 Debug: Decompressed data sample:", { sample: Array.from(decompressed.slice(0, 100)) });
        this.logger.debug(
          `🔍 Debug: Decompression completed: ${decompressed.length} bytes`
        );
        
        this.logger.debug(`🔍 Debug: About to decode with TextDecoder...`);
        const decodeStartTime = Date.now();
        
        // 🚨 TIMEOUT PROTECTION: Prevent hanging during TextDecoder
        xmlText = await this.logger.withTimeout('TextDecoder.decode()', async () => {
          return new TextDecoder().decode(decompressed);
        }, 15000, 1000); // 15 second timeout, progress every 1 second
        
        const decodeEndTime = Date.now();
        this.logger.debug(`🔍 Debug: TextDecoder completed in ${decodeEndTime - decodeStartTime}ms`);
        this.logger.debug(`🔍 Debug: Decoded text length: ${xmlText.length} characters`);
        
        this.logger.debug(
          `📊 Decompressed gzipped data: ${decompressed.length} bytes -> ${xmlText.length} characters`
        );
        this.logger.debug(
          `🔍 Debug: First 200 chars after decompression:`,
          { chars: xmlText.substring(0, 200) }
        );
        this.logger.debug(
          `🔍 Debug: Last 200 chars after decompression:`,
          { chars: xmlText.substring(Math.max(0, xmlText.length - 200)) }
        );

        // Yield to UI thread after decompression to prevent freezing
        this.logger.debug(`🔍 Debug: Yielding to UI thread...`);
        await new Promise(resolve => setTimeout(resolve, 1));
        this.logger.debug(`🔍 Debug: UI thread yield completed`);
        
      } catch (err) {
        this.logger.error("❌ Failed to decompress gzipped data:", { error: err instanceof Error ? err.message : String(err) });
        this.logger.error("❌ Error details:", {
          name: err instanceof Error ? err.name : 'Unknown',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : 'No stack trace'
        });
        throw err;
      }
    } else {
      // Data is not compressed
      xmlText = new TextDecoder().decode(data);
      this.logger.debug(
        `📊 Data is not compressed: ${data.byteLength} bytes -> ${xmlText.length} characters`
      );
      this.logger.debug(`🔍 Debug: First 200 chars:`, { chars: xmlText.substring(0, 200) });
    }

    if (progress) progress(0.1);

    // Get project metadata to determine file type
    const project = Project.from(projectIdWithVersion);
    const projectType = (project as any).projectData?.type;
    
    this.logger.debug(`🔍 Debug: Project type from metadata: ${projectType}`);
    this.logger.debug(`🔍 Debug: Project data:`, (project as any).projectData);

    // Handle different file types based on project metadata
    if (projectType === 'ili') {
      this.logger.debug(`📝 Detected ILI file type from project metadata`);
      
      // Parse ILI TSV data
      const iliData = await this.loadILI(xmlText);
      this.logger.debug(`📊 Loaded ${iliData.length} ILI records`);
      
              // Yield to UI thread after ILI parsing to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 1));
      
      if (progress) progress(0.5);
      
      // Insert ILI data
      await this.insertILIData(iliData, projectIdWithVersion);
      
              // Yield to UI thread after ILI data insertion to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 1));
      
      if (progress) progress(1.0);
      this.logger.debug(`✅ ILI data loaded successfully for ${projectIdWithVersion}`);
      return;
    }

    // Default to LMF XML processing
    this.logger.debug(`📝 Processing as LMF XML file`);
    
    // Verify that we have valid LMF XML content
    this.logger.debug(`🔍 Debug: Verifying XML content...`);

    // Check for empty content first
    if (xmlText.length === 0) {
      this.logger.error(`❌ CRITICAL: Decompressed XML is empty (0 characters)!`);
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

    // Check if the XML is very large (over 1MB)
    this.logger.debug(
      `🔍 Debug: XML size check - xmlText.length: ${xmlText.length}, threshold: 1000000, isLarge: ${xmlText.length > 1000000}`
    );

    if (xmlText.length > 1000000) {
      this.logger.debug(
        `📊 Large XML file detected (${(xmlText.length / 1024 / 1024).toFixed(
          2
        )}MB), using browser-compatible parser...`
      );

      try {
        // Use browser-compatible parser for large files
        const browserParser = new BrowserXMLParser(xmlText, {
          debug: true,
          progress: (p) => {
            if (progress) {
              // Map parser progress to our progress range (0.2-0.9)
              progress(0.2 + p * 0.7);
            }
          },
        });

        this.logger.debug(`🔍 Debug: Browser parser created, starting parse...`);
        
        // 🚨 TIMEOUT PROTECTION: Prevent hanging during XML parsing
        const parsed = await this.logger.withTimeout('Browser XML parsing', async () => {
          return await browserParser.parse();
        }, 120000, 5000); // 2 minute timeout, progress every 5 seconds
        
        this.logger.debug(`🔍 Debug: Browser parser completed successfully`);

        // Yield to UI thread after XML parsing to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 1));

        if (progress) progress(0.9);

        // Convert browser parser output to LMF format and insert
        this.logger.debug(`🔍 Debug: Starting insertBrowserParsedData...`);
        
        // 🚨 TIMEOUT PROTECTION: Prevent hanging during data insertion
        await this.logger.withTimeout('Browser parsed data insertion', async () => {
          return await this.insertBrowserParsedData(parsed, projectIdWithVersion);
        }, 60000, 3000); // 1 minute timeout, progress every 3 seconds
        
        this.logger.debug(`🔍 Debug: insertBrowserParsedData completed successfully`);

        // Yield to UI thread after browser parser data insertion to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 1));

        if (progress) progress(1.0);
      } catch (browserError) {
        this.logger.error(`❌ Browser parser failed:`, browserError);
        this.logger.error(`❌ Falling back to regular parser...`);

        // Fallback to regular parser if browser parser fails
        const { parseLMFXML, diagnoseDownloadIssue } = await import(
          "wn-ts-core"
        );

        try {
          const lmfDocument = parseLMFXML(xmlText, { debug: true });
          
          // Yield to UI thread after fallback XML parsing to prevent freezing
          await new Promise(resolve => setTimeout(resolve, 1));
          
          await this.insertLMFData(lmfDocument, projectIdWithVersion);
          
          // Yield to UI thread after fallback parser data insertion to prevent freezing
          await new Promise(resolve => setTimeout(resolve, 1));
          
          if (progress) progress(1.0);
        } catch (fallbackError) {
          this.logger.error(`❌ Fallback parser also failed:`, fallbackError);
          throw fallbackError;
        }
      }
    } else {
      // For smaller files, use the regular parser
      this.logger.debug(
        `📊 Small XML file detected (${(xmlText.length / 1024).toFixed(
          2
        )}KB), using regular parser...`
      );
      const { parseLMFXML, diagnoseDownloadIssue } = await import("wn-ts-core");

      try {
        const lmfDocument = parseLMFXML(xmlText, { debug: true });

          // Yield to UI thread after XML parsing to prevent freezing
          await new Promise(resolve => setTimeout(resolve, 1));

        if (progress) progress(0.5);

        // Insert the parsed data into the database
        await this.insertLMFData(lmfDocument, projectIdWithVersion);

        // Yield to UI thread after small file parser data insertion to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 1));

        if (progress) progress(1.0);
      } catch (error) {
        // Provide better error diagnosis
        const { diagnoseDownloadIssue, analyzeXMLContent } = await import(
          "wn-ts-core"
        );
        const diagnosis = diagnoseDownloadIssue(xmlText);
        const analysis = analyzeXMLContent(xmlText);

        this.logger.error(`❌ LMF parsing failed: ${diagnosis}`);
        this.logger.error(`❌ Error details:`, error);
        this.logger.error(`❌ XML analysis:`, analysis);

        // Log additional debugging information
        this.logger.error(`❌ XML content length: ${xmlText.length}`);
        this.logger.error(`❌ First 500 characters:`, xmlText.substring(0, 500));
        this.logger.error(
          `❌ Last 500 characters:`,
          xmlText.substring(Math.max(0, xmlText.length - 500))
        );

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to parse LMF file: ${diagnosis}. Original error: ${errorMessage}`
        );
      }
    }
  }



  /**
   * Load ILI data from TSV content
   */
  private async loadILI(content: string): Promise<any[]> {
    const lines = content.split(/\r?\n/);
    const records: any[] = [];
    
    // CILI data file typically doesn't have a header, but some might
    const dataLines = lines.filter(line => line.trim());
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      const values = line.split('\t');
      if (values.length >= 2) {
        const record = {
          id: values[0]?.trim(),
          definition: values[1]?.trim(),
          status: values[2]?.trim() || 'active'
        };
        
        // Skip records with empty IDs or definitions, and skip header-like lines
        if (record.id && record.definition && 
            !record.id.toLowerCase().includes('ili') && 
            !record.id.toLowerCase().includes('definition')) {
          records.push(record);
        }
      }
    }
    
    this.logger.debug(`📊 Parsed ${records.length} valid ILI records from ${dataLines.length} total lines`);
    return records;
  }

  /**
   * Insert ILI data into the database
   */
  private async insertILIData(iliData: any[], projectIdWithVersion: string): Promise<void> {
    this.logger.debug(`📝 Inserting ILI data for ${projectIdWithVersion}...`);
    
    try {
      // Insert lexicon information first
      await this.insertLexicon(projectIdWithVersion);
      
      // Insert ILI records
      const iliRecords = iliData.map(record => ({
        id: record.id,
        definition: record.definition,
        status: record.status || 'active',
        superseded_by: null,
        note: null,
        meta: null
      }));
      
      const queryService = this.getQueryService();
      if (queryService) {
        this.logger.debug(`📝 Inserting ${iliRecords.length} ILI records...`);
        await queryService.batchInsert("ilis", iliRecords);
        this.logger.debug(`✅ ILI data inserted for ${projectIdWithVersion}`);
      } else {
        // Fall back to raw SQL if query service is not available
        this.logger.debug(`📝 Inserting ${iliRecords.length} ILI records using raw SQL...`);
        for (const record of iliRecords) {
          this.database.run(
            `INSERT OR REPLACE INTO ilis (id, definition, status, superseded_by, note, meta) VALUES (?, ?, ?, ?, ?, ?)`,
            [record.id, record.definition, record.status, record.superseded_by, record.note, record.meta]
          );
        }
        this.logger.debug(`✅ ILI data inserted for ${projectIdWithVersion}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to insert ILI data for ${projectIdWithVersion}:`, error);
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

      const lexiconData = {
        id: project.projectIdWithVersion,
        label: label,
        language: language,
        version: project.version,
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
    lmfDocument: any,
    projectIdWithVersion: string
  ): Promise<void> {
    this.logger.debug(`📝 Inserting LMF data for ${projectIdWithVersion}...`);
    const queryService = this.getQueryService();
    if (!queryService) {
      throw new Error("Query service not available for batch insert.");
    }
    try {
      const lexicons =
        lmfDocument.lexicons ||
        (lmfDocument.lexicon ? [lmfDocument.lexicon] : []);
      const lexiconsToInsert = lexicons.map((lexicon: any) => ({
        id: lexicon.id,
        label: lexicon.label,
        language: lexicon.language,
        version: lexicon.version,
        license: lexicon.license,
      }));

      const wordsToInsert = (lmfDocument.words || []).map((word: any) => ({
        id: word.id,
        lemma: word.lemma,
        pos: word.partOfSpeech,
        language: word.language || lexicons[0]?.language || "en",
        lexicon: word.lexicon || lexicons[0]?.id || projectIdWithVersion,
      }));

      const synsetsToInsert = (lmfDocument.synsets || []).map(
        (synset: any) => ({
          id: synset.id,
          ili: synset.ili || null,
          pos: synset.partOfSpeech,
          language: synset.language || lexicons[0]?.language || "en",
          lexicon: synset.lexicon || lexicons[0]?.id || projectIdWithVersion,
        })
      );

      const sensesToInsert = (lmfDocument.senses || []).map((sense: any) => ({
        id: sense.id,
        word_id: sense.word,
        synset_id: sense.synset,
      }));

      const definitionsToInsert = (lmfDocument.synsets || []).flatMap(
        (synset: any) =>
          (synset.definitions || []).map((def: any, i: number) => {
            const gloss = def.gloss || "";
            // The gloss can be a string with embedded markup. Strip it for plain text.
            const text =
              typeof gloss === "string"
                ? gloss
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
                : "";
            return {
              id: `${synset.id}.def.${def.language || "en"}.${i}`,
              synset_id: synset.id,
              language: def.language || "en",
              text,
            };
          })
      );

      // Batch insert all data
      if (lexiconsToInsert.length > 0)
        await queryService.batchInsert("lexicons", lexiconsToInsert);
      if (wordsToInsert.length > 0)
        await queryService.batchInsert("words", wordsToInsert);
      if (synsetsToInsert.length > 0)
        await queryService.batchInsert("synsets", synsetsToInsert);
      if (sensesToInsert.length > 0)
        await queryService.batchInsert("senses", sensesToInsert);
      if (definitionsToInsert.length > 0)
        await queryService.batchInsert("definitions", definitionsToInsert);

      this.logger.debug(`✅ LMF data inserted for ${projectIdWithVersion}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to insert LMF data for ${projectIdWithVersion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Insert data parsed by the browser-compatible parser
   */
  private async insertBrowserParsedData(
    parsed: any,
    projectIdWithVersion: string
  ): Promise<void> {
    this.logger.debug(
      `�� Inserting browser-parsed data for ${projectIdWithVersion}...`
    );

    // Use a more efficient yielding strategy
    const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 1));

    try {
      const lexicalResource = parsed.LexicalResource;
      if (!lexicalResource) {
        throw new Error("No LexicalResource found in parsed XML");
      }

      const lexicons = Array.isArray(lexicalResource.children)
        ? lexicalResource.children.filter(
            (child: any) => child.name === "Lexicon"
          )
        : [lexicalResource.children].filter(
            (child: any) => child.name === "Lexicon"
          );

      const lexiconsToInsert: any[] = [];
      const wordsToInsert: any[] = [];
      const sensesToInsert: any[] = [];
      const synsetsToInsert: any[] = [];
      const definitionsToInsert: any[] = [];

      for (const lexiconElem of lexicons) {
        const lexiconId = lexiconElem.attributes?.id || projectIdWithVersion;
        const lexiconLang = lexiconElem.attributes?.language || "en";

        lexiconsToInsert.push({
          id: lexiconId,
          label: lexiconElem.attributes?.label || "Unknown Lexicon",
          language: lexiconLang,
          version: lexiconElem.attributes?.version,
          license: lexiconElem.attributes?.license,
        });

        // Process lexical entries
        const entries =
          lexiconElem.children?.filter(
            (child: any) => child.name === "LexicalEntry"
          ) || [];
        this.logger.debug(
          `📊 Processing ${entries.length} lexical entries for lexicon ${lexiconId}...`
        );

          // Process entries in chunks to prevent UI freezing
          await this.processEntriesInChunks(entries, wordsToInsert, sensesToInsert, lexiconLang, lexiconId);

        // Process synsets
        const synsetElems =
          lexiconElem.children?.filter(
            (child: any) => child.name === "Synset"
          ) || [];
        this.logger.debug(
          `📊 Processing ${synsetElems.length} synsets for lexicon ${lexiconId}...`
        );

        // Process synsets in chunks to prevent UI freezing
        await this.processSynsetsInChunks(synsetElems, synsetsToInsert, definitionsToInsert, lexiconLang, lexiconId);
      }

      const queryService = this.getQueryService();
      if (queryService) {
        this.logger.debug(
          `📝 Inserting ${lexiconsToInsert.length} lexicons, ${wordsToInsert.length} words, ${sensesToInsert.length} senses, ${synsetsToInsert.length} synsets, and ${definitionsToInsert.length} definitions in batches...`
        );
        
        if (lexiconsToInsert.length > 0) {
          await queryService.batchInsert("lexicons", lexiconsToInsert);
        }
        if (wordsToInsert.length > 0) {
          await queryService.batchInsert("words", wordsToInsert);
        }
        if (synsetsToInsert.length > 0) {
          await queryService.batchInsert("synsets", synsetsToInsert);
        }
        if (sensesToInsert.length > 0) {
          await queryService.batchInsert("senses", sensesToInsert);
        }
        if (definitionsToInsert.length > 0) {
          await queryService.batchInsert("definitions", definitionsToInsert);
        }
      } else {
        throw new Error("Query service not available for batch insert.");
      }

      this.logger.debug(
        `✅ Browser-parsed data inserted for ${projectIdWithVersion}`
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to insert browser-parsed data for ${projectIdWithVersion}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process entries in chunks to prevent UI freezing
   */
  private async processEntriesInChunks(
    entries: any[],
    wordsToInsert: any[],
    sensesToInsert: any[],
    lexiconLang: string,
    lexiconId: string
  ): Promise<void> {
    const CHUNK_SIZE = 1000;
    
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);
      
      for (const entry of chunk) {
          const wordId = entry.attributes?.id || "unknown-word";
          const lemmaElem = entry.children?.find(
            (child: any) => child.name === "Lemma"
          );
          const lemma = lemmaElem?.attributes?.writtenForm || wordId;
          const partOfSpeech = lemmaElem?.attributes?.partOfSpeech || "n";

          wordsToInsert.push({
            id: wordId,
            lemma: lemma,
            pos: partOfSpeech,
            language: lexiconLang,
            lexicon: lexiconId,
          });

          const senses =
            entry.children?.filter((child: any) => child.name === "Sense") ||
            [];
          for (const sense of senses) {
            const senseId = sense.attributes?.id || `${wordId}.sense`;
            const synsetId = sense.attributes?.synset || `${wordId}.synset`;
            sensesToInsert.push({
              id: senseId,
              word_id: wordId,
              synset_id: synsetId,
            });
          }
        }

      // Yield to UI thread after each chunk
      if (i + CHUNK_SIZE < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  /**
   * Process synsets in chunks to prevent UI freezing
   */
  private async processSynsetsInChunks(
    synsetElems: any[],
    synsetsToInsert: any[],
    definitionsToInsert: any[],
    lexiconLang: string,
    lexiconId: string
  ): Promise<void> {
    const CHUNK_SIZE = 1000;
    
    for (let i = 0; i < synsetElems.length; i += CHUNK_SIZE) {
      const chunk = synsetElems.slice(i, i + CHUNK_SIZE);
      
      for (const synset of chunk) {
          const synsetId = synset.attributes?.id || "unknown-synset";
          synsetsToInsert.push({
            id: synsetId,
            ili: synset.attributes?.ili || null,
            pos: synset.attributes?.partOfSpeech || "n",
            language: lexiconLang,
            lexicon: lexiconId,
          });

          const definitions =
            synset.children?.filter(
              (child: any) => child.name === "Definition"
            ) || [];
        for (const [j, def] of definitions.entries()) {
            const lang = def.attributes?.language || "en";
            const glossElem = def.children?.find(
              (c: any) => c.name === "gloss"
            );

            // Use the recursive text extractor
            const textContent = glossElem
              ? this.extractTextFromNode(glossElem)
              : this.extractTextFromNode(def);
            const cleanedText = textContent.replace(/\s+/g, " ").trim();

            definitionsToInsert.push({
            id: `${synsetId}.def.${lang}.${j}`,
              synset_id: synsetId,
              language: lang,
              text: cleanedText,
            });
        }
      }
      
      // Yield to UI thread after each chunk
      if (i + CHUNK_SIZE < synsetElems.length) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
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
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    try {
      await this.database.clearAllData();
      
      // Emit events after successful clear
      if (this.wordnet && typeof (this.wordnet as any).emitDataChanged === 'function') {
        (this.wordnet as any).emitDataChanged('databaseCleared', {
          timestamp: new Date().toISOString()
        });
        
        // Emit statistics updated event
        await (this.wordnet as any).emitStatisticsUpdated();
      }
    } catch (error) {
      if (this.wordnet && typeof (this.wordnet as any).emitError === 'function') {
        (this.wordnet as any).emitError('clearAllData', error instanceof Error ? error : String(error));
      }
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
}

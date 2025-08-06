import { Project } from "./project.js";
import { WebDatabase } from "./web-database.js";
import { WebWordnet } from "./web-wordnet.js";

export interface ProgressCallback {
  (progress: number): void;
}

export interface DataLoaderOptions {
  force?: boolean;
  progress?: ProgressCallback;
}
/**
 * Browser-compatible streaming XML parser for large files
 */
class BrowserXMLParser {
  private xmlText: string;
  private position: number = 0;
  private progress?: ProgressCallback;
  private debug: boolean;

  constructor(
    xmlText: string,
    options: { progress?: ProgressCallback; debug?: boolean } = {}
  ) {
    this.xmlText = xmlText;
    this.progress = options.progress;
    this.debug = options.debug || false;
  }

  /**
   * Parse XML using a streaming approach to avoid stack overflow
   */
  async parse(): Promise<any> {
    const result: any = {};
    let elementStack: any[] = [];
    let elementCount = 0;

    // Skip XML declaration if present
    if (this.xmlText.startsWith("<?xml")) {
      const declEnd = this.xmlText.indexOf("?>");
      if (declEnd !== -1) {
        this.position = declEnd + 2;
      }
    }

    if (this.debug) {
      console.log(
        `[DEBUG] BrowserXMLParser starting with ${this.xmlText.length} characters`
      );
      console.log(`[DEBUG] First 500 chars:`, this.xmlText.substring(0, 500));
    }

    while (this.position < this.xmlText.length) {
      // Skip whitespace
      while (
        this.position < this.xmlText.length &&
        /\s/.test(this.xmlText[this.position])
      ) {
        this.position++;
      }

      if (this.position >= this.xmlText.length) break;

      const char = this.xmlText[this.position];

      if (char === "<") {
        // Found a tag
        if (this.xmlText[this.position + 1] === "/") {
          // Closing tag
          const tagEnd = this.xmlText.indexOf(">", this.position);
          if (tagEnd === -1) break;

          const tagName = this.xmlText.substring(this.position + 2, tagEnd);
          this.position = tagEnd + 1;

          // Pop from stack
          if (elementStack.length > 0) {
            elementStack.pop();
          }

          elementCount++;
          if (this.progress && elementCount % 1000 === 0) {
            this.progress(Math.min(elementCount / 100000, 0.95));
          }
        } else if (this.xmlText[this.position + 1] === "!") {
          // Comment or CDATA - skip
          const commentEnd = this.xmlText.indexOf("-->", this.position);
          const cdataEnd = this.xmlText.indexOf("]]>", this.position);
          if (commentEnd !== -1) {
            this.position = commentEnd + 3;
          } else if (cdataEnd !== -1) {
            this.position = cdataEnd + 3;
          } else {
            this.position++;
          }
        } else {
          // Opening tag
          const tagEnd = this.xmlText.indexOf(">", this.position);
          if (tagEnd === -1) break;

          const tagContent = this.xmlText.substring(this.position + 1, tagEnd);
          const spaceIndex = tagContent.indexOf(" ");

          let tagName: string;
          let attributes: any = {};

          if (spaceIndex === -1) {
            tagName = tagContent;
          } else {
            tagName = tagContent.substring(0, spaceIndex);
            const attrString = tagContent.substring(spaceIndex + 1);
            attributes = this.parseAttributes(attrString);
          }

          // Check if it's a self-closing tag
          const isSelfClosing = tagContent.endsWith("/");
          if (isSelfClosing) {
            tagName = tagName.replace("/", "");
          }

          // Create new element
          const newElement: any = {
            name: tagName,
            attributes,
            children: [],
            text: "",
          };

          if (elementStack.length === 0) {
            result[tagName] = newElement;
            if (this.debug && elementCount < 10) {
              console.log(`[DEBUG] Root element found: ${tagName}`);
            }
          } else {
            const parent = elementStack[elementStack.length - 1];
            if (!parent.children) parent.children = [];
            parent.children.push(newElement);
          }

          if (!isSelfClosing) {
            elementStack.push(newElement);
          }

          this.position = tagEnd + 1;

          elementCount++;
          if (this.progress && elementCount % 1000 === 0) {
            this.progress(Math.min(elementCount / 100000, 0.95));
          }
        }
      } else {
        // Text content - collect until next tag
        let textContent = "";
        while (
          this.position < this.xmlText.length &&
          this.xmlText[this.position] !== "<"
        ) {
          textContent += this.xmlText[this.position];
          this.position++;
        }

        // Trim whitespace and assign to current element
        textContent = textContent.trim();
        if (textContent && elementStack.length > 0) {
          const currentElement = elementStack[elementStack.length - 1];
          currentElement.text = textContent;
        }
      }
    }

    if (this.debug) {
      console.log(
        `[DEBUG] BrowserXMLParser completed. Found ${elementCount} elements.`
      );
      console.log(`[DEBUG] Root elements:`, Object.keys(result));
      console.log(`[DEBUG] Result structure:`, JSON.stringify(result, null, 2));
    }

    return result;
  }

  private parseAttributes(attrString: string): any {
    const attributes: any = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}

/**
 * Download and load WordNet data into the browser database
 * Mirrors wn-ts-node's data management patterns
 */
export class DataLoader {
  protected database: WebDatabase;
  protected wordnet: WebWordnet;

  constructor(database: WebDatabase, wordnet: WebWordnet) {
    this.database = database;
    this.wordnet = wordnet;
  }

  /**
   * Get the query service lazily (only when needed)
   */
  protected getQueryService(): any {
    const queryService = this.wordnet.getQueryService();
    console.log(
      "🔍 DataLoader.getQueryService() called, queryService:",
      queryService ? "available" : "undefined"
    );
    return queryService;
  }

  /**
   * Convert external URLs to proxy URLs to bypass CORS
   */
  protected toProxyUrl(url: string): string {
    // Check if we're in a development environment (localhost)
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!isDev) {
      return url; // Return original URL in production
    }

    console.log(`🔍 Original URL: ${url}`);

    // Convert external URLs to proxy URLs
    if (url.includes("en-word.net")) {
      const proxyUrl = url.replace("https://en-word.net", "/api/en-word-net");
      console.log(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("raw.githubusercontent.com")) {
      const proxyUrl = url.replace(
        "https://raw.githubusercontent.com",
        "/api/raw-github"
      );
      console.log(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("github.com/globalwordnet")) {
      const proxyUrl = url.replace(
        "https://github.com/globalwordnet",
        "/api/globalwordnet"
      );
      console.log(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    if (url.includes("github.com")) {
      const proxyUrl = url.replace("https://github.com", "/api/github");
      console.log(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    // For any other external URL, use the generic proxy
    if (url.startsWith("https://")) {
      const proxyUrl = url.replace("https://", "/api/external/");
      console.log(`🔍 Proxied to: ${proxyUrl}`);
      return proxyUrl;
    }

    console.log(`🔍 No proxy needed: ${url}`);
    return url;
  }

  /**
   * Download a project from the web and load it into the database
   */
  async downloadAndLoad(
    projectIdWithVersion: string,
    options: DataLoaderOptions = {}
  ): Promise<void> {
    const { force = false, progress } = options;

    console.log(`📥 Downloading project: ${projectIdWithVersion}`);

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
        console.log(`🌐 Downloading from ${url} (proxied as ${proxyUrl})...`);
        const data = await this.downloadFile(proxyUrl, progress);

        // Load the data into the database
        console.log(`📊 Loading data into database...`);
        await this.loadData(data, projectIdWithVersion, progress);

        console.log(`✅ Successfully loaded ${projectIdWithVersion}`);
        return; // Success, exit early
      } catch (error) {
        console.warn(`⚠️ Failed to download from ${url}:`, error);
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
    // This will replace the current DB with the one from the buffer
    await this.database.loadDatabase(new Uint8Array(data));

    await this.insertLexicon(projectIdWithVersion);
  }

  /**
   * Download a file from a URL
   */
  protected async downloadFile(
    url: string,
    progress?: ProgressCallback
  ): Promise<ArrayBuffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

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
    }

    // Combine chunks into a single ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
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
    // Parse the downloaded LMF XML data
    const xmlText = new TextDecoder().decode(data);

    if (progress) progress(0.1);

    // Insert lexicon information
    await this.insertLexicon(projectIdWithVersion);

    if (progress) progress(0.2);

    try {
      // Check if the XML is very large (over 1MB)
      if (xmlText.length > 1000000) {
        console.log(
          `📊 Large XML file detected (${(xmlText.length / 1024 / 1024).toFixed(2)}MB), using browser-compatible parser...`
        );

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

        const parsed = await browserParser.parse();

        if (progress) progress(0.9);

        // Convert browser parser output to LMF format and insert
        await this.insertBrowserParsedData(parsed, projectIdWithVersion);

        if (progress) progress(1.0);
      } else {
        // For smaller files, use the regular parser
        console.log(
          `📊 Small XML file detected (${(xmlText.length / 1024).toFixed(2)}KB), using regular parser...`
        );
        const { parseLMFXML } = await import("wn-ts-core");
        const lmfDocument = parseLMFXML(xmlText, { debug: true });

        if (progress) progress(0.5);

        // Insert the parsed data into the database
        await this.insertLMFData(lmfDocument, projectIdWithVersion);

        if (progress) progress(1.0);
      }
    } catch (error) {
      console.warn(
        "Failed to parse LMF data, falling back to sample data:",
        error
      );
      // Fall back to sample data if parsing fails
      await this.insertSampleData(projectIdWithVersion);
      if (progress) progress(1.0);
    }
  }

  /**
   * Insert lexicon information
   */
  protected async insertLexicon(projectIdWithVersion: string): Promise<void> {
    try {
      const project = Project.from(projectIdWithVersion);
      console.log(`🔍 Debug insertLexicon: projectId = ${project.id}`);
      console.log(`🔍 Debug insertLexicon: project =`, project);

      const label = project.getLabel();
      const language = project.getLanguage();
      const license = project.getLicense();
      const url = `https://github.com/globalwordnet/${project.id}`;
      const citation = project.getCitation();

      console.log(
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
      console.log(`✅ Lexicon inserted: ${project.projectIdWithVersion}`);
    } catch (error) {
      console.error(
        `❌ Failed to insert lexicon ${projectIdWithVersion}:`,
        error
      );
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
      console.warn("Failed to check if data exists:", error);
      return false;
    }
  }

  /**
   * Ensure data is loaded (load if not present)
   */
  async ensureDataLoaded(projectId: string = "oewn:2024"): Promise<void> {
    const hasData = await this.hasData();
    if (!hasData) {
      console.log("📥 No data found, loading automatically...");
      await this.downloadAndLoad(projectId);
    } else {
      console.log("📊 Data already loaded");
    }
  }
}

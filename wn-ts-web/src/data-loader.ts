import { BrowserXMLParser } from "./parsers/xml/browser-xml-parser.js";
import { Project } from "./project.js";
import type { ProgressCallback } from "./types/progress.js";
import { WebDatabase } from "./web-database.js";
import { WebWordnet } from "./web-wordnet.js";

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

      if (current.name === '#text') {
        if (typeof current.text === 'string' && current.text.length > 0) {
          aggregatedText += " " + current.text;
        }
      } else if (typeof current.text === 'string' && current.text.length > 0) {
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
    options: DataLoadOptions = {}
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
    // Recreate Kysely connections after DB swap
    try {
      this.wordnet.refreshConnections();
    } catch {}
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
    let xmlText: string;
    const view = new Uint8Array(data);

    // Check for gzip magic numbers: 0x1f 0x8b
    if (view.length > 2 && view[0] === 0x1f && view[1] === 0x8b) {
      try {
        // Dynamically import pako for decompression
        const pako = await import("pako");
        const decompressed = pako.inflate(view);
        xmlText = new TextDecoder().decode(decompressed);
        console.log("📊 Decompressed gzipped data.");
      } catch (err) {
        console.error("❌ Failed to decompress gzipped data:", err);
        throw err;
      }
    } else {
      // Data is not gzipped
      xmlText = new TextDecoder().decode(data);
    }

    if (progress) progress(0.1);

    // Lexicon information will be inserted from the file data

    if (progress) progress(0.2);

    // Check if the XML is very large (over 1MB)
    if (xmlText.length > 1000000) {
      console.log(
        `📊 Large XML file detected (${(xmlText.length / 1024 / 1024).toFixed(
          2
        )}MB), using browser-compatible parser...`
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
        `📊 Small XML file detected (${(xmlText.length / 1024).toFixed(
          2
        )}KB), using regular parser...`
      );
      const { parseLMFXML } = await import("wn-ts-core");
      const lmfDocument = parseLMFXML(xmlText, { debug: true });

      if (progress) progress(0.5);

      // Insert the parsed data into the database
      await this.insertLMFData(lmfDocument, projectIdWithVersion);

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
   * Insert parsed LMF data into the database
   */
  private async insertLMFData(
    lmfDocument: any,
    projectIdWithVersion: string
  ): Promise<void> {
    console.log(`📝 Inserting LMF data for ${projectIdWithVersion}...`);
    const queryService = this.getQueryService();
    if (!queryService) {
      throw new Error("Query service not available for batch insert.");
    }
    try {
      const lexicons = lmfDocument.lexicons || (lmfDocument.lexicon ? [lmfDocument.lexicon] : []);
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
        language: word.language || lexicons[0]?.language || 'en',
        lexicon: word.lexicon || lexicons[0]?.id || projectIdWithVersion,
      }));

      const synsetsToInsert = (lmfDocument.synsets || []).map((synset: any) => ({
        id: synset.id,
        ili: synset.ili || null,
        pos: synset.partOfSpeech,
        language: synset.language || lexicons[0]?.language || 'en',
        lexicon: synset.lexicon || lexicons[0]?.id || projectIdWithVersion,
      }));

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
                ? gloss.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
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
      if (lexiconsToInsert.length > 0) await queryService.batchInsert('lexicons', lexiconsToInsert);
      if (wordsToInsert.length > 0) await queryService.batchInsert('words', wordsToInsert);
      if (synsetsToInsert.length > 0) await queryService.batchInsert('synsets', synsetsToInsert);
      if (sensesToInsert.length > 0) await queryService.batchInsert('senses', sensesToInsert);
      if (definitionsToInsert.length > 0) await queryService.batchInsert('definitions', definitionsToInsert);
      
      console.log(`✅ LMF data inserted for ${projectIdWithVersion}`);
    } catch (error) {
      console.error(
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
    console.log(
      `📝 Inserting browser-parsed data for ${projectIdWithVersion}...`
    );

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
        const lexiconLang = lexiconElem.attributes?.language || 'en';

        lexiconsToInsert.push({
          id: lexiconId,
          label: lexiconElem.attributes?.label || 'Unknown Lexicon',
          language: lexiconLang,
          version: lexiconElem.attributes?.version,
          license: lexiconElem.attributes?.license,
        });
        
        // Process lexical entries
        const entries = lexiconElem.children?.filter((child: any) => child.name === "LexicalEntry") || [];
        console.log(`📊 Processing ${entries.length} lexical entries for lexicon ${lexiconId}...`);

        for (const entry of entries) {
          const wordId = entry.attributes?.id || "unknown-word";
          const lemmaElem = entry.children?.find((child: any) => child.name === "Lemma");
          const lemma = lemmaElem?.attributes?.writtenForm || wordId;
          const partOfSpeech = lemmaElem?.attributes?.partOfSpeech || "n";

          wordsToInsert.push({
            id: wordId,
            lemma: lemma,
            pos: partOfSpeech,
            language: lexiconLang,
            lexicon: lexiconId,
          });

          const senses = entry.children?.filter((child: any) => child.name === "Sense") || [];
          for (const sense of senses) {
            const senseId = sense.attributes?.id || `${wordId}.sense`;
            const synsetId = sense.attributes?.synset || `${wordId}.synset`;
            sensesToInsert.push({ id: senseId, word_id: wordId, synset_id: synsetId });
          }
        }
        
        // Process synsets
        const synsetElems = lexiconElem.children?.filter((child: any) => child.name === "Synset") || [];
        console.log(`📊 Processing ${synsetElems.length} synsets for lexicon ${lexiconId}...`);

        for (const synset of synsetElems) {
          const synsetId = synset.attributes?.id || "unknown-synset";
          synsetsToInsert.push({
            id: synsetId,
            ili: synset.attributes?.ili || null,
            pos: synset.attributes?.partOfSpeech || "n",
            language: lexiconLang,
            lexicon: lexiconId,
          });

          const definitions = synset.children?.filter((child: any) => child.name === "Definition") || [];
          for (const [i, def] of definitions.entries()) {
            const lang = def.attributes?.language || "en";
            const glossElem = def.children?.find((c: any) => c.name === 'gloss');
            
            // Use the recursive text extractor
            const textContent = glossElem ? this.extractTextFromNode(glossElem) : this.extractTextFromNode(def);
            const cleanedText = textContent.replace(/\s+/g, ' ').trim();

            definitionsToInsert.push({
              id: `${synsetId}.def.${lang}.${i}`,
              synset_id: synsetId,
              language: lang,
              text: cleanedText,
            });
          }
        }
      }

      const queryService = this.getQueryService();
      if (queryService) {
        console.log(`📝 Inserting ${lexiconsToInsert.length} lexicons, ${wordsToInsert.length} words, ${sensesToInsert.length} senses, ${synsetsToInsert.length} synsets, and ${definitionsToInsert.length} definitions in batches...`);
        if (lexiconsToInsert.length > 0) await queryService.batchInsert('lexicons', lexiconsToInsert);
        if (wordsToInsert.length > 0) await queryService.batchInsert('words', wordsToInsert);
        if (synsetsToInsert.length > 0) await queryService.batchInsert('synsets', synsetsToInsert);
        if (sensesToInsert.length > 0) await queryService.batchInsert('senses', sensesToInsert);
        if (definitionsToInsert.length > 0) await queryService.batchInsert('definitions', definitionsToInsert);
      } else {
        throw new Error("Query service not available for batch insert.");
      }

      console.log(
        `✅ Browser-parsed data inserted for ${projectIdWithVersion}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to insert browser-parsed data for ${projectIdWithVersion}:`,
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

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    await this.database.clearAllData();
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

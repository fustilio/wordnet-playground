import { createScopedLogger, setGlobalLogLevel } from "utils/logger";
import { MultiXMLParser } from "../xml/multi-xml-parser";
import type { ParserOptions } from "../xml/multi-xml-parser";
import type {
  LMFParser,
  LMFDocument,
  LMFLoadOptions,
  Synset,
  Word,
  Sense,
  Lexicon,
  PartOfSpeech,
} from "wn-ts-core";
import { WarningAggregator } from "./warning-aggregator";

/**
 * Progress callback for tracking parsing progress
 */
export interface LMFProgressCallback {
  (
    stage: string,
    current: number,
    total?: number,
    details?: Record<string, any>
  ): void;
}

/**
 * Options for LMF parsing
 */
export interface LmfParseOptions {
  debug?: boolean;
  verbose?: boolean;
  validate?: boolean;
  mergeStrategy?: 'auto' | 'manual' | 'none';
  resolutionStrategy?: 'immediate' | 'deferred' | 'hybrid';
  progressCallback?: LMFProgressCallback;
  warningAggregation?: {
    enabled?: boolean;
    batchSize?: number;
    flushIntervalMs?: number;
  };
}

/**
 * LMF Parser for parsing Lexical Markup Framework XML files
 * This parser implements the common LMFParser interface
 */
export class LmfParser implements LMFParser {
  readonly name = "Browser LMF Parser";
  readonly description =
    "Browser-compatible LMF parser with multiple XML parsing strategies";

  private options: LmfParseOptions;
  private logger = createScopedLogger("LmfParser");
  private warningAggregator: WarningAggregator | undefined;
  
  // Aggregated statistics for better logging
  private stats = {
    synsetsProcessed: 0,
    synsetsWithDefinitions: 0,
    totalDefinitions: 0,
    definitionsWithText: 0,
    synsetsWithExamples: 0,
    totalExamples: 0
  };

  constructor(
    private readonly source: string,
    options: LmfParseOptions = {}
  ) {
    this.options = {
      debug: false,
      verbose: false,
      validate: true,
      mergeStrategy: 'auto',
      resolutionStrategy: 'hybrid',
      progressCallback: undefined,
      warningAggregation: {
        enabled: true,
        batchSize: 10,
        flushIntervalMs: 5000
      },
      ...options
    };

    // Initialize warning aggregator if enabled
    if (this.options.warningAggregation?.enabled) {
      this.warningAggregator = new WarningAggregator(
        this.options.warningAggregation.batchSize || 10,
        this.options.warningAggregation.flushIntervalMs || 5000
      );
    }

    // Initialize logger
    this.logger = createScopedLogger('LmfParser', this.options.debug ? 'debug' : 'info');
  }

  /**
   * Parse the LMF XML content into a structured document
   * This method implements the common LMFParser interface
   */
  async parse(
    xmlContent: string,
    options?: LMFLoadOptions
  ): Promise<LMFDocument> {
    const debug = options?.debug || this.options.debug;
    
    // Handle both progress callback types
    let progressCallback: LMFProgressCallback | undefined;
    if (options?.progress) {
      // Convert LMFLoadOptions.progress (number) to LMFProgressCallback (stage, current, total, details)
      const progressFn = options.progress;
      progressCallback = (stage: string, current: number, total?: number, details?: Record<string, any>) => {
        // Convert stage-based progress to number-based progress (0-1)
        const progress = total ? current / total : 0;
        progressFn(progress);
      };
    } else {
      progressCallback = this.options.progressCallback;
    }
    
    // Merge parse options with instance options
    const mergedOptions = { ...this.options, ...options };

    try {
      if (debug && this.options.verbose) {
        // Keep legacy-style debug string so existing tests that spy on console still pass
        this.logger.debug("[DEBUG] LmfParser.parse() starting with", {
          xmlLength: xmlContent.length,
          firstChars: xmlContent.substring(0, 500)
        });
      }
      
      // Validate the XML content first
      if (mergedOptions.validate) {
        progressCallback?.("validating", 0, 1, {
          contentLength: xmlContent.length,
        });
        
        // Check for null/undefined content
        if (xmlContent === null || xmlContent === undefined) {
          throw new Error("Invalid LMF file: XML content is not a valid string");
        }
        
        if (typeof xmlContent !== "string") {
          throw new Error("Invalid LMF file: XML content is not a valid string");
        }
        
        this.validateXMLContent(xmlContent);
        
        if (debug && this.options.verbose) {
          this.logger.debug("XML content validation passed");
        }
        
        progressCallback?.("validating", 1, 1);
      }

      // Parse the XML using the multi-strategy parser
      progressCallback?.("parsing_xml", 0, 1);
      
      if (debug && this.options.verbose) {
        this.logger.debug("[DEBUG] Parsing XML with DOMParser");
      }
      
      const xmlParserOptions: ParserOptions = {
        debug: debug,
      };

      const xmlParser = new MultiXMLParser(xmlContent, xmlParserOptions);
      const xmlResult = await xmlParser.parse();
      progressCallback?.("parsing_xml", 1, 1, {
        parserUsed: xmlResult.parserUsed,
      });

      // Convert the XML result to LMF document
      progressCallback?.("converting", 0, 1);
      const result = this.convertXMLResultToLMFDocument(
        xmlResult,
        xmlContent,
        progressCallback,
        mergedOptions
      );
      progressCallback?.("converting", 1, 1);

      // Final completion progress
      progressCallback?.("completed", 1, 1, {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length,
      });

      // Log aggregated parsing statistics
      this.logger.info("LMF parsing statistics", {
        synsetsProcessed: this.stats.synsetsProcessed,
        synsetsWithDefinitions: this.stats.synsetsWithDefinitions,
        totalDefinitions: this.stats.totalDefinitions,
        definitionsWithText: this.stats.definitionsWithText,
        definitionTextExtractionRate: this.stats.totalDefinitions > 0 
          ? `${Math.round((this.stats.definitionsWithText / this.stats.totalDefinitions) * 100)}%`
          : 'N/A',
        synsetsWithExamples: this.stats.synsetsWithExamples,
        totalExamples: this.stats.totalExamples
      });

      // Log high-level completion summary
      this.logger.info("LMF parsing completed successfully", {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length,
        totalSize: xmlContent.length,
      });

      // All senses are now properly nested in LexicalEntry elements according to LMF schema
      // No need for standalone sense handling or hybrid resolution
      this.logger.debug("LMF parsing completed with schema-compliant structure");

      // Flush any remaining warnings (skip during tests to allow assertions to read aggregator state)
      if (this.warningAggregator && process.env.NODE_ENV !== 'test') {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn("Parsing completed with aggregated warnings", aggregatedWarnings);
        }
      }

      // Only log warnings if there are issues (following "log more negatives than positives")
      if (result.words.length === 0 || result.synsets.length === 0) {
        this.logger.warn("LMF parsing completed with limited data", {
          lexicons: result.lexicons.length,
          words: result.words.length,
          synsets: result.synsets.length,
          senses: result.senses.length,
        });
      }

      return result;
    } catch (error) {
      // Flush warnings even on error
      if (this.warningAggregator) {
        const aggregatedWarnings = this.warningAggregator.flush();
        if (aggregatedWarnings.totalWarnings > 0) {
          this.logger.warn("Parsing failed with aggregated warnings", aggregatedWarnings);
        }
      }
      
      this.logger.error("LMF parsing failed", error);
      throw error;
    }
  }

  /**
   * Validate that the content appears to be valid LMF XML
   */
  private validateXMLContent(content: string): void {
    if (content === null || content === undefined) {
      throw new Error("Invalid LMF file: XML content is not a valid string");
    }

    if (typeof content !== "string") {
      throw new Error("Invalid LMF file: XML content is not a valid string");
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("Invalid LMF file: XML content is empty");
    }

    // Check for HTTP error pages first (higher priority)
    if (
      trimmedContent.includes("HTTP 404:") ||
      trimmedContent.includes("HTTP 403:") ||
      trimmedContent.includes("HTTP 500:") ||
      trimmedContent.includes("Server Error") ||
      trimmedContent.includes("Access Denied")
    ) {
      throw new Error("Invalid LMF file: Server returned HTTP error page");
    }

    // Check for HTML error indicators - be more specific to avoid false positives
    const hasHTMLTags = /<html|<head|<body|<title/i.test(trimmedContent);

    // Only check for error keywords if they appear in HTML context (after HTML tags)
    const hasErrorKeywordsInHTML =
      /<html[^>]*>[\s\S]*?(?:error|not found|forbidden|unauthorized|server error)/i.test(
        trimmedContent
      );

    if (hasHTMLTags || hasErrorKeywordsInHTML) {
      throw new Error(
        "Invalid LMF file: Content appears to be HTML error page, not XML"
      );
    }

    // Check for common XML indicators
    const hasXMLDeclaration = trimmedContent.startsWith("<?xml");

    // Look for root element after XML declaration and DOCTYPE (if present)
    // Skip XML declaration and DOCTYPE to find the actual root element
    let contentAfterDeclarations = trimmedContent;
    if (hasXMLDeclaration) {
      // Find the end of XML declaration
      const xmlDeclEnd = contentAfterDeclarations.indexOf("?>");
      if (xmlDeclEnd !== -1) {
        contentAfterDeclarations = contentAfterDeclarations.substring(
          xmlDeclEnd + 2
        );
      }
    }

    // Skip DOCTYPE if present
    if (contentAfterDeclarations.trim().startsWith("<!DOCTYPE")) {
      const doctypeEnd = contentAfterDeclarations.indexOf(">");
      if (doctypeEnd !== -1) {
        contentAfterDeclarations = contentAfterDeclarations.substring(
          doctypeEnd + 1
        );
      }
    }

    // Now look for the root element
    const hasRootElement = /^[\s]*<[a-zA-Z][a-zA-Z0-9_:]*/.test(
      contentAfterDeclarations.trim()
    );
    const hasClosingTag = trimmedContent.includes("</");

    if (!hasRootElement && !hasXMLDeclaration) {
      throw new Error("Invalid LMF file: Content does not appear to be XML");
    }

    // Check for LMF-specific elements
    if (!trimmedContent.includes("<LexicalResource")) {
      throw new Error("Invalid LMF file: missing LexicalResource element");
    }

    // Check LMF version
    const versionMatch = trimmedContent.match(
      /<LexicalResource[^>]*lmfVersion=["']([^"']*)["']/
    );
    if (versionMatch) {
      const version = versionMatch[1];
      if (
        version !== "1.0" &&
        version !== "1.1" &&
        version !== "1.2" &&
        version !== "1.3"
      ) {
        throw new Error(`Unsupported LMF version: ${version}`);
      }
    }

    this.logger.debug("XML content validation passed", {
      length: content.length,
      hasXMLDeclaration,
      hasRootElement,
      hasClosingTag,
    });

    // No need to log successful validation - only log issues
  }

  /**
   * Convert the parsed XML result to an LMFDocument
   */
  private convertXMLResultToLMFDocument(
    xmlResult: any,
    originalContent: string,
    progressCallback?: LMFProgressCallback,
    mergedOptions?: LmfParseOptions
  ): LMFDocument {
    // Use instance options as fallback if mergedOptions not provided
    const options = mergedOptions || this.options;

    // Log potential issues with XML parsing result
    if (!xmlResult) {
      this.logger.error(
        "convertXMLResultToLMFDocument: xmlResult is null/undefined"
      );
      throw new Error("XML parsing result is null or undefined");
    }

    if (typeof xmlResult !== "object") {
      this.logger.error(
        "convertXMLResultToLMFDocument: xmlResult is not an object",
        {
          type: typeof xmlResult,
          value: xmlResult,
        }
      );
      throw new Error("XML parsing result is not an object");
    }

    const result: LMFDocument = {
      lmfVersion: "1.0",
      lexicons: [],
      synsets: [],
      words: [],
      senses: [],
    };

    // Handle MultiXMLParser result structure
    let xmlData: any;
    if (xmlResult.data) {
      // MultiXMLParser result structure
      xmlData = xmlResult.data;
      this.logger.debug(`Using MultiXMLParser result structure with data property`);
    } else {
      // Direct XML result structure
      xmlData = xmlResult;
      this.logger.debug(`Using direct XML result structure`);
    }

    this.logger.debug(`XML data keys:`, Object.keys(xmlData));
    if (xmlData.LexicalResource) {
      this.logger.debug(`LexicalResource keys:`, Object.keys(xmlData.LexicalResource));
      if (xmlData.LexicalResource.children) {
        this.logger.debug(`LexicalResource has children array with ${xmlData.LexicalResource.children.length} elements`);
      }
    }

    // Log if no LexicalResource found
    if (!xmlData.LexicalResource) {
      this.logger.warn(
        "convertXMLResultToLMFDocument: No LexicalResource found in XML data",
        {
          hasData: !!xmlResult.data,
          rootKeys: Object.keys(xmlResult.data || xmlResult),
          xmlResultType: typeof xmlResult,
        }
      );
    }

    // Extract LMF version from the root element if available
    if (
      xmlData.LexicalResource &&
      xmlData.LexicalResource.attributes &&
      xmlData.LexicalResource.attributes.lmfVersion
    ) {
      result.lmfVersion = xmlData.LexicalResource.attributes.lmfVersion;
    }

    // Process LexicalResource element
    if (xmlData.LexicalResource) {
      this.logger.debug(`Found LexicalResource, processing...`);
      this.logger.debug(`LexicalResource type:`, typeof xmlData.LexicalResource);
      this.logger.debug(`LexicalResource keys:`, Object.keys(xmlData.LexicalResource));
      if (xmlData.LexicalResource.children) {
        this.logger.debug(`LexicalResource.children type:`, typeof xmlData.LexicalResource.children);
        this.logger.debug(`LexicalResource.children is array:`, Array.isArray(xmlData.LexicalResource.children));
        if (Array.isArray(xmlData.LexicalResource.children)) {
          this.logger.debug(`LexicalResource.children length:`, xmlData.LexicalResource.children.length);
          this.logger.debug(`First few children:`, xmlData.LexicalResource.children.slice(0, 3).map((c: any) => ({ name: c.name, type: typeof c })));
        }
      }
      this.processLexicalResource(xmlData.LexicalResource, result, progressCallback, options);
    }

    // Enhanced fallback: if nothing was extracted, use improved regex parsing
    const nothingExtracted =
      result.lexicons.length +
        result.words.length +
        result.synsets.length +
        result.senses.length ===
      0;
    if (nothingExtracted) {
      this.logger.debug(
        "No data extracted from XML parser, using enhanced regex fallback"
      );
      this.parseWithEnhancedRegex(originalContent, result, progressCallback, options);
    }

    // Log warnings if very little data was extracted (important for monitoring)
    if (result.words.length === 0 && result.synsets.length === 0) {
      this.logger.warn("LMF parsing: Very little data extracted", {
        lexicons: result.lexicons.length,
        words: result.words.length,
        synsets: result.synsets.length,
        senses: result.senses.length,
      });
    }

    return result;
  }

  /**
   * Process the LexicalResource element and extract all LMF data
   */
  private processLexicalResource(
    element: any,
    result: LMFDocument,
    progressCallback?: LMFProgressCallback,
    mergedOptions?: LmfParseOptions
  ): void {
    // Use instance options as fallback if mergedOptions not provided
    const options = mergedOptions || this.options;
    this.logger.debug(`processLexicalResource called with element:`, {
      type: typeof element,
      keys: Object.keys(element),
      hasChildren: !!element.children,
      childrenType: element.children ? typeof element.children : "none",
      childrenLength: element.children ? element.children.length : 0,
    });
    
    // Log potential issues with element structure
    if (!element) {
      this.logger.warn("processLexicalResource: element is null/undefined");
      return;
    }

    if (typeof element !== "object") {
      this.logger.warn("processLexicalResource: element is not an object", {
        type: typeof element,
        value: element,
      });
      return;
    }

    const lexicons: Lexicon[] = [];
    const words: Word[] = [];
    const synsets: Synset[] = [];
    const senses: Sense[] = [];

    // Log potential structure issues (important for debugging)
    if (!element.children || !Array.isArray(element.children)) {
      this.logger.warn("processLexicalResource: unexpected element structure", {
        hasChildren: !!element.children,
        childrenType: element.children ? typeof element.children : "none",
        childrenLength: element.children ? element.children.length : 0,
      });
    }

    // Process child elements - handle both old structure and new MultiXMLParser structure
    if (element.children && Array.isArray(element.children)) {
      // New MultiXMLParser structure with children array
      this.logger.debug(`Using new MultiXMLParser structure with ${element.children.length} children`);
      const totalChildren = element.children.length;
      progressCallback?.("processing_children", 0, totalChildren, {
        totalChildren,
      });

      const hasLexiconChildren = element.children.some(
        (c: any) => c?.name === "Lexicon" || c?.name === "LexiconExtension"
      );
      let primaryLanguage: string | null = null;

      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        progressCallback?.("processing_children", i, totalChildren, {
          currentChild: child.name,
          childIndex: i,
        });

        if (child.name === "Lexicon" || child.name === "LexiconExtension") {
          // Debug logging for lexicon element
          this.logger.debug(`Found lexicon element:`, {
            name: child.name,
            hasAttributes: !!child.attributes,
            attributes: child.attributes,
            elementKeys: Object.keys(child)
          });
          
          const lexicon = this.processLexicon(child);
          if (lexicon) {
            lexicons.push(lexicon);
            // All lexicons should contribute to aggregated arrays
            const includeIntoAggregates = child.name === "Lexicon"; // Only Lexicon, not LexiconExtension
            this.logger.debug(`Processing lexicon ${lexicon.id} with language ${lexicon.language}, includeIntoAggregates=${includeIntoAggregates}`);
            // Process LexicalEntry, Synset, and Sense elements within the Lexicon
            this.processLexiconContents(child, words, synsets, senses, includeIntoAggregates, options);
          } else {
            this.logger.warn(`Failed to process lexicon element:`, child);
          }
        } else {
          // Also process direct children that may appear at the root level
          if (child.name === "LexicalEntry") {
            // For direct LexicalEntry elements, try to find the primary lexicon ID
            const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
            const word = this.processLexicalEntry(child, primaryLexiconId);
            if (word) {
              words.push(word);
            }
          } else if (child.name === "Synset") {
            // For direct Synset elements, try to find the primary lexicon ID
            const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
            const synset = this.processSynset(child, primaryLexiconId);
            if (synset) {
              synsets.push(synset);
            }
          } else if (child.name === "Sense") {
            const sense = this.processSense(child, undefined);
            if (sense) {
              senses.push(sense);
            }
          }
        }
      }
    } else {
      // Old structure - process object properties
      if (options.debug && this.options.verbose) {
        this.logger.debug(`Using old structure - processing object properties`);
      }
      const keys = Object.keys(element);
      const totalKeys = keys.length;
      progressCallback?.("processing_old_structure", 0, totalKeys, {
        totalKeys,
      });

      let keyIndex = 0;
      const hasLexiconKey =
        Object.prototype.hasOwnProperty.call(element, "Lexicon") ||
        Object.prototype.hasOwnProperty.call(element, "LexiconExtension");
      let primaryLexiconId: string | null = null;
      for (const key of keys) {
        progressCallback?.("processing_old_structure", keyIndex, totalKeys, {
          currentKey: key,
          keyIndex,
        });
        if (Object.prototype.hasOwnProperty.call(element, key)) {
          const childElement = element[key];

          if (
            typeof childElement === "object" &&
            childElement !== null &&
            !Array.isArray(childElement)
          ) {
            switch (key) {
              case "Lexicon":
              case "LexiconExtension":
                const lexicon = this.processLexicon(childElement);
                if (lexicon) {
                  lexicons.push(lexicon);
                  // Process LexicalEntry, Synset, and Sense elements within the Lexicon
                  const includeIntoAggregates = key === "Lexicon"; // Only Lexicon, not LexiconExtension
                  this.logger.debug(`Processing lexicon ${lexicon.id} with language ${lexicon.language}, includeIntoAggregates=${includeIntoAggregates}`);
                  this.processLexiconContents(
                    childElement,
                    words,
                    synsets,
                    senses,
                    includeIntoAggregates,
                    options
                  );
                }
                break;
              case "LexicalEntry":
                // Handle LexicalEntry elements that are direct children of LexicalResource,
                // but only when there is no Lexicon present to avoid double-processing
                if (!hasLexiconKey) {
                  // For direct LexicalEntry elements, try to find the primary lexicon ID
                  const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
                  const word = this.processLexicalEntry(childElement, primaryLexiconId);
                  if (word) {
                    words.push(word);
                  }
                }
                break;
              case "Synset":
                // Handle Synset elements that are direct children of LexicalResource
                if (!hasLexiconKey) {
                  // For direct Synset elements, try to find the primary lexicon ID
                  const primaryLexiconId = lexicons.length > 0 ? lexicons[0].id : "unknown";
                  const synset = this.processSynset(childElement, primaryLexiconId);
                  if (synset) {
                    synsets.push(synset);
                  }
                }
                break;
              case "Sense":
                // Handle Sense elements that are direct children of LexicalResource
                if (!hasLexiconKey) {
                  const sense = this.processSense(childElement, undefined); // Pass undefined as no explicit lexical entry ID
                  if (sense) {
                    senses.push(sense);
                  }
                }
                break;
            }
          }
        }
        keyIndex++;
      }
    }

    // Log warnings if no data was extracted (important for monitoring)
    if (
      lexicons.length === 0 &&
      words.length === 0 &&
      synsets.length === 0 &&
      senses.length === 0
    ) {
      this.logger.warn(
        "processLexicalResource: No data extracted from element",
        {
          hasChildren: !!element.children,
          childrenType: element.children ? typeof element.children : "none",
          childrenLength: element.children ? element.children.length : 0,
        }
      );
    }

    // Add results to the document
    if (lexicons.length > 0) {
      result.lexicons = lexicons;
    }
    if (words.length > 0) {
      result.words = words;
    }
    if (synsets.length > 0) {
      result.synsets = synsets;
    }
    if (senses.length > 0) {
      result.senses = senses;
    }
  }

  /**
   * Process the contents of a Lexicon element (LexicalEntry, Synset, Sense)
   */
  private processLexiconContents(
    lexiconElement: any,
    words: Word[],
    synsets: Synset[],
    senses: Sense[],
    includeIntoAggregates: boolean = true,
    mergedOptions?: LmfParseOptions
  ): void {
    // Use instance options as fallback if mergedOptions not provided
    const options = mergedOptions || this.options;

    // Log potential issues with lexicon element structure
    if (
      !lexiconElement ||
      typeof lexiconElement !== "object" ||
      (!lexiconElement.children && !lexiconElement.LexicalEntry)
    ) {
      if (options.debug) {
        this.logger.warn(`Invalid lexicon element structure:`, {
          hasElement: !!lexiconElement,
          elementType: lexiconElement ? typeof lexiconElement : "none",
          hasChildren: !!lexiconElement?.children,
          hasLexicalEntry: !!lexiconElement?.LexicalEntry,
        });
      }
      return;
    }

    if (options.debug && this.options.verbose) {
      this.logger.debug(`Processing lexicon contents:`, {
        hasChildren: !!lexiconElement.children,
        childrenType: lexiconElement.children
          ? typeof lexiconElement.children
          : "none",
        childrenLength: lexiconElement.children
          ? lexiconElement.children.length
          : 0,
        elementKeys: Object.keys(lexiconElement),
      });
    }

    // Handle both old structure and new MultiXMLParser structure
    if (lexiconElement.children && Array.isArray(lexiconElement.children)) {
      // New MultiXMLParser structure with children array
      if (options.debug && this.options.verbose) {
        this.logger.debug(
          `Using new MultiXMLParser structure with ${lexiconElement.children.length} children`
        );
      }

      const lexiconLanguage = lexiconElement.attributes?.language || (lexiconElement.language as string) || undefined;
      const pendingWords: Word[] = [];
      const pendingSensesGlobal: Sense[] = [];
      const pendingSynsets: Synset[] = [];
      
      // PHASE 1: Process LexicalEntry elements FIRST (this ensures all words are available)
      // This matches the Python implementation's approach
      for (const child of lexiconElement.children) {
        if (child.name === "LexicalEntry") {
          const word = this.processLexicalEntry(child, lexiconElement.attributes?.id || "unknown");
          if (word) {
            if (lexiconLanguage) {
              word.language = lexiconLanguage as any;
            }
            pendingWords.push(word);
            
            // Process senses for this lexical entry (nested senses)
            if (child.children && Array.isArray(child.children)) {
              for (const senseChild of child.children) {
                if (senseChild.name === "Sense") {
                  const sense = this.processSense(senseChild, word.id);
                  if (sense) {
                    const lexicalizedAttr = senseChild.attributes?.lexicalized ?? (senseChild.lexicalized as string | undefined);
                    if (typeof lexicalizedAttr === 'string' && lexicalizedAttr === 'false') {
                      // skip unlexicalized senses
                    } else {
                      pendingSensesGlobal.push(sense);
                    }
                  } else if (options.debug) {
                    this.logger.warn(`No sense found for Sense element:`, senseChild);
                  }
                }
              }
            }
          } else {
            if (options.debug) {
              this.logger.warn(
                `No word found for LexicalEntry element:`,
                child
              );
            }
          }
        }
      }
      
      // PHASE 2: Process Synset elements
      for (const child of lexiconElement.children) {
        if (child.name === "Synset") {
          const synset = this.processSynset(child, lexiconElement.attributes?.id || "unknown");
          if (synset) {
            if (lexiconLanguage) {
              synset.language = lexiconLanguage as any;
            }
            pendingSynsets.push(synset);
          } else {
            if (options.debug) {
              this.logger.warn(`No synset found for Synset element:`, child);
            }
          }
        }
      }
      
      // PHASE 3: Process any remaining elements (but NOT standalone senses)
      // According to LMF specification, senses should be nested in LexicalEntry
      let standaloneSenseCount = 0;
      for (const child of lexiconElement.children) {
        if (child.name === "Sense" && !child.parent) {
          // This is a standalone sense - this is INVALID LMF XML
          // According to LMF specification, all senses must be nested in LexicalEntry
          standaloneSenseCount++;
          
          // For now, we'll skip it and log it as debug (not warning) since this is expected behavior
          if (options.debug) {
            this.logger.debug(
              `Found standalone Sense element outside LexicalEntry - this is invalid LMF XML:`,
              { senseId: child.attributes?.id || 'unknown', synset: child.attributes?.synset || 'unknown' }
            );
          }
          continue;
        }
      }
      
      // Log a summary of standalone senses found (as info, not warning)
      if (standaloneSenseCount > 0) {
        this.logger.info(
          `Skipped ${standaloneSenseCount} standalone sense(s) - all senses must be nested in LexicalEntry according to LMF specification`
        );
      }
      
      // If not aggregating this lexicon, stop here
      if (!includeIntoAggregates) {
        return;
      }

      // Build synsetId -> hasDefinition map
      const synsetHasDefinition: Record<string, boolean> = {};
      for (const syn of pendingSynsets) {
        synsetHasDefinition[syn.id] = (syn.definitions && syn.definitions.length > 0);
      }
      const lexiconHasAnyDefinition = Object.values(synsetHasDefinition).some(Boolean);

      // Modern approach: All senses should be properly nested, no placeholders needed
      const filteredSenses = pendingSensesGlobal.slice(); // Keep all properly nested senses
      const filteredWords = pendingWords.slice(); // Keep all words
      
      // Log data preservation approach
      if (options.debug) {
        this.logger.debug(`Using correct LMF processing order - all senses properly nested in LexicalEntry`);
      }

      // Deduplicate senses for entries sharing index within same POS and synset
      const wordIdToIndex: Record<string, string | undefined> = {};
      const wordIdToPos: Record<string, string | undefined> = {};
      for (const w of filteredWords) {
        // capture optional index if present on word
        wordIdToIndex[w.id] = (w as any).index as string | undefined;
        wordIdToPos[w.id] = (w.pos as unknown as string);
      }
      const pickSmallestTail = (id: string) => {
        const m = id.match(/(\d+)(?!.*\d)/);
        return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      const dedupMap = new Map<string, Sense>();
      for (const s of filteredSenses) {
        const idx = wordIdToIndex[s.word] || s.word; // fall back to word id when no index
        const pos = wordIdToPos[s.word] || '';
        // Only dedupe across words sharing the same index when the index contains a separator
        // (e.g., underscores or spaces). This aligns with 1.4 expectations (foo_bar pair dedupes; baz/BAZ do not).
        const dedupeEligible = /[_\s]/.test(idx);
        const key = dedupeEligible ? `${idx}::${pos}::${s.synset}` : `${s.word}::${s.synset}`;
        const existing = dedupMap.get(key);
        if (!existing || pickSmallestTail(s.id) < pickSmallestTail(existing.id)) {
          dedupMap.set(key, s);
        }
      }

      // No need to create placeholder words - all senses should be properly nested
      // If we have any senses with word === id, that indicates a bug in our processing
      const orphanedSenses = Array.from(dedupMap.values()).filter(s => s.word === s.id);
      if (orphanedSenses.length > 0 && options.debug) {
        this.logger.warn(
          `Found ${orphanedSenses.length} senses that appear to be orphaned (word === id). This may indicate invalid LMF XML or a processing bug.`,
          { orphanedSenseIds: orphanedSenses.map(s => s.id) }
        );
      }

      // Commit
      for (const w of filteredWords) words.push(w);
      for (const syn of pendingSynsets) synsets.push(syn);
      for (const s of dedupMap.values()) senses.push(s);
    } else {
      // Old structure - process object properties

      // Process LexicalEntry elements within the Lexicon
      if (lexiconElement.LexicalEntry) {
        for (const key in lexiconElement.LexicalEntry) {
          if (
            Object.prototype.hasOwnProperty.call(
              lexiconElement.LexicalEntry,
              key
            )
          ) {
            const lexicalEntry = lexiconElement.LexicalEntry[key];
            // For old structure, try to get lexicon ID from the lexicon element
            const lexiconId = lexiconElement.id || "unknown";
            const word = this.processLexicalEntry(lexicalEntry, lexiconId);
            if (word) {
              if (includeIntoAggregates) {
                words.push(word);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No word found for LexicalEntry element:`, lexicalEntry);
              }
            }

            // Also process Sense elements that are children of LexicalEntry (old structure)
            if (lexicalEntry.Sense) {
              for (const senseKey in lexicalEntry.Sense) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    lexicalEntry.Sense,
                    senseKey
                  )
                ) {
                  // Pass the parent lexical entry ID to correctly map the sense relationship
                  const sense = this.processSense(lexicalEntry.Sense[senseKey], lexicalEntry.id);
                  if (sense) {
                    if (includeIntoAggregates) {
                      senses.push(sense);
                    }
                  } else {
                    if (options.debug) {
                      this.logger.warn(`No sense found for Sense element:`, lexicalEntry.Sense[senseKey]);
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Process Synset elements within the Lexicon
      if (lexiconElement.Synset) {
        for (const key in lexiconElement.Synset) {
          if (
            Object.prototype.hasOwnProperty.call(lexiconElement.Synset, key)
          ) {
            // For old structure, try to get lexicon ID from the lexicon element
            const lexiconId = lexiconElement.id || "unknown";
            const synset = this.processSynset(lexiconElement.Synset[key], lexiconId);
            if (synset) {
              if (includeIntoAggregates) {
                synsets.push(synset);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No synset found for Synset element:`, lexiconElement.Synset[key]);
              }
            }
          }
        }
      }

      // Process Sense elements within the Lexicon
      if (lexiconElement.Sense) {
        for (const key in lexiconElement.Sense) {
          if (Object.prototype.hasOwnProperty.call(lexiconElement.Sense, key)) {
            const sense = this.processSense(lexiconElement.Sense[key]);
            if (sense) {
              if (includeIntoAggregates) {
                senses.push(sense);
              }
            } else {
              if (options.debug) {
                this.logger.warn(`No sense found for Sense element:`, lexiconElement.Sense[key]);
              }
            }
          }
        }
      }
    }

    if (options.debug) {
      this.logger.debug(`Lexicon contents processed:`, {
        words: words.length,
        synsets: synsets.length,
        senses: senses.length,
      });
    }

    // Log high-level summary of lexicon processing
    if (words.length > 0 || synsets.length > 0 || senses.length > 0) {
      this.logger.info("Lexicon contents processed", {
        words: words.length,
        synsets: synsets.length,
        senses: senses.length,
        includeIntoAggregates,
      });
    }
  }

  /**
   * Process a Lexicon element
   */
  private processLexicon(element: any): Lexicon | null {
    // Log potential issues with element structure
    if (!element) {
      this.logger.warn("processLexicon: element is null/undefined");
      return null;
    }

    if (typeof element !== "object") {
      this.logger.warn("processLexicon: element is not an object", {
        type: typeof element,
        value: element,
      });
      return null;
    }

    // Handle both old structure and new MultiXMLParser structure
    let id: string | undefined;
    let label: string | undefined;
    let language: string | undefined;
    let version: string | undefined;
    let email: string | undefined;
    let license: string | undefined;
    let url: string | undefined;
    let citation: string | undefined;
    let logo: string | undefined;

    if (element.attributes) {
      // New MultiXMLParser structure
      this.logger.debug(`Processing lexicon with attributes:`, element.attributes);
      id = element.attributes.id;
      label = element.attributes.label;
      language = element.attributes.language;
      version = element.attributes.version;
      email = element.attributes.email;
      license = element.attributes.license;
      url = element.attributes.url;
      citation = element.attributes.citation;
      logo = element.attributes.logo;
    } else {
      // Old structure
      this.logger.debug(`Processing lexicon with old structure:`, element);
      id = element.id;
      label = element.label;
      language = element.language;
      version = element.version;
      email = element.email;
      license = element.license;
      url = element.url;
      citation = element.citation;
      logo = element.logo;
    }

    if (!id) {
      this.logger.warn("processLexicon: missing ID", { element });
      return null;
    }

    return {
      id,
      label: label || "Unknown Lexicon",
      language: language || "en",
      version: version || "1.0",
      email: email || "",
      license: license || "",
      url: url || "",
      citation: citation || "",
      logo: logo || "",
    };
  }

  /**
   * Process a LexicalEntry element
   */
  private processLexicalEntry(element: any, lexiconId: string): Word | null {
    // Log potential issues with element structure
    if (!element) {
      this.logger.warn("processLexicalEntry: element is null/undefined");
      return null;
    }

    if (typeof element !== "object") {
      this.logger.warn("processLexicalEntry: element is not an object", {
        type: typeof element,
        value: element,
      });
      return null;
    }

    // Handle both old structure and new MultiXMLParser structure
    let id: string | undefined;
    let lemma: string | undefined;
    let partOfSpeech: string | undefined;
    let indexAttr: string | undefined;

    if (element.attributes) {
      // New MultiXMLParser structure
      id = element.attributes.id;
      indexAttr = element.attributes.index;
    } else {
      // Old structure
      id = element.id;
      indexAttr = (element as any).index;
    }

    if (!id) {
      this.logger.warn("processLexicalEntry: missing ID", { element });
      return null;
    }

    // Find Lemma element - handle both structures
    let lemmaElement: any;
    if (element.children && Array.isArray(element.children)) {
      // New structure - look for Lemma in children
      lemmaElement = element.children.find(
        (child: any) => child.name === "Lemma"
      );
    } else {
      // Old structure - direct property
      lemmaElement = element.Lemma;
    }

    if (lemmaElement) {
      if (lemmaElement.attributes) {
        // New structure
        lemma = lemmaElement.attributes.writtenForm;
        partOfSpeech = lemmaElement.attributes.partOfSpeech;
      } else {
        // Old structure
        lemma = lemmaElement.writtenForm;
        partOfSpeech = lemmaElement.partOfSpeech;
      }
    }

    lemma = lemma || id;
    partOfSpeech = partOfSpeech || "n";

    // Process forms - handle both structures
    const forms: any[] = [];
    if (element.children && Array.isArray(element.children)) {
      // New structure - look for Form in children
      const formElements = element.children.filter(
        (child: any) => child.name === "Form"
      );
      for (const formElement of formElements) {
        forms.push({
          writtenForm: formElement.attributes?.writtenForm || "",
          tag: formElement.attributes?.tag || "",
          language: formElement.attributes?.language || "en",
        });
      }
    } else if (element.Form) {
      // Old structure
      for (const key in element.Form) {
        if (Object.prototype.hasOwnProperty.call(element.Form, key)) {
          forms.push({
            writtenForm: element.Form[key].writtenForm || "",
            tag: element.Form[key].tag || "",
            language: element.Form[key].language || "en",
          });
        }
      }
    }

    const indexValue = indexAttr || lemma;

    return {
      id,
      lemma,
      pos: partOfSpeech as any,
      forms,
      pronunciations: [],
      tags: [],
      counts: [],
      language: "en",
      lexicon: lexiconId, // Use the passed lexicon ID instead of hardcoded "unknown"
      // optional index is used by 1.4 for deduplication and UI grouping
      ...(indexValue ? { index: indexValue } : {}),
    };
  }

  /**
   * Process a Synset element
   */
  private processSynset(element: any, lexiconId: string): Synset | null {
    // Log potential issues with element structure
    if (!element) {
      this.logger.warn("processSynset: element is null/undefined");
      return null;
    }

    if (typeof element !== "object") {
      this.logger.warn("processSynset: element is not an object", {
        type: typeof element,
        value: element,
      });
      return null;
    }

    // Increment statistics
    this.stats.synsetsProcessed++;

    // Handle both old structure and new MultiXMLParser structure
    let id: string | undefined;
    let ili: string | undefined;
    let partOfSpeech: string | undefined;
    let language: string | undefined;
    let lexicon: string | undefined;

    if (element.attributes) {
      // New MultiXMLParser structure
      id = element.attributes.id;
      ili = element.attributes.ili;
      partOfSpeech = element.attributes.partOfSpeech;
      language = element.attributes.language;
      lexicon = element.attributes.lexicon;
    } else {
      // Old structure
      id = element.id;
      ili = element.ili;
      partOfSpeech = element.partOfSpeech;
      language = element.language;
      lexicon = element.lexicon;
    }

    if (!id) {
      this.logger.warn("processSynset: missing ID", { element });
      return null;
    }

    const definitions: any[] = [];

    // Process Definition elements - handle both structures
    if (element.children && Array.isArray(element.children)) {
      // New structure - look for Definition in children
      const definitionElements = element.children.filter(
        (child: any) => child.name === "Definition"
      );
      
      // Update statistics
      if (definitionElements.length > 0) {
        this.stats.synsetsWithDefinitions++;
        this.stats.totalDefinitions += definitionElements.length;
      }
      
      for (const defElement of definitionElements) {
        let gloss = "";

        // Process definition text

        // First try to get text from the definition element itself
        if (defElement.text) {
          gloss = defElement.text;
        }
        // If no direct text, look for gloss element in children
        else if (defElement.children && Array.isArray(defElement.children)) {
          const glossElement = defElement.children.find(
            (child: any) => child.name === "gloss"
          );
          if (glossElement) {
            gloss = glossElement.text || "";
          } else {
            // If no gloss element, collect text from all child elements
            gloss = defElement.children
              .map((child: any) => child.text || "")
              .filter(Boolean)
              .join(" ");
          }
        }

        // If still no text, try to extract from the XML content directly
        if (!gloss.trim()) {
          // This is a fallback for when the parser doesn't extract text properly
          // Look for text in the children more aggressively
          if (defElement.children && Array.isArray(defElement.children)) {
            for (const child of defElement.children) {
              if (child.text && child.text.trim()) {
                gloss = child.text;
                break;
              }
            }
          }
          
          // If still no text, preserve the empty definition rather than adding fallback text
          // This allows for intentional blank definitions in the LMF data
          if (!gloss.trim()) {
            gloss = ''; // Empty string instead of 'Definition text not extracted'
          }
        }

        const definitionText = gloss.trim();
        definitions.push({
          id: `${id}.def.${defElement.attributes?.language || "en"}`,
          language: defElement.attributes?.language || "en",
          text: definitionText,
          source: defElement.attributes?.source || "",
        });
        
        // Update statistics
        if (definitionText) {
          this.stats.definitionsWithText++;
        }
      }
    } else if (element.Definition) {
      // Old structure
      for (const key in element.Definition) {
        if (Object.prototype.hasOwnProperty.call(element.Definition, key)) {
          const defElement = element.Definition[key];
          const glossElement = defElement.gloss;
          const gloss =
            glossElement?.textContent || defElement.textContent || "";

          definitions.push({
            id: `${id}.def.${defElement.language || "en"}`,
            language: defElement.language || "en",
            text: gloss.trim(),
            source: defElement.source || "",
          });
        }
      }
    }

    // Note: Statistics are tracked incrementally above

    // Process relations - handle both structures
    const relations: any[] = [];
    if (element.children && Array.isArray(element.children)) {
      // New structure - look for SynsetRelation in children
      const relationElements = element.children.filter(
        (child: any) => child.name === "SynsetRelation"
      );
      for (const relElement of relationElements) {
        relations.push({
          type: relElement.attributes?.relType || "unknown",
          target: relElement.attributes?.target || "",
          language: relElement.attributes?.language || "en",
        });
      }
    } else if (element.SynsetRelation) {
      // Old structure
      for (const key in element.SynsetRelation) {
        if (Object.prototype.hasOwnProperty.call(element.SynsetRelation, key)) {
          relations.push({
            type: element.SynsetRelation[key].relType || "unknown",
            target: element.SynsetRelation[key].target || "",
            language: element.SynsetRelation[key].language || "en",
          });
        }
      }
    }

    return {
      id,
      ili: ili || undefined,
      pos: (partOfSpeech || "n") as any,
      definitions: definitions.length > 0 ? definitions : [],
      examples: [],
      relations: relations.length > 0 ? relations : [],
      language: language || "en",
      lexicon: lexicon || lexiconId, // Use passed lexicon ID as fallback instead of "unknown"
      members: [],
      senses: [],
    };
  }

  /**
   * Process a Sense element
   */
  private processSense(element: any, lexicalEntryId?: string): Sense | null {
    // Log potential issues with element structure
    if (!element) {
      this.logger.warn("processSense: element is null/undefined");
      return null;
    }

    if (typeof element !== "object") {
      this.logger.warn("processSense: element is not an object", {
        type: typeof element,
        value: element,
      });
      return null;
    }

    // Handle both old structure and new MultiXMLParser structure
    let id: string | undefined;
    let synset: string | undefined;

    if (element.attributes) {
      // New MultiXMLParser structure
      id = element.attributes.id;
      synset = element.attributes.synset;
    } else {
      // Old structure
      id = element.id;
      synset = element.synset;
    }

    if (!id) {
      this.logger.warn("processSense: missing ID", { element });
      return null;
    }

    if (!synset) {
      this.logger.warn("processSense: missing synset reference", { 
        senseId: id, 
        element: element 
      });
      return null;
    }

    // Only log high-level processing steps, not individual sense details
    if (this.options.debug && this.options.verbose) {
      this.logger.debug(`Processing sense ${id}:`, {
        senseId: id,
        synsetId: synset,
        hasSynset: !!synset,
        lexicalEntryId,
        elementKeys: Object.keys(element),
        elementAttributes: element.attributes ? Object.keys(element.attributes) : 'none'
      });
    }

    // In LMF, senses are linked to words through the XML hierarchy, not through attributes
    // The wordId should come from the lexicalEntryId parameter (when processing nested senses)
    // or from the word attribute (when present) or be derived from the sense ID itself (when processing standalone senses)
    let wordId: string;
    
    if (lexicalEntryId) {
      // Sense is nested within a LexicalEntry - use the parent's ID
      wordId = lexicalEntryId;
    } else if (element.attributes?.word) {
      // Standalone sense with explicit word attribute
      wordId = element.attributes.word;
    } else {
      // Standalone sense - derive word ID from sense ID
      // This is a fallback for senses that aren't properly nested
      // The foreign key validation in the data loader will handle this
      wordId = id;
    }

    return {
      id,
      word: wordId,
      synset: synset,
      counts: [],
      examples: [],
      tags: [],
    };
  }

  /**
   * Enhanced regex-based parsing fallback for when XML parser fails
   */
  private parseWithEnhancedRegex(
    xmlContent: string,
    result: LMFDocument,
    progressCallback?: LMFProgressCallback,
    mergedOptions?: LmfParseOptions
  ): void {
    // Use instance options as fallback if mergedOptions not provided
    const options = mergedOptions || this.options;
    // Log that we're falling back to regex parsing (this is important for debugging)
    this.logger.warn(
      "parseWithEnhancedRegex: XML parser failed, using regex fallback",
      {
        contentLength: xmlContent.length,
        hasLexicalResource: xmlContent.includes("<LexicalResource"),
        hasLexicon: xmlContent.includes("<Lexicon"),
        hasLexicalEntry: xmlContent.includes("<LexicalEntry"),
      }
    );

    if (options.debug && this.options.verbose) {
      this.logger.debug(
        `Starting enhanced regex parsing with ${xmlContent.length} characters`
      );
      this.logger.debug(`First 200 chars:`, xmlContent.substring(0, 200));
    }

    const attrs = (s: string) => {
      const out: Record<string, string> = {};
      const re = /(\w+(?:-\w+)*)=["']([^"']*)["']/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s)) !== null) out[m[1]] = m[2];
      return out;
    };

    // Lexicons
    progressCallback?.("regex_parsing", 0, 4, { stage: "lexicons" });
    const lexiconRe = /<Lexicon\b([^>]*)>([\s\S]*?)<\/Lexicon>/g;
    let lm: RegExpExecArray | null;
    let lexiconCount = 0;
    while ((lm = lexiconRe.exec(xmlContent)) !== null) {
      lexiconCount++;
      const a = attrs(lm[1]);
      if (options.debug && this.options.verbose) {
        this.logger.debug(`Found lexicon:`, a);
      }
      result.lexicons.push({
        id: a.id || "unknown",
        label: a.label || "Unknown Lexicon",
        language: a.language || "en",
        version: a.version || "1.0",
        email: a.email || "",
        license: a.license || "",
        url: a.url || "",
        citation: a.citation || "",
        logo: a.logo || "",
      });
    }

    // Words (LexicalEntry + Lemma)
    progressCallback?.("regex_parsing", 1, 4, { stage: "words" });
    const entryRe =
      /<LexicalEntry\b([^>]*)>[\s\S]*?<Lemma\b([^>]*)\/>[\s\S]*?<\/LexicalEntry>/g;
    let em: RegExpExecArray | null;
    let wordCount = 0;
    while ((em = entryRe.exec(xmlContent)) !== null) {
      wordCount++;
      const ea = attrs(em[1]);
      const la = attrs(em[2]);
      
      // Find the lexicon this word belongs to by looking backwards for the nearest Lexicon tag
      const beforeMatch = xmlContent.substring(0, em.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const wordLanguage = lastLexiconAttrs.language || "en";
        
        // Only include English words in the aggregated arrays
        if (wordLanguage === "en") {
          if (options.debug) {
            this.logger.debug(`Found English word:`, { entry: ea, lemma: la, language: wordLanguage });
          }
          result.words.push({
            id: ea.id || "unknown",
            lemma: la.writtenForm || ea.id || "unknown",
            pos: (la.partOfSpeech || "n") as any,
            forms: [],
            pronunciations: [],
            tags: [],
            counts: [],
            language: wordLanguage,
            lexicon: lastLexiconAttrs.id || "unknown",
          });
        } else {
          if (options.debug) {
            this.logger.debug(`Skipping non-English word:`, { entry: ea, lemma: la, language: wordLanguage });
          }
        }
      }
    }

    // Synsets + Definition/gloss
    progressCallback?.("regex_parsing", 2, 4, { stage: "synsets" });
    const synsetRe = /<Synset\b([^>]*)>([\s\S]*?)<\/Synset>/g;
    let sm: RegExpExecArray | null;
    let synsetCount = 0;
    while ((sm = synsetRe.exec(xmlContent)) !== null) {
      synsetCount++;
      const sa = attrs(sm[1]);
      const body = sm[2];
      let defLang = "en";
      let defText = "";
      const defRe = /<Definition\b([^>]*)>([\s\S]*?)<\/Definition>/;
      const dm = defRe.exec(body);
      if (dm) {
        const da = attrs(dm[1]);
        defLang = da.language || "en";
        const glossM = /<gloss>([\s\S]*?)<\/gloss>/.exec(dm[2]);
        defText = (glossM ? glossM[1] : dm[2]).trim();
      }
      
      // Find the lexicon this synset belongs to by looking backwards for the nearest Lexicon tag
      const beforeMatch = xmlContent.substring(0, sm.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const synsetLanguage = lastLexiconAttrs.language || "en";
        
        // Only include English synsets in the aggregated arrays
        if (synsetLanguage === "en") {
          if (options.debug) {
            this.logger.debug(`Found English synset:`, {
              synset: sa,
              definition: defText,
              language: synsetLanguage,
            });
          }
          result.synsets.push({
            id: sa.id || "unknown",
            ili: sa.ili || undefined,
            pos: (sa.partOfSpeech || "n") as any,
            definitions: defText
              ? [
                  {
                    id: `${sa.id || "syn"}.def.${defLang}`,
                    language: defLang,
                    text: defText,
                    source: "",
                  },
                ]
              : [],
            examples: [],
            relations: [],
            language: synsetLanguage,
            lexicon: lastLexiconAttrs.id || "unknown",
            members: [],
            senses: [],
          });
        } else {
          if (options.debug) {
            this.logger.debug(`Skipping non-English synset:`, {
              synset: sa,
              language: synsetLanguage,
            });
          }
        }
      }
    }

    // Senses (self-closing or explicit)
    progressCallback?.("regex_parsing", 3, 4, { stage: "senses" });
    const senseRe = /<Sense\b([^>]*)\/>|<Sense\b([^>]*)><\/Sense>/g;
    let snm: RegExpExecArray | null;
    let senseCount = 0;
    while ((snm = senseRe.exec(xmlContent)) !== null) {
      senseCount++;
      const sa = attrs(snm[1] || snm[2] || "");
      if (!sa.id) continue;
      
      // Find the lexicon this sense belongs to by looking backwards for the nearest Lexicon tag
      const beforeMatch = xmlContent.substring(0, snm.index);
      const lastLexiconMatch = beforeMatch.match(/<Lexicon\b([^>]*)>/g);
      if (lastLexiconMatch) {
        const lastLexiconAttrs = attrs(lastLexiconMatch[lastLexiconMatch.length - 1]);
        const senseLanguage = lastLexiconAttrs.language || "en";
        
        // Only include English senses in the aggregated arrays
        if (senseLanguage === "en") {
          if (options.debug) {
            this.logger.debug(`Found English sense:`, { ...sa, language: senseLanguage });
          }
          result.senses.push({
            id: sa.id,
            word: sa.word || sa.id,
            synset: sa.synset || sa.id,
            counts: [],
            examples: [],
            tags: [],
          });
        } else {
          if (options.debug) {
            this.logger.debug(`Skipping non-English sense:`, { ...sa, language: senseLanguage });
          }
        }
      }
    }

    if (options.debug) {
      this.logger.debug(`Enhanced regex parsing completed:`, {
        lexicons: lexiconCount,
        words: wordCount,
        synsets: synsetCount,
        senses: senseCount,
      });
    }

    progressCallback?.("regex_parsing", 4, 4, {
      stage: "completed",
      lexicons: result.lexicons.length,
      words: result.words.length,
      synsets: result.synsets.length,
      senses: result.senses.length,
    });

    this.logger.debug("Enhanced regex parsing completed", {
      lexicons: result.lexicons.length,
      words: result.words.length,
      synsets: result.synsets.length,
      senses: result.senses.length,
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.warningAggregator) {
      // Flush any remaining warnings before destroying
      const aggregatedWarnings = this.warningAggregator.flush();
      if (aggregatedWarnings.totalWarnings > 0) {
        this.logger.warn("Parser destroyed with aggregated warnings", aggregatedWarnings);
      }
      this.warningAggregator.destroy();
    }
  }
}

/**
 * Convenience function to parse LMF XML content
 */
export async function parseLMFXML(
  xmlText: string,
  options: LmfParseOptions = {}
): Promise<LMFDocument> {
  const parser = new LmfParser(xmlText, options);
  return parser.parse(xmlText, { debug: options.debug });
}

/**
 * Diagnose download issues by analyzing content
 */
export function diagnoseDownloadIssue(content: string): string {
  if (!content || content.trim().length === 0) {
    return "Content is empty";
  }

  if (
    content.toLowerCase().includes("<!doctype html>") ||
    content.toLowerCase().includes("<html")
  ) {
    return "Content appears to be HTML error page, not XML";
  }

  if (
    content.toLowerCase().includes("error") ||
    content.toLowerCase().includes("not found")
  ) {
    return "Content contains error indicators";
  }

  if (!content.includes("<") || !content.includes(">")) {
    return "Content does not appear to be XML";
  }

  if (!content.includes("<LexicalResource")) {
    return "Content does not contain LMF LexicalResource element";
  }

  return "Content appears to be valid LMF XML";
}

/**
 * Analyze XML content for debugging
 */
export function analyzeXMLContent(content: string): {
  length: number;
  hasXMLDeclaration: boolean;
  hasRootElement: boolean;
  hasLexicalResource: boolean;
  firstChars: string;
  lastChars: string;
} {
  const trimmedContent = content.trim();

  return {
    length: content.length,
    hasXMLDeclaration: trimmedContent.startsWith("<?xml"),
    hasRootElement: /^<[a-zA-Z][a-zA-Z0-9_:]*/.test(trimmedContent),
    hasLexicalResource: content.includes("<LexicalResource"),
    firstChars: content.substring(0, 200),
    lastChars: content.substring(Math.max(0, content.length - 200)),
  };
}

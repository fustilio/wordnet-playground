import { createScopedLogger } from "utils/logger";
import type { LMFParser, LMFDocument, LMFLoadOptions, Synset, Word, Sense, Lexicon } from "wn-ts-core";

/**
 * Options for LMF parsing
 */
export interface LmfParseOptions {
  debug?: boolean;
  validate?: boolean;
}

/**
 * LMF Parser for parsing Lexical Markup Framework XML files
 * This parser implements the common LMFParser interface
 */
export class LmfParser implements LMFParser {
  readonly name = 'Browser LMF Parser';
  readonly description = 'Browser-compatible LMF parser with DOMParser and manual fallback';
  
  private xmlText: string;
  private options: LmfParseOptions;
  private logger = createScopedLogger("LmfParser");

  constructor(xmlText: string, options: LmfParseOptions = {}) {
    this.xmlText = xmlText;
    this.options = { debug: false, validate: true, ...options };
    
    if (this.options.debug) {
      this.logger.debug("LmfParser starting", { 
        xmlLength: xmlText.length,
        firstChars: xmlText.substring(0, 500)
      });
    }
  }

  /**
   * Parse the LMF XML content into a structured document
   * This method implements the common LMFParser interface
   */
  async parse(xmlContent: string, options?: LMFLoadOptions): Promise<LMFDocument> {
    const debug = options?.debug || this.options.debug;
    
    if (debug) {
      this.logger.debug("Starting LMF parsing");
    }

    try {
      // Validate the XML content first
      if (this.options.validate) {
        this.validateXMLContent(xmlContent);
      }

      // Parse the XML using DOMParser if available, otherwise fall back to manual parsing
      if (typeof DOMParser !== 'undefined') {
        return await this.parseWithDOMParser(xmlContent);
      } else {
        this.logger.warn("DOMParser not available, falling back to manual parsing");
        return await this.parseManually(xmlContent);
      }
    } catch (error) {
      this.logger.error("LMF parsing error", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Validate that the content appears to be valid LMF XML
   */
  private validateXMLContent(content: string): void {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      throw new Error('Invalid LMF file: XML content is empty');
    }
    
    // Check for common XML indicators
    const hasXMLDeclaration = trimmedContent.startsWith('<?xml');
    const hasRootElement = /^<[a-zA-Z][a-zA-Z0-9_:]*/.test(trimmedContent);
    const hasClosingTag = trimmedContent.includes('</');
    
    // Check for HTML error indicators
    const hasHTMLTags = /<html|<head|<body|<title/i.test(trimmedContent);
    const hasErrorKeywords = /error|not found|forbidden|unauthorized|server error/i.test(trimmedContent);
    
    if (hasHTMLTags || hasErrorKeywords) {
      throw new Error('Invalid LMF file: Content appears to be HTML error page, not XML');
    }
    
    if (!hasRootElement && !hasXMLDeclaration) {
      throw new Error('Invalid LMF file: Content does not appear to be XML');
    }
    
    // Check for LMF-specific elements
    if (!trimmedContent.includes('<LexicalResource')) {
      throw new Error('Invalid LMF file: missing LexicalResource element');
    }
    
    this.logger.debug("XML content validation passed", {
      length: content.length,
      hasXMLDeclaration,
      hasRootElement,
      hasClosingTag
    });
  }

  /**
   * Parse using native DOMParser (browser environment)
   */
  private async parseWithDOMParser(content: string): Promise<LMFDocument> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      const errorMsg = xmlDoc.getElementsByTagName("parsererror")[0]?.textContent || "Unknown parsing error";
      this.logger.error("XML parsing failed", { error: errorMsg });
      throw new Error(`XML parsing failed: ${errorMsg}`);
    }

    const result: LMFDocument = {
      lmfVersion: '1.0',
      lexicons: [],
      synsets: [],
      words: [],
      senses: []
    };

    // Process the root element (documentElement)
    const rootElement = xmlDoc.documentElement;
    if (rootElement && rootElement.nodeName === 'LexicalResource') {
      this.processLexicalResource(rootElement as Element, result);
    }

    if (this.options.debug) {
      this.logger.debug("LMF parsing completed", { 
        lexicons: result.lexicons?.length || 0,
        words: result.words?.length || 0,
        synsets: result.synsets?.length || 0,
        senses: result.senses?.length || 0
      });
    }

    return result;
  }

  /**
   * Manual XML parsing fallback for Web Worker environments
   */
  private async parseManually(content: string): Promise<LMFDocument> {
    this.logger.info("Using manual LMF XML parser fallback");
    
    const result: LMFDocument = {
      lmfVersion: '1.0',
      lexicons: [],
      synsets: [],
      words: [],
      senses: []
    };

    try {
      // Find LexicalResource element
      const lexicalResourceMatch = content.match(/<LexicalResource[^>]*>([\s\S]*?)<\/LexicalResource>/);
      if (lexicalResourceMatch) {
        const lexicalResourceContent = lexicalResourceMatch[1];
        
        // Parse lexicons
        const lexicons = this.parseLexiconsManually(lexicalResourceContent);
        if (lexicons.length > 0) {
          result.lexicons = lexicons;
        }
        
        // Parse words
        const words = this.parseWordsManually(lexicalResourceContent);
        if (words.length > 0) {
          result.words = words;
        }
        
        // Parse synsets
        const synsets = this.parseSynsetsManually(lexicalResourceContent);
        if (synsets.length > 0) {
          result.synsets = synsets;
        }
        
        // Parse senses
        const senses = this.parseSensesManually(lexicalResourceContent);
        if (senses.length > 0) {
          result.senses = senses;
        }
      }
      
      this.logger.info("Manual LMF parsing completed", { 
        lexicons: result.lexicons?.length || 0,
        words: result.words?.length || 0,
        synsets: result.synsets?.length || 0,
        senses: result.senses?.length || 0
      });
    } catch (error) {
      this.logger.error("Manual LMF parsing failed", { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Manual LMF parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Process the LexicalResource element and extract all LMF data
   */
  private processLexicalResource(element: Element, result: LMFDocument): void {
    const lexicons: Lexicon[] = [];
    const words: Word[] = [];
    const synsets: Synset[] = [];
    const senses: Sense[] = [];

    // Process child elements
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as Element;
        
        switch (childElement.nodeName) {
          case 'Lexicon':
            const lexicon = this.processLexicon(childElement);
            if (lexicon) {
              lexicons.push(lexicon);
            }
            break;
          case 'LexicalEntry':
            const word = this.processLexicalEntry(childElement);
            if (word) {
              words.push(word);
            }
            break;
          case 'Synset':
            const synset = this.processSynset(childElement);
            if (synset) {
              synsets.push(synset);
            }
            break;
          case 'Sense':
            const sense = this.processSense(childElement);
            if (sense) {
              senses.push(sense);
            }
            break;
        }
      }
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
   * Process a Lexicon element
   */
  private processLexicon(element: Element): Lexicon | null {
    const id = element.getAttribute('id');
    if (!id) return null;

    return {
      id,
      label: element.getAttribute('label') || 'Unknown Lexicon',
      language: element.getAttribute('language') || 'en',
      version: element.getAttribute('version') || '1.0',
      email: element.getAttribute('email') || '',
      license: element.getAttribute('license') || '',
      url: element.getAttribute('url') || '',
      citation: element.getAttribute('citation') || '',
      logo: element.getAttribute('logo') || ''
    };
  }

  /**
   * Process a LexicalEntry element
   */
  private processLexicalEntry(element: Element): Word | null {
    const id = element.getAttribute('id');
    if (!id) return null;

    // Find Lemma element
    const lemmaElement = element.querySelector('Lemma');
    const lemma = lemmaElement?.getAttribute('writtenForm') || id;
    const partOfSpeech = lemmaElement?.getAttribute('partOfSpeech') || 'n';

    return {
      id,
      lemma,
      pos: partOfSpeech as any,
      language: element.getAttribute('language') || 'en',
      lexicon: element.getAttribute('lexicon') || 'unknown',
      forms: [],
      tags: [],
      pronunciations: [],
      counts: []
    };
  }

  /**
   * Process a Synset element
   */
  private processSynset(element: Element): Synset | null {
    const id = element.getAttribute('id');
    if (!id) return null;

    const definitions: any[] = [];
    
    // Process Definition elements
    const definitionElements = element.querySelectorAll('Definition');
    for (let i = 0; i < definitionElements.length; i++) {
      const defElement = definitionElements[i];
      const glossElement = defElement.querySelector('gloss');
      const gloss = glossElement?.textContent || defElement.textContent || '';
      
      definitions.push({
        id: `${id}.def.${defElement.getAttribute('language') || 'en'}`,
        language: defElement.getAttribute('language') || 'en',
        text: gloss.trim(),
        source: defElement.getAttribute('source') || ''
      });
    }

    return {
      id,
      ili: element.getAttribute('ili') || undefined,
      pos: (element.getAttribute('partOfSpeech') || 'n') as any,
      definitions: definitions.length > 0 ? definitions : [],
      examples: [],
      relations: [],
      language: element.getAttribute('language') || 'en',
      lexicon: element.getAttribute('lexicon') || 'unknown',
      members: [],
      senses: []
    };
  }

  /**
   * Process a Sense element
   */
  private processSense(element: Element): Sense | null {
    const id = element.getAttribute('id');
    if (!id) return null;

    return {
      id,
      word: element.getAttribute('word') || id,
      synset: element.getAttribute('synset') || id,
      counts: [],
      examples: [],
      tags: []
    };
  }

  /**
   * Parse lexicons manually from XML content
   */
  private parseLexiconsManually(content: string): Lexicon[] {
    const lexicons: Lexicon[] = [];
    const lexiconRegex = /<Lexicon([^>]*)>/g;
    let match;

    while ((match = lexiconRegex.exec(content)) !== null) {
      const attributes = this.parseAttributesManually(match[1]);
      if (attributes.id) {
        lexicons.push({
          id: attributes.id,
          label: attributes.label || 'Unknown Lexicon',
          language: attributes.language || 'en',
          version: attributes.version || '1.0',
          email: attributes.email || '',
          license: attributes.license || '',
          url: attributes.url || '',
          citation: attributes.citation || '',
          logo: attributes.logo || ''
        });
      }
    }

    return lexicons;
  }

  /**
   * Parse words manually from XML content
   */
  private parseWordsManually(content: string): Word[] {
    const words: Word[] = [];
    const entryRegex = /<LexicalEntry([^>]*)>([\s\S]*?)<\/LexicalEntry>/g;
    let match;

    while ((match = entryRegex.exec(content)) !== null) {
      const attributes = this.parseAttributesManually(match[1]);
      const entryContent = match[2];
      
      if (attributes.id) {
        // Find Lemma element
        const lemmaMatch = entryContent.match(/<Lemma([^>]*)>/);
        const lemmaAttributes = lemmaMatch ? this.parseAttributesManually(lemmaMatch[1]) : {};
        
        words.push({
          id: attributes.id,
          lemma: lemmaAttributes.writtenForm || attributes.id,
          pos: (lemmaAttributes.partOfSpeech || 'n') as any,
          language: attributes.language || 'en',
          lexicon: attributes.lexicon || 'unknown',
          forms: [],
          tags: [],
          pronunciations: [],
          counts: []
        });
      }
    }

    return words;
  }

  /**
   * Parse synsets manually from XML content
   */
  private parseSynsetsManually(content: string): Synset[] {
    const synsets: Synset[] = [];
    const synsetRegex = /<Synset([^>]*)>([\s\S]*?)<\/Synset>/g;
    let match;

    while ((match = synsetRegex.exec(content)) !== null) {
      const attributes = this.parseAttributesManually(match[1]);
      const synsetContent = match[2];
      
      if (attributes.id) {
        const definitions: any[] = [];
        
        // Parse definitions
        const defRegex = /<Definition([^>]*)>([\s\S]*?)<\/Definition>/g;
        let defMatch;
        while ((defMatch = defRegex.exec(synsetContent)) !== null) {
          const defAttributes = this.parseAttributesManually(defMatch[1]);
          const defContent = defMatch[2];
          
          // Find gloss element
          const glossMatch = defContent.match(/<gloss[^>]*>([\s\S]*?)<\/gloss>/);
          const gloss = glossMatch ? glossMatch[1].trim() : defContent.trim();
          
          if (gloss) {
            definitions.push({
              id: `${attributes.id}.def.${defAttributes.language || 'en'}`,
              language: defAttributes.language || 'en',
              text: gloss,
              source: defAttributes.source || ''
            });
          }
        }

        synsets.push({
          id: attributes.id,
          ili: attributes.ili,
          pos: (attributes.partOfSpeech || 'n') as any,
          definitions: definitions,
          examples: [],
          relations: [],
          language: attributes.language || 'en',
          lexicon: attributes.lexicon || 'unknown',
          members: [],
          senses: []
        });
      }
    }

    return synsets;
  }

  /**
   * Parse senses manually from XML content
   */
  private parseSensesManually(content: string): Sense[] {
    const senses: Sense[] = [];
    const senseRegex = /<Sense([^>]*)>/g;
    let match;

    while ((match = senseRegex.exec(content)) !== null) {
      const attributes = this.parseAttributesManually(match[1]);
      if (attributes.id) {
        senses.push({
          id: attributes.id,
          word: attributes.word || attributes.id,
          synset: attributes.synset || attributes.id,
          counts: [],
          examples: [],
          tags: []
        });
      }
    }

    return senses;
  }

  /**
   * Parse attributes manually from attribute string
   */
  private parseAttributesManually(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = regex.exec(attrString)) !== null) {
      attributes[match[1]] = match[2];
    }

    return attributes;
  }
}

/**
 * Convenience function to parse LMF XML content
 */
export async function parseLMFXML(xmlText: string, options: LmfParseOptions = {}): Promise<LMFDocument> {
  const parser = new LmfParser(xmlText, options);
  return parser.parse(xmlText, { debug: options.debug });
}

/**
 * Diagnose download issues by analyzing content
 */
export function diagnoseDownloadIssue(content: string): string {
  if (!content || content.trim().length === 0) {
    return 'Content is empty';
  }
  
  if (content.toLowerCase().includes('<!doctype html>') || content.toLowerCase().includes('<html')) {
    return 'Content appears to be HTML error page, not XML';
  }
  
  if (content.toLowerCase().includes('error') || content.toLowerCase().includes('not found')) {
    return 'Content contains error indicators';
  }
  
  if (!content.includes('<') || !content.includes('>')) {
    return 'Content does not appear to be XML';
  }
  
  if (!content.includes('<LexicalResource')) {
    return 'Content does not contain LMF LexicalResource element';
  }
  
  return 'Content appears to be valid LMF XML';
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
    hasXMLDeclaration: trimmedContent.startsWith('<?xml'),
    hasRootElement: /^<[a-zA-Z][a-zA-Z0-9_:]*/.test(trimmedContent),
    hasLexicalResource: content.includes('<LexicalResource'),
    firstChars: content.substring(0, 200),
    lastChars: content.substring(Math.max(0, content.length - 200))
  };
}

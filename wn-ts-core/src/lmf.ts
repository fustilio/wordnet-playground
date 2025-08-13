/**
 * LMF (Lexical Markup Framework) loader and parser.
 * 
 * This module provides functionality to load and parse LMF XML files
 * into TypeScript data structures.
 * 
 * For different parser implementations, see the parsers module.
 */

/**
 * LMF (Lexical Markup Framework) parser.
 * 
 * This module provides functionality to parse LMF XML content
 * into TypeScript data structures.
 * 
 * The Node.js-specific file loading and streaming parser functionality
 * has been moved to 'wn-ts-node/src/lmf.ts'.
 */

import { XMLParser } from 'fast-xml-parser';
import type { Synset, Word, Sense, Lexicon } from './types.js';

export interface LMFDocument {
  lmfVersion: string;
  lexicons: Lexicon[];
  synsets: Synset[];
  words: Word[];
  senses: Sense[];
}

export interface LMFLoadOptions {
  progress?: (progress: number) => void;
  debug?: boolean; // Add debug flag to control logging
}

// Supported LMF versions
const SUPPORTED_VERSIONS = new Set(['1.0', '1.1', '1.2', '1.3', '1.4']);

/**
 * Validate LMF XML content and provide helpful error messages
 */
function validateLMFContent(xmlContent: string, debug: boolean = false): void {
  if (typeof xmlContent !== 'string') {
    throw new Error('Invalid LMF file: XML content is not a valid string');
  }
  
  if (xmlContent.trim().length === 0) {
    throw new Error('Invalid LMF file: XML content is empty');
  }
  
  const trimmedContent = xmlContent.trim();
  
  // Check for common error patterns first
  if (trimmedContent.toLowerCase().includes('<!doctype html>') || 
      trimmedContent.toLowerCase().includes('<html') ||
      (trimmedContent.toLowerCase().includes('error') && trimmedContent.toLowerCase().includes('not found'))) {
    throw new Error('Invalid LMF file: Content appears to be HTML error page, not XML');
  }
  
  // Check for HTTP error responses
  if (trimmedContent.toLowerCase().includes('http') && 
      (trimmedContent.toLowerCase().includes('404') || 
       trimmedContent.toLowerCase().includes('500') ||
       trimmedContent.toLowerCase().includes('403'))) {
    throw new Error('Invalid LMF file: Server returned HTTP error page');
  }
  
  // Check if content starts with XML declaration or root element
  if (!trimmedContent.startsWith('<?xml') && !trimmedContent.startsWith('<')) {
    throw new Error('Invalid LMF file: Content does not appear to be XML');
  }
  
  if (debug) {
    console.log(`[DEBUG] XML content validation passed`);
    console.log(`[DEBUG] First 200 characters:`, trimmedContent.substring(0, 200));
  }
}

/**
 * Helper function to diagnose common download issues
 */
export function diagnoseDownloadIssue(xmlContent: string): string {
  if (typeof xmlContent !== 'string') {
    return 'Download failed: No content received';
  }
  
  const trimmed = xmlContent.trim();
  
  if (trimmed.length === 0) {
    return 'Download failed: Empty content received';
  }
  
  if (trimmed.toLowerCase().includes('<!doctype html>')) {
    return 'Download failed: Received HTML page instead of XML (possible 404 or server error)';
  }
  
  if (trimmed.toLowerCase().includes('error') && trimmed.toLowerCase().includes('not found')) {
    return 'Download failed: File not found (404 error)';
  }
  
  if (trimmed.toLowerCase().includes('access denied') || trimmed.toLowerCase().includes('forbidden')) {
    return 'Download failed: Access denied (403 error)';
  }
  
  if (trimmed.toLowerCase().includes('internal server error')) {
    return 'Download failed: Server error (500)';
  }
  
  if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<')) {
    return 'Download failed: Content is not valid XML';
  }
  
  if (!trimmed.includes('<LexicalResource')) {
    return 'Download failed: XML does not contain LexicalResource element (not a valid LMF file)';
  }
  
  return 'Download appears successful, but parsing failed';
}

/**
 * Analyze XML content and provide a summary of found elements
 */
export function analyzeXMLContent(xmlContent: string): {
  isXML: boolean;
  hasXMLDeclaration: boolean;
  rootElements: string[];
  hasLexicalResource: boolean;
  hasLexicon: boolean;
  hasLexicalEntry: boolean;
  hasSynset: boolean;
  contentLength: number;
  firstChars: string;
  lastChars: string;
} {
  const trimmed = xmlContent.trim();
  
  return {
    isXML: trimmed.startsWith('<?xml') || trimmed.startsWith('<'),
    hasXMLDeclaration: trimmed.startsWith('<?xml'),
    rootElements: Array.from(trimmed.match(/<(\w+)/g) || []).map(match => match.slice(1)),
    hasLexicalResource: trimmed.includes('<LexicalResource'),
    hasLexicon: trimmed.includes('<Lexicon'),
    hasLexicalEntry: trimmed.includes('<LexicalEntry'),
    hasSynset: trimmed.includes('<Synset'),
    contentLength: trimmed.length,
    firstChars: trimmed.substring(0, 200),
    lastChars: trimmed.substring(Math.max(0, trimmed.length - 200))
  };
}

/**
 * Parse LMF XML content into TypeScript data structures.
 * (Legacy method - kept for compatibility)
 * 
 * @param xmlContent - XML content as string
 * @param options - Parsing options
 * @returns Parsed LMF document
 */
export function parseLMFXML(
  xmlContent: string, 
  options: LMFLoadOptions = {}
): LMFDocument {
  const { debug = false } = options;
  
  if (debug) console.log(`[DEBUG] parseLMFXML() starting with ${xmlContent.length.toLocaleString()} characters`);
  
  // Validate XML content before parsing
  validateLMFContent(xmlContent, debug);
  
  // Configure XML parser for LMF format
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false, // Don't parse attribute values to preserve version strings
    parseTagValue: false,
    trimValues: true,
    // Add options to handle large files better
    processEntities: true, // Enable entity processing for &amp; etc.
    allowBooleanAttributes: true,
    // stopNodes: ['LexicalEntry', 'Synset'] // Stop processing at these nodes to reduce memory
  });

  if (debug) console.log(`[DEBUG] Parsing XML with fast-xml-parser...`);
  const parseStartTime = Date.now();
  const parsed = parser.parse(xmlContent);
  const parseTime = Date.now() - parseStartTime;
  if (debug) console.log(`[DEBUG] XML parser completed in ${parseTime}ms`);
  
  // Debug: Show the structure of the parsed XML
  if (debug) {
    console.log(`[DEBUG] Parsed XML structure:`, Object.keys(parsed));
    console.log(`[DEBUG] First 1000 characters of XML content:`, xmlContent.substring(0, 1000));
    if (parsed.LexicalResource) {
      console.log(`[DEBUG] LexicalResource found with keys:`, Object.keys(parsed.LexicalResource));
    }
  }
  
  const lexicalResource = parsed.LexicalResource;

  if (!lexicalResource) {
    // Provide more detailed error information
    const errorDetails = {
      parsedKeys: Object.keys(parsed),
      xmlLength: xmlContent.length,
      firstChars: xmlContent.substring(0, 200),
      lastChars: xmlContent.substring(Math.max(0, xmlContent.length - 200))
    };
    
    console.error(`[ERROR] LMF parsing failed. Details:`, errorDetails);
    
    // Check if this might be a different file format
    if (parsed.html || parsed.HTML || parsed.Html) {
      throw new Error('Invalid LMF file: File appears to be HTML content, not LMF XML');
    }
    
    if (parsed.error || parsed.Error) {
      throw new Error(`Invalid LMF file: Server returned error: ${JSON.stringify(parsed.error || parsed.Error)}`);
    }
    
    // Check if the file might be empty or corrupted
    if (xmlContent.trim().length === 0) {
      throw new Error('Invalid LMF file: File is empty or contains only whitespace');
    }
    
    // Check if this might be a different XML format
    if (parsed.rdf || parsed.RDF) {
      throw new Error('Invalid LMF file: File appears to be RDF/XML format, not LMF XML');
    }
    
    throw new Error(`Invalid LMF file: missing LexicalResource element. File contains: ${Object.keys(parsed).join(', ')}`);
  }

  // Extract LMF version
  const lmfVersion = lexicalResource['@_lmfVersion'] || '1.0';
  if (debug) console.log(`[DEBUG] LMF version: ${lmfVersion}`);
  
  if (!SUPPORTED_VERSIONS.has(lmfVersion)) {
    throw new Error(`Unsupported LMF version: ${lmfVersion}`);
  }

  const lexicons: Lexicon[] = [];
  const synsets: Synset[] = [];
  const words: Word[] = [];
  const senses: Sense[] = [];

  // Parse lexicons
  const lexiconElements = Array.isArray(lexicalResource.Lexicon) 
    ? lexicalResource.Lexicon 
    : [lexicalResource.Lexicon];

  if (debug) console.log(`[DEBUG] Processing ${lexiconElements.length} lexicon(s)...`);
  
  for (let i = 0; i < lexiconElements.length; i++) {
    const lexiconElem = lexiconElements[i];
    if (!lexiconElem) continue;

    if (debug) console.log(`[DEBUG] Processing lexicon ${i + 1}/${lexiconElements.length}: ${lexiconElem['@_id'] || 'unknown'}`);

    const lexicon: Lexicon = {
      id: lexiconElem['@_id'] || 'unknown',
      label: lexiconElem['@_label'] || 'Unknown Lexicon',
      language: lexiconElem['@_language'] || 'en',
      version: lexiconElem['@_version'] || '1.0',
      email: lexiconElem['@_email'] || '',
      license: lexiconElem['@_license'] || '',
      url: lexiconElem['@_url'] || '',
      citation: lexiconElem['@_citation'] || '',
      logo: lexiconElem['@_logo'] || '',
    };

    lexicons.push(lexicon);

    // Parse lexical entries (words)
    const entries = Array.isArray(lexiconElem.LexicalEntry) 
      ? lexiconElem.LexicalEntry 
      : [lexiconElem.LexicalEntry];

    if (debug) console.log(`[DEBUG] Processing ${entries.length} lexical entries for lexicon ${lexicon.id}...`);

    for (let j = 0; j < entries.length; j++) {
      const entry = entries[j];
      if (!entry) continue;

      if (debug && j % 1000 === 0) {
        console.log(`[DEBUG] Processing entry ${j + 1}/${entries.length} for lexicon ${lexicon.id}`);
      }

      const word: Word = {
        id: entry['@_id'] || 'unknown-word',
        lemma: entry.Lemma?.['@_writtenForm'] || entry['@_id'] || 'unknown',
        pos: (entry.Lemma?.['@_partOfSpeech'] || 'n') as any,
        language: lexicon.language,
        lexicon: lexicon.id,
        forms: [],
        tags: [],
        pronunciations: [],
        counts: [],
      };

      // Parse forms
      if (entry.Form) {
        const forms = Array.isArray(entry.Form) ? entry.Form : [entry.Form];
        for (const form of forms) {
          if (!form) continue;
          word.forms.push({
            id: form['@_id'] || '',
            writtenForm: form['@_writtenForm'] || '',
            script: form['@_script'] || '',
            tag: form['@_tag'] || '',
          });
        }
      }

      words.push(word);

      // Parse senses
      if (entry.Sense) {
        const senseElements = Array.isArray(entry.Sense) ? entry.Sense : [entry.Sense];
        for (const senseElem of senseElements) {
          if (!senseElem) continue;

          const sense: Sense = {
            id: senseElem['@_id'] || 'unknown-sense',
            word: word.id,
            synset: senseElem['@_synset'] || 'unknown-synset',
            counts: [],
            examples: [],
            tags: [],
          };

          senses.push(sense);
        }
      }
    }

    if (debug) console.log(`[DEBUG] Completed processing ${words.length} words and ${senses.length} senses for lexicon ${lexicon.id}`);

    // Parse synsets
    if (lexiconElem.Synset) {
      const synsetElements = Array.isArray(lexiconElem.Synset) 
        ? lexiconElem.Synset 
        : [lexiconElem.Synset];

      if (debug) console.log(`[DEBUG] Processing ${synsetElements.length} synsets for lexicon ${lexicon.id}...`);

      for (let k = 0; k < synsetElements.length; k++) {
        const synsetElem = synsetElements[k];
        if (!synsetElem) continue;

        if (debug && k % 1000 === 0) {
          console.log(`[DEBUG] Processing synset ${k + 1}/${synsetElements.length} for lexicon ${lexicon.id}`);
        }

        const synset: Synset = {
          id: synsetElem['@_id'] || 'unknown-synset',
          pos: (synsetElem['@_partOfSpeech'] || 'n') as any,
          definitions: [],
          examples: [],
          relations: [],
          language: lexicon.language,
          lexicon: lexicon.id,
          members: [],
          senses: [],
        };

        // Parse definitions
        if (synsetElem.Definition) {
          const definitions = Array.isArray(synsetElem.Definition) 
            ? synsetElem.Definition 
            : [synsetElem.Definition];

          for (const def of definitions) {
            if (!def) continue;
            
            // Extract text content from definition, handling both direct text and gloss elements
            let text = '';
            if (def['#text']) {
              text = def['#text'];
            } else if (def.gloss) {
              // Handle gloss element which may contain text or nested elements
              if (Array.isArray(def.gloss)) {
                text = def.gloss.map((g: any) => g['#text'] || '').join(' ');
              } else if (def.gloss['#text']) {
                text = def.gloss['#text'];
              } else if (typeof def.gloss === 'string') {
                text = def.gloss;
              }
            }
            
            synset.definitions.push({
              id: def['@_id'] || '',
              language: def['@_language'] || lexicon.language,
              text: text.trim(),
              source: def['@_source'] || '',
            });
          }
        }

        // Parse relations
        if (synsetElem.SynsetRelation) {
          const relations = Array.isArray(synsetElem.SynsetRelation) 
            ? synsetElem.SynsetRelation 
            : [synsetElem.SynsetRelation];

          for (const rel of relations) {
            if (!rel) continue;
            synset.relations.push({
              id: rel['@_id'] || '',
              type: rel['@_relType'] || 'unknown',
              target: rel['@_target'] || '',
              source: rel['@_source'] || '',
            });
          }
        }

        // Find senses that belong to this synset
        const synsetSenses = senses.filter(s => s.synset === synset.id);
        synset.senses = synsetSenses.map(s => s.id);
        synset.members = synsetSenses.map(s => s.word);

        synsets.push(synset);
      }
    }
  }

  if (debug) console.log(`[DEBUG] parseLMFXML() completed. Final counts: ${lexicons.length} lexicons, ${words.length} words, ${synsets.length} synsets, ${senses.length} senses`);

  if (options.progress) {
    options.progress(1.0);
  }

  return {
    lmfVersion,
    lexicons,
    synsets,
    words,
    senses,
  };
}

/**
 * Create a minimal LMF document for testing.
 * 
 * @returns Minimal LMF document
 */
export function createMinimalLMF(): LMFDocument {
  return {
    lmfVersion: '1.0',
    lexicons: [
      {
        id: 'test-en',
        label: 'Test English Lexicon',
        language: 'en',
        version: '1.0',
        email: '',
        license: '',
        url: '',
        citation: '',
        logo: '',
      }
    ],
    synsets: [
      {
        id: 'test-en-0001-n',
        pos: 'n',
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      }
    ],
    words: [
      {
        id: 'test-en-example-n',
        lemma: 'example',
        pos: 'n',
        language: 'en',
        lexicon: 'test-en',
        forms: [],
        tags: [],
        pronunciations: [],
        counts: [],
      }
    ],
    senses: [
      {
        id: 'test-en-example-n-0001-01',
        word: 'test-en-example-n',
        synset: 'test-en-0001-n',
        counts: [],
        examples: [],
        tags: [],
      }
    ],
  };
} 

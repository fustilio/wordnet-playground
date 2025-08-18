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
 * Common LMF Parser Interface
 * This interface should be implemented by all LMF parsers across packages
 */
export interface LMFParser {
  readonly name: string;
  readonly description: string;
  
  /**
   * Parse LMF XML content into structured data
   * @param xmlContent - XML content as string
   * @param options - Parsing options
   * @returns Parsed LMF document
   */
  parse(xmlContent: string, options?: LMFLoadOptions): Promise<LMFDocument>;
}

/**
 * Validate LMF XML content and provide helpful error messages
 * This is shared validation logic that all parsers should use
 */
export function validateLMFContent(xmlContent: string, debug: boolean = false): void {
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
 * This is shared diagnostic logic that all parsers should use
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
 * This is shared analysis logic that all parsers should use
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

/**
 * Legacy parseLMFXML function - kept for backward compatibility
 * This should be deprecated in favor of using the new parser interface
 * 
 * @deprecated Use a specific parser implementation instead
 */
export function parseLMFXML(
  xmlContent: string, 
  options: LMFLoadOptions = {}
): LMFDocument {
  const { debug = false } = options;
  
  if (debug) console.log(`[DEBUG] parseLMFXML() starting with ${xmlContent.length.toLocaleString()} characters`);
  
  // Validate XML content before parsing
  validateLMFContent(xmlContent, debug);
  
  // This is a placeholder - in practice, you should use a specific parser
  throw new Error('parseLMFXML is deprecated. Use a specific parser implementation instead.');
} 

/**
 * Parser registry for easy access to all LMF parser implementations
 */

import type { LMFParser, ParserFactory } from './base.js';
import { createNativeXMLParser, createStringCountingParser } from './native-xml.js';
import { createOptimizedSaxParser } from './optimized-sax.js';
import { createStreamingSaxParser, createFullStreamingParser } from './streaming-sax.js';
import { createInMemorySaxParser } from './in-memory-sax.js';
import { createLegacyParser } from './legacy.js';
import { createPythonParser } from './python.js';

export interface ParserInfo {
  name: string;
  description: string;
  factory: ParserFactory;
  category: 'counting' | 'streaming' | 'memory' | 'legacy' | 'external';
  recommended: boolean;
}

/**
 * Registry of all available LMF parsers
 */
export const PARSER_REGISTRY: Record<string, ParserInfo> = {
  'native-xml': {
    name: 'Native XML Parser (regex)',
    description: 'Ultra-fast regex-based XML element counting',
    factory: createNativeXMLParser,
    category: 'counting',
    recommended: false,
  },
  'string-counting': {
    name: 'String Counting Parser',
    description: 'Ultra-fast string-based element counting',
    factory: createStringCountingParser,
    category: 'counting',
    recommended: false,
  },
  'optimized-sax': {
    name: 'Optimized SAX Parser',
    description: 'SAX parser with minimal processing for maximum speed',
    factory: createOptimizedSaxParser,
    category: 'memory',
    recommended: false,
  },
  'streaming-sax': {
    name: 'Optimized Streaming Parser (sax, stream)',
    description: 'Streaming SAX parser for memory-efficient parsing of large files',
    factory: createStreamingSaxParser,
    category: 'streaming',
    recommended: true,
  },
  'full-streaming': {
    name: 'Full Streaming Parser',
    description: 'Complete LMF streaming parser with full data extraction',
    factory: createFullStreamingParser,
    category: 'streaming',
    recommended: true,
  },
  'in-memory-sax': {
    name: 'In-memory Parser (sax, string)',
    description: 'SAX parser that loads entire file into memory before parsing',
    factory: createInMemorySaxParser,
    category: 'memory',
    recommended: false,
  },
  'legacy': {
    name: 'Legacy Parser',
    description: 'Original parser using fast-xml-parser library',
    factory: createLegacyParser,
    category: 'legacy',
    recommended: false,
  },
  'python': {
    name: 'Python Parser',
    description: 'Parser using Python via pythonia library',
    factory: createPythonParser,
    category: 'external',
    recommended: false,
  },
};

/**
 * Get a parser by name
 */
export function getParser(name: string): LMFParser {
  const info = PARSER_REGISTRY[name];
  if (!info) {
    throw new Error(`Unknown parser: ${name}. Available parsers: ${Object.keys(PARSER_REGISTRY).join(', ')}`);
  }
  return info.factory();
}

/**
 * Get all available parser names
 */
export function getParserNames(): string[] {
  return Object.keys(PARSER_REGISTRY);
}

/**
 * Get all parser information
 */
export function getAllParserInfo(): ParserInfo[] {
  return Object.values(PARSER_REGISTRY);
}

/**
 * Get recommended parsers
 */
export function getRecommendedParsers(): ParserInfo[] {
  return Object.values(PARSER_REGISTRY).filter(info => info.recommended);
}

/**
 * Get parsers by category
 */
export function getParsersByCategory(category: ParserInfo['category']): ParserInfo[] {
  return Object.values(PARSER_REGISTRY).filter(info => info.category === category);
}

/**
 * Get the default parser (recommended for production use)
 */
export function getDefaultParser(): LMFParser {
  return createFullStreamingParser();
} 
/**
 * Shared LMF parsing functionality
 * This module provides common parsing logic that can be used across all packages
 */

import type { Synset, Word, Sense } from '../types.js';

/**
 * LMF Document structure
 */
export interface LMFDocument {
  lmfVersion: string;
  lexicons: Lexicon[];
  synsets: Synset[];
  words: Word[];
  senses: Sense[];
}

/**
 * LMF Load Options
 */
export interface LMFLoadOptions {
  progress?: (progress: number) => void;
  debug?: boolean;
  strictForeignKeys?: boolean;
  duplicateHandling?: DuplicateHandlingConfig;
}

/**
 * Lexicon interface
 */
export interface Lexicon {
  id: string;
  label: string;
  language: string;
  email?: string | undefined;
  license?: string | undefined;
  version?: string | undefined;
  url?: string | undefined;
  citation?: string | undefined;
  logo?: string | undefined;
  requires?: string[] | undefined;
  confidence?: number | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Common LMF parsing error types
 */
export class LMFParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LMFParseError';
  }
}

/**
 * Duplicate handling strategies
 */
export type DuplicateStrategy = 'keep-first' | 'keep-last' | 'merge' | 'skip' | 'error';

/**
 * Duplicate handling configuration
 */
export interface DuplicateHandlingConfig {
  strategy: DuplicateStrategy;
  mergeFields?: {
    definitions?: boolean;
    examples?: boolean;
    relations?: boolean;
    forms?: boolean;
    pronunciations?: boolean;
    tags?: boolean;
    counts?: boolean;
  };
  uniqueKeys?: {
    words?: ('id' | 'lemma' | 'index' | 'pos')[];
    synsets?: ('id' | 'ili')[];
    senses?: ('id' | 'wordId-synsetId')[];
  };
  logDuplicates?: boolean;
  trackStatistics?: boolean;
}

/**
 * Duplicate handling statistics
 */
export interface DuplicateStats {
  wordsDeduplicated: number;
  synsetsDeduplicated: number;
  sensesDeduplicated: number;
  totalDuplicates: number;
}

/**
 * Shared duplicate handler for LMF parsing
 */
export class DuplicateHandler {
  private statistics: DuplicateStats = {
    wordsDeduplicated: 0,
    synsetsDeduplicated: 0,
    sensesDeduplicated: 0,
    totalDuplicates: 0,
  };

  constructor(private config: DuplicateHandlingConfig) {}

  /**
   * Handle duplicates according to the configured strategy
   */
  handleDuplicates<T extends Word | Synset | Sense>(
    items: T[],
    type: 'words' | 'synsets' | 'senses'
  ): T[] {
    if (this.config.strategy === 'skip') {
      return items;
    }

    const uniqueKeys = this.config.uniqueKeys?.[type];
    if (!uniqueKeys || uniqueKeys.length === 0) {
      return items;
    }

    const seen = new Map<string, T>();
    const duplicates: T[] = [];

    for (const item of items) {
      const key = this.generateUniqueKey(item, uniqueKeys, type);
      
      if (seen.has(key)) {
        duplicates.push(item);
        this.statistics.totalDuplicates++;
        
        if (this.config.logDuplicates) {
          console.debug(`Duplicate ${type} found:`, { key, itemId: (item as any).id });
        }

        const existing = seen.get(key)!;
        
        switch (this.config.strategy) {
          case 'keep-first':
            // Keep existing, skip current
            break;
          case 'keep-last':
            // Replace existing with current
            seen.set(key, item);
            break;
          case 'merge':
            // Merge current into existing
            const merged = this.mergeItems(existing, item, type);
            seen.set(key, merged);
            break;
          case 'error':
            throw new LMFParseError(
              `Duplicate ${type} found with key: ${key}`,
              'DUPLICATE_FOUND',
              { key, itemId: (item as any).id, type }
            );
          default:
            // Default to keep-first
            break;
        }
      } else {
        seen.set(key, item);
      }
    }

    // Update statistics
    switch (type) {
      case 'words':
        this.statistics.wordsDeduplicated = duplicates.length;
        break;
      case 'synsets':
        this.statistics.synsetsDeduplicated = duplicates.length;
        break;
      case 'senses':
        this.statistics.sensesDeduplicated = duplicates.length;
        break;
    }

    return Array.from(seen.values());
  }

  /**
   * Generate a unique key for an item based on the specified unique key fields
   */
  private generateUniqueKey<T extends Word | Synset | Sense>(
    item: T,
    uniqueKeys: string[],
    type: string
  ): string {
    const keyParts: string[] = [];
    
    for (const key of uniqueKeys) {
      switch (key) {
        case 'id':
          keyParts.push((item as any).id || '');
          break;
        case 'lemma':
          if (type === 'words') {
            keyParts.push((item as Word).lemma || '');
          }
          break;
        case 'index':
          if (type === 'words') {
            keyParts.push((item as any).index || '');
          }
          break;
        case 'pos':
          if (type === 'words') {
            keyParts.push((item as Word).pos || '');
          }
          break;
        case 'ili':
          if (type === 'synsets') {
            keyParts.push((item as Synset).ili || '');
          }
          break;
        case 'wordId-synsetId':
          if (type === 'senses') {
            const sense = item as Sense;
            keyParts.push(sense.wordId || '');
            keyParts.push(sense.synsetId || '');
          }
          break;
      }
    }
    
    return keyParts.filter(Boolean).join('::');
  }

  /**
   * Merge two items according to the merge strategy
   */
  private mergeItems<T extends Word | Synset | Sense>(
    existing: T,
    current: T,
    type: string
  ): T {
    if (this.config.strategy !== 'merge') {
      return existing;
    }

    const merged = { ...existing };
    const mergeFields = this.config.mergeFields;

    if (type === 'words' && mergeFields?.forms) {
      const existingWord = existing as Word;
      const currentWord = current as Word;
      if ('forms' in existingWord && 'forms' in currentWord) {
        (merged as Word).forms = [...existingWord.forms, ...currentWord.forms];
      }
    }

    if (type === 'synsets') {
      const existingSynset = existing as Synset;
      const currentSynset = current as Synset;
      
      if (mergeFields?.definitions && 'definitions' in existingSynset && 'definitions' in currentSynset) {
        (merged as Synset).definitions = [...existingSynset.definitions, ...currentSynset.definitions];
      }
      if (mergeFields?.examples && 'examples' in existingSynset && 'examples' in currentSynset) {
        (merged as Synset).examples = [...existingSynset.examples, ...currentSynset.examples];
      }
      if (mergeFields?.relations && 'relations' in existingSynset && 'relations' in currentSynset) {
        (merged as Synset).relations = [...existingSynset.relations, ...currentSynset.relations];
      }
    }

    if (type === 'senses') {
      const existingSense = existing as Sense;
      const currentSense = current as Sense;
      
      if (mergeFields?.examples && 'examples' in existingSense && 'examples' in currentSense) {
        (merged as Sense).examples = [...existingSense.examples, ...currentSense.examples];
      }
      if (mergeFields?.tags && 'tags' in existingSense && 'tags' in currentSense) {
        (merged as Sense).tags = [...existingSense.tags, ...currentSense.tags];
      }
      if (mergeFields?.counts && 'counts' in existingSense && 'counts' in currentSense) {
        (merged as Sense).counts = [...existingSense.counts, ...currentSense.counts];
      }
    }

    return merged;
  }

  /**
   * Get duplicate handling statistics
   */
  getStatistics(): DuplicateStats {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      wordsDeduplicated: 0,
      synsetsDeduplicated: 0,
      sensesDeduplicated: 0,
      totalDuplicates: 0,
    };
  }
}

/**
 * Enhanced XML content validation with detailed error reporting
 */
export function validateLMFContentEnhanced(xmlContent: string, debug: boolean = false): void {
  if (typeof xmlContent !== 'string') {
    throw new LMFParseError(
      'XML content is not a valid string',
      'INVALID_CONTENT_TYPE',
      { contentType: typeof xmlContent }
    );
  }
  
  if (xmlContent.trim().length === 0) {
    throw new LMFParseError(
      'XML content is empty',
      'EMPTY_CONTENT',
      { contentLength: xmlContent.length }
    );
  }
  
  const trimmedContent = xmlContent.trim();
  
  // Check for common error patterns first
  if (trimmedContent.toLowerCase().includes('<!doctype html>') || 
      trimmedContent.toLowerCase().includes('<html') ||
      (trimmedContent.toLowerCase().includes('error') && trimmedContent.toLowerCase().includes('not found'))) {
    throw new LMFParseError(
      'Content appears to be HTML error page, not XML',
      'HTML_ERROR_PAGE',
      { 
        hasDoctype: trimmedContent.toLowerCase().includes('<!doctype html>'),
        hasHtml: trimmedContent.toLowerCase().includes('<html'),
        hasError: trimmedContent.toLowerCase().includes('error')
      }
    );
  }
  
  // Check for HTTP error responses
  if (trimmedContent.toLowerCase().includes('http') && 
      (trimmedContent.toLowerCase().includes('404') || 
       trimmedContent.toLowerCase().includes('500') ||
       trimmedContent.toLowerCase().includes('403'))) {
    throw new LMFParseError(
      'Server returned HTTP error page',
      'HTTP_ERROR_RESPONSE',
      { 
        has404: trimmedContent.toLowerCase().includes('404'),
        has500: trimmedContent.toLowerCase().includes('500'),
        has403: trimmedContent.toLowerCase().includes('403')
      }
    );
  }
  
  // Check if content starts with XML declaration or root element
  if (!trimmedContent.startsWith('<?xml') && !trimmedContent.startsWith('<')) {
    throw new LMFParseError(
      'Content does not appear to be XML',
      'NOT_XML',
      { 
        startsWithXml: trimmedContent.startsWith('<?xml'),
        startsWithTag: trimmedContent.startsWith('<'),
        firstChars: trimmedContent.substring(0, 50)
      }
    );
  }
  
  // Check for LMF-specific elements
  if (!trimmedContent.includes('<LexicalResource')) {
    throw new LMFParseError(
      'Missing LexicalResource element - not a valid LMF file',
      'MISSING_LEXICAL_RESOURCE',
      { 
        hasLexicalResource: trimmedContent.includes('<LexicalResource'),
        firstChars: trimmedContent.substring(0, 200)
      }
    );
  }

  // Check for malformed XML (basic check)
  const openTags = (trimmedContent.match(/</g) || []).length;
  const closeTags = (trimmedContent.match(/>/g) || []).length;
  if (openTags !== closeTags) {
    throw new LMFParseError(
      'Malformed XML - mismatched tags',
      'MALFORMED_XML',
      { 
        openTags,
        closeTags,
        difference: Math.abs(openTags - closeTags)
      }
    );
  }
  
  if (debug) {
    console.log(`[DEBUG] Enhanced XML content validation passed`);
    console.log(`[DEBUG] Content length: ${xmlContent.length}`);
    console.log(`[DEBUG] First 200 characters:`, trimmedContent.substring(0, 200));
  }
}

/**
 * Default duplicate handling configuration
 */
export const DEFAULT_DUPLICATE_HANDLING: DuplicateHandlingConfig = {
  strategy: 'keep-first',
  mergeFields: {
    definitions: true,
    examples: true,
    relations: true,
    forms: true,
    pronunciations: true,
    tags: true,
    counts: true,
  },
  uniqueKeys: {
    words: ['id'],
    synsets: ['id'],
    senses: ['id'],
  },
  logDuplicates: false,
  trackStatistics: true,
};

/**
 * Apply duplicate handling to an LMF document
 */
export function applyDuplicateHandling(
  document: LMFDocument,
  config: DuplicateHandlingConfig = DEFAULT_DUPLICATE_HANDLING
): LMFDocument {
  const handler = new DuplicateHandler(config);
  
  return {
    ...document,
    words: handler.handleDuplicates(document.words, 'words'),
    synsets: handler.handleDuplicates(document.synsets, 'synsets'),
    senses: handler.handleDuplicates(document.senses, 'senses'),
  };
}

/**
 * Base interface for LMF parsers
 */

import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

export interface LMFParser {
  /**
   * Parse LMF XML content into structured data
   * 
   * Note: Different parser implementations may work with different input types:
   * - File-based parsers: expect file paths and handle streaming/buffering
   * - Content-based parsers: expect XML content strings for in-memory processing
   * 
   * @param input - Either a file path (string) or XML content (string)
   * @param options - Parsing options including duplicate handling configuration
   * @returns Parsed LMF document
   */
  parse(input: string, options?: LMFLoadOptions): Promise<LMFDocument>;
  
  /**
   * Get the name of this parser implementation
   */
  readonly name: string;
  
  /**
   * Get a description of this parser implementation
   */
  readonly description: string;
}

/**
 * Parser factory function type
 */
export type ParserFactory = () => LMFParser; 
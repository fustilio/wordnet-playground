/**
 * Base interface for LMF parsers
 */

import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

export interface LMFParser {
  /**
   * Parse an LMF XML file
   * @param filePath - Path to the LMF XML file
   * @param options - Parsing options
   * @returns Parsed LMF document
   */
  parse(filePath: string, options?: LMFLoadOptions): Promise<LMFDocument>;
  
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
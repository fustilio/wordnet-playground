/**
 * Native XML parser using regex-based counting for maximum speed
 * 
 * This parser is optimized for scenarios where you only need to count elements
 * or perform very basic XML operations. It's the fastest but least feature-rich.
 */

import { readFile } from 'fs/promises';
import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

export class NativeXMLParser implements LMFParser {
  readonly name = 'Native XML Parser (regex)';
  readonly description = 'Ultra-fast regex-based XML element counting';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    const xmlContent = await readFile(filePath, 'utf8');
    
    // Use regex-based counting for maximum speed
    const elementCount = (xmlContent.match(/<[^/][^>]*>/g) || []).length;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Found ${elementCount} elements`);
    
    // Return a minimal document structure for compatibility
    // This parser is mainly for benchmarking element counting speed
    return {
      lmfVersion: '1.0',
      lexicons: [],
      synsets: [],
      words: [],
      senses: [],
    };
  }
}

/**
 * String-based counting parser (even faster than regex)
 */
export class StringCountingParser implements LMFParser {
  readonly name = 'String Counting Parser';
  readonly description = 'Ultra-fast string-based element counting';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    const xmlContent = await readFile(filePath, 'utf8');
    
    // Use string split for even faster counting
    let count = 0;
    let pos = 0;
    while ((pos = xmlContent.indexOf('<', pos)) !== -1) {
      if (xmlContent[pos + 1] !== '/') {
        count++;
      }
      pos++;
    }
    
    if (debug) console.log(`[DEBUG] ${this.name}: Found ${count} elements`);
    
    return {
      lmfVersion: '1.0',
      lexicons: [],
      synsets: [],
      words: [],
      senses: [],
    };
  }
}

// Factory functions
export const createNativeXMLParser = (): LMFParser => new NativeXMLParser();
export const createStringCountingParser = (): LMFParser => new StringCountingParser(); 
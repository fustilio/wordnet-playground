/**
 * Legacy parser using fast-xml-parser
 * 
 * This parser uses the fast-xml-parser library for parsing LMF XML files.
 * It's a simpler implementation but may be slower than SAX parsers.
 */

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
const browserReadFile = async (_path: string, _encoding?: string) => {
  throw new Error('File system operations not available in browser environment');
};

// Use browser stubs by default, will be overridden in Node.js
let readFile = browserReadFile;

// Initialize Node.js functions if available
if (isNode) {
  try {
    const fsPromises = require('fs/promises');
    readFile = fsPromises.readFile;
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { parseLMFXML } from '../lmf.js';

export class LegacyParser implements LMFParser {
  readonly name = 'Legacy Parser';
  readonly description = 'Original parser using fast-xml-parser library';

  async parse(input: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false, duplicateHandling } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    // This parser expects a file path, not XML content
    const filePath = input;
    const content = await readFile(filePath, 'utf8');
    
    // Note: This parser doesn't implement duplicate handling as it's designed for benchmarking
    // For production use with duplicate handling, use the web or node parsers
    if (duplicateHandling && debug) {
      console.log(`[DEBUG] ${this.name}: Duplicate handling options ignored (parser not designed for production use)`);
    }
    
    const result = parseLMFXML(content, options);
    
    if (debug) {
      const totalElements = result.words.length + result.synsets.length + 
                           result.lexicons.length + result.senses.length;
      console.log(`[DEBUG] ${this.name}: Parsed ${totalElements} total elements`);
    }
    
    return result;
  }
}

// Factory function
export const createLegacyParser = (): LMFParser => new LegacyParser(); 

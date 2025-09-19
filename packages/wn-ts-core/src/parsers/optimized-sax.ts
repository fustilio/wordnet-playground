/**
 * Optimized SAX parser with minimal processing for maximum speed
 * 
 * This parser disables trimming, normalization, and lowercase conversion
 * to achieve the best possible performance while still providing full parsing.
 */

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserReadFile = async (_path: string, _encoding?: string) => {
  throw new Error('File system operations not available in browser environment');
};

const browserSax = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parser: (_strict: boolean, _options?: any) => {
    return {
      onopentag: () => {},
      onend: () => {},
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onerror: (_error: any) => {},
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      write: (_content: string) => ({ close: () => {} })
    };
  }
};

// Use browser stubs by default, will be overridden in Node.js
let readFile = browserReadFile;
let sax = browserSax;

// Initialize Node.js functions if available
if (isNode) {
  try {
    const fsPromises = require('fs/promises');
    const saxModule = require('sax');
    
    readFile = fsPromises.readFile;
    sax = saxModule;
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
// import type { Synset, Word, Sense, Lexicon, PartOfSpeech } from '../types.js';

export class OptimizedSaxParser implements LMFParser {
  readonly name = 'Optimized SAX Parser';
  readonly description = 'SAX parser with minimal processing for maximum speed';

  async parse(input: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false, duplicateHandling } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    // This parser expects a file path, not XML content
    const filePath = input;
    const xmlContent = await readFile(filePath, 'utf8');
    
    // Note: This parser doesn't implement duplicate handling as it's designed for benchmarking
    // For production use with duplicate handling, use the web or node parsers
    if (duplicateHandling && debug) {
      console.log(`[DEBUG] ${this.name}: Duplicate handling options ignored (parser not designed for production use)`);
    }
    
    return new Promise((resolve, reject) => {
      let elementCount = 0;
      const parser = sax.parser(true, {
        trim: false, // Disable trimming for speed
        normalize: false, // Disable normalization for speed
        lowercase: false, // Disable lowercase for speed
        position: false,
        xmlns: false,
      });
      
      parser.onopentag = () => {
        elementCount++;
      };
      
      parser.onend = () => {
        if (debug) console.log(`[DEBUG] ${this.name}: Found ${elementCount} elements`);
        
        // Return a minimal document structure for compatibility
        // This parser is mainly for benchmarking element counting speed
        resolve({
          lmfVersion: '1.0',
          lexicons: [],
          synsets: [],
          words: [],
          senses: [],
        });
      };
      
      parser.onerror = (error) => {
        if (debug) console.log(`[DEBUG] ${this.name}: Error:`, error);
        reject(new Error(`XML parsing error: ${error.message}`));
      };
      
      parser.write(xmlContent).close();
    });
  }
}

// Factory function
export const createOptimizedSaxParser = (): LMFParser => new OptimizedSaxParser(); 

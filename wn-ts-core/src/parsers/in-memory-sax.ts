/**
 * In-memory SAX parser that loads the entire file into memory
 * 
 * This parser loads the complete XML file into memory before parsing.
 * It's faster than streaming for small files but uses more memory.
 */

import { readFile } from 'fs/promises';
import sax from 'sax';
import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

export class InMemorySaxParser implements LMFParser {
  readonly name = 'In-memory Parser (sax, string)';
  readonly description = 'SAX parser that loads entire file into memory before parsing';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    const xmlContent = await readFile(filePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      let elementCount = 0;
      const parser = sax.parser(true, {
        trim: true,
        normalize: true,
        lowercase: true,
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
export const createInMemorySaxParser = (): LMFParser => new InMemorySaxParser(); 
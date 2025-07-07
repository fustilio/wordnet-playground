/**
 * Legacy parser using the original parseLMFXML function
 * 
 * This parser uses the fast-xml-parser library and loads the entire file
 * into memory. It's the original implementation but may be slower for large files.
 */

import { readFile } from 'fs/promises';
import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { parseLMFXML } from '../lmf.js';

export class LegacyParser implements LMFParser {
  readonly name = 'Legacy Parser';
  readonly description = 'Original parser using fast-xml-parser library';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    const content = await readFile(filePath, 'utf8');
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
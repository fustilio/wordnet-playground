/**
 * Legacy parser using fast-xml-parser
 * 
 * This parser uses the fast-xml-parser library for parsing LMF XML files.
 * It's a simpler implementation but may be slower than SAX parsers.
 */

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { parseLMFXML } from '../lmf.js';
import { parseOptions, logDebug, warnDuplicateHandling, measurePerformance, readFileSafely } from './shared-parser-utils.js';

export class LegacyParser implements LMFParser {
  readonly name = 'Legacy Parser';
  readonly description = 'Original parser using fast-xml-parser library';

  async parse(input: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug, duplicateHandling } = parseOptions(options);
    
    logDebug(this.name, 'Starting parse', debug);
    
    // This parser expects a file path, not XML content
    const filePath = input;
    
    // Note: This parser doesn't implement duplicate handling as it's designed for benchmarking
    // For production use with duplicate handling, use the web or node parsers
    if (duplicateHandling) {
      warnDuplicateHandling(this.name, debug);
    }
    
    return measurePerformance(async () => {
      try {
        const content = await readFileSafely(filePath, this.name, debug);
        const result = parseLMFXML(content, options);
        
        if (debug) {
          const totalElements = result.words.length + result.synsets.length + 
                               result.lexicons.length + result.senses.length;
          logDebug(this.name, `Parsed ${totalElements} total elements`, debug);
        }
        
        return result;
      } catch (error) {
        throw new Error(`Legacy parsing failed: ${error}`);
      }
    }, this.name, debug).then(({ result }) => result);
  }
}

// Factory function
export const createLegacyParser = (): LMFParser => new LegacyParser(); 

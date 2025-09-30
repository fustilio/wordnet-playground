/**
 * Native XML parser using fast-xml-parser
 * 
 * This parser uses the fast-xml-parser library for parsing LMF XML files.
 * It's a simpler implementation but may be slower than SAX parsers.
 */

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { 
  readFileSafely, 
  parseOptions, 
  logDebug, 
  warnDuplicateHandling,
  measurePerformance,
  // createParserResult,
  // getMemoryUsage
} from './shared-parser-utils.js';

export class NativeXMLParser implements LMFParser {
  readonly name = 'Native XML Parser (regex)';
  readonly description = 'Ultra-fast regex-based XML element counting';

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
      const xmlContent = await readFileSafely(filePath, this.name, debug);
      
      // Use regex-based counting for maximum speed
      const elementCount = (xmlContent.match(/<[^/][^>]*>/g) || []).length;
      
      logDebug(this.name, `Found ${elementCount} elements`, debug);
      
      // Return a minimal document structure for compatibility
      // This parser is mainly for benchmarking element counting speed
      return {
        lmfVersion: '1.0',
        lexicons: [],
        synsets: [],
        words: [],
        senses: [],
        definitions: [],
        examples: [],
        relations: [],
        ilis: []
      };
    }, this.name, debug).then(({ result }) => result);
  }
}

/**
 * String-based counting parser (even faster than regex)
 */
export class StringCountingParser implements LMFParser {
  readonly name = 'String Counting Parser';
  readonly description = 'Ultra-fast string-based element counting';

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
      const xmlContent = await readFileSafely(filePath, this.name, debug);
      
      // Use string split for even faster counting
      let count = 0;
      let pos = 0;
      while ((pos = xmlContent.indexOf('<', pos)) !== -1) {
        if (xmlContent[pos + 1] !== '/') {
          count++;
        }
        pos++;
      }
      
      logDebug(this.name, `Found ${count} elements`, debug);
      
      return {
        lmfVersion: '1.0',
        lexicons: [],
        words: [],
        synsets: [],
        senses: [],
        definitions: [],
        examples: [],
        relations: [],
        ilis: []
      };
    }, this.name, debug).then(({ result }) => result);
  }
}

// Factory functions
export const createNativeXMLParser = (): LMFParser => new NativeXMLParser();
export const createStringCountingParser = (): LMFParser => new StringCountingParser(); 

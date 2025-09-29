/**
 * In-memory SAX parser that loads the entire file into memory
 * 
 * This parser loads the entire XML file into memory before parsing.
 * It's useful for smaller files or when you need to parse the same file multiple times.
 */

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { 
  readFileSafely, 
  parseOptions, 
  logDebug, 
  warnDuplicateHandling,
  measurePerformance,
  createSaxParser,
  setupSaxHandlers,
  createParserResult,
  getMemoryUsage,
  type SaxEventHandlers
} from './shared-parser-utils.js';

export class InMemorySaxParser implements LMFParser {
  readonly name = 'In-memory Parser (sax, string)';
  readonly description = 'SAX parser that loads entire file into memory before parsing';

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
      
      return new Promise<LMFDocument>((resolve, reject) => {
        let elementCount = 0;
        
        const handlers: SaxEventHandlers = {
          onOpenTag: () => {
            elementCount++;
          },
          onEnd: () => {
            logDebug(this.name, `Found ${elementCount} elements`, debug);
            
            // Return a minimal document structure for compatibility
            // This parser is mainly for benchmarking element counting speed
            resolve({
              lmfVersion: '1.0',
              lexicons: [],
              synsets: [],
              words: [],
              senses: [],
              definitions: [],
              examples: [],
              relations: [],
              ilis: []
            });
          },
          onError: (error) => {
            logDebug(this.name, `Error: ${error.message}`, debug);
            reject(new Error(`XML parsing error: ${error.message}`));
          }
        };
        
        createSaxParser(this.name, {
          strict: true,
          trim: true,
          normalize: true,
          lowercase: true,
        }, debug).then(parser => {
          setupSaxHandlers(parser, handlers, this.name, debug);
          parser.write(xmlContent).close();
        }).catch(reject);
      });
    }, this.name, debug).then(({ result }) => result);
  }
}

// Factory function
export const createInMemorySaxParser = (): LMFParser => new InMemorySaxParser(); 

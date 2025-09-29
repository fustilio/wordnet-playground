/**
 * Python parser using pythonia to call Python code
 * 
 * This parser uses the pythonia library to call Python code for parsing.
 * It's useful for comparing performance with Python implementations.
 */

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';
import { parseOptions, logDebug, warnDuplicateHandling, measurePerformance } from './shared-parser-utils.js';

// Type import for pythonia
import type { python as PythoniaPython } from 'pythonia';

let pythonParser: any = null;

async function getOrSetupPythonParser() {
  if (pythonParser) {
    return pythonParser;
  }
  
  try {
    const { python } = await import('pythonia') as { python: typeof PythoniaPython };
    pythonParser = await python('./lmf.py');
    return pythonParser;
  } catch (error) {
    throw new Error(`Failed to initialize Python parser: ${error}`);
  }
}

export class PythonParser implements LMFParser {
  readonly name = 'Python Parser';
  readonly description = 'Parser using Python via pythonia library';

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
        const pythonParser = await getOrSetupPythonParser();
        await pythonParser.load(filePath);
        
        logDebug(this.name, 'Python parser completed', debug);
        
        // Convert Python result to TypeScript format if needed
        // For now, return a minimal structure for benchmarking
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
      } catch (error) {
        logDebug(this.name, `Error: ${error}`, debug);
        throw new Error(`Python parser error: ${error}`);
      }
    }, this.name, debug).then(({ result }) => result);
  }
}

// Factory function
export const createPythonParser = (): LMFParser => new PythonParser(); 
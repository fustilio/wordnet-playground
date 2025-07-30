/**
 * Python parser using pythonia to call Python code
 * 
 * This parser uses the pythonia library to call Python code for parsing.
 * It's useful for comparing performance with Python implementations.
 */

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

let pythonParser: any = null;

async function getOrSetupPythonParser() {
  if (pythonParser) {
    return pythonParser;
  }
  
  try {
    const { python } = await import('pythonia');
    pythonParser = await python('./lmf.py');
    return pythonParser;
  } catch (error) {
    throw new Error(`Failed to initialize Python parser: ${error}`);
  }
}

export class PythonParser implements LMFParser {
  readonly name = 'Python Parser';
  readonly description = 'Parser using Python via pythonia library';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    const { debug = false } = options;
    
    if (debug) console.log(`[DEBUG] ${this.name}: Starting parse`);
    
    try {
      const pythonParser = await getOrSetupPythonParser();
      await pythonParser.load(filePath);
      
      if (debug) console.log(`[DEBUG] ${this.name}: Python parser completed`);
      
      // Convert Python result to TypeScript format if needed
      // For now, return a minimal structure for benchmarking
      return {
        lmfVersion: '1.0',
        lexicons: [],
        synsets: [],
        words: [],
        senses: [],
      };
    } catch (error) {
      if (debug) console.log(`[DEBUG] ${this.name}: Error:`, error);
      throw new Error(`Python parser error: ${error}`);
    }
  }
}

// Factory function
export const createPythonParser = (): LMFParser => new PythonParser(); 
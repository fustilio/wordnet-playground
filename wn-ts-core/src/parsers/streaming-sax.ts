// This file is a stub for browser environments.
// The Node.js implementation is in 'wn-ts-node/src/parsers/streaming-sax.ts'.

import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

const notAvailable = () => {
  throw new Error('This parser is not available in the browser environment.');
};

export class StreamingSaxParser implements LMFParser {
  readonly name = 'Optimized Streaming Parser (sax, stream)';
  readonly description = 'Streaming SAX parser for memory-efficient parsing of large files';

  async parse(_filePath: string, _options: LMFLoadOptions = {}): Promise<LMFDocument> {
    return notAvailable();
  }
}

/**
 * Full streaming parser that actually parses LMF content
 * This is the production-ready version
 */
export class FullStreamingParser implements LMFParser {
  readonly name = 'Full Streaming Parser';
  readonly description = 'Complete LMF streaming parser with full data extraction';

  async parse(_filePath: string, _options: LMFLoadOptions = {}): Promise<LMFDocument> {
    return notAvailable();
  }
}

// Factory functions
export const createStreamingSaxParser = (): LMFParser => new StreamingSaxParser();
export const createFullStreamingParser = (): LMFParser => new FullStreamingParser();

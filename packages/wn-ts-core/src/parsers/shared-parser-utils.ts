/**
 * Shared utilities for XML parsers
 * 
 * Provides common functionality to reduce duplication across different parser implementations.
 */

import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

// Browser environment detection
export const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
export const browserReadFile = async (_path: string, _encoding?: string): Promise<string> => {
  throw new Error('File system operations not available in browser environment');
};

// Simple SAX parser stub interface for browser
interface SaxParserStub {
  onopentag: () => void;
  onend: () => void;
  onerror: (_error: Error) => void;
  write: (_content: string) => { close: () => void };
}

export const browserSax = {
  parser: (_strict: boolean, _options?: Record<string, unknown>): SaxParserStub => {
    return {
      onopentag: () => {},
      onend: () => {},
      onerror: (_error: Error) => {},
      write: (_content: string) => ({ close: () => {} })
    };
  }
};

// Lazy-loaded Node.js modules
let _readFile: typeof browserReadFile | null = null;
let _sax: typeof browserSax | null = null;

/**
 * Get the readFile function (Node.js or browser stub)
 */
export async function getReadFile(): Promise<typeof browserReadFile> {
  if (_readFile) {
    return _readFile;
  }

  if (isNode) {
    try {
      const fsPromises = await import('fs/promises');
      // Wrap Node.js readFile to match browser stub signature
      _readFile = async (path: string, encoding?: string): Promise<string> => {
        const result = await fsPromises.readFile(path, { encoding: (encoding || 'utf-8') as BufferEncoding });
        return result as string;
      };
      return _readFile;
    } catch (e) {
      console.warn('Failed to load Node.js fs/promises, using browser stub');
      _readFile = browserReadFile;
      return _readFile;
    }
  }

  _readFile = browserReadFile;
  return _readFile;
}

/**
 * Get the SAX parser (Node.js or browser stub)
 */
export async function getSax(): Promise<typeof browserSax> {
  if (_sax) {
    return _sax;
  }

  if (isNode) {
    try {
      const saxModule = await import('sax');
      // Wrap Node.js sax to match browser stub signature
      // The Node.js sax parser has compatible interface, we just need to wrap it properly
      _sax = {
        parser: (strict: boolean, options?: Record<string, unknown>) => {
          const parser = saxModule.parser(strict, options);
          // Return as-is since Node.js sax has compatible interface
          // We know the interface is compatible even if TypeScript can't verify it
          return parser as unknown as SaxParserStub;
        }
      };
      return _sax;
    } catch (e) {
      console.warn('Failed to load Node.js sax module, using browser stub');
      _sax = browserSax;
      return _sax;
    }
  }

  _sax = browserSax;
  return _sax;
}

/**
 * Common parser options interface
 */
export interface ParserOptions {
  debug?: boolean;
  duplicateHandling?: any;
  strict?: boolean;
  trim?: boolean;
  normalize?: boolean;
  lowercase?: boolean;
}

/**
 * Parse options from LMFLoadOptions
 */
export function parseOptions(options: LMFLoadOptions = {}): ParserOptions {
  const { debug = false, duplicateHandling } = options;
  
  return {
    debug,
    duplicateHandling,
    strict: true,
    trim: true,
    normalize: true,
    lowercase: true
  };
}

/**
 * Common debug logging
 */
export function logDebug(parserName: string, message: string, debug: boolean = false): void {
  if (debug) {
    console.log(`[DEBUG] ${parserName}: ${message}`);
  }
}

/**
 * Common error handling
 */
export function handleParserError(parserName: string, error: any, debug: boolean = false): never {
  const message = `Parser error in ${parserName}: ${error instanceof Error ? error.message : String(error)}`;
  if (debug) {
    console.error(`[ERROR] ${message}`);
  }
  throw new Error(message);
}

/**
 * Common duplicate handling warning
 */
export function warnDuplicateHandling(parserName: string, debug: boolean = false): void {
  if (debug) {
    logDebug(parserName, 'Duplicate handling options ignored (parser not designed for production use)', debug);
  }
}

/**
 * Common file reading with error handling
 */
export async function readFileSafely(filePath: string, parserName: string, debug: boolean = false): Promise<string> {
  try {
    const readFile = await getReadFile();
    const content = await readFile(filePath, 'utf8');
    logDebug(parserName, `Successfully read file: ${filePath}`, debug);
    return content;
  } catch (error) {
    handleParserError(parserName, error, debug);
  }
}

/**
 * Common SAX parser creation
 */
export async function createSaxParser(
  parserName: string, 
  options: ParserOptions = {},
  debug: boolean = false
): Promise<any> {
  try {
    const sax = await getSax();
    const parser = sax.parser(options.strict ?? true, {
      trim: options.trim ?? true,
      normalize: options.normalize ?? true,
      lowercase: options.lowercase ?? true
    });
    
    logDebug(parserName, 'SAX parser created successfully', debug);
    return parser;
  } catch (error) {
    handleParserError(parserName, error, debug);
  }
}

/**
 * Common SAX parser event handlers
 */
export interface SaxEventHandlers {
  onOpenTag?: (tagName: string, attributes: Record<string, string>) => void;
  onCloseTag?: (tagName: string) => void;
  onText?: (text: string) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

/**
 * Setup common SAX event handlers
 */
export function setupSaxHandlers(
  parser: any, 
  handlers: SaxEventHandlers,
  parserName: string,
  debug: boolean = false
): void {
  if (handlers.onOpenTag) {
    parser.onopentag = (node: any) => {
      try {
        handlers.onOpenTag!(node.name, node.attributes || {});
      } catch (error) {
        if (handlers.onError) {
          handlers.onError(error);
        } else {
          handleParserError(parserName, error, debug);
        }
      }
    };
  }

  if (handlers.onCloseTag) {
    parser.onclosetag = (tagName: string) => {
      try {
        handlers.onCloseTag!(tagName);
      } catch (error) {
        if (handlers.onError) {
          handlers.onError(error);
        } else {
          handleParserError(parserName, error, debug);
        }
      }
    };
  }

  if (handlers.onText) {
    parser.ontext = (text: string) => {
      try {
        handlers.onText!(text);
      } catch (error) {
        if (handlers.onError) {
          handlers.onError(error);
        } else {
          handleParserError(parserName, error, debug);
        }
      }
    };
  }

  if (handlers.onError) {
    parser.onerror = handlers.onError;
  }

  if (handlers.onEnd) {
    parser.onend = handlers.onEnd;
  }

  logDebug(parserName, 'SAX event handlers setup complete', debug);
}

/**
 * Common parser result structure
 */
export interface ParserResult {
  document: LMFDocument;
  stats: {
    elementsProcessed: number;
    parseTime: number;
    memoryUsage?: number;
  };
}

/**
 * Create a parser result
 */
export function createParserResult(
  document: LMFDocument,
  elementsProcessed: number,
  parseTime: number,
  memoryUsage?: number
): ParserResult {
  return {
    document,
    stats: {
      elementsProcessed,
      parseTime,
      ...(memoryUsage !== undefined && { memoryUsage })
    }
  };
}

/**
 * Common performance measurement
 */
export function measurePerformance<T>(
  operation: () => T | Promise<T>,
  parserName: string,
  debug: boolean = false
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      logDebug(parserName, `Operation completed in ${duration.toFixed(2)}ms`, debug);
      resolve({ result, duration });
    } catch (error) {
      const duration = performance.now() - startTime;
      logDebug(parserName, `Operation failed after ${duration.toFixed(2)}ms`, debug);
      reject(error);
    }
  });
}

/**
 * Common memory usage measurement (Node.js only)
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if (isNode && typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      total: usage.heapTotal
    };
  }
  return null;
}

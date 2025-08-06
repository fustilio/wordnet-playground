/**
 * Browser-specific test setup
 * 
 * This setup file is used for browser tests and doesn't mock
 * browser APIs that already exist in the browser environment.
 */

import { vi } from 'vitest';

// Create mock SQLite WASM for browser tests
export const mockSqliteWasm = {
  oo1: {
    DB: class MockDB {
      public sqlite3: any;

      constructor(path: string, mode: string) {
        this.sqlite3 = {
          capi: {
            sqlite3_last_insert_rowid: (db: any) => 1,
          },
        };
      }
      
      exec(sql: any): any[] {
        const sqlString = typeof sql === 'string' ? sql : sql.sql;
        // Mock exec for schema creation
        if (sqlString && sqlString.includes('CREATE TABLE')) {
          return [];
        }

        const isLexiconQuery = sqlString.toLowerCase().includes('from "lexicons"');
        const isWordsQuery = sqlString.toLowerCase().includes('from "words"');
        const isSynsetsQuery = sqlString.toLowerCase().includes('from "synsets"');
        const isCountQuery = sqlString.toLowerCase().includes('count(');
        
        const mockWord = { id: 'happy.a.01', lemma: 'happy', part_of_speech: 'a' };
        const mockSynset = { id: 'happy.a.01', part_of_speech: 'a' };
        const mockLexicon = { id: 'oewn:2024', label: 'Sample', language: 'en', version: '2024' };
        
        if (sqlString.toLowerCase().includes('select')) {
          if (isCountQuery) return [{ count: 1 }];
          if (isLexiconQuery) return [mockLexicon];
          if (isWordsQuery) return [mockWord];
          if (isSynsetsQuery) return [mockSynset];
        }
        
        return [];
      }
      
      close(): void {
        // Mock close method
      }
      
      export(): Uint8Array {
        // Mock export method
        return new Uint8Array([1, 2, 3, 4]);
      }
      
      prepare(sql: string): any {
        const isLexiconQuery = sql.toLowerCase().includes('from "lexicons"');
        const isWordsQuery = sql.toLowerCase().includes('from "words"');
        const isSynsetsQuery = sql.toLowerCase().includes('from "synsets"');
        const isCountQuery = sql.toLowerCase().includes('count(');
        
        const mockWord = { id: 'happy.a.01', lemma: 'happy', part_of_speech: 'a' };
        const mockSynset = { id: 'happy.a.01', part_of_speech: 'a' };
        const mockLexicon = { id: 'oewn:2024', label: 'Sample', language: 'en', version: '2024' };

        return {
          run: vi.fn(),
          bind: vi.fn(),
          step(): boolean {
            return true;
          },
          get(): any {
            if (isCountQuery) return { count: 1 };
            if (isLexiconQuery) return mockLexicon;
            if (isWordsQuery) return mockWord;
            if (isSynsetsQuery) return mockSynset;
            return {};
          },
          all(): any[] {
            if (isCountQuery) return [{ count: 1 }];
            if (isLexiconQuery) return [mockLexicon];
            if (isWordsQuery) return [mockWord];
            if (isSynsetsQuery) return [mockSynset];
            return [];
          },
          getAsObject(): any {
            if (isCountQuery) return { count: 1 };
            if (isLexiconQuery) return mockLexicon;
            if (isWordsQuery) return mockWord;
            if (isSynsetsQuery) return mockSynset;
            return {};
          },
          free: vi.fn()
        };
      }
      
      changes(reset?: boolean): number {
        return 1;
      }
    }
  },
  opfs: {
    Vfs: class MockVfs {
      constructor() {}
    }
  }
};

// Mock SQLite WASM for browser tests
vi.mock('@sqlite.org/sqlite-wasm', () => {
  return {
    ...mockSqliteWasm,
    default: vi.fn().mockResolvedValue(mockSqliteWasm)
  };
});

// Mock fetch for @sqlite.org/sqlite-wasm loading
(window as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: {
    get: vi.fn((name: string) => {
      if (name === 'content-length') {
        return '1024';
      }
      return null;
    })
  },
  body: {
    getReader: vi.fn(() => ({
      read: vi.fn().mockResolvedValue({
        done: true,
        value: new Uint8Array([1, 2, 3, 4])
      })
    }))
  },
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
});

// Mock console methods (but don't override if they exist)
if (!window.console.log) {
  window.console.log = vi.fn();
}
if (!window.console.error) {
  window.console.error = vi.fn();
}
if (!window.console.warn) {
  window.console.warn = vi.fn();
}
if (!window.console.info) {
  window.console.info = vi.fn();
}

// Mock isSecureContext for browser tests
if (typeof window.isSecureContext === 'undefined') {
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
}

// Mock navigator.storage for consistent testing
const mockFileHandle = {
  kind: 'file' as const,
  getFile: vi.fn().mockResolvedValue({
    name: 'test-file.db',
    size: 1024,
    lastModified: Date.now(),
    type: 'application/octet-stream',
  }),
  createWritable: vi.fn().mockResolvedValue({
    write: vi.fn(),
    close: vi.fn(),
  }),
  createSyncAccessHandle: vi.fn().mockResolvedValue({
    read: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    write: vi.fn(),
    close: vi.fn(),
  }),
};

async function* mockDirectoryEntries(): AsyncGenerator<[string, typeof mockFileHandle]> {
  yield ['test-file.db', mockFileHandle];
}

const mockDirectoryHandle = {
  kind: 'directory' as const,
  getFileHandle: vi.fn().mockResolvedValue(mockFileHandle),
  removeEntry: vi.fn().mockResolvedValue(undefined),
  entries: vi.fn(mockDirectoryEntries),
};

if (!('storage' in navigator)) {
  Object.defineProperty(navigator, 'storage', { value: {}, writable: true });
}

Object.assign(navigator.storage, {
  getDirectory: vi.fn().mockResolvedValue(mockDirectoryHandle),
  estimate: vi.fn().mockResolvedValue({
    quota: 1000000000,
    usage: 1000000,
    usageDetails: {
      indexedDB: 500000,
      caches: 500000,
    },
  }),
});

// Mock SharedArrayBuffer if it doesn't exist
if (typeof SharedArrayBuffer === 'undefined') {
  (window as any).SharedArrayBuffer = class MockSharedArrayBuffer extends ArrayBuffer {
    constructor(length: number) {
      super(length);
    }
  };
}

// Mock performance API if it doesn't exist
if (typeof performance === 'undefined') {
  (window as any).performance = {
    now: vi.fn(() => Date.now())
  };
}

// Mock WebAssembly if it doesn't exist
if (typeof WebAssembly === 'undefined') {
  (window as any).WebAssembly = {
    instantiate: vi.fn().mockResolvedValue({
      instance: {
        exports: {}
      }
    })
  };
} else {
  // Ensure WebAssembly is properly typed for tests
  const originalWebAssembly = window.WebAssembly;
  // Create a function constructor to ensure typeof returns 'function'
  const MockWebAssembly = function() {} as any;
  MockWebAssembly.instantiate = vi.fn().mockResolvedValue({
    instance: {
      exports: {}
    }
  });
  (window as any).WebAssembly = MockWebAssembly;
} 

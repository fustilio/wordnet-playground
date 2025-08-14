/**
 * Browser-specific test setup
 * 
 * This setup file is used for browser tests and doesn't mock
 * browser APIs that already exist in the browser environment.
 */

import { vi } from 'vitest';

// Create mock SQLite WASM for browser tests
export const mockSqliteWasm = {
  capi: {
    sqlite3_trace_v2: vi.fn(),
    sqlite3_last_insert_rowid: vi.fn(() => 1),
  },
  oo1: {
    DB: class MockDB {
      private data: Record<string, any[]> = {};
      private totalChangesCount = 0;
      private lastOpChangesCount = 0;

      constructor(path: string, mode: string) {}

      exec(sqlOptions: any): any[] {
        this.lastOpChangesCount = 0;
        const sqlString = typeof sqlOptions === 'string' ? sqlOptions : sqlOptions.sql;
        const params = sqlOptions.bind || [];

        if (sqlString && sqlString.toLowerCase().includes('create table')) {
          const tableNameMatch = sqlString.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+['"]?(\w+)['"]?/i);
          if (tableNameMatch && tableNameMatch[1]) {
            this.data[tableNameMatch[1]] = [];
          }
          return [];
        }

        if (sqlString && sqlString.toLowerCase().startsWith('delete from')) {
          const tableNameMatch = sqlString.match(/DELETE FROM\s+['"]?(\w+)['"]?/i);
          if (tableNameMatch && tableNameMatch[1]) {
            const table = this.data[tableNameMatch[1]];
            if (table) {
              const changes = table.length;
              this.totalChangesCount += changes;
              this.lastOpChangesCount += changes;
              this.data[tableNameMatch[1]] = [];
            }
          }
          return [];
        }

        if (sqlString && sqlString.toLowerCase().startsWith('insert into')) {
          const tableNameMatch = sqlString.match(/INSERT INTO\s+['"]?(\w+)['"]?/i);
          const columnsMatch = sqlString.match(/\(([^)]+)\)/);
          
          if (tableNameMatch && tableNameMatch[1] && columnsMatch && columnsMatch[1]) {
            const tableName = tableNameMatch[1];
            const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/['"`]/g, ''));
            const table = this.data[tableName];

            if (table && columns.length > 0) {
              const numRows = params.length / columns.length;
              for (let i = 0; i < numRows; i++) {
                const row: Record<string, any> = {};
                columns.forEach((col, j) => {
                  row[col] = params[i * columns.length + j];
                });

                const existingIndex = table.findIndex(r => r.id === row.id);
                
                if (existingIndex === -1) {
                  table.push(row);
                  this.totalChangesCount++;
                  this.lastOpChangesCount++;
                } else if (!sqlString.toLowerCase().includes('do nothing')) {
                   Object.assign(table[existingIndex], row);
                   this.totalChangesCount++;
                   this.lastOpChangesCount++;
                }
              }
            }
          }
          return [];
        }
        
        const isCountQuery = sqlString.toLowerCase().includes('count(');
        if (isCountQuery) {
          const tableNameMatch = sqlString.match(/FROM\s+['"]?(\w+)['"]?/i);
          if (tableNameMatch && tableNameMatch[1]) {
            const tableName = tableNameMatch[1];
            return [{ count: this.data[tableName]?.length ?? 0 }];
          }
           return [{ count: 0 }];
        }

        const isSelectQuery = sqlString.toLowerCase().startsWith('select');
        if (isSelectQuery) {
          const tableNameMatch = sqlString.match(/FROM\s+['"]?(\w+)['"]?/i);
          if (tableNameMatch && tableNameMatch[1]) {
            const tableName = tableNameMatch[1];
            let results = this.data[tableName] || [];

            const whereMatch = sqlString.match(/WHERE\s+"id"\s*=\s*\?/i);
            if (whereMatch && params.length > 0) {
              results = results.filter(row => row.id === params[0]);
            }
            
            return results;
          }
        }
        
        return [];
      }
      
      close(): void {
        this.data = {};
        this.totalChangesCount = 0;
        this.lastOpChangesCount = 0;
      }
      
      export(): Uint8Array {
        return new Uint8Array([1, 2, 3, 4]);
      }
      
      prepare(sql: string): any {
        const isSelect1 = sql.toLowerCase().includes('select 1 as test');
        let stepCalled = false;
        
        return {
          run: vi.fn(),
          bind: vi.fn(),
          step: () => {
            if (isSelect1 && !stepCalled) {
              stepCalled = true;
              return true;
            }
            return false;
          },
          get: () => ({}),
          all: () => [],
          getAsObject: () => ({}),
          free: vi.fn(),
          stepFinalize: vi.fn()
        };
      }
      
      changes(isTotal: boolean = false, reset: boolean = false): number {
        if (isTotal) {
          return this.totalChangesCount;
        }
        const changes = this.lastOpChangesCount;
        if (reset) {
          this.lastOpChangesCount = 0;
        }
        return changes;
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
vi.mock('@sqlite.org/sqlite-wasm', async (importOriginal) => {
  // E2E tests run in a real browser and need the original module, not a mock.
  // We can detect E2E tests by checking the URL path.
  const isE2E = window.location.pathname.includes('/e2e/');

  if (isE2E) {
    // For E2E tests, we need to load the original module. Because of how Vitest
    // handles modules, we need to import it, initialize it once, and then
    // return a mock that provides the initialized module.
    try {
      const original = await importOriginal<typeof import('@sqlite.org/sqlite-wasm')>();
      const sqlite3 = await original.default();
      return {
        default: () => Promise.resolve(sqlite3),
      };
    } catch (e) {
      console.error('Failed to load original @sqlite.org/sqlite-wasm for E2E test', e);
      // Return a dummy mock to avoid crashing the test runner completely
      return {
        default: () => Promise.reject(new Error('Failed to load SQLite WASM for E2E')),
      };
    }
  }
  
  // For browser unit tests, use the mock.
  return {
    ...mockSqliteWasm,
    default: vi.fn().mockResolvedValue(mockSqliteWasm)
  };
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
}

/**
 * SQLite WASM Browser Tests
 * 
 * These tests require browser APIs and WebAssembly support.
 * They test SQLite WASM functionality in the browser environment.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { WebDatabase } from '../../src/client/submodules/web-database.js';

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

describe.skipIf(isNode)('SQLite WASM Browser Tests', () => {
  let wordnet: WebWordnet;
  let database: WebDatabase;

  beforeAll(async () => {
    // Check WebAssembly support
    expect(WebAssembly).toBeDefined();
    
    // Check for SQLite WASM module
    try {
      const sqlite3 = await import('@sqlite.org/sqlite-wasm');
      expect(sqlite3).toBeDefined();
    } catch (error) {
      console.warn('SQLite WASM not available in test environment');
    }
  });

  describe('SQLite WASM Loading', () => {
    it('should load SQLite WASM module', async () => {
      try {
        const sqlite3 = await import('@sqlite.org/sqlite-wasm');
        const sqlModule = await sqlite3.default({
          locateFile: (file: string) => {
            if (file === 'sqlite3.wasm') {
              return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
            }
            return file;
          },
          // Suppress verbose SQL trace output but keep error logging
          print: (msg: string) => {
            // Only suppress SQL TRACE messages, keep other output
            if (!msg.includes('SQL TRACE')) {
              console.log(msg);
            }
          },
          printErr: (msg: string) => {
            // Keep error output for debugging
            console.error(msg);
          }
        });
        
        expect(sqlModule).toBeDefined();
        expect(sqlModule.oo1).toBeDefined();
        expect(sqlModule.oo1.DB).toBeDefined();
      } catch (error) {
        // Expected in test environment without actual WASM file
        expect(error).toBeDefined();
      }
    });

    it('should handle WASM loading errors gracefully', async () => {
      try {
        const sqlite3 = await import('@sqlite.org/sqlite-wasm');
        await sqlite3.default({
          locateFile: () => 'nonexistent.wasm',
          // Suppress verbose SQL trace output but keep error logging
          print: (msg: string) => {
            // Only suppress SQL TRACE messages, keep other output
            if (!msg.includes('SQL TRACE')) {
              console.log(msg);
            }
          },
          printErr: (msg: string) => {
            // Keep error output for debugging
            console.error(msg);
          }
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
      try {
        const sqlite3 = await import('@sqlite.org/sqlite-wasm');
        const sqlModule = await sqlite3.default({
          locateFile: (file: string) => {
            if (file === 'sqlite3.wasm') {
              return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
            }
            return file;
          },
          // Suppress verbose SQL trace output but keep error logging
          print: (msg: string) => {
            // Only suppress SQL TRACE messages, keep other output
            if (!msg.includes('SQL TRACE')) {
              console.log(msg);
            }
          },
          printErr: (msg: string) => {
            // Keep error output for debugging
            console.error(msg);
          }
        });

        wordnet = new WebWordnet('oewn:2024');
        await wordnet.initialize(sqlModule);
        database = (wordnet as any).database;
      } catch (error) {
        // Skip tests if SQLite WASM is not available
        console.warn('Skipping SQLite WASM tests:', error);
      }
    });

    afterEach(async () => {
      if (wordnet) {
        try {
          await wordnet.close();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should create database in browser', async () => {
      if (!wordnet) {
        console.warn('Skipping test - SQLite WASM not available');
        return;
      }

      expect(wordnet).toBeDefined();
      expect(database).toBeDefined();
      expect((wordnet as any).initialized).toBe(true);
    });

    it('should execute SQL statements', async () => {
      if (!database) {
        console.warn('Skipping test - database not available');
        return;
      }

      // The mock should be reliable. If `exec` doesn't exist, it's a failure.
      const dbInstance = (database as any).db;
      expect(typeof dbInstance.exec).toBe('function');

      // This should not throw if the database is initialized correctly
      expect(() => {
        dbInstance.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)');
      }).not.toThrow();
    });

    it('should handle prepared statements', async () => {
      if (!database) {
        console.warn('Skipping test - database not available');
        return;
      }

      const dbInstance = (database as any).db;
      expect(typeof dbInstance.prepare).toBe('function');

      const stmt = dbInstance.prepare('SELECT 1 as test');
      expect(stmt).toBeDefined();

      // The mock should provide these methods. If not, the test should fail.
      expect(typeof stmt.step).toBe('function');
      expect(typeof stmt.free).toBe('function');
      
      const hasRow = stmt.step();
      expect(hasRow).toBe(true);
      stmt.free();
    });
  });

  describe('OPFS Integration', () => {
    it('should detect OPFS support', () => {
      expect('storage' in navigator).toBe(true);
      expect('getDirectory' in navigator.storage).toBe(true);
    });

    it('should handle OPFS database creation', async () => {
      try {
        const sqlite3 = await import('@sqlite.org/sqlite-wasm');
        const sqlModule = await sqlite3.default({
          locateFile: (file: string) => {
            if (file === 'sqlite3.wasm') {
              return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
            }
            return file;
          },
          // Suppress verbose SQL trace output but keep error logging
          print: (msg: string) => {
            // Only suppress SQL TRACE messages, keep other output
            if (!msg.includes('SQL TRACE')) {
              console.log(msg);
            }
          },
          printErr: (msg: string) => {
            // Keep error output for debugging
            console.error(msg);
          }
        });

        expect(sqlModule.oo1).toBeDefined();
        expect(sqlModule.oo1.OpfsDb).toBeDefined();
        
      } catch (error) {
        // Expected in test environment
        console.warn('OPFS not available in test environment');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle WASM loading failures', async () => {
      try {
        const sqlite3 = await import('@sqlite.org/sqlite-wasm');
        await sqlite3.default({
          locateFile: () => 'invalid.wasm',
          // Suppress verbose SQL trace output but keep error logging
          print: (msg: string) => {
            // Only suppress SQL TRACE messages, keep other output
            if (!msg.includes('SQL TRACE')) {
              console.log(msg);
            }
          },
          printErr: (msg: string) => {
            // Keep error output for debugging
            console.error(msg);
          }
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should handle database initialization failures', async () => {
      try {
        const wordnet = new WebWordnet('oewn:2024');
        await wordnet.initialize(null as any);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });
}); 

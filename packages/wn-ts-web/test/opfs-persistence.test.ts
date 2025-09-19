/**
 * Test OPFS persistence functionality
 * 
 * This test verifies that:
 * 1. Database is created with OPFS when available
 * 2. Data is properly flushed to OPFS storage
 * 3. Database persistence status is correctly reported
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebDatabase } from '../src/client/submodules/web-database.js';
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('OPFS-Persistence-Test');

describe('OPFS Persistence', () => {
  let database: WebDatabase;

  beforeEach(() => {
    database = new WebDatabase();
  });

  afterEach(() => {
    if (database) {
      try {
        database.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should detect OPFS support correctly', async () => {
    // Mock SQLite module with OPFS support
    const mockSqlModule = {
      oo1: {
        OpfsDb: class MockOpfsDb {
          constructor(filename: string) {
            // Mock OPFS database constructor
          }
          close() {}
          exec(sql: string) {}
        },
        DB: class MockDB {
          constructor(filename: string, mode?: string) {
            // Mock regular database constructor
          }
          close() {}
          exec(sql: string) {}
        }
      }
    } as any;

    await database.initializeWithModule(mockSqlModule);
    await database.createDatabase();

    // Should detect OPFS and create persistent database
    expect(database.isPersistent()).toBe(true);
    expect(database.getStorageInfo().type).toBe('opfs');
    expect(database.getStorageInfo().persistent).toBe(true);
  });

  it('should fall back to in-memory when OPFS not available', async () => {
    // Mock SQLite module without OPFS support
    const mockSqlModule = {
      oo1: {
        DB: class MockDB {
          constructor(filename: string, mode?: string) {
            // Mock regular database constructor
          }
          close() {}
          exec(sql: string) {}
        }
      }
    } as any;

    await database.initializeWithModule(mockSqlModule);
    await database.createDatabase();

    // Should fall back to in-memory database
    expect(database.isPersistent()).toBe(false);
    expect(database.getStorageInfo().type).toBe('memory');
    expect(database.getStorageInfo().persistent).toBe(false);
  });

  it('should flush database successfully', async () => {
    // Mock SQLite module with OPFS support
    const mockSqlModule = {
      oo1: {
        OpfsDb: class MockOpfsDb {
          constructor(filename: string) {
            // Mock OPFS database constructor
          }
          close() {}
          exec(sql: string) {
            // Mock SQL execution
            if (sql.includes('PRAGMA')) {
              // Mock PRAGMA execution
            }
          }
        }
      }
    } as any;

    await database.initializeWithModule(mockSqlModule);
    await database.createDatabase();

    // Should be able to flush without errors
    await expect(database.flush()).resolves.not.toThrow();
  });

  it('should handle flush errors gracefully', async () => {
    // Mock SQLite module with OPFS support that throws on exec
    const mockSqlModule = {
      oo1: {
        OpfsDb: class MockOpfsDb {
          constructor(filename: string) {
            // Mock OPFS database constructor
          }
          close() {}
          exec(sql: string) {
            // Mock SQL execution that throws
            throw new Error('Mock SQL error');
          }
        }
      }
    } as any;

    await database.initializeWithModule(mockSqlModule);
    await database.createDatabase();

    // Should handle flush errors gracefully
    await expect(database.flush()).resolves.not.toThrow();
  });

  it('should report correct storage information', async () => {
    // Mock SQLite module with OPFS support
    const mockSqlModule = {
      oo1: {
        OpfsDb: class MockOpfsDb {
          constructor(filename: string) {
            // Mock OPFS database constructor
          }
          close() {}
          exec(sql: string) {}
        }
      }
    } as any;

    await database.initializeWithModule(mockSqlModule);
    await database.createDatabase();

    const storageInfo = database.getStorageInfo();
    
    expect(storageInfo.type).toBe('opfs');
    expect(storageInfo.persistent).toBe(true);
    expect(storageInfo.path).toBe('/wordnet.sqlite3');
  });
});

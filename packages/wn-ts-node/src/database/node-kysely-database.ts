/**
 * Node.js Kysely database adapter using better-sqlite3
 * This provides the database interface for wn-ts-node to use Kysely
 */

import type { Database } from './types/database.js';
import { Kysely, SqliteDialect } from 'kysely';
import type { NodeDatabaseConfig } from 'wn-ts-core';
import { SchemaBuilder } from 'wn-ts-core/shared';

// Local interface that works with our database types
export interface NodeKyselyDatabaseInterface {
  getDatabase(): Kysely<Database>;
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export class NodeKyselyDatabase implements NodeKyselyDatabaseInterface {
  private db: Kysely<Database> | undefined;
  private sqliteDb: any; // better-sqlite3 Database instance
  private config: NodeDatabaseConfig;

  constructor(config: NodeDatabaseConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Dynamically import better-sqlite3 to avoid bundling issues
    const Database = (await import('better-sqlite3')).default;
    
    // If forceRecreate is true, delete the existing database file
    if (this.config.forceRecreate) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(this.config.filename)) {
          fs.unlinkSync(this.config.filename);
        }
      } catch (error) {
        // Ignore errors if file doesn't exist
      }
    }
    
    this.sqliteDb = new Database(this.config.filename, {
      readonly: this.config.readonly || false,
      fileMustExist: this.config.fileMustExist || false,
      timeout: this.config.timeout || 5000,
      verbose: this.config.verbose ? console.log : undefined,
    });

    // Create Kysely instance with SQLite dialect
    const dialect = new SqliteDialect({
      database: this.sqliteDb,
    });

    this.db = new Kysely<Database>({ dialect });

    // Create tables and indexes using shared SchemaBuilder
    await SchemaBuilder.createTables(this.db);
    await SchemaBuilder.createIndexes(this.db);
  }

  getDatabase(): Kysely<Database> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = undefined;
    }
    this.db = undefined;
  }

  /**
   * Get the underlying better-sqlite3 database instance
   * This is useful for operations that need direct SQLite access
   */
  getSqliteDatabase(): any {
    return this.sqliteDb;
  }

  /**
   * Execute a raw SQL query (useful for complex operations)
   */
  async executeRaw(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    const stmt = this.sqliteDb.prepare(sql);
    return stmt.all(params);
  }

  /**
   * Execute a raw SQL query that returns a single row
   */
  async executeRawSingle(sql: string, params: any[] = []): Promise<any> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    const stmt = this.sqliteDb.prepare(sql);
    return stmt.get(params);
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    this.sqliteDb.exec('BEGIN TRANSACTION');
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    this.sqliteDb.exec('COMMIT');
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    this.sqliteDb.exec('ROLLBACK');
  }

  /**
   * Check if the database is in a transaction
   */
  isInTransaction(): boolean {
    if (!this.sqliteDb) {
      return false;
    }
    
    try {
      const result = this.sqliteDb.prepare('PRAGMA transaction_state').get();
      return result?.transaction_state === 'BEGIN';
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    pageCount: number;
    pageSize: number;
    pageCountBytes: number;
    freelistCount: number;
    freelistCountBytes: number;
    cacheSize: number;
    cacheSizeBytes: number;
    cacheUsed: number;
    cacheUsedBytes: number;
  }> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }

    const stats = await Promise.all([
      this.executeRawSingle('PRAGMA page_count'),
      this.executeRawSingle('PRAGMA page_size'),
      this.executeRawSingle('PRAGMA freelist_count'),
      this.executeRawSingle('PRAGMA cache_size'),
      this.executeRawSingle('PRAGMA cache_used'),
    ]);

    const pageCount = stats[0]?.page_count || 0;
    const pageSize = stats[1]?.page_size || 0;
    const freelistCount = stats[2]?.freelist_count || 0;
    const cacheSize = stats[3]?.cache_size || 0;
    const cacheUsed = stats[4]?.cache_used || 0;

    return {
      pageCount,
      pageSize,
      pageCountBytes: pageCount * pageSize,
      freelistCount,
      freelistCountBytes: freelistCount * pageSize,
      cacheSize,
      cacheSizeBytes: cacheSize * pageSize,
      cacheUsed,
      cacheUsedBytes: cacheUsed * pageSize,
    };
  }

  /**
   * Optimize the database
   */
  async optimize(): Promise<void> {
    if (!this.sqliteDb) {
      throw new Error('Database not initialized');
    }
    
    await this.executeRaw('PRAGMA optimize');
    await this.executeRaw('VACUUM');
    await this.executeRaw('ANALYZE');
  }
}

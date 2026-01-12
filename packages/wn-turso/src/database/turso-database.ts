/**
 * Turso database wrapper
 */

import { Kysely, CompiledQuery } from 'kysely';
import { createTursoDialect } from './turso-dialect.js';
import { TursoQueryService } from './kysely-query-service.js';
import { RemoteTursoAdapter } from '../adapters/remote-adapter.js';
import { EmbeddedTursoAdapter } from '../adapters/embedded-adapter.js';
import type { TursoDatabaseConfig } from '../config.js';
import { validateTursoConfig } from '../config.js';
import type { TursoAdapter } from '../adapters/adapter.js';
import type { Database } from 'wn-ts-core/shared';
import { SchemaBuilder } from 'wn-ts-core/shared';

/**
 * Main Turso database class
 * Provides a unified interface for remote and embedded Turso connections
 */
export class TursoDatabase {
  private adapter?: TursoAdapter;
  private db?: Kysely<Database>;
  private queryService?: TursoQueryService;
  private config: TursoDatabaseConfig;
  private initialized = false;

  constructor(config: TursoDatabaseConfig) {
    validateTursoConfig(config);
    this.config = config;
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Select adapter based on mode
    switch (this.config.mode) {
      case 'remote':
        this.adapter = new RemoteTursoAdapter();
        break;
      case 'embedded':
        this.adapter = new EmbeddedTursoAdapter();
        break;
      default:
        throw new Error(`Unknown connection mode: ${this.config.mode}`);
    }

    await this.adapter.initialize(this.config);

    // Create Kysely instance
    const dialect = createTursoDialect({
      client: this.adapter.getClient(),
      onCreateConnection: async (connection) => {
        if (this.config.enableForeignKeys) {
          await connection.executeQuery(
            CompiledQuery.raw('PRAGMA foreign_keys = ON')
          );
        }
      },
    });

    this.db = new Kysely<Database>({ dialect });

    // Create query service
    this.queryService = new TursoQueryService(this.db);

    // Initialize schema if not readonly
    if (!this.config.readonly) {
      await SchemaBuilder.createTables(this.db);
      await SchemaBuilder.migrateSchema(this.db);
      await SchemaBuilder.createIndexes(this.db);
    }

    this.initialized = true;
  }

  /**
   * Get the Kysely database instance
   */
  getDatabase(): Kysely<Database> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Get the query service
   */
  getQueryService(): TursoQueryService {
    if (!this.queryService) {
      throw new Error('Query service not initialized');
    }
    return this.queryService;
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): TursoAdapter {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }
    return this.adapter;
  }

  /**
   * Check if the database is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Sync embedded replica with remote (only for embedded mode)
   */
  async sync(): Promise<void> {
    if (!this.adapter) {
      throw new Error('Database not initialized');
    }
    if (!this.adapter.sync) {
      throw new Error('Sync not available for this adapter (remote mode)');
    }
    await this.adapter.sync();
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.destroy();
      this.db = undefined;
    }
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = undefined;
    }
    this.queryService = undefined;
    this.initialized = false;
  }
}

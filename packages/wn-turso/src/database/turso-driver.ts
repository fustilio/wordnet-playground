/**
 * Turso/libsql Kysely driver implementation
 */

import { CompiledQuery, type DatabaseConnection, type Driver } from 'kysely';
import type { Client } from '@libsql/client';
import { TursoConnection } from './turso-connection.js';

export interface TursoDriverConfig {
  client: Client;
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}

/**
 * Kysely Driver implementation for Turso/libsql
 */
export class TursoDriver implements Driver {
  private config: TursoDriverConfig;
  private connection?: TursoConnection;

  constructor(config: TursoDriverConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.connection = new TursoConnection(this.config.client);

    if (this.config.onCreateConnection) {
      await this.config.onCreateConnection(this.connection);
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      throw new Error('Driver not initialized');
    }
    return this.connection;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('BEGIN'));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('COMMIT'));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('ROLLBACK'));
  }

  async releaseConnection(): Promise<void> {
    // No-op for libsql client - connection pooling handled internally
  }

  async destroy(): Promise<void> {
    this.config.client.close();
    this.connection = undefined;
  }
}

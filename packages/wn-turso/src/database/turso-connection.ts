/**
 * Turso/libsql Kysely connection implementation
 */

import type { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import type { Client, ResultSet } from '@libsql/client';

/**
 * Kysely DatabaseConnection implementation for Turso/libsql
 */
export class TursoConnection implements DatabaseConnection {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery;

    const result: ResultSet = await this.client.execute({
      sql,
      args: parameters as any[],
    });

    return {
      numAffectedRows: BigInt(result.rowsAffected),
      insertId:
        result.lastInsertRowid !== undefined
          ? BigInt(result.lastInsertRowid)
          : undefined,
      rows: result.rows as unknown as O[],
    };
  }

  async *streamQuery<O>(): AsyncIterableIterator<QueryResult<O>> {
    throw new Error('Streaming queries not supported by libsql client');
  }
}

/**
 * Turso/libsql Kysely connection implementation
 */

import type { CompiledQuery, DatabaseConnection, QueryResult } from "kysely";
import type { Client, ResultSet, InValue } from "@libsql/client";

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
      args: parameters as InValue[],
    });

    return {
      numAffectedRows: BigInt(result.rowsAffected),
      insertId:
        result.lastInsertRowid !== undefined
          ? BigInt(result.lastInsertRowid)
          : undefined,
      // Type assertion needed: libsql returns Row[] which is compatible with O[]
      // but TypeScript can't verify this at compile time. The type safety is
      // maintained by Kysely's query builder which ensures the query matches O.
      rows: result.rows as unknown as O[],
    };
  }

  async *streamQuery<O>(): AsyncIterableIterator<QueryResult<O>> {
    throw new Error("Streaming queries not supported by libsql client");
  }
}

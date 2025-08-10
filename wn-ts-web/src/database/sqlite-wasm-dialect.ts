/**
 * SQLite WASM Kysely dialect integration
 * 
 * This module integrates the sqlite-wasm-kysely dialect with our existing
 * SQLite WASM setup, providing a proper Kysely dialect for browser-based
 * WordNet operations.
 */

import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  CompiledQuery,
} from "kysely";
import { SqliteWasmDriver } from "./kysely/SqliteWasmDriver.js";
import type { SqliteWasmDatabase } from "./types/sqlite-wasm.js";

/**
 * Create a Kysely dialect for SQLite WASM
 * 
 * @param database - The SQLite WASM database instance
 * @returns A Kysely dialect configuration
 */
export const createSqliteWasmDialect = (database: SqliteWasmDatabase) => {
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () =>
      new SqliteWasmDriver({
        database: database,
        async onCreateConnection(connection) {
          // Enable foreign key support
          await connection.executeQuery(
            CompiledQuery.raw("PRAGMA foreign_keys = ON")
          );
        },
      }),
    createIntrospector: (db: any) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
}; 

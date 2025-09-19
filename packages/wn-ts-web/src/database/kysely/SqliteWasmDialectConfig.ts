import type { DatabaseConnection } from "kysely";
import type { SqliteWasmDatabase } from "../types/sqlite-wasm.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

export interface SqliteWasmDialectConfig {
  /**
   * An sqlite Database instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
   */
  database: SqliteWasmDatabase | (() => Promise<SqliteWasmDatabase>);
  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
  /**
   * The sqlite3 module used to create the database.
   *
   * Use this API to access the sqlite3 module directly.
   */
  sqlModule: Sqlite3Static;
} 
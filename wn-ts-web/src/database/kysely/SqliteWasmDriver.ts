import { CompiledQuery, type DatabaseConnection, type Driver } from "kysely";
import { type SqliteWasmDialectConfig } from "./SqliteWasmDialectConfig.js";
import { ConnectionMutex } from "./ConnectionMutex.js";
import { SqliteWasmConnection } from "./SqliteWasmConnection.js";
import type * as sqliteWasm from "../types/sqlite-wasm.js";

export class SqliteWasmDriver implements Driver {
  readonly #config: SqliteWasmDialectConfig;
  readonly #connectionMutex = new ConnectionMutex();

  #db?: sqliteWasm.SqliteWasmDatabase;
  #connection?: DatabaseConnection;

  constructor(config: SqliteWasmDialectConfig) {
    // this.#config = freeze({ ...config })
    this.#config = { ...config };
  }

  async init(): Promise<void> {
    this.#db =
      typeof this.#config.database === "function"
        ? await this.#config.database()
        : this.#config.database;

    this.#connection = new SqliteWasmConnection(
      this.#db,
      this.#config.sqlModule,
      (reason: number, cbArg: number, arg1: number, arg2: number) => {
        // console.log("reason: " + reason);
        // console.log("cbArg: " + cbArg);
        // console.log("arg1: " + arg1);
        // console.log("arg2: " + arg2);
        return 0;
      }
    );

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection);
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.#connectionMutex.lock();
    return this.#connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    this.#db?.close();
  }
}

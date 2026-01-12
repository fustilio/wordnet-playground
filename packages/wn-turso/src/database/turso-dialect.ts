/**
 * Turso/libsql Kysely dialect
 */

import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseConnection,
  type Dialect,
  type Kysely,
} from 'kysely';
import { TursoDriver } from './turso-driver.js';
import type { Client } from '@libsql/client';

export interface TursoDialectConfig {
  client: Client;
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}

/**
 * Create a Kysely dialect for Turso/libsql
 *
 * This follows the same pattern as sqlite-wasm-dialect.ts in wn-ts-web
 */
export function createTursoDialect(config: TursoDialectConfig): Dialect {
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () =>
      new TursoDriver({
        client: config.client,
        async onCreateConnection(connection: DatabaseConnection) {
          if (config.onCreateConnection) {
            await config.onCreateConnection(connection);
          }
        },
      }),
    createIntrospector: (db: Kysely<Record<string, unknown>>) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
}

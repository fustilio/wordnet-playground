/**
 * Pipeline sources for reading data
 */

import type { Kysely } from "kysely";
import { TursoDatabase } from "../database/turso-database.js";
import type { TursoDatabaseConfig } from "../config.js";
import type { PipelineSource, SourceOptions } from "./types.js";
import { streamTable, countRows } from "./streams.js";

/**
 * Create a pipeline source from a Turso database
 *
 * @typeParam T - The row type being read from the table
 */
export function tursoSource<T extends Record<string, unknown>>(
  config: TursoDatabaseConfig,
  table: string,
  options: SourceOptions = {}
): PipelineSource<T> {
  return {
    name: `turso:${config.url}/${table}`,

    async *read(): AsyncIterable<T> {
      const db = new TursoDatabase(config);
      await db.initialize();

      try {
        // Double assertion needed: Database type lacks index signature required
        // for dynamic table access. We go through unknown to safely widen the type.
        yield* streamTable<T>(
          db.getDatabase() as unknown as Kysely<Record<string, unknown>>,
          table,
          options
        );
      } finally {
        await db.close();
      }
    },

    async count(): Promise<number> {
      const tempDb = new TursoDatabase(config);
      await tempDb.initialize();

      try {
        // Double assertion needed: Database type lacks index signature required
        // for dynamic table access. We go through unknown to safely widen the type.
        return await countRows(
          tempDb.getDatabase() as unknown as Kysely<Record<string, unknown>>,
          table,
          options
        );
      } finally {
        await tempDb.close();
      }
    },
  };
}

/**
 * Create a pipeline source from a Kysely database instance
 * (for use with existing connections)
 *
 * @typeParam T - The row type being read from the table
 */
export function kyselySource<T extends Record<string, unknown>>(
  db: Kysely<Record<string, unknown>>,
  table: string,
  options: SourceOptions = {}
): PipelineSource<T> {
  return {
    name: `kysely:${table}`,

    async *read(): AsyncIterable<T> {
      yield* streamTable<T>(db, table, options);
    },

    async count(): Promise<number> {
      return countRows(db, table, options);
    },
  };
}

/**
 * Create a source from an array (for testing)
 *
 * @typeParam T - The item type in the array
 */
export function arraySource<T>(items: T[], name = "array"): PipelineSource<T> {
  return {
    name,

    async *read(): AsyncIterable<T> {
      for (const item of items) {
        yield item;
      }
    },

    async count(): Promise<number> {
      return items.length;
    },
  };
}

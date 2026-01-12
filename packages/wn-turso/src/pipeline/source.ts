/**
 * Pipeline sources for reading data
 */

import type { Kysely } from 'kysely';
import { TursoDatabase } from '../database/turso-database.js';
import type { TursoDatabaseConfig } from '../config.js';
import type { PipelineSource, SourceOptions } from './types.js';
import { streamTable, countRows } from './streams.js';

/**
 * Create a pipeline source from a Turso database
 */
export function tursoSource<T extends Record<string, any>>(
  config: TursoDatabaseConfig,
  table: string,
  options: SourceOptions = {}
): PipelineSource<T> {
  let db: TursoDatabase | null = null;

  return {
    name: `turso:${config.url}/${table}`,

    async *read(): AsyncIterable<T> {
      db = new TursoDatabase(config);
      await db.initialize();

      try {
        yield* streamTable<T>(db.getDatabase(), table, options);
      } finally {
        await db.close();
        db = null;
      }
    },

    async count(): Promise<number> {
      const tempDb = new TursoDatabase(config);
      await tempDb.initialize();

      try {
        return await countRows(tempDb.getDatabase(), table, options);
      } finally {
        await tempDb.close();
      }
    },
  };
}

/**
 * Create a pipeline source from a Kysely database instance
 * (for use with existing connections)
 */
export function kyselySource<T extends Record<string, any>>(
  db: Kysely<any>,
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
 */
export function arraySource<T>(
  items: T[],
  name: string = 'array'
): PipelineSource<T> {
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

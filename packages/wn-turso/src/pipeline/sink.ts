/**
 * Pipeline sinks for writing data
 */

import type { Kysely } from 'kysely';
import { TursoDatabase } from '../database/turso-database.js';
import type { TursoDatabaseConfig } from '../config.js';
import type { PipelineSink, SinkOptions, PipelineResult } from './types.js';
import { writeBatches } from './streams.js';

/**
 * Create a pipeline sink for a Turso database
 */
export function tursoSink<T extends Record<string, any>>(
  config: TursoDatabaseConfig,
  table: string,
  options: SinkOptions = {}
): PipelineSink<T> {
  return {
    name: `turso:${config.url}/${table}`,

    async write(data: AsyncIterable<T>): Promise<PipelineResult> {
      const db = new TursoDatabase({
        ...config,
        readonly: false, // Ensure we can write
      });
      await db.initialize();

      try {
        return await writeBatches<T>(db.getDatabase(), table, data, options);
      } finally {
        await db.close();
      }
    },
  };
}

/**
 * Create a pipeline sink from a Kysely database instance
 * (for use with existing connections)
 */
export function kyselySink<T extends Record<string, any>>(
  db: Kysely<any>,
  table: string,
  options: SinkOptions = {}
): PipelineSink<T> {
  return {
    name: `kysely:${table}`,

    async write(data: AsyncIterable<T>): Promise<PipelineResult> {
      return writeBatches<T>(db, table, data, options);
    },
  };
}

/**
 * Create a sink that collects items into an array (for testing)
 */
export function arraySink<T>(): PipelineSink<T> & { items: T[] } {
  const items: T[] = [];
  const startTime = Date.now();

  return {
    name: 'array',
    items,

    async write(data: AsyncIterable<T>): Promise<PipelineResult> {
      let processed = 0;

      for await (const item of data) {
        items.push(item);
        processed++;
      }

      return {
        processed,
        inserted: processed,
        skipped: 0,
        errors: 0,
        duration: Date.now() - startTime,
      };
    },
  };
}

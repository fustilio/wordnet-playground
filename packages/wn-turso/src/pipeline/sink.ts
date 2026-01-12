/**
 * Pipeline sinks for writing data
 */

import type { Kysely } from "kysely";
import { TursoDatabase } from "../database/turso-database.js";
import type { TursoDatabaseConfig } from "../config.js";
import type { PipelineSink, SinkOptions, PipelineResult } from "./types.js";
import { writeBatches } from "./streams.js";

/**
 * Create a pipeline sink for a Turso database
 *
 * @typeParam T - The row type being written to the table
 */
export function tursoSink<T extends Record<string, unknown>>(
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
        // Double assertion needed: Database type lacks index signature required
        // for dynamic table access. We go through unknown to safely widen the type.
        return await writeBatches<T>(
          db.getDatabase() as unknown as Kysely<Record<string, unknown>>,
          table,
          data,
          options
        );
      } finally {
        await db.close();
      }
    },
  };
}

/**
 * Create a pipeline sink from a Kysely database instance
 * (for use with existing connections)
 *
 * @typeParam T - The row type being written to the table
 */
export function kyselySink<T extends Record<string, unknown>>(
  db: Kysely<Record<string, unknown>>,
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
 *
 * @typeParam T - The item type being collected
 */
export function arraySink<T>(): PipelineSink<T> & { items: T[] } {
  const items: T[] = [];
  const startTime = Date.now();

  return {
    name: "array",
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

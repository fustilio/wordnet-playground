/**
 * Low-level streaming utilities for pipeline operations
 */

import type { Kysely } from "kysely";
import type {
  SourceOptions,
  SinkOptions,
  PipelineResult,
  AnyDatabase,
} from "./types.js";

/**
 * Stream rows from a table as an async generator
 *
 * @typeParam T - The row type being streamed
 */
export async function* streamTable<T>(
  db: Kysely<Record<string, unknown>>,
  table: string,
  options: SourceOptions = {}
): AsyncGenerator<T> {
  const { batchSize = 1000, where, orderBy, limit, offset = 0 } = options;

  let currentOffset = offset;
  let hasMore = true;
  let totalFetched = 0;

  while (hasMore) {
    // Type assertion needed: we're treating the database as having arbitrary tables
    // for dynamic table access. The actual type safety comes from the generic T.
    let query = (db as Kysely<AnyDatabase>)
      .selectFrom(table as keyof AnyDatabase & string)
      .selectAll();

    if (where) {
      query = where(query);
    }

    if (orderBy) {
      query = query.orderBy(orderBy);
    }

    // Apply pagination
    query = query.limit(batchSize).offset(currentOffset);

    const rows = await query.execute();

    if (rows.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of rows) {
      yield row as T;
      totalFetched++;

      // Check if we've hit the limit
      if (limit !== undefined && totalFetched >= limit) {
        hasMore = false;
        break;
      }
    }

    // If we got fewer rows than batch size, we're done
    if (rows.length < batchSize) {
      hasMore = false;
    }

    currentOffset += batchSize;
  }
}

/**
 * Write rows in batches to a table
 *
 * @typeParam T - The row type being written
 */
export async function writeBatches<T extends Record<string, unknown>>(
  db: Kysely<Record<string, unknown>>,
  table: string,
  rows: AsyncIterable<T>,
  options: SinkOptions = {}
): Promise<PipelineResult> {
  const { batchSize = 100, onConflict = "error", onProgress } = options;
  const startTime = Date.now();

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let batch: T[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    try {
      // Type assertion needed: treating database as having arbitrary tables
      // for dynamic table access. Type safety maintained through generic T.
      const typedDb = db as Kysely<AnyDatabase>;
      let query = typedDb
        .insertInto(table as keyof AnyDatabase & string)
        .values(batch as Record<string, unknown>[]);

      if (onConflict === "ignore" || onConflict === "replace") {
        // For both ignore and replace, use doNothing for simplicity
        // Full replace would need schema introspection for primary key columns
        query = query.onConflict((oc) => oc.doNothing());
      }

      await query.execute();
      inserted += batch.length;
    } catch (error) {
      if (onConflict === "error") {
        throw error;
      }
      // For ignore/replace, count as errors
      errors += batch.length;
    }

    batch = [];
  };

  for await (const row of rows) {
    batch.push(row);
    processed++;

    if (batch.length >= batchSize) {
      await flushBatch();

      if (onProgress) {
        onProgress({
          current: processed,
          processed,
          skipped,
          errors,
        });
      }
    }
  }

  // Flush remaining rows
  await flushBatch();

  return {
    processed,
    inserted,
    skipped,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Count rows in a table with optional filter
 */
export async function countRows(
  db: Kysely<Record<string, unknown>>,
  table: string,
  options: SourceOptions = {}
): Promise<number> {
  const { where } = options;

  // Type assertion needed: treating database as having arbitrary tables
  const typedDb = db as Kysely<AnyDatabase>;
  let query = typedDb
    .selectFrom(table as keyof AnyDatabase & string)
    .select((eb) => eb.fn.countAll().as("count"));

  if (where) {
    query = where(query);
  }

  const result = await query.executeTakeFirst();
  return Number(result?.count ?? 0);
}

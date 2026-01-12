/**
 * Low-level streaming utilities for pipeline operations
 */

import type { Kysely } from 'kysely';
import type { SourceOptions, SinkOptions, PipelineResult } from './types.js';

/**
 * Stream rows from a table as an async generator
 */
export async function* streamTable<T>(
  db: Kysely<any>,
  table: string,
  options: SourceOptions<T> = {}
): AsyncGenerator<T> {
  const { batchSize = 1000, where, orderBy, limit, offset = 0 } = options;

  let currentOffset = offset;
  let hasMore = true;
  let totalFetched = 0;

  while (hasMore) {
    let query = db.selectFrom(table).selectAll();

    if (where) {
      query = where(query);
    }

    if (orderBy) {
      query = query.orderBy(orderBy as any);
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
 */
export async function writeBatches<T extends Record<string, any>>(
  db: Kysely<any>,
  table: string,
  rows: AsyncIterable<T>,
  options: SinkOptions = {}
): Promise<PipelineResult> {
  const { batchSize = 100, onConflict = 'error', onProgress } = options;
  const startTime = Date.now();

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let batch: T[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;

    try {
      let query = db.insertInto(table).values(batch as any);

      if (onConflict === 'ignore') {
        query = query.onConflict((oc) => oc.doNothing()) as any;
      } else if (onConflict === 'replace') {
        // For replace, we need to know the primary key columns
        // This is a simplified version - full implementation would need schema introspection
        query = query.onConflict((oc) => oc.doNothing()) as any;
      }

      const result = await query.execute();
      inserted += batch.length;
    } catch (error) {
      if (onConflict === 'error') {
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
export async function countRows<T>(
  db: Kysely<any>,
  table: string,
  options: SourceOptions<T> = {}
): Promise<number> {
  const { where } = options;

  let query = db.selectFrom(table).select((eb: any) => eb.fn.count('*').as('count'));

  if (where) {
    query = where(query);
  }

  const result = await query.executeTakeFirst() as { count: number | bigint } | undefined;
  return Number(result?.count ?? 0);
}

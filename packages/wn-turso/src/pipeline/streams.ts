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
import { computeChecksum, loadChecksumsFromTable } from "./checksum.js";

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
  const {
    batchSize = 100,
    onConflict = "error",
    onProgress,
    checksumDeduplication,
  } = options;
  const startTime = Date.now();

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let skipped_unchanged = 0;
  let errors = 0;
  let batch: T[] = [];

  // Load existing checksums if deduplication is enabled
  let existingChecksums: Map<string, string> | undefined;
  const checksumColumn =
    checksumDeduplication?.checksumColumn || "_etl_checksum";
  const keyField = checksumDeduplication?.keyField || "id";
  const checksumFields = checksumDeduplication?.fields;
  const checksumStrategy = checksumDeduplication?.strategy || "skip";

  if (checksumDeduplication?.enabled) {
    try {
      existingChecksums = await loadChecksumsFromTable(
        db,
        table,
        keyField,
        checksumColumn
      );
    } catch (error) {
      // Table might not exist yet or checksum column might not exist
      // In this case, treat all rows as new
      existingChecksums = new Map();
    }
  }

  const flushBatch = async () => {
    if (batch.length === 0) return;

    try {
      let rowsToWrite = batch;

      // Filter out unchanged rows if deduplication is enabled
      if (checksumDeduplication?.enabled && existingChecksums) {
        const originalCount = batch.length;

        // Compute checksums and add to rows
        const batchWithChecksums = batch.map((row) => {
          const checksum = computeChecksum(row, checksumFields);

          // Include checksum in the row to be written
          return {
            ...row,
            [checksumColumn]: checksum,
          };
        });

        // Filter based on strategy
        if (checksumStrategy === "skip") {
          rowsToWrite = batchWithChecksums.filter((row) => {
            const key = String(row[keyField]);
            const checksum = String(row[checksumColumn]);
            const existingChecksum = existingChecksums!.get(key);

            // Write if new or changed
            return (
              existingChecksum === undefined || checksum !== existingChecksum
            );
          }) as T[];

          const unchangedCount = originalCount - rowsToWrite.length;
          skipped_unchanged += unchangedCount;
        } else {
          // strategy === 'update': write all rows but include checksum
          rowsToWrite = batchWithChecksums as T[];
        }
      }

      // Skip if all rows were filtered out
      if (rowsToWrite.length === 0) {
        batch = [];
        return;
      }

      // Type assertion needed: treating database as having arbitrary tables
      // for dynamic table access. Type safety maintained through generic T.
      const typedDb = db as Kysely<AnyDatabase>;
      let query = typedDb
        .insertInto(table as keyof AnyDatabase & string)
        .values(rowsToWrite as Record<string, unknown>[]);

      if (onConflict === "ignore" || onConflict === "replace") {
        // For both ignore and replace, use doNothing for simplicity
        // Full replace would need schema introspection for primary key columns
        query = query.onConflict((oc) => oc.doNothing());
      }

      await query.execute();
      inserted += rowsToWrite.length;
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
    skipped_unchanged,
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

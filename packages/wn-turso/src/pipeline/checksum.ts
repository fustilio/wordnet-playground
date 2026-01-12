/**
 * Checksum utilities for pipeline deduplication
 *
 * Provides deterministic hashing functions to detect unchanged rows
 * and skip unnecessary writes, following production ETL patterns.
 */

import { createHash } from "node:crypto";
import type { Kysely } from "kysely";
import type { AnyDatabase } from "./types.js";

/**
 * Compute a deterministic checksum for a row
 *
 * @param data - The row data to hash
 * @param fields - Optional array of field names to hash (undefined = all fields)
 * @returns MD5 hash string
 */
export function computeChecksum(
  data: Record<string, unknown>,
  fields?: string[]
): string {
  // Select fields to hash
  const dataToHash = fields
    ? fields.reduce(
        (acc, field) => {
          if (field in data) {
            acc[field] = data[field];
          }
          return acc;
        },
        {} as Record<string, unknown>
      )
    : data;

  // Deterministic JSON serialization (sorted keys)
  const json = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());

  // Compute MD5 hash (fast, good enough for deduplication)
  return createHash("md5").update(json).digest("hex");
}

/**
 * Compute checksums for a batch of rows
 *
 * @param rows - Array of rows to hash
 * @param fields - Optional array of field names to hash
 * @returns Array of checksums in same order as input rows
 */
export function checksumBatch(
  rows: Record<string, unknown>[],
  fields?: string[]
): string[] {
  return rows.map((row) => computeChecksum(row, fields));
}

/**
 * Load existing checksums from a database table
 *
 * @param db - Kysely database instance
 * @param table - Table name to load from
 * @param keyField - Field name containing the row key/id
 * @param checksumField - Field name containing the checksum (default: '_etl_checksum')
 * @returns Map of key -> checksum
 */
export async function loadChecksumsFromTable(
  db: Kysely<Record<string, unknown>>,
  table: string,
  keyField: string,
  checksumField = "_etl_checksum"
): Promise<Map<string, string>> {
  const typedDb = db as Kysely<AnyDatabase>;
  const rows = await typedDb
    .selectFrom(table as keyof AnyDatabase & string)
    .select([keyField, checksumField])
    .execute();

  const checksums = new Map<string, string>();
  for (const row of rows) {
    const key = String(row[keyField]);
    const checksum = String(row[checksumField]);
    if (key && checksum) {
      checksums.set(key, checksum);
    }
  }

  return checksums;
}

/**
 * Checksum comparison result for a single row
 */
export interface ChecksumComparison {
  /** The row key/id */
  key: string;
  /** Computed checksum for this row */
  checksum: string;
  /** Whether this is a new row (not in existing checksums) */
  isNew: boolean;
  /** Whether the checksum changed (only set if not new) */
  hasChanged?: boolean;
  /** The existing checksum (only set if not new) */
  existingChecksum?: string;
}

/**
 * Compare computed checksums against existing checksums
 *
 * @param rows - Array of rows to check
 * @param keyField - Field name containing the row key/id
 * @param existingChecksums - Map of existing key -> checksum
 * @param checksumFields - Optional fields to hash
 * @returns Array of comparison results
 */
export function compareChecksums(
  rows: Record<string, unknown>[],
  keyField: string,
  existingChecksums: Map<string, string>,
  checksumFields?: string[]
): ChecksumComparison[] {
  return rows.map((row) => {
    const key = String(row[keyField]);
    const checksum = computeChecksum(row, checksumFields);
    const existingChecksum = existingChecksums.get(key);

    if (existingChecksum === undefined) {
      return {
        key,
        checksum,
        isNew: true,
      };
    }

    return {
      key,
      checksum,
      isNew: false,
      hasChanged: checksum !== existingChecksum,
      existingChecksum,
    };
  });
}

/**
 * Filter rows to only those that need to be written
 * (new rows or rows with changed checksums)
 *
 * @param rows - Array of rows to filter
 * @param keyField - Field name containing the row key/id
 * @param existingChecksums - Map of existing key -> checksum
 * @param checksumFields - Optional fields to hash
 * @returns Filtered array of rows that need to be written
 */
export function filterChangedRows<T extends Record<string, unknown>>(
  rows: T[],
  keyField: string,
  existingChecksums: Map<string, string>,
  checksumFields?: string[]
): T[] {
  return rows.filter((row) => {
    const key = String(row[keyField]);
    const checksum = computeChecksum(row, checksumFields);
    const existingChecksum = existingChecksums.get(key);

    // Include if new or changed
    return existingChecksum === undefined || checksum !== existingChecksum;
  });
}

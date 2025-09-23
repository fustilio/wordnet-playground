/**
 * Shared batch insert function for wn-ts ecosystem
 * 
 * This provides a common batch insert implementation that both Node.js and Web
 * implementations can use, eliminating duplication across packages.
 */

import type { Kysely } from 'kysely';
import type { Database } from './database-types.js';

/**
 * Generic batch insert function using Kysely.
 * Inserts data in chunks and handles conflicts by doing nothing.
 *
 * @param db The Kysely database instance.
 * @param tableName The name of the table to insert into.
 * @param data An array of objects to insert.
 * @param chunkSize The size of each chunk for batch insertion.
 */
export async function batchInsert<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  data: any[],
  chunkSize: number = 150
): Promise<void> {
  if (!data || data.length === 0) {
    return;
  }

  // Insert data in chunks - transaction management is handled by the caller
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      await db
        .insertInto(tableName)
        .values(chunk)
        .onConflict((oc) => oc.column('id').doNothing()) // Assumes 'id' is the conflict key
        .execute();
    }
  }
}

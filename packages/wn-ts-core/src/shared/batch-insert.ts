/**
 * Shared batch insert function for wn-ts ecosystem
 *
 * This provides a common batch insert implementation that both Node.js and Web
 * implementations can use, eliminating duplication across packages.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';

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
  const totalChunks = Math.ceil(data.length / chunkSize);
  console.log(`Starting batch insert for table ${String(tableName)}: ${data.length} records in ${totalChunks} chunks of ${chunkSize}`);
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkNumber = Math.floor(i / chunkSize) + 1;
    
    if (chunk.length > 0) {
      console.log(`Inserting chunk ${chunkNumber}/${totalChunks} for table ${String(tableName)}: ${chunk.length} records`);
      
      // Add timeout to prevent hanging - increased for large datasets
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Batch insert timeout after 120 seconds for table ${String(tableName)} chunk ${chunkNumber}`)), 120000);
      });
      
      const insertPromise = db
        .insertInto(tableName)
        .values(chunk)
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();
      
      await Promise.race([insertPromise, timeoutPromise]);
      console.log(`Completed chunk ${chunkNumber}/${totalChunks} for table ${String(tableName)}`);
    }
  }
  
  console.log(`Completed batch insert for table ${String(tableName)}: ${data.length} records`);
}

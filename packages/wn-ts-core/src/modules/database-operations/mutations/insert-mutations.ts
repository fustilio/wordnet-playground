import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';


/**
 * Insert a single record into a table
 */
export function insertRecord<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  data: Database[T]
) {
  return db
    .insertInto(tableName)
    .values(data as any)
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

/**
 * Insert multiple records into a table
 */
export function insertRecords<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  data: Database[T][]
) {
  if (!data || data.length === 0) {
    throw new Error('No data to insert');
  }
  
  return db
    .insertInto(tableName)
    .values(data as any[])
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
}

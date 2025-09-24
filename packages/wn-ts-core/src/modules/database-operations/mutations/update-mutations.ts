import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

/**
 * Update a single record by ID
 */
export function updateRecordById<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  id: string,
  updates: Partial<Database[T]>
) {
  return db
    .updateTable(tableName)
    .set(updates as any)
    .where('id', '=', id)
    .execute();
}

/**
 * Update multiple records by condition
 */
export function updateRecordsByCondition<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  condition: (eb: any) => any,
  updates: Partial<Database[T]>
) {
  return db
    .updateTable(tableName)
    .set(updates as any)
    .where(condition)
    .execute();
}

/**
 * Upsert a single record (insert or update)
 */
export function upsertRecord<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  data: Database[T]
) {
  return db
    .insertInto(tableName)
    .values(data as any)
    .onConflict((oc) => oc.column('id').doUpdateSet(data as any))
    .execute();
}

/**
 * Upsert multiple records (insert or update)
 */
export function upsertRecords<T extends keyof Database>(
  db: Kysely<Database>,
  tableName: T,
  data: Database[T][]
) {
  return db
    .insertInto(tableName)
    .values(data as any[])
    .onConflict((oc) => oc.column('id').doUpdateSet((eb) => eb))
    .execute();
}

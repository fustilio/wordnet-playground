import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getRelationsBySynsetIdQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('relations')
    .selectAll()
    .where('source_id', '=', synsetId);
}

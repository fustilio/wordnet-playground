import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getExamplesBySynsetIdQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('examples')
    .selectAll()
    .where('synset_id', '=', synsetId);
}

import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getDefinitionsBySynsetIdQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('definitions')
    .selectAll()
    .where('synset_id', '=', synsetId);
}

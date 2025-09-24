import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getFormsByWordIdQuery(
  db: Kysely<Database>,
  wordId: string
) {
  return db
    .selectFrom('forms')
    .selectAll()
    .where('word_id', '=', wordId);
}

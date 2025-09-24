import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getLexiconsQuery(
  db: Kysely<Database>,
  options: {
    ids?: string[];
    id?: string;
    language?: string;
    version?: string;
  } = {}
) {
  return db
    .selectFrom('lexicons')
    .selectAll()
    .$if(!!options.id && options.id !== '*', (qb) => qb.where('id', '=', options.id!))
    .$if(!!options.ids && options.ids.length > 0, (qb) => qb.where('id', 'in', options.ids!))
    .$if(!!options.language, (qb) => qb.where('language', '=', options.language!))
    .$if(!!options.version, (qb) => qb.where('version', '=', options.version!));
}

export function getLexiconByIdQuery(
  db: Kysely<Database>,
  id: string
) {
  return db
    .selectFrom('lexicons')
    .selectAll()
    .where('id', '=', id);
}

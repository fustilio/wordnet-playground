import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getIliByIdQuery(
  db: Kysely<Database>,
  id: string
) {
  return db
    .selectFrom('ilis')
    .selectAll()
    .where('id', '=', id);
}

export function getIlisQuery(
  db: Kysely<Database>,
  options: { status?: string } = {}
) {
  return db
    .selectFrom('ilis')
    .selectAll()
    .$if(!!options.status, (qb) => qb.where('status', '=', options.status!));
}

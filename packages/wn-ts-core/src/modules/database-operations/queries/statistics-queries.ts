import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getStatisticsQueries(db: Kysely<Database>) {
  return {
    totalWords: db.selectFrom('words').select(db.fn.countAll().as('count')),
    totalSynsets: db.selectFrom('synsets').select(db.fn.countAll().as('count')),
    totalSenses: db.selectFrom('senses').select(db.fn.countAll().as('count')),
    totalILIs: db.selectFrom('synsets').where('ili', 'is not', null).select(db.fn.countAll().as('count')),
    totalLexicons: db.selectFrom('lexicons').select(db.fn.countAll().as('count'))
  };
}

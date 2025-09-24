import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

export function getBatchDefinitionsQuery(
  db: Kysely<Database>,
  synsetIds: string[]
) {
  return db
    .selectFrom('definitions')
    .selectAll()
    .where('synset_id', 'in', synsetIds);
}

export function getBatchExamplesQuery(
  db: Kysely<Database>,
  synsetIds: string[]
) {
  return db
    .selectFrom('examples')
    .selectAll()
    .where('synset_id', 'in', synsetIds);
}

export function getBatchRelationsQuery(
  db: Kysely<Database>,
  synsetIds: string[]
) {
  return db
    .selectFrom('relations')
    .selectAll()
    .where('source_id', 'in', synsetIds);
}

export function getBatchSensesQuery(
  db: Kysely<Database>,
  synsetIds: string[]
) {
  return db
    .selectFrom('senses')
    .selectAll()
    .where('synset_id', 'in', synsetIds);
}

export function getSensesBySynsetIdForTransformationQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('senses')
    .select('word_id')
    .where('synset_id', '=', synsetId);
}

export function getSensesBySynsetIdAllQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('senses')
    .selectAll()
    .where('synset_id', '=', synsetId);
}

import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
// import { sql } from 'kysely';
import type { PartOfSpeech, WordQuery } from '../../../core/types.js';
// import { WordQueryBuilder } from './base-query-builder.js';
// import { createQueryBuilder } from './base-query-builder.js';

export function getWordsBySynsetAndLanguageQuery(
  db: Kysely<Database>,
  synsetId: string,
  language?: string
) {
  let query = db
    .selectFrom('senses')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .selectAll('words')
    .where('senses.synset_id', '=', synsetId);

  if (language) {
    query = query.where('words.language', '=', language);
  }

  return query.orderBy('words.lemma');
}

export function getWordsQuery(
  db: Kysely<Database>,
  options: WordQuery = { language: undefined }
) {
  let query = db.selectFrom('words').selectAll('words');
  
  // Handle form filtering
  if (options.form) {
    if (options.fuzzy) {
      const searchTerm = `%${options.form.toLowerCase()}%`;
      query = query.where('words.lemma', 'like', searchTerm);
    } else {
      query = query.where('words.lemma', '=', options.form.toLowerCase());
    }
  }

  // Handle POS filtering
  if (options.pos) {
    query = query.where('words.pos', '=', options.pos);
  }

  // Handle lexicon filtering
  if (options.lexicon) {
    query = query.where('words.lexicon', '=', options.lexicon);
  }

  // Handle language filtering
  if (options.language) {
    query = query.where('words.language', '=', options.language);
  }

  // Handle max results
  if (options.maxResults) {
    query = query.limit(options.maxResults);
  }

  return query
    .orderBy('words.lemma')
    .orderBy('words.pos');
}

export function getWordByIdQuery(
  db: Kysely<Database>,
  id: string
) {
  return db
    .selectFrom('words')
    .selectAll()
    .where('id', '=', id);
}

export function getWordsByFormFastQuery(
  db: Kysely<Database>,
  form: string,
  options: { pos?: PartOfSpeech; lexicon?: string; maxResults?: number } = {}
) {
  // Use direct index lookup instead of LOWER() function
  return db
    .selectFrom('words')
    .selectAll('words')
    .where('lemma', '=', form.toLowerCase())
    .$if(!!options.pos, (qb) => qb.where('pos', '=', options.pos!))
    .$if(!!options.lexicon, (qb) => qb.where('lexicon', '=', options.lexicon!))
    .$if(!!options.maxResults, (qb) => qb.limit(options.maxResults!))
    .orderBy('lemma')
    .orderBy('pos');
}

export function getWordsByFormFuzzyFastQuery(
  db: Kysely<Database>,
  form: string,
  options: { pos?: PartOfSpeech; lexicon?: string; maxResults?: number } = {}
) {
  // Use LIKE with proper indexing
  const searchTerm = `%${form.toLowerCase()}%`;
  return db
    .selectFrom('words')
    .selectAll('words')
    .where('lemma', 'like', searchTerm)
    .$if(!!options.pos, (qb) => qb.where('pos', '=', options.pos!))
    .$if(!!options.lexicon, (qb) => qb.where('lexicon', '=', options.lexicon!))
    .$if(!!options.maxResults, (qb) => qb.limit(options.maxResults!))
    .orderBy('lemma')
    .orderBy('pos');
}

export function getWordsByLexiconQuery(
  db: Kysely<Database>,
  lexiconId: string
) {
  return db
    .selectFrom('words')
    .selectAll()
    .where('lexicon', '=', lexiconId);
}

export function getWordsByIdsQuery(
  db: Kysely<Database>,
  wordIds: string[]
) {
  if (!wordIds || wordIds.length === 0) {
    return db.selectFrom('words').selectAll().where('id', '=', '');
  }
  return db
    .selectFrom('words')
    .selectAll()
    .where('id', 'in', wordIds);
}

export function getWordsByIliAndLanguageQuery(
  db: Kysely<Database>,
  ili: string,
  language?: string
) {
  // Find words whose senses point to synsets sharing the same ILI
  return db
    .selectFrom('senses')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
    .selectAll('words')
    .where('synsets.ili', '=', ili)
    .$if(!!language, (qb) => qb.where('words.language', '=', language!));
}

export function getWordsByIliAndLexiconPrefixQuery(
  db: Kysely<Database>,
  ili: string,
  lexiconPrefix: string
) {
  // Find words whose senses point to synsets sharing the same ILI, scoped to target lexicon prefix
  return db
    .selectFrom('senses')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
    .selectAll('words')
    .where('synsets.ili', '=', ili)
    .where('words.lexicon', 'like', `${lexiconPrefix}%`);
}

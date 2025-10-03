import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
// import { sql } from 'kysely';
import type { SenseQuery } from '../../../core/types.js';
import { SenseQueryBuilder } from './base-query-builder.js';
// import { createQueryBuilder } from './base-query-builder.js';

export function getSensesQuery(
  db: Kysely<Database>,
  options: SenseQuery & { wordIdOrForm?: string } = { language: undefined }
) {
  let query = db.selectFrom('senses').selectAll('senses');
  let hasWordsJoin = false;
  
  // Handle wordIdOrForm - this is specific to senses
  const wordIdOrForm = options.wordIdOrForm;
  if (wordIdOrForm) {
    // Check if it's a word ID (contains lexicon prefix and part of speech)
    // Word IDs typically have format: word-pos-number (e.g., computer-n-1)
    const isWordId = wordIdOrForm.includes('-') && 
      (wordIdOrForm.match(/-[nvarscpix]-\d+$/) || 
       wordIdOrForm.endsWith('-n') || wordIdOrForm.endsWith('-v') || 
       wordIdOrForm.endsWith('-a') || wordIdOrForm.endsWith('-r') || 
       wordIdOrForm.endsWith('-s') || wordIdOrForm.endsWith('-c') || 
       wordIdOrForm.endsWith('-p') || wordIdOrForm.endsWith('-i') || 
       wordIdOrForm.endsWith('-x') || wordIdOrForm.endsWith('-u'));
    
    if (isWordId) {
      // Direct word ID lookup - fastest possible
      query = query.where('senses.word_id', '=', wordIdOrForm);
    } else {
      // Form lookup - join with words table
      query = query
        .innerJoin('words', 'senses.word_id', 'words.id')
        .where('words.lemma', '=', wordIdOrForm.toLowerCase());
      hasWordsJoin = true;
    }
  }

  // Handle POS filtering
  if (options.pos) {
    if (!hasWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.pos' as any, '=', options.pos);
  }

  // Handle lexicon filtering
  if (options.lexicon) {
    if (!hasWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.lexicon' as any, '=', options.lexicon);
  }

  return query.orderBy('senses.id');
}

export function getSenseByIdQuery(
  db: Kysely<Database>,
  id: string
) {
  return db
    .selectFrom('senses')
    .selectAll()
    .where('id', '=', id);
}

export function getSensesByWordIdQuery(
  db: Kysely<Database>,
  wordId: string
) {
  const builder = new SenseQueryBuilder(db);
  return builder.buildSensesByWordQuery(wordId);
}

export function getSensesBySynsetIdQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  const builder = new SenseQueryBuilder(db);
  return builder.buildSensesBySynsetQuery(synsetId);
}


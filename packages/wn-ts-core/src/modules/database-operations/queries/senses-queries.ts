import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { SenseQuery } from '../../../core/types.js';
import { SenseQueryBuilder, createQueryBuilder } from './base-query-builder.js';

export function getSensesQuery(
  db: Kysely<Database>,
  options: SenseQuery = {}
) {
  let query = db.selectFrom('senses').selectAll('senses');
  let hasWordsJoin = false;
  
  // Handle wordIdOrForm - this is specific to senses
  if (options.wordIdOrForm) {
    // Check if it's a word ID (contains lexicon prefix and part of speech)
    // Word IDs typically have format: word-pos-number (e.g., computer-n-1)
    const isWordId = options.wordIdOrForm.includes('-') && 
      (options.wordIdOrForm.match(/-[nvarscpix]-\d+$/) || 
       options.wordIdOrForm.endsWith('-n') || options.wordIdOrForm.endsWith('-v') || 
       options.wordIdOrForm.endsWith('-a') || options.wordIdOrForm.endsWith('-r') || 
       options.wordIdOrForm.endsWith('-s') || options.wordIdOrForm.endsWith('-c') || 
       options.wordIdOrForm.endsWith('-p') || options.wordIdOrForm.endsWith('-i') || 
       options.wordIdOrForm.endsWith('-x') || options.wordIdOrForm.endsWith('-u'));
    
    if (isWordId) {
      // Direct word ID lookup - fastest possible
      query = query.where('senses.word_id', '=', options.wordIdOrForm);
    } else {
      // Form lookup - join with words table
      query = query
        .innerJoin('words', 'senses.word_id', 'words.id')
        .where('words.lemma', '=', options.wordIdOrForm.toLowerCase());
      hasWordsJoin = true;
    }
  }

  // Handle POS filtering
  if (options.pos) {
    if (!hasWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.pos', '=', options.pos);
  }

  // Handle lexicon filtering
  if (options.lexicon) {
    if (!hasWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.lexicon', '=', options.lexicon);
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


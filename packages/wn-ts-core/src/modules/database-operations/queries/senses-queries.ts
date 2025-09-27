import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { SenseQuery } from '../../../core/types.js';

export function getSensesQuery(
  db: Kysely<Database>,
  options: SenseQuery = {}
) {
  const {
    wordIdOrForm,
    pos,
    lexicon
  } = options;

  // Build query with single JOIN to avoid column ambiguity
  let query = db
    .selectFrom('senses')
    .selectAll('senses');

  // Determine if we need to join with words table
  // We need to join if:
  // 1. wordIdOrForm is provided and doesn't contain a dot (indicating it's a form, not a word ID)
  // 2. pos filter is provided
  // 3. lexicon filter is provided (and not '*')
  let needsWordsJoin = !!(wordIdOrForm && !wordIdOrForm.includes('.')) || pos || (lexicon && lexicon !== '*');
  
  if (needsWordsJoin) {
    query = query.innerJoin('words', 'senses.word_id', 'words.id');
  }

  // Apply filters
  if (wordIdOrForm) {
    // Check if it's a word ID (contains lexicon prefix and part of speech)
    // Pattern examples: "oewn-fire-n", "omw-fr-ordinateur-n", "cili-1234"
    if (wordIdOrForm.includes('-') && (wordIdOrForm.endsWith('-n') || wordIdOrForm.endsWith('-v') || wordIdOrForm.endsWith('-a') || wordIdOrForm.endsWith('-r') || wordIdOrForm.endsWith('-s') || wordIdOrForm.endsWith('-c') || wordIdOrForm.endsWith('-p') || wordIdOrForm.endsWith('-i') || wordIdOrForm.endsWith('-x') || wordIdOrForm.endsWith('-u'))) {
      // Direct word ID lookup - fastest possible
      query = query.where('senses.word_id', '=', wordIdOrForm);
    } else {
      // Form lookup - words table already joined
      query = query.where(sql`words.lemma`, '=', wordIdOrForm.toLowerCase());
    }
  }

  if (pos) {
    if (!needsWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      needsWordsJoin = true; // Update the flag
    }
    query = query.where(sql`words.pos`, '=', pos);
  }

  if (lexicon && lexicon !== '*') {
    if (!needsWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
      needsWordsJoin = true; // Update the flag
    }
    query = query.where(sql`words.lexicon`, '=', lexicon);
  }

  return query;
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
  return db
    .selectFrom('senses')
    .selectAll()
    .where('word_id', '=', wordId);
}

export function getSensesBySynsetIdQuery(
  db: Kysely<Database>,
  synsetId: string
) {
  return db
    .selectFrom('senses')
    .selectAll()
    .where('synset_id', '=', synsetId);
}

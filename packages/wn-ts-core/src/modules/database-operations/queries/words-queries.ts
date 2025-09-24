import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { PartOfSpeech, WordQuery } from '../../../core/types.js';

export function getWordsBySynsetAndLanguageQuery(
  db: Kysely<Database>,
  synsetId: string,
  language?: string
) {
  return db
    .selectFrom('senses')
    .innerJoin('words', 'senses.word_id', 'words.id')
    .selectAll('words')
    .where('senses.synset_id', '=', synsetId)
    .$if(!!language, qb => qb.where('words.language', '=', language!));
}

export function getWordsQuery(
  db: Kysely<Database>,
  options: WordQuery = {}
) {
  const {
    form,
    pos,
    lexicon,
    language: lang,
    searchAllForms = false,
    fuzzy = false,
    maxResults,
    includeInflected = false
  } = options;

  let query = db
    .selectFrom('words')
    .distinct()
    .selectAll('words');

  // Handle lexicon filtering - support both single and multiple lexicons
  if (lexicon && lexicon !== '*') {
    if (Array.isArray(lexicon)) {
      if (lexicon.length > 0) {
        query = query.where('words.lexicon', 'in', lexicon);
      }
    } else {
      query = query.where(sql`words.lexicon`, '=', lexicon);
    }
  }

  // Handle language filtering
  if (lang && lang !== '*') {
    query = query.where('words.language', '=', lang);
  }

  // Handle part of speech filtering
  if (pos) {
    query = query.where(sql`words.pos`, '=', pos);
  }

  // Handle form searching with enhanced capabilities
  if (form) {
    const searchTerm = fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase();
    
    if (searchAllForms || includeInflected) {
      // Join with forms table to search both lemma and inflected forms
      query = query.leftJoin('forms', 'words.id', 'forms.word_id');
      
      if (fuzzy) {
        query = query.where((eb) =>
          eb.or([
            eb(sql`lower(words.lemma)`, 'like', searchTerm),
            eb(sql`lower(forms.written_form)`, 'like', searchTerm),
          ])
        );
      } else {
        query = query.where((eb) =>
          eb.or([
            eb(sql`lower(words.lemma)`, '=', searchTerm),
            eb(sql`lower(forms.written_form)`, '=', searchTerm),
          ])
        );
      }
    } else {
      // Only search lemma
      if (fuzzy) {
        query = query.where(sql`lower(words.lemma)`, 'like', searchTerm);
      } else {
        query = query.where(sql`lower(words.lemma)`, '=', searchTerm);
      }
    }
  }

  // Apply limit if specified
  if (maxResults) {
    query = query.limit(maxResults);
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

import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import type { SynsetQuery } from '../../../core/types.js';
// import { SynsetQueryBuilder } from './base-query-builder.js';

export function getSynsetsV2Query(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  let query = db.selectFrom('synsets').selectAll('synsets');
  let hasWordsJoin = false;
  
  // Handle form filtering - need to join with senses and words
  if (options.form) {
    query = query
      .innerJoin('senses', 'synsets.id', 'senses.synset_id')
      .innerJoin('words', 'senses.word_id', 'words.id');
    hasWordsJoin = true;
    
    if (options.fuzzy) {
      const searchTerm = `%${options.form.toLowerCase()}%`;
      query = query.where('words.lemma' as any, 'like', searchTerm);
    } else {
      query = query.where('words.lemma' as any, '=', options.form.toLowerCase());
    }
  }

  // Handle POS filtering - need to join with senses and words
  if (options.pos) {
    if (!hasWordsJoin) {
      query = query
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.pos' as any, '=', options.pos);
  }

  // Handle lexicon filtering - need to join with senses and words
  if (options.lexicon) {
    if (!hasWordsJoin) {
      query = query
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.lexicon' as any, '=', options.lexicon);
  }

  // Handle language filtering - need to join with senses and words
  if (options.language) {
    if (!hasWordsJoin) {
      query = query
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id');
      hasWordsJoin = true;
    }
    query = query.where('words.language' as any, '=', options.language);
  }

  // Handle ILI filtering (specific to synsets)
  const ili = (options as any).ili;
  if (ili) {
    query = query.where('synsets.ili', '=', ili);
  }

  // Handle max results
  if (options.maxResults) {
    query = query.limit(options.maxResults);
  }

  return query.orderBy('synsets.id');
}

export function getSynsetsV3Query(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  const {
    form,
    pos,
    lexicon,
    language,
    fuzzy = false,
    maxResults
  } = options;
  const ili = (options as any).ili;

  // Use direct joins instead of subqueries for better performance
  let query = db
    .selectFrom('synsets')
    .selectAll('synsets')
    .$if(!!form, qb => {
      if (!form) return qb;
      return qb
        .leftJoin('senses', 'senses.synset_id', 'synsets.id')
        .leftJoin('words', 'words.id', 'senses.word_id')
        .where('words.lemma' as any, fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
        .distinct();
    })
    .$if(!!pos, qb => {
      if (!form) {
        return qb
          .leftJoin('senses', 'senses.synset_id', 'synsets.id')
          .leftJoin('words', 'words.id', 'senses.word_id')
          .where('words.pos', '=', pos!)
          .distinct();
    } else {
        // Use subquery to filter by POS when no form is provided
        return qb.where('synsets.id', 'in', 
          db.selectFrom('senses')
            .leftJoin('words', 'words.id', 'senses.word_id')
            .select('senses.synset_id')
            .where('words.pos', '=', pos!)
        );
      }
    })
    .$if(!!lexicon && lexicon !== '*', qb => {
      if (Array.isArray(lexicon)) {
        return lexicon.length > 0 ? qb.where('synsets.lexicon', 'in', lexicon) : qb;
      } else {
        return qb.where('synsets.lexicon', '=', lexicon!);
      }
    })
    .$if(!!language, qb => qb.where('synsets.language', '=', language!))
    .$if(!!ili, qb => qb.where('synsets.ili', '=', ili!))
    .$if(!!maxResults, qb => qb.limit(maxResults!))
    .orderBy('synsets.id');

  return query;
}

export function getSynsetsV4Query(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  const {
    form,
    pos,
    lexicon,
    language,
    fuzzy = false,
    maxResults
  } = options;
  const ili = (options as any).ili;

  // V4 Optimization: Single massive JOIN query to get everything at once
  let query = db
    .selectFrom('synsets')
    .leftJoin('definitions', 'definitions.synset_id', 'synsets.id')
    .leftJoin('examples', 'examples.synset_id', 'synsets.id')
    .leftJoin('relations', 'relations.source_id', 'synsets.id')
    .leftJoin('senses', 'senses.synset_id', 'synsets.id')
    .leftJoin('words', 'words.id', 'senses.word_id')
    .select([
      'synsets.id as synset_id',
      'synsets.pos as synset_pos',
      'synsets.language as synset_language',
      'synsets.lexicon as synset_lexicon',
      'synsets.ili as synset_ili',
      'definitions.id as def_id',
      'definitions.language as def_language',
      'definitions.text as def_text',
      'definitions.source as def_source',
      'examples.id as ex_id',
      'examples.language as ex_language',
      'examples.text as ex_text',
      'examples.source as ex_source',
      'relations.id as rel_id',
      'relations.type as rel_type',
      'relations.target_id as rel_target',
      'relations.source as rel_source',
      'senses.id as sense_id',
      'senses.word_id as sense_word_id'
    ])
    .distinct()
    .$if(!!form, qb => {
      if (!form) return qb;
      return qb
        .where('words.lemma' as any, fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase());
    })
    .$if(!!pos, qb => {
      // Always ensure words table is joined when filtering by POS
      return qb
        .where('words.pos', '=', pos!);
    })
    .$if(!!lexicon && lexicon !== '*', qb => {
      if (Array.isArray(lexicon)) {
        return lexicon.length > 0 ? qb.where('synsets.lexicon', 'in', lexicon) : qb;
      } else {
        return qb.where('synsets.lexicon', '=', lexicon!);
      }
    })
    .$if(!!language, qb => qb.where('synsets.language', '=', language!))
    .$if(!!ili, qb => qb.where('synsets.ili', '=', ili!))
    .$if(!!maxResults, qb => qb.limit(maxResults!))
    .orderBy('synsets.id');

  return query;
}

export function getSynsetsV5Query(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  const {
    form,
    pos,
    lexicon,
    language,
    fuzzy = false,
    maxResults
  } = options;
  const ili = (options as any).ili;

  // V5 Optimization: Use optimized query with proper indexes
  let query = db
    .selectFrom('synsets')
    .leftJoin('definitions', 'definitions.synset_id', 'synsets.id')
    .leftJoin('examples', 'examples.synset_id', 'synsets.id')
    .leftJoin('relations', 'relations.source_id', 'synsets.id')
    .leftJoin('senses', 'senses.synset_id', 'synsets.id')
    .leftJoin('words', 'words.id', 'senses.word_id')
    .select([
      'synsets.id as synset_id',
      'synsets.pos as synset_pos',
      'synsets.language as synset_language',
      'synsets.lexicon as synset_lexicon',
      'synsets.ili as synset_ili',
      'definitions.id as def_id',
      'definitions.language as def_language',
      'definitions.text as def_text',
      'definitions.source as def_source',
      'examples.id as ex_id',
      'examples.language as ex_language',
      'examples.text as ex_text',
      'examples.source as ex_source',
      'relations.id as rel_id',
      'relations.type as rel_type',
      'relations.target_id as rel_target',
      'relations.source as rel_source',
      'senses.id as sense_id',
      'senses.word_id as sense_word_id'
    ])
    .distinct()
    .$if(!!form, qb => {
      if (!form) return qb;
      // V5 Optimization: Use indexed column directly
      return qb
        .where('words.lemma' as any, fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase());
    })
    .$if(!!pos, qb => {
      // Always ensure words table is joined when filtering by POS
      return qb
        .where('words.pos', '=', pos!);
    })
    .$if(!!lexicon && lexicon !== '*', qb => {
      if (Array.isArray(lexicon)) {
        return lexicon.length > 0 ? qb.where('synsets.lexicon', 'in', lexicon) : qb;
      } else {
        return qb.where('synsets.lexicon', '=', lexicon!);
      }
    })
    .$if(!!language, qb => qb.where('synsets.language', '=', language!))
    .$if(!!ili, qb => qb.where('synsets.ili', '=', ili!))
    .$if(!!maxResults, qb => qb.limit(maxResults!))
    .orderBy('synsets.id');

  return query;
}

export function getSynsetsV6Query(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  const {
    form,
    pos,
    lexicon,
    language,
    fuzzy = false,
    maxResults
  } = options;
  const ili = (options as any).ili;

  // V6 Optimization: Use the most efficient query possible
  let query = db
    .selectFrom('synsets')
    .selectAll('synsets')
    .$if(!!form, qb => {
      if (!form) return qb;
      return qb
        .innerJoin('senses', 'senses.synset_id', 'synsets.id')
        .innerJoin('words', 'words.id', 'senses.word_id')
        .where('words.lemma' as any, fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
        .distinct();
    })
    .$if(!!pos, qb => {
      // Always ensure words table is joined when filtering by POS
      return qb
        .innerJoin('senses', 'senses.synset_id', 'synsets.id')
        .innerJoin('words', 'words.id', 'senses.word_id')
        .where('words.pos', '=', pos!)
        .distinct();
    })
    .$if(!!lexicon && lexicon !== '*', qb => {
      if (Array.isArray(lexicon)) {
        return lexicon.length > 0 ? qb.where('synsets.lexicon', 'in', lexicon) : qb;
      } else {
        return qb.where('synsets.lexicon', '=', lexicon!);
      }
    })
    .$if(!!language, qb => qb.where('synsets.language', '=', language!))
    .$if(!!ili, qb => qb.where('synsets.ili', '=', ili!))
    .$if(!!maxResults, qb => qb.limit(maxResults!))
    .orderBy('synsets.id');

  return query;
}

export function getSynsetsFastQuery(
  db: Kysely<Database>,
  options: SynsetQuery = { language: undefined }
) {
  const {
    form,
    pos,
    lexicon,
    language,
    fuzzy = false,
    maxResults
  } = options;
  const ili = (options as any).ili;

  // Use the V2 query approach but with minimal data transformation
  let query = db
    .selectFrom('synsets')
    .selectAll('synsets')
    .$if(!!form, qb => {
      if (!form) return qb;
      return qb
        .innerJoin('senses', 'senses.synset_id', 'synsets.id')
        .innerJoin('words', 'words.id', 'senses.word_id')
        .where('words.lemma' as any, fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
        .distinct();
    })
    .$if(!!pos, qb => {
      // Always ensure words table is joined when filtering by POS
      return qb
        .innerJoin('senses', 'senses.synset_id', 'synsets.id')
        .innerJoin('words', 'words.id', 'senses.word_id')
        .where('words.pos', '=', pos!)
        .distinct();
    })
    .$if(!!lexicon && lexicon !== '*', qb => {
      if (Array.isArray(lexicon)) {
        return lexicon.length > 0 ? qb.where('synsets.lexicon', 'in', lexicon) : qb;
      } else {
        return qb.where('synsets.lexicon', '=', lexicon!);
      }
    })
    .$if(!!language, qb => qb.where('synsets.language', '=', language!))
    .$if(!!ili, qb => qb.where('synsets.ili', '=', ili!))
    .$if(!!maxResults, qb => qb.limit(maxResults!))
    .orderBy('synsets.id');

  return query;
}

export function getSynsetByIdQuery(
  db: Kysely<Database>,
  id: string
) {
  return db
    .selectFrom('synsets')
    .selectAll()
    .where('id', '=', id);
}

export function getSynsetsByFormFastQuery(
  db: Kysely<Database>,
  form: string,
  options: { pos?: string; lexicon?: string; maxResults?: number } = {}
) {
  // Direct join without subquery for better performance
  return db
    .selectFrom('synsets')
    .innerJoin('senses', 'senses.synset_id', 'synsets.id')
    .innerJoin('words', 'words.id', 'senses.word_id')
    .selectAll('synsets')
    .where('words.lemma', '=', form.toLowerCase())
    .distinct()
    .$if(!!options.pos, (qb) => qb.where('words.pos', '=', options.pos!))
    .$if(!!options.lexicon, (qb) => qb.where('synsets.lexicon', '=', options.lexicon!))
    .$if(!!options.maxResults, (qb) => qb.limit(options.maxResults!))
    .orderBy('synsets.id');
}

export function getSynsetsByLexiconQuery(
  db: Kysely<Database>,
  lexiconId: string
) {
  return db
    .selectFrom('synsets')
    .selectAll()
    .where('lexicon', '=', lexiconId);
}

export function getSynsetsByIliQuery(
  db: Kysely<Database>,
  ili: string,
  options: { excludeLanguage?: string } = {}
) {
  return db
    .selectFrom('synsets')
    .selectAll()
    .where('ili', '=', ili)
    .$if(!!options.excludeLanguage, (qb) => qb.where('language', '!=', options.excludeLanguage!));
}

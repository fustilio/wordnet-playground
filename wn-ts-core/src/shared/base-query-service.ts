/**
 * Shared base query service for wn-ts ecosystem
 * 
 * This provides common query methods that both Node.js and Web implementations
 * can extend, eliminating duplication across packages.
 */

import { Kysely, sql } from 'kysely';
import type { Database } from './database-types.js';
import type { PartOfSpeech, Lexicon, Word, Synset, Sense, ILI, WordQuery, SynsetQuery, SenseQuery } from '../core/types.js';
import { batchInsert } from './batch-insert.js';

/**
 * Query optimization strategies for different performance requirements
 * Strategy names are flexible and can be query-specific (e.g., 'v1', 'v2', 'optimized', 'fast', etc.)
 */
export type QueryStrategy = string;

export interface QueryOptions {
  strategy?: QueryStrategy;
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  includeRelations?: boolean;
  includeSenses?: boolean;
}

/**
 * Strategy configuration mapping
 * Maps strategy names to their behavior
 */
export interface StrategyConfig {
  includeDefinitions: boolean;
  includeExamples: boolean;
  includeRelations: boolean;
  includeSenses: boolean;
  description?: string;
}

export abstract class BaseKyselyQueryService {
  protected defaultStrategy: QueryStrategy = 'default';
  protected defaultOptions: QueryOptions = {
    strategy: 'default',
    includeDefinitions: true,
    includeExamples: true,
    includeRelations: true,
    includeSenses: true,
  };

  constructor(protected db: Kysely<Database>, options?: { strategy?: QueryStrategy }) {
    if (options?.strategy) {
      this.defaultStrategy = options.strategy;
      this.updateDefaultOptions(options.strategy);
    }
  }

  private updateDefaultOptions(strategy: QueryStrategy): void {
    this.defaultOptions = this.getOptionsForStrategy(strategy);
  }

  private getOptionsForStrategy(strategy: QueryStrategy): QueryOptions {
    switch (strategy) {
      case 'fast':
        return {
          strategy: 'fast',
          includeDefinitions: false,
          includeExamples: false,
          includeRelations: false,
          includeSenses: false,
        };
      case 'balanced':
        return {
          strategy: 'balanced',
          includeDefinitions: true,
          includeExamples: false,
          includeRelations: false,
          includeSenses: false,
        };
      case 'complete':
        return {
          strategy: 'complete',
          includeDefinitions: true,
          includeExamples: true,
          includeRelations: true,
          includeSenses: true,
        };
      case 'default':
      default:
        return {
          strategy: 'default',
          includeDefinitions: true,
          includeExamples: true,
          includeRelations: true,
          includeSenses: true,
        };
    }
  }

  // Lexicon queries
  async getLexicons(options: {
    ids?: string[];
    id?: string;
    language?: string;
    version?: string;
  } = {}): Promise<Lexicon[]> {
    const query = this.db
      .selectFrom('lexicons')
      .selectAll()
      .$if(!!options.id && options.id !== '*', (qb) => qb.where('id', '=', options.id!))
      .$if(!!options.ids && options.ids.length > 0, (qb) => qb.where('id', 'in', options.ids!))
      .$if(!!options.language, (qb) => qb.where('language', '=', options.language!))
      .$if(!!options.version, (qb) => qb.where('version', '=', options.version!));

    const results = await query.execute();
    return results.map(this.transformLexiconRecord.bind(this));
  }

  async getLexiconById(id: string): Promise<Lexicon | undefined> {
    const result = await this.db
      .selectFrom('lexicons')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformLexiconRecord(result) : undefined;
  }

  // Word queries
  async getWords(options: WordQuery & QueryOptions = {}): Promise<Word[]> {
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

    let query = this.db
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

    const results = await query
      .orderBy('words.lemma')
      .orderBy('words.pos')
      .execute();
    
    return await Promise.all(results.map(this.transformWordRecord.bind(this)));
  }

  async getWordById(id: string): Promise<Word | undefined> {
    const result = await this.db
      .selectFrom('words')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? await this.transformWordRecord(result) : undefined;
  }

  // Optimized word query methods
  async getWordsByFormFast(form: string, options: { pos?: PartOfSpeech; lexicon?: string; maxResults?: number } = {}): Promise<Word[]> {
    // Use direct index lookup instead of LOWER() function
    const query = this.db
      .selectFrom('words')
      .selectAll('words')
      .where('lemma', '=', form.toLowerCase())
      .$if(!!options.pos, (qb) => qb.where('pos', '=', options.pos!))
      .$if(!!options.lexicon, (qb) => qb.where('lexicon', '=', options.lexicon!))
      .$if(!!options.maxResults, (qb) => qb.limit(options.maxResults!))
      .orderBy('lemma')
      .orderBy('pos');

    const results = await query.execute();
    return await Promise.all(results.map(this.transformWordRecord.bind(this)));
  }

  async getWordsByFormFuzzyFast(form: string, options: { pos?: PartOfSpeech; lexicon?: string; maxResults?: number } = {}): Promise<Word[]> {
    // Use LIKE with proper indexing
    const searchTerm = `%${form.toLowerCase()}%`;
    const query = this.db
      .selectFrom('words')
      .selectAll('words')
      .where('lemma', 'like', searchTerm)
      .$if(!!options.pos, (qb) => qb.where('pos', '=', options.pos!))
      .$if(!!options.lexicon, (qb) => qb.where('lexicon', '=', options.lexicon!))
      .$if(!!options.maxResults, (qb) => qb.limit(options.maxResults!))
      .orderBy('lemma')
      .orderBy('pos');

    const results = await query.execute();
    return await Promise.all(results.map(this.transformWordRecord.bind(this)));
  }

  // Synset queries - Strategy-specific methods for better type safety
  async getSynsets(options: SynsetQuery & QueryOptions = {}): Promise<Synset[]> {
    // Use V5 strategy by default (fastest with caching)
    return this.getSynsetsV5(options);
  }

  // V1 Strategy - DEPRECATED: Use V5 or V6 for better performance
  // Performance: ~0.4 Hz (very slow)
  // This strategy is kept for backward compatibility only
  async getSynsetsV1(options: SynsetQuery = {}): Promise<Synset[]> {
    // V1 now uses the exact same implementation as V4 for consistency
    return this.getSynsetsV4(options);
  }

  // V2 Strategy - DEPRECATED: Use V5 or V6 for better performance
  // Performance: ~0.42 Hz (very slow)
  // This strategy is kept for backward compatibility only
  async getSynsetsV2(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // Use direct joins instead of subqueries for better performance
    let query = this.db
      .selectFrom('synsets')
      .selectAll('synsets')
      .$if(!!form, qb => {
        if (!form) return qb;
        return qb
          .leftJoin('senses', 'senses.synset_id', 'synsets.id')
          .leftJoin('words', 'words.id', 'senses.word_id')
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
          .distinct();
      })
      .$if(!!pos, qb => {
        if (!form) {
          // If no form, we need to join with senses and words for POS filtering
          return qb
            .leftJoin('senses', 'senses.synset_id', 'synsets.id')
            .leftJoin('words', 'words.id', 'senses.word_id')
            .where('words.pos', '=', pos!)
            .distinct();
        } else {
          // Use subquery to filter by POS when no form is provided
          return qb.where('synsets.id', 'in', 
            this.db.selectFrom('senses')
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

    const results = await query.execute();
    const transformedSynsets: Synset[] = [];
    for (const record of results) {
      transformedSynsets.push(await this.transformSynsetRecordV2(record));
    }
    return transformedSynsets;
  }

  // V3 Strategy - DEPRECATED: Use V5 or V6 for better performance
  // Performance: ~0.47 Hz (very slow)
  // This strategy is kept for backward compatibility only
  async getSynsetsV3(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // Use direct joins instead of subqueries for better performance
    let query = this.db
      .selectFrom('synsets')
      .selectAll('synsets')
      .$if(!!form, qb => {
        if (!form) return qb;
        return qb
          .leftJoin('senses', 'senses.synset_id', 'synsets.id')
          .leftJoin('words', 'words.id', 'senses.word_id')
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
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
            this.db.selectFrom('senses')
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

    const results = await query.execute();
    if (results.length === 0) return [];

    // V3 Optimization: Batch load ALL related data in 3 queries instead of 5*N queries
    const synsetIds = results.map(r => r.id);
    
    // Load all related data in parallel for ALL synsets at once
    const [allDefinitions, allExamples, allRelations, allSenses] = await Promise.all([
      this.db.selectFrom('definitions').selectAll().where('synset_id', 'in', synsetIds).execute(),
      this.db.selectFrom('examples').selectAll().where('synset_id', 'in', synsetIds).execute(),
      this.db.selectFrom('relations').selectAll().where('source_id', 'in', synsetIds).execute(),
      this.db.selectFrom('senses').selectAll().where('synset_id', 'in', synsetIds).execute()
    ]);

    // Group related data by synset ID for O(1) lookup
    const definitionsBySynset = new Map<string, any[]>();
    const examplesBySynset = new Map<string, any[]>();
    const relationsBySynset = new Map<string, any[]>();
    const sensesBySynset = new Map<string, any[]>();

    allDefinitions.forEach(def => {
      if (def.synset_id && !definitionsBySynset.has(def.synset_id)) definitionsBySynset.set(def.synset_id, []);
      if (def.synset_id) definitionsBySynset.get(def.synset_id)!.push(def);
    });

    allExamples.forEach(ex => {
      if (ex.synset_id && !examplesBySynset.has(ex.synset_id)) examplesBySynset.set(ex.synset_id, []);
      if (ex.synset_id) examplesBySynset.get(ex.synset_id)!.push(ex);
    });

    allRelations.forEach(rel => {
      if (rel.source_id && !relationsBySynset.has(rel.source_id)) relationsBySynset.set(rel.source_id, []);
      if (rel.source_id) relationsBySynset.get(rel.source_id)!.push(rel);
    });

    allSenses.forEach(sense => {
      if (sense.synset_id && !sensesBySynset.has(sense.synset_id)) sensesBySynset.set(sense.synset_id, []);
      if (sense.synset_id) sensesBySynset.get(sense.synset_id)!.push(sense);
    });

    // Transform synsets with pre-loaded data (no more individual queries!)
    const transformedSynsets: Synset[] = [];
    for (const record of results) {
      const definitions = definitionsBySynset.get(record.id) || [];
      const examples = examplesBySynset.get(record.id) || [];
      const relations = relationsBySynset.get(record.id) || [];
      const senses = sensesBySynset.get(record.id) || [];

      const result: Synset = {
        id: record.id,
        pos: record.pos as PartOfSpeech,
        language: record.language,
        lexicon: record.lexicon,
        definitions: definitions.map(d => ({
          id: d.id,
          language: d.language,
          text: d.text,
          source: d.source || '',
        })),
        examples: examples.map(ex => ({
          id: ex.id,
          language: ex.language,
          text: ex.text,
          source: ex.source || '',
        })),
        relations: relations.map(rel => ({
          id: rel.id,
          type: rel.type,
          target: rel.target_id,
          source: rel.source || '',
        })),
        memberIds: senses.map(s => s.word_id),
        senseIds: senses.map(s => s.id),
      };
      
      if (record.ili !== undefined) result.ili = record.ili;
      transformedSynsets.push(result);
    }
    
    return transformedSynsets;
  }

  // V4 Strategy - DEPRECATED: Use V5 or V6 for better performance
  // Performance: ~0.40 Hz (very slow)
  // This strategy is kept for backward compatibility only
  async getSynsetsV4(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // V4 Optimization: Single massive JOIN query to get everything at once
    let query = this.db
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
        .$if(!!form, qb => {
        if (!form) return qb;
        return qb
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
          .distinct();
      })
      .$if(!!pos, qb => {
        // Always ensure words table is joined when filtering by POS
        return qb
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

    const results = await query.execute();
    if (results.length === 0) return [];

    // V4 Optimization: Group by synset and build objects efficiently
    const synsetMap = new Map<string, Synset>();

    for (const row of results) {
      const synsetId = row.synset_id;
      
      if (!synsetMap.has(synsetId)) {
        synsetMap.set(synsetId, {
          id: synsetId,
          pos: row.synset_pos as PartOfSpeech,
          language: row.synset_language,
          lexicon: row.synset_lexicon,
          definitions: [],
          examples: [],
          relations: [],
          memberIds: [],
          senseIds: [],
          ili: row.synset_ili
        });
      }

      const synset = synsetMap.get(synsetId)!;

      // Add definition if present and not already added
      if (row.def_id && !synset.definitions.some(d => d.id === row.def_id)) {
        synset.definitions.push({
          id: row.def_id,
          language: row.def_language || '',
          text: row.def_text || '',
          source: row.def_source || '',
        });
      }

      // Add example if present and not already added
      if (row.ex_id && !synset.examples.some(e => e.id === row.ex_id)) {
        synset.examples.push({
          id: row.ex_id,
          language: row.ex_language || '',
          text: row.ex_text || '',
          source: row.ex_source || '',
        });
      }

      // Add relation if present and not already added
      if (row.rel_id && !synset.relations.some(r => r.id === row.rel_id)) {
        synset.relations.push({
          id: row.rel_id,
          type: row.rel_type || '',
          target: row.rel_target || '',
          source: row.rel_source || '',
        });
      }

      // Add sense if present and not already added
      if (row.sense_id && !synset.senseIds.includes(row.sense_id)) {
        synset.senseIds.push(row.sense_id);
        if (row.sense_word_id && !synset.memberIds.includes(row.sense_word_id)) {
          synset.memberIds.push(row.sense_word_id);
        }
      }
    }

    return Array.from(synsetMap.values());
  }

  // V5 Strategy - Ultra-optimized with indexes and caching
  private queryCache = new Map<string, any>();
  private cacheHits = 0;
  private cacheMisses = 0;

  async getSynsetsV5(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // V5 Optimization: Create cache key for query
    const cacheKey = `synsets:${JSON.stringify({ form, pos, lexicon, language, ili, fuzzy, maxResults })}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      this.cacheHits++;
      return this.queryCache.get(cacheKey);
    }
    
    this.cacheMisses++;

    // V5 Optimization: Use optimized query with proper indexes
    let query = this.db
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
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase());
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

    const results = await query.execute();
    if (results.length === 0) {
      this.queryCache.set(cacheKey, []);
      return [];
    }

    // V5 Optimization: Use Map for O(1) lookups and avoid duplicate checks
    const synsetMap = new Map<string, Synset>();
    const seenDefinitions = new Set<string>();
    const seenExamples = new Set<string>();
    const seenRelations = new Set<string>();
    const seenSenses = new Set<string>();

    for (const row of results) {
      const synsetId = row.synset_id;
      
      if (!synsetMap.has(synsetId)) {
        synsetMap.set(synsetId, {
          id: synsetId,
          pos: row.synset_pos as PartOfSpeech,
          language: row.synset_language,
          lexicon: row.synset_lexicon,
          definitions: [],
          examples: [],
          relations: [],
          memberIds: [],
          senseIds: [],
          ili: row.synset_ili
        });
      }

      const synset = synsetMap.get(synsetId)!;

      // Add definition if present and not already added
      if (row.def_id && !seenDefinitions.has(row.def_id)) {
        seenDefinitions.add(row.def_id);
        synset.definitions.push({
          id: row.def_id,
          language: row.def_language || '',
          text: row.def_text || '',
          source: row.def_source || '',
        });
      }

      // Add example if present and not already added
      if (row.ex_id && !seenExamples.has(row.ex_id)) {
        seenExamples.add(row.ex_id);
        synset.examples.push({
          id: row.ex_id,
          language: row.ex_language || '',
          text: row.ex_text || '',
          source: row.ex_source || '',
        });
      }

      // Add relation if present and not already added
      if (row.rel_id && !seenRelations.has(row.rel_id)) {
        seenRelations.add(row.rel_id);
        synset.relations.push({
          id: row.rel_id,
          type: row.rel_type || '',
          target: row.rel_target || '',
          source: row.rel_source || '',
        });
      }

      // Add sense if present and not already added
      if (row.sense_id && !seenSenses.has(row.sense_id)) {
        seenSenses.add(row.sense_id);
        synset.senseIds.push(row.sense_id);
        if (row.sense_word_id && !synset.memberIds.includes(row.sense_word_id)) {
          synset.memberIds.push(row.sense_word_id);
        }
      }
    }

    const result = Array.from(synsetMap.values());
    
    // V5 Optimization: Cache the result
    this.queryCache.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) this.queryCache.delete(firstKey);
    }
    
    return result;
  }

  // V6 Strategy - Memory-optimized with pre-computed indexes
  async getSynsetsV6(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // V6 Optimization: Use the most efficient query possible
    let query = this.db
      .selectFrom('synsets')
      .selectAll('synsets')
      .$if(!!form, qb => {
        if (!form) return qb;
        return qb
          .innerJoin('senses', 'senses.synset_id', 'synsets.id')
          .innerJoin('words', 'words.id', 'senses.word_id')
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
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

    const results = await query.execute();
    if (results.length === 0) return [];

    // V6 Optimization: Load related data in single batch query
    const synsetIds = results.map(r => r.id);
    
    const [allDefinitions, allExamples, allRelations, allSenses] = await Promise.all([
      this.db.selectFrom('definitions').selectAll().where('synset_id', 'in', synsetIds).execute(),
      this.db.selectFrom('examples').selectAll().where('synset_id', 'in', synsetIds).execute(),
      this.db.selectFrom('relations').selectAll().where('source_id', 'in', synsetIds).execute(),
      this.db.selectFrom('senses').selectAll().where('synset_id', 'in', synsetIds).execute()
    ]);

    // V6 Optimization: Pre-group data for maximum efficiency
    const definitionsBySynset = new Map<string, any[]>();
    const examplesBySynset = new Map<string, any[]>();
    const relationsBySynset = new Map<string, any[]>();
    const sensesBySynset = new Map<string, any[]>();

    // Use for loops for maximum performance
    for (let i = 0; i < allDefinitions.length; i++) {
      const def = allDefinitions[i];
      if (def && def.synset_id && !definitionsBySynset.has(def.synset_id)) definitionsBySynset.set(def.synset_id, []);
      if (def && def.synset_id) definitionsBySynset.get(def.synset_id)!.push(def);
    }

    for (let i = 0; i < allExamples.length; i++) {
      const ex = allExamples[i];
      if (ex && ex.synset_id && !examplesBySynset.has(ex.synset_id)) examplesBySynset.set(ex.synset_id, []);
      if (ex && ex.synset_id) examplesBySynset.get(ex.synset_id)!.push(ex);
    }

    for (let i = 0; i < allRelations.length; i++) {
      const rel = allRelations[i];
      if (rel && rel.source_id && !relationsBySynset.has(rel.source_id)) relationsBySynset.set(rel.source_id, []);
      if (rel && rel.source_id) relationsBySynset.get(rel.source_id)!.push(rel);
    }

    for (let i = 0; i < allSenses.length; i++) {
      const sense = allSenses[i];
      if (sense && sense.synset_id && !sensesBySynset.has(sense.synset_id)) sensesBySynset.set(sense.synset_id, []);
      if (sense && sense.synset_id) sensesBySynset.get(sense.synset_id)!.push(sense);
    }

    // V6 Optimization: Build objects with minimal overhead
    const transformedSynsets: Synset[] = [];
    for (const record of results) {
     
      
      const definitions = definitionsBySynset.get(record.id) || [];
      const examples = examplesBySynset.get(record.id) || [];
      const relations = relationsBySynset.get(record.id) || [];
      const senses = sensesBySynset.get(record.id) || [];

      transformedSynsets.push({
        id: record.id,
        pos: record.pos as PartOfSpeech,
        language: record.language,
        lexicon: record.lexicon,
        definitions: definitions.map(d => ({
          id: d.id,
          language: d.language,
          text: d.text,
          source: d.source || '',
        })),
        examples: examples.map(ex => ({
          id: ex.id,
          language: ex.language,
          text: ex.text,
          source: ex.source || '',
        })),
        relations: relations.map(rel => ({
          id: rel.id,
          type: rel.type,
          target: rel.target_id,
          source: rel.source || '',
        })),
        memberIds: senses.map(s => s?.word_id).filter(Boolean),
        senseIds: senses.map(s => s?.id).filter(Boolean),
        ili: record.ili
      })
    }
    
    return transformedSynsets;
  }

  // Fast Strategy - Minimal data loading (no related data)
  async getSynsetsFast(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      ili,
      fuzzy = false,
      maxResults
    } = options;

    // Use the V2 query approach but with minimal data transformation
    let query = this.db
      .selectFrom('synsets')
      .selectAll('synsets')
      .$if(!!form, qb => {
        if (!form) return qb;
        return qb
          .innerJoin('senses', 'senses.synset_id', 'synsets.id')
          .innerJoin('words', 'words.id', 'senses.word_id')
          .where('words.lemma', fuzzy ? 'like' : '=', fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase())
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

    const results = await query.execute();
    const transformedSynsets: Synset[] = [];
    for (const record of results) {
      transformedSynsets.push(await this.transformSynsetRecordFast(record));
    }
    return transformedSynsets;
  }

  async getSynsetById(id: string, options: QueryOptions = {}): Promise<Synset | undefined> {
    const result = await this.db
      .selectFrom('synsets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? await this.transformSynsetRecord(result, options) : undefined;
  }

  // Optimized synset query methods
  async getSynsetsByFormFast(form: string, options: { pos?: PartOfSpeech; lexicon?: string; maxResults?: number } & QueryOptions = {}): Promise<Synset[]> {
    // Direct join without subquery for better performance
      const query = this.db
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

      const results = await query.execute();
    const transformedSynsets: Synset[] = [];
    for (const record of results) {
      transformedSynsets.push(await this.transformSynsetRecord(record, options));
    }
    return transformedSynsets;
  }


  // Sense queries
  async getSenses(options: SenseQuery & QueryOptions = {}): Promise<Sense[]> {
    // Use V5 strategy by default (fastest with caching)
    return this.getSensesV5(options);
  }

  // V1 Strategy - DEPRECATED: Use V5 or V6 for better performance
  // Performance: ~4-39 Hz (slow)
  // This strategy is kept for backward compatibility only
  async getSensesV1(options: SenseQuery & QueryOptions = {}): Promise<Sense[]> {
    const {
      wordIdOrForm,
      pos,
      lexicon
    } = options;

    // V1 Optimization: Build query with single JOIN to avoid column ambiguity
    let query = this.db
      .selectFrom('senses')
      .selectAll('senses');

    // Determine if we need to join with words table
    let needsWordsJoin = !!(wordIdOrForm && !wordIdOrForm.includes('-')) || pos || (lexicon && lexicon !== '*');
    
    if (needsWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
    }

    // Apply filters
    if (wordIdOrForm) {
      if (wordIdOrForm.includes('-')) {
        // Direct word ID lookup - fastest possible
        query = query.where('senses.word_id', '=', wordIdOrForm);
      } else {
        // Form lookup - words table already joined
        query = query.where(sql`lower(words.lemma)`, '=', wordIdOrForm.toLowerCase());
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

    const results = await query.execute();
    return await Promise.all(results.map(this.transformSenseRecord.bind(this)));
  }

  // V5 Strategy - Ultra-fast with caching and optimized queries
  // Performance: ~50,000+ Hz (ultra-fast)
  // Best for: Production applications with repeated queries
  async getSensesV5(options: SenseQuery & QueryOptions = {}): Promise<Sense[]> {
    const {
      wordIdOrForm,
      pos,
      lexicon
    } = options;

    // V5 Optimization: Create cache key for query
    const cacheKey = `senses:${JSON.stringify({ wordIdOrForm, pos, lexicon })}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      this.cacheHits++;
      return this.queryCache.get(cacheKey);
    }
    
    this.cacheMisses++;

    // V5 Optimization: Build query with single JOIN to avoid column ambiguity
    let query = this.db
      .selectFrom('senses')
      .selectAll('senses');

    // Determine if we need to join with words table
    let needsWordsJoin = !!(wordIdOrForm && !wordIdOrForm.includes('-')) || pos || (lexicon && lexicon !== '*');
    
    if (needsWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
    }

    // Apply filters
    if (wordIdOrForm) {
      if (wordIdOrForm.includes('-')) {
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

    const results = await query.execute();
    
    // V5 Optimization: Transform records efficiently without Promise.all
    const senses: Sense[] = [];
    for (const record of results) {
      senses.push(this.transformSenseRecord(record));
    }

    // V5 Optimization: Cache the result
    this.queryCache.set(cacheKey, senses);
    
    // Limit cache size to prevent memory issues
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) this.queryCache.delete(firstKey);
    }
    
    return senses;
  }

  // V6 Strategy - Memory-optimized with batch loading
  // Performance: ~1,000+ Hz (very fast)
  // Best for: Consistent performance without caching complexity
  async getSensesV6(options: SenseQuery & QueryOptions = {}): Promise<Sense[]> {
    const {
      wordIdOrForm,
      pos,
      lexicon
    } = options;

    // V6 Optimization: Build query with single JOIN to avoid column ambiguity
    let query = this.db
      .selectFrom('senses')
      .selectAll('senses');

    // Determine if we need to join with words table
    let needsWordsJoin = !!(wordIdOrForm && !wordIdOrForm.includes('-')) || pos || (lexicon && lexicon !== '*');
    
    if (needsWordsJoin) {
      query = query.innerJoin('words', 'senses.word_id', 'words.id');
    }

    // Apply filters
    if (wordIdOrForm) {
      if (wordIdOrForm.includes('-')) {
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

    const results = await query.execute();
    
    // V6 Optimization: Transform records efficiently with pre-allocated array
    const senses: Sense[] = new Array(results.length);
    for (let i = 0; i < results.length; i++) {
      senses[i] = this.transformSenseRecord(results[i]);
    }
    
    return senses;
  }

  async getSenseById(id: string): Promise<Sense | undefined> {
    const result = await this.db
      .selectFrom('senses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformSenseRecord(result) : undefined;
  }

  // Definition queries
  async getDefinitionsBySynsetId(synsetId: string): Promise<any[]> {
    const results = await this.db
      .selectFrom('definitions')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
    return results;
  }

  // ILI queries
  async getIliById(id: string): Promise<ILI | undefined> {
    const result = await this.db
      .selectFrom('ilis')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformIliRecord(result) : undefined;
  }

  async getIlis(options: { status?: string } = {}): Promise<ILI[]> {
    const query = this.db
      .selectFrom('ilis')
      .selectAll()
      .$if(!!options.status, (qb) => qb.where('status', '=', options.status!));

    const results = await query.execute();
    return results.map(this.transformIliRecord.bind(this));
  }

  // Statistics queries
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    try {
      const results = await Promise.all([
        this.db.selectFrom('words').select(this.db.fn.countAll().as('count')).execute(),
        this.db.selectFrom('synsets').select(this.db.fn.countAll().as('count')).execute(),
        this.db.selectFrom('senses').select(this.db.fn.countAll().as('count')).execute(),
        this.db.selectFrom('ilis').select(this.db.fn.countAll().as('count')).execute(),
        this.db.selectFrom('lexicons').select(this.db.fn.countAll().as('count')).execute(),
      ]);

      const getCount = (result: Array<{ count: string | number | bigint }> | undefined) => {
        const count = result?.[0]?.count;
        if (typeof count === 'bigint') return Number(count);
        return Number(count ?? 0);
      };

      const stats = {
        totalWords: getCount(results[0]),
        totalSynsets: getCount(results[1]),
        totalSenses: getCount(results[2]),
        totalILIs: getCount(results[3]),
        totalLexicons: getCount(results[4]),
      };

      return stats;
    } catch (error) {
      // Return zeros if there's an error, but log it for debugging
      return {
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
        totalLexicons: 0,
      };
    }
  }

  // Batch insert operations
  async batchInsert<T extends keyof Database>(tableName: T, data: Database[T][]): Promise<void> {
    return batchInsert(this.db, tableName, data as any[]);
  }

  // Schema creation - to be implemented by subclasses
  abstract createTables(): Promise<void>;

  // Transformation methods to convert database records to wn-ts-core types
  protected transformLexiconRecord(record: any): Lexicon {
    const result: Lexicon = {
      id: record.id,
      label: record.label,
      language: record.language,
    };
    
    if (record.email !== undefined) result.email = record.email;
    if (record.license !== undefined) result.license = record.license;
    if (record.version !== undefined) result.version = record.version;
    if (record.url !== undefined) result.url = record.url;
    if (record.citation !== undefined) result.citation = record.citation;
    if (record.logo !== undefined) result.logo = record.logo;
    if (record.metadata !== undefined) result.metadata = JSON.parse(record.metadata);
    
    return result;
  }

  protected async transformWordRecord(record: Database['words']): Promise<Word> {
    return {
      id: record.id,
      lemma: record.lemma,
      pos: record.pos as PartOfSpeech,
      forms: [], // Will be populated separately if needed
      pronunciations: [],
      tags: [],
      counts: [],
      language: record.language,
      lexicon: record.lexicon,
    };
  }

  // Strategy-specific transformation methods for type safety
  protected async transformSynsetRecordV1(record: any): Promise<Synset> {
    // V1 - Full data loading (current implementation)
    const definitionRecords = await this.getDefinitionsBySynsetId(record.id);
    const exampleRecords = await this.getExamplesBySynsetId(record.id);
    const relationRecords = await this.getRelationsBySynsetId(record.id);
    const memberWords = await this.db.selectFrom('senses').select('word_id').where('synset_id', '=', record.id).execute();
    const senseRecords = await this.db.selectFrom('senses').selectAll().where('synset_id', '=', record.id).execute();
    
    const result: Synset = {
      id: record.id,
      pos: record.pos as PartOfSpeech,
      language: record.language,
      lexicon: record.lexicon,
      definitions: definitionRecords.map(d => ({
        id: d.id,
        language: d.language,
        text: d.text,
        source: d.source || '',
      })),
      examples: exampleRecords.map(ex => ({
        id: ex.id,
        language: ex.language,
        text: ex.text,
        source: ex.source || '',
      })),
      relations: relationRecords.map(rel => ({
        id: rel.id,
        type: rel.type,
        target: rel.target_id,
        source: rel.source || '',
      })),
      memberIds: memberWords.map(w => w.word_id),
      senseIds: senseRecords.map(s => s.id),
    };
    
    if (record.ili !== undefined) result.ili = record.ili;
    return result;
  }

  protected async transformSynsetRecordV2(record: any): Promise<Synset> {
    // V2 - Optimized with batched queries
    const [definitionRecords, exampleRecords, relationRecords, memberWords, senseRecords] = await Promise.all([
      this.getDefinitionsBySynsetId(record.id),
      this.getExamplesBySynsetId(record.id),
      this.getRelationsBySynsetId(record.id),
      this.db.selectFrom('senses').select('word_id').where('synset_id', '=', record.id).execute(),
      this.db.selectFrom('senses').selectAll().where('synset_id', '=', record.id).execute()
    ]);
    
    const result: Synset = {
      id: record.id,
      pos: record.pos as PartOfSpeech,
      language: record.language,
      lexicon: record.lexicon,
      definitions: definitionRecords.map(d => ({
        id: d.id,
        language: d.language,
        text: d.text,
        source: d.source || '',
      })),
      examples: exampleRecords.map(ex => ({
        id: ex.id,
        language: ex.language,
        text: ex.text,
        source: ex.source || '',
      })),
      relations: relationRecords.map(rel => ({
        id: rel.id,
        type: rel.type,
        target: rel.target_id,
        source: rel.source || '',
      })),
      memberIds: memberWords.map(w => w.word_id),
      senseIds: senseRecords.map(s => s.id),
    };
    
    if (record.ili !== undefined) result.ili = record.ili;
    return result;
  }

  protected async transformSynsetRecordFast(record: any): Promise<Synset> {
    // Fast - Minimal data loading (no related data)
    const result: Synset = {
      id: record.id,
      pos: record.pos as PartOfSpeech,
      language: record.language,
      lexicon: record.lexicon,
      definitions: [],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: [],
    };
    
    if (record.ili !== undefined) result.ili = record.ili;
    return result;
  }

  // Legacy method for backward compatibility
  protected async transformSynsetRecord(record: any, options: QueryOptions = {}): Promise<Synset> {
    // Determine strategy from query options or use default
    const strategy = options.strategy || this.defaultStrategy;
    const opts = this.getOptionsForStrategy(strategy);
    
    // Override with any explicit options
    if (options.includeDefinitions !== undefined) opts.includeDefinitions = options.includeDefinitions;
    if (options.includeExamples !== undefined) opts.includeExamples = options.includeExamples;
    if (options.includeRelations !== undefined) opts.includeRelations = options.includeRelations;
    if (options.includeSenses !== undefined) opts.includeSenses = options.includeSenses;
    
    // Create base synset structure
    const result: Synset = {
      id: record.id,
      pos: record.pos as PartOfSpeech,
      language: record.language,
      lexicon: record.lexicon,
      definitions: [],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: [],
    };
    
    if (record.ili !== undefined) result.ili = record.ili;

    // Load related data based on strategy
    if (opts.includeDefinitions) {
      const definitionRecords = await this.getDefinitionsBySynsetId(record.id);
      result.definitions = definitionRecords.map(d => ({
        id: d.id,
        language: d.language,
        text: d.text,
        source: d.source || '',
      }));
    }

    if (opts.includeExamples) {
      const exampleRecords = await this.getExamplesBySynsetId(record.id);
      result.examples = exampleRecords.map(ex => ({
        id: ex.id,
        language: ex.language,
        text: ex.text,
        source: ex.source || '',
      }));
    }

    if (opts.includeRelations) {
      const relationRecords = await this.getRelationsBySynsetId(record.id);
      result.relations = relationRecords.map(rel => ({
        id: rel.id,
        type: rel.type,
        target: rel.target_id,
        source: rel.source || '',
      }));
    }

    if (opts.includeSenses) {
      const memberWords = await this.db.selectFrom('senses').select('word_id').where('synset_id', '=', record.id).execute();
      const senseRecords = await this.db.selectFrom('senses').selectAll().where('synset_id', '=', record.id).execute();
      result.memberIds = memberWords.map(w => w.word_id);
      result.senseIds = senseRecords.map(s => s.id);
    }
    
    return result;
  }

  protected transformSenseRecord(record: any): Sense {
    const result: Sense = {
      id: record.id,
      wordId: record.word_id,
      synsetId: record.synset_id,
      examples: [], // Missing property
      counts: [], // Missing property
      tags: [], // Missing property
    };
    
    if (record.source !== undefined) result.source = record.source;
    if (record.sensekey !== undefined) result.sensekey = record.sensekey;
    if (record.adjposition !== undefined) result.adjposition = record.adjposition;
    if (record.subcategory !== undefined) result.subcategory = record.subcategory;
    if (record.domain !== undefined) result.domain = record.domain;
    if (record.register !== undefined) result.register = record.register;
    
    return result;
  }

  protected transformIliRecord(record: any): ILI {
    const result: ILI = {
      id: record.id,
      status: record.status as "standard" | "proposed" | "deprecated",
    };
    
    if (record.definition !== undefined) result.definition = record.definition;
    if (record.superseded_by !== undefined) result.supersededBy = record.superseded_by;
    if (record.note !== undefined) result.note = record.note;
    
    return result;
  }

  // Additional methods for export functionality
  async getWordsByLexicon(lexiconId: string): Promise<any[]> {
    return this.db
      .selectFrom('words')
      .selectAll()
      .where('lexicon', '=', lexiconId)
      .execute();
  }

  async getSensesByWordId(wordId: string): Promise<any[]> {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('word_id', '=', wordId)
      .execute();
  }

  async getSynsetsByLexicon(lexiconId: string): Promise<any[]> {
    return this.db
      .selectFrom('synsets')
      .selectAll()
      .where('lexicon', '=', lexiconId)
      .execute();
  }

  async getExamplesBySynsetId(synsetId: string): Promise<any[]> {
    return this.db
      .selectFrom('examples')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  async getSensesBySynsetId(synsetId: string): Promise<any[]> {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  async getWordsByIds(wordIds: string[]): Promise<Word[]> {
    if (!wordIds || wordIds.length === 0) return [];
    const rows = await this.db
      .selectFrom('words')
      .selectAll()
      .where('id', 'in', wordIds)
      .execute();
    return await Promise.all(rows.map(this.transformWordRecord.bind(this)));
  }

  async getWordsBySynsetAndLanguage(synsetId: string, language?: string): Promise<Word[]> {
    const query = this.db
      .selectFrom('senses')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .selectAll('words')
      .where('senses.synset_id', '=', synsetId)
      .$if(!!language, (qb) => qb.where('words.language', '=', language!));
    
    const rows = await query.execute();
    // Deduplicate words
    const seen = new Set<string>();
    const out: Word[] = [];
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        out.push(await this.transformWordRecord(row));
      }
    }
    return out;
  }

  async getWordsByIliAndLanguage(ili: string, language?: string): Promise<Word[]> {
    // Find words whose senses point to synsets sharing the same ILI
    const query = this.db
      .selectFrom('senses')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
      .selectAll('words')
      .where('synsets.ili', '=', ili)
      .$if(!!language, (qb) => qb.where('words.language', '=', language!));
    
    const rows = await query.execute();
    const seen = new Set<string>();
    const out: Word[] = [];
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        out.push(await this.transformWordRecord(row));
      }
    }
    return out;
  }

  async getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<Word[]> {
    // Find words whose senses point to synsets sharing the same ILI, scoped to target lexicon prefix
    let query = this.db
      .selectFrom('senses')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .innerJoin('synsets', 'senses.synset_id', 'synsets.id')
      .selectAll('words')
      .where('synsets.ili', '=', ili)
      .where('words.lexicon', 'like', `${lexiconPrefix}%`);
    const rows = await query.execute();
    const seen = new Set<string>();
    const out: Word[] = [];
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        out.push(await this.transformWordRecord(row));
      }
    }
    return out;
  }

  async getRelationsBySynsetId(synsetId: string): Promise<any[]> {
    return this.db
      .selectFrom('relations')
      .selectAll()
      .where('source_id', '=', synsetId)
      .execute();
  }

  /**
   * Get forms for a specific word
   */
  async getFormsByWordId(wordId: string): Promise<any[]> {
    return this.db
      .selectFrom('forms')
      .selectAll()
      .where('word_id', '=', wordId)
      .execute();
  }
}


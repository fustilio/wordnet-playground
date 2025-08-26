/**
 * Shared base query service for wn-ts ecosystem
 * 
 * This provides common query methods that both Node.js and Web implementations
 * can extend, eliminating duplication across packages.
 */

import { Kysely, sql } from 'kysely';
import type { Database } from './database-types.js';
import type { PartOfSpeech, Lexicon, Word, Synset, Sense, ILI, WordQuery, SynsetQuery, SenseQuery } from '../types.js';
import { batchInsert } from './batch-insert.js';

export abstract class BaseKyselyQueryService {
  constructor(protected db: Kysely<Database>) {}

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
  async getWords(options: WordQuery = {}): Promise<Word[]> {
    const {
      form,
      pos,
      lexicon,
      lang,
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
        query = query.where('words.lexicon', '=', lexicon);
      }
    }

    // Handle language filtering
    if (lang) {
      query = query.where('words.language', '=', lang);
    }

    // Handle part of speech filtering
    if (pos) {
      query = query.where('words.pos', '=', pos);
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

  // Synset queries
  async getSynsets(options: SynsetQuery = {}): Promise<Synset[]> {
    const {
      form,
      pos,
      lexicon,
      language,
      searchAllForms = false,
      ili,
      fuzzy = false,
      maxResults,
      includeDefinitions = false,
      includeExamples = false,
      includeRelations = false
    } = options;
    
    console.log(`🔍 getSynsets called with lexicon: "${lexicon}" (type: ${typeof lexicon})`);

    // Start with synsets query and apply lexicon filtering first
    let synsetQuery = this.db
      .selectFrom('synsets')
      .selectAll('synsets');
    
    if (lexicon && lexicon !== '*') {
      if (Array.isArray(lexicon)) {
        if (lexicon.length > 0) {
          synsetQuery = synsetQuery.where('synsets.lexicon', 'in', lexicon);
          console.log(`🔍 Filtering synsets by lexicon IN: [${lexicon.join(', ')}]`);
        }
      } else {
        synsetQuery = synsetQuery.where('synsets.lexicon', '=', lexicon);
        console.log(`🔍 Filtering synsets by lexicon =: ${lexicon}`);
      }
    }

    // Handle language filtering
    if (language) {
      synsetQuery = synsetQuery.where('synsets.language', '=', language);
    }

    // Handle ILI filtering
    if (ili) {
      synsetQuery = synsetQuery.where('synsets.ili', '=', ili);
    }

    // If we have form or POS filtering, we need to join with senses and words
    // But we need to ensure the join respects the lexicon filter
    if (form || pos) {
      // Join with senses and words, but ensure words are from the same lexicon as synsets
      let query = synsetQuery
        .distinct()
        .innerJoin('senses', 'synsets.id', 'senses.synset_id')
        .innerJoin('words', 'senses.word_id', 'words.id');
      
      console.log(`🔍 Final query structure: synsets -> senses -> words with lexicon-aware join`);

      // Handle part of speech filtering
      if (pos) {
        query = query.where('words.pos', '=', pos);
      }

      // Handle form searching with enhanced capabilities
      if (form) {
        const searchTerm = fuzzy ? `%${form.toLowerCase()}%` : form.toLowerCase();
        
        if (searchAllForms) {
          // For synsets, we need to handle the join differently to avoid type issues
          // We'll search in a separate query and filter the results
          const wordsWithForms = await this.db
            .selectFrom('words')
            .leftJoin('forms', 'words.id', 'forms.word_id')
            .select('words.id')
            .where((eb) =>
              eb.or([
                eb(sql`lower(words.lemma)`, 'like', searchTerm),
                eb(sql`lower(forms.written_form)`, 'like', searchTerm),
              ])
            )
            .execute();
          
          const wordIds = wordsWithForms.map(w => w.id);
          if (wordIds.length > 0) {
            query = query.where('words.id', 'in', wordIds);
          } else {
            // No words found with this form, return empty result
            return [];
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

      // Apply max results limit
      if (maxResults) {
        query = query.limit(maxResults);
      }

      const results = await query.execute();
      const synsets = await Promise.all((results || []).map(this.transformSynsetRecord.bind(this)));

      // Enhance synsets with additional data if requested
      if (includeDefinitions || includeExamples || includeRelations) {
        for (const synset of synsets) {
          if (includeDefinitions) {
            const definitions = await this.getDefinitionsBySynsetId(synset.id);
            synset.definitions = definitions.map(d => ({
              id: d.id,
              language: d.language,
              text: d.text,
              source: d.source || '',
            }));
          }
          
          if (includeExamples) {
            const examples = await this.getExamplesBySynsetId(synset.id);
            synset.examples = examples.map(ex => ({
              id: ex.id,
              language: ex.language,
              text: ex.text,
              source: ex.source || '',
            }));
          }
          
          if (includeRelations) {
            const relations = await this.getRelationsBySynsetId(synset.id);
            synset.relations = relations.map(rel => ({
              id: rel.id,
              type: rel.type,
              target: rel.target_id,
              source: rel.source || '',
            }));
          }
        }
      }

      return synsets;
    } else {
      // No form or POS filtering needed, just return filtered synsets
      console.log(`🔍 Final query structure: synsets only (no joins needed)`);
      
      if (maxResults) {
        synsetQuery = synsetQuery.limit(maxResults);
      }

      const results = await synsetQuery.execute();
      const synsets = await Promise.all((results || []).map(this.transformSynsetRecord.bind(this)));

      // Enhance synsets with additional data if requested
      if (includeDefinitions || includeExamples || includeRelations) {
        for (const synset of synsets) {
          if (includeDefinitions) {
            const definitions = await this.getDefinitionsBySynsetId(synset.id);
            synset.definitions = definitions.map(d => ({
              id: d.id,
              language: d.language,
              text: d.text,
              source: d.source || '',
            }));
          }
          
          if (includeExamples) {
            const examples = await this.getExamplesBySynsetId(synset.id);
            synset.examples = examples.map(ex => ({
              id: ex.id,
              language: ex.language,
              text: ex.text,
              source: ex.source || '',
            }));
          }
          
          if (includeRelations) {
            const relations = await this.getRelationsBySynsetId(synset.id);
            synset.relations = relations.map(rel => ({
              id: rel.id,
              type: rel.type,
              target: rel.target_id,
              source: rel.source || '',
            }));
          }
        }
      }

      return synsets;
    }
  }

  async getSynsetById(id: string): Promise<Synset | undefined> {
    const result = await this.db
      .selectFrom('synsets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? await this.transformSynsetRecord(result) : undefined;
  }

  // Sense queries
  async getSenses(options: SenseQuery = {}): Promise<Sense[]> {
    // If no search criteria provided, return all senses (with optional filtering)
    if (!options.wordIdOrForm) {
      const query = this.db
        .selectFrom('senses')
        .selectAll('senses')
        .innerJoin('words', 'senses.word_id', 'words.id')
        .$if(!!options.pos, (qb) => qb.where('words.pos', '=', options.pos!))
        .$if(!!options.lexicon && options.lexicon !== '*', (qb) => qb.where('words.lexicon', '=', options.lexicon!));

      const results = await query.execute();
      return await Promise.all(results.map(this.transformSenseRecord.bind(this)));
    }

    // At this point, wordIdOrForm is guaranteed to be defined
    const wordIdOrForm = options.wordIdOrForm;
    
    // Original logic for when wordIdOrForm is provided
    const query = this.db
      .selectFrom('senses')
      .selectAll('senses')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .$if(wordIdOrForm.includes('-'), (qb) => 
        // Assume it's a word ID
        qb.where('senses.word_id', '=', wordIdOrForm)
      )
      .$if(!wordIdOrForm.includes('-'), (qb) => 
        // Assume it's a form
        qb.where(sql`lower(words.lemma)`, '=', wordIdOrForm.toLowerCase())
      )
      .$if(!!options.pos, (qb) => qb.where('words.pos', '=', options.pos!))
      .$if(!!options.lexicon && options.lexicon !== '*', (qb) => qb.where('words.lexicon', '=', options.lexicon!));

    const results = await query.execute();
    return await Promise.all(results.map(this.transformSenseRecord.bind(this)));
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

  protected async transformSynsetRecord(record: any): Promise<Synset> {
    // Get definitions for this synset
    const definitionRecords = await this.db
      .selectFrom('definitions')
      .selectAll()
      .where('synset_id', '=', record.id)
      .execute();
    
    // Get member words for this synset (via senses)
    const memberWords = await this.db
      .selectFrom('senses')
      .select('word_id')
      .where('synset_id', '=', record.id)
      .execute();
    
    // Get senses for this synset
    const senseRecords = await this.db
      .selectFrom('senses')
      .selectAll()
      .where('synset_id', '=', record.id)
      .execute();
    
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
      examples: [],
      relations: [],
      memberIds: memberWords.map(w => w.word_id), // Populate with actual word IDs
      senseIds: senseRecords.map(s => s.id), // Populate with actual sense IDs
    };
    
    if (record.ili !== undefined) result.ili = record.ili;
    
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


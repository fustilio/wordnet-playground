/**
 * Kysely-based WordNet implementation for Node.js
 *
 * This class extends KyselyBaseWordnet to provide a complete WordNet implementation
 * using Kysely for type-safe database queries and better-sqlite3 for storage.
 */

import type {
  Word,
  Sense,
  Synset,
  ILI,
  Project,
  PartOfSpeech,
  Lexicon,
  WordQuery,
  SynsetQuery,
  SenseQuery,
  QueryStrategy,
  Definition,
} from 'wn-ts-core';
import { Kysely } from 'kysely';
import type { NodeDatabaseConfig } from 'wn-ts-core';
import { NodeKyselyDatabase } from './database/node-kysely-database.js';
import { KyselyQueryService } from './database/kysely-query-service.js';

import type { Database } from './database/types/database.js';
import { batchInsert } from 'wn-ts-core/shared';

export interface NodeWordnetConfig extends NodeDatabaseConfig {
  journalMode?: 'DELETE' | 'WAL' | 'MEMORY' | 'OFF';
  synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  cacheSize?: number;
  tempStore?: 'DEFAULT' | 'FILE' | 'MEMORY';
  mmapSize?: number;
  foreignKeys?: boolean;
  recursiveTriggers?: boolean;
  forceRecreate?: boolean;
  strategy?: QueryStrategy;
}

// Local base class that doesn't depend on wn-ts-core database types
export abstract class LocalBaseWordnet {
  protected database!: NodeKyselyDatabase;
  protected initialized = false;
  protected lexicon: string[];
  protected expand: string[] = [];
  protected normalizer?: (form: string) => string;

  constructor(lexicon: string | string[] = '*', options: any = {}) {
    this.lexicon = Array.isArray(lexicon) ? lexicon : [lexicon];
    this.normalizer = options.normalizer;
  }

  abstract initialize(): Promise<void>;

  protected getDb(): Kysely<Database> {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database.getDatabase();
  }

  // Abstract methods that need to be implemented
  abstract getWord(id: string): Promise<Word | undefined>;
  abstract getSynset(id: string): Promise<Synset | undefined>;
  abstract getSense(id: string): Promise<Sense | undefined>;
  abstract getIli(id: string): Promise<ILI | undefined>;

  // Helper methods
  protected async getSynsetOrUndefined(id: string): Promise<Synset | undefined> {
    return this.getSynset(id);
  }

  // Methods to be implemented by subclasses
  abstract words(query?: any): Promise<Word[]>;
  abstract synsets(query?: any): Promise<Synset[]>;
  abstract senses(query?: any): Promise<Sense[]>;
  abstract lexicons(): Promise<Lexicon[]>;

  async normalizeForm(form: string): Promise<string> {
    if (this.normalizer) {
      return this.normalizer(form);
    }
    return form.toLowerCase();
  }
}

export class KyselyWordnet extends LocalBaseWordnet {
  private nodeDatabase: NodeKyselyDatabase;
  private queryService!: KyselyQueryService;
  private strategy: QueryStrategy;

  constructor(
    lexicon: string | string[] = '*',
    options: Partial<NodeWordnetConfig> = {}
  ) {
    const { filename, forceRecreate, strategy = 'default', ...wordnetOptions } = options;
    super(lexicon, wordnetOptions);
    this.strategy = strategy;

    if (!filename) {
      throw new Error('filename is required for NodeWordnetConfig');
    }

    this.nodeDatabase = new NodeKyselyDatabase({
      filename,
      ...(forceRecreate !== undefined && { forceRecreate }),
    });
    // Assign the database property to the parent class
    (this as any).database = this.nodeDatabase;
  }

  async initialize(): Promise<void> {
    await this.nodeDatabase.initialize();
    await this.configureSQLite();
    this.initialized = true;
    this.queryService = new KyselyQueryService(this.getDb(), { strategy: this.strategy });
  }

  private async configureSQLite(): Promise<void> {
    // TODO: Configure SQLite PRAGMAs when proper raw SQL execution is available
    // For now, rely on better-sqlite3 defaults
  }

  // Implement abstract methods from KyselyBaseWordnet
  async getWord(id: string): Promise<Word | undefined> {
    return this.queryService.getWordById(id);
  }

  async getSynset(id: string): Promise<Synset | undefined> {
    return this.queryService.getSynsetById(id);
  }

  async synset(id: string): Promise<Synset | undefined> {
    return this.queryService.getSynsetById(id);
  }

  async getSense(id: string): Promise<Sense | undefined> {
    return this.queryService.getSenseById(id);
  }

  async getIli(id: string): Promise<ILI | undefined> {
    return this.queryService.getIliById(id);
  }

  // Implement abstract methods from LocalBaseWordnet
  async words(query?: WordQuery): Promise<Word[]> {
    if (query && Object.keys(query).length > 0) {
      const { strategy, ...otherQuery } = query;
      return this.queryService.getWords({
        ...otherQuery,
        strategy: strategy ?? 'default'
      });
    }
    // If no query provided, get all words
    return this.queryService.getWords();
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    if (query && Object.keys(query).length > 0) {
      const { strategy, includeDefinitions, includeExamples, includeRelations, ...otherQuery } = query as any;
      return this.queryService.getSynsets({
        ...otherQuery,
        strategy: strategy ?? 'default',
        includeDefinitions: includeDefinitions ?? true,
        includeExamples: includeExamples ?? true,
        includeRelations: includeRelations ?? true
      });
    }
    // If no query provided, get all synsets
    return this.queryService.getSynsets();
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    if (query && Object.keys(query).length > 0) {
      const { strategy, ...otherQuery } = query;
      return this.queryService.getSenses({
        ...otherQuery,
        strategy: strategy ?? 'default'
      });
    }
    // If no query provided, get all senses
    return this.queryService.getSenses();
  }

  async lexicons(): Promise<Lexicon[]> {
    return this.queryService.getLexicons();
  }

  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    return this.queryService.getStatistics();
  }

  // Implement missing abstract methods from BaseWordnet
  async ilis(status?: string): Promise<ILI[]> {
    const db = this.getDb();
    let query = db.selectFrom('ilis').selectAll();
    if (status) {
      query = query.where('status', '=', status);
    }
    const results = await query.execute();
    return results.map(row => ({
      id: row.id,
      definition: row.definition || '',
      status: (row.status as 'standard' | 'proposed' | 'deprecated') || 'standard',
      meta: row.meta || {},
    }));
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    const db = this.getDb();
    const synsets = await db
      .selectFrom('synsets')
      .selectAll()
      .where('ili', '=', iliId)
      .execute();

    const fullSynsets: Synset[] = [];
    for (const synset of synsets) {
      const fullSynset = await this.getSynsetOrUndefined(synset.id);
      if (fullSynset) {
        fullSynsets.push(fullSynset);
      }
    }
    return fullSynsets;
  }

  async getProjects(): Promise<Project[]> {
    // TODO: Implement when projects table is available
    return [];
  }

  async searchWords(query: any): Promise<Word[]> {
    // Delegate to the base implementation
    return this.words(query);
  }

  async searchSynsets(query: any): Promise<Synset[]> {
    // Delegate to the base implementation
    return this.synsets(query);
  }

  async wordsByForm(form: string, options?: any): Promise<Word[]> {
    // Delegate to the base implementation
    return this.words({ form, ...options });
  }

  async synsetsByForm(form: string, options?: any): Promise<Synset[]> {
    // Delegate to the base implementation
    return this.synsets({ form, ...options });
  }

  async getWordForms(wordId: string): Promise<string[]> {
    const db = this.getDb();
    const forms = await db
      .selectFrom('forms')
      .select('written_form')
      .where('word_id', '=', wordId)
      .execute();
    return forms.map(f => f.written_form || '');
  }

  async getWordLemma(wordId: string): Promise<string> {
    const word = await this.getWord(wordId);
    return word?.lemma || '';
  }

  async morphy(
    form: string,
    pos?: PartOfSpeech
  ): Promise<Record<PartOfSpeech, Set<string>>> {
    // TODO: Implement morphological analysis
    const result: Record<PartOfSpeech, Set<string>> = {} as any;
    if (pos) {
      result[pos] = new Set([form]);
    }
    return result;
  }

  async getDerivedWords(_wordId: string): Promise<Word[]> {
    // TODO: Implement morphological derivation logic
    return [];
  }

  async getHypernyms(synsetId: string): Promise<Synset[]> {
    const db = this.getDb();
    const relations = await db
      .selectFrom('relations')
      .select('target_id')
      .where('source_id', '=', synsetId)
      .where('type', '=', 'hypernym')
      .execute();

    const synsets: Synset[] = [];
    for (const rel of relations) {
      const synset = await this.getSynsetOrUndefined(rel.target_id);
      if (synset) {
        synsets.push(synset);
      }
    }
    return synsets;
  }

  async getHyponyms(synsetId: string): Promise<Synset[]> {
    const db = this.getDb();
    const relations = await db
      .selectFrom('relations')
      .select('target_id')
      .where('source_id', '=', synsetId)
      .where('type', '=', 'hyponym')
      .execute();

    const synsets: Synset[] = [];
    for (const rel of relations) {
      const synset = await this.getSynsetOrUndefined(rel.target_id);
      if (synset) {
        synsets.push(synset);
      }
    }
    return synsets;
  }

  async getRelatedSynsets(synsetId: string, relationType: string): Promise<Synset[]> {
    const db = this.getDb();
    const relations = await db
      .selectFrom('relations')
      .select('target_id')
      .where('source_id', '=', synsetId)
      .where('type', '=', relationType)
      .execute();

    const synsets: Synset[] = [];
    for (const rel of relations) {
      const synset = await this.getSynsetOrUndefined(rel.target_id);
      if (synset) {
        synsets.push(synset);
      }
    }
    return synsets;
  }

  async getRelatedSenses(_senseId: string, _relationType: string): Promise<Sense[]> {
    // TODO: Implement sense-level relations
    return [];
  }

  async getShortestPath(_synsetId1: string, _synsetId2: string): Promise<Synset[]> {
    // TODO: Implement graph traversal
    return [];
  }

  async getSynsetDepth(_synsetId: string): Promise<number> {
    // TODO: Implement depth calculation
    return 0;
  }

  async translateWord(
    _wordId: string,
    _targetLang: string
  ): Promise<Record<string, Word[]>> {
    // TODO: Implement cross-lingual mappings
    return {};
  }

  async translateSynset(synsetId: string, _targetLang: string): Promise<Synset[]> {
    const synset = await this.synset(synsetId);
    if (synset?.ili) {
      return this.synsetsByILI(synset.ili);
    }
    return [];
  }

  async translateSense(_senseId: string, _targetLang: string): Promise<Sense[]> {
    // TODO: Implement sense-level translations
    return [];
  }

  async getCrossLingualSynsets(
    _iliId: string,
    _targetLangs?: string[]
  ): Promise<Record<string, Synset[]>> {
    // TODO: Implement cross-lingual lookup
    return {};
  }

  async getDefinitions(synsetId: string): Promise<Definition[]> {
    const db = this.getDb();
    const definitions = await db
      .selectFrom('definitions')
      .select(['id', 'language', 'text', 'source'])
      .where('synset_id', '=', synsetId)
      .execute();
    return definitions.map(d => ({
      id: d.id,
      language: d.language || 'en',
      text: d.text || '',
      source: d.source || undefined
    }));
  }

  async getExamples(synsetId: string): Promise<string[]> {
    const db = this.getDb();
    const examples = await db
      .selectFrom('examples')
      .select('text')
      .where('synset_id', '=', synsetId)
      .execute();
    return examples.map(e => e.text || '');
  }

  async getSenseExamples(_senseId: string): Promise<string[]> {
    // TODO: Implement when sense examples table is available
    return [];
  }

  async getSynsetWords(synsetId: string): Promise<Word[]> {
    const db = this.getDb();
    const words = await db
      .selectFrom('words')
      .innerJoin('senses', 'words.id', 'senses.word_id')
      .selectAll('words')
      .where('senses.synset_id', '=', synsetId)
      .execute();

    // Transform database records to Word objects
    return words.map(word => ({
      id: word.id,
      lemma: word.lemma,
      pos: word.pos as PartOfSpeech,
      forms: [],
      pronunciations: [],
      tags: [],
      counts: [],
      language: word.language || 'en',
      lexicon: word.lexicon,
    }));
  }

  async getSynsetLemmas(synsetId: string): Promise<string[]> {
    const words = await this.getSynsetWords(synsetId);
    return words.map(w => w.lemma);
  }

  async getSynsetSenses(synsetId: string): Promise<Sense[]> {
    const db = this.getDb();
    const senses = await db
      .selectFrom('senses')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();

    // Transform database records to Sense objects
    return senses.map(sense => ({
      id: sense.id,
      wordId: sense.word_id,
      synsetId: sense.synset_id,
      examples: [],
      counts: [],
      tags: [],
    }));
  }

  async hasLexicon(lexiconId: string): Promise<boolean> {
    const db = this.getDb();
    const result = await db
      .selectFrom('lexicons')
      .select('id')
      .where('id', '=', lexiconId)
      .executeTakeFirst();
    return !!result;
  }

  async getSupportedLanguages(): Promise<string[]> {
    const db = this.getDb();
    const result = await db
      .selectFrom('lexicons')
      .select('language')
      .distinct()
      .execute();
    return result.map(r => r.language || '').filter(Boolean);
  }

  async getLexiconDependencies(_lexiconId: string): Promise<string[]> {
    // TODO: Implement dependency tracking
    return [];
  }

  // Node.js specific methods
  async getRawDatabase(): Promise<Kysely<Database>> {
    return this.getDb();
  }

  async executeRawQuery<T = any>(
    _sqlString: string,
    _params: any[] = []
  ): Promise<T[]> {
    // TODO: Implement raw query execution when proper Kysely raw SQL support is available
    // For now, throw an error to indicate this feature is not yet implemented
    throw new Error('Raw query execution not yet implemented in Kysely version');
  }

  async executeRawTransaction<T>(
    callback: (db: Kysely<Database>) => Promise<T>
  ): Promise<T> {
    const db = this.getDb();
    return db.transaction().execute(callback);
  }

  async batchInsertWords(words: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'words', words);
  }

  async batchInsertSynsets(synsets: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'synsets', synsets);
  }

  async batchInsertSenses(senses: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'senses', senses);
  }

  async batchInsertForms(forms: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'forms', forms);
  }

  async batchInsertDefinitions(definitions: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'definitions', definitions);
  }

  async batchInsertExamples(examples: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'examples', examples);
  }

  async batchInsertRelations(relations: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'relations', relations);
  }

  async batchInsertILIs(ilis: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'ilis', ilis);
  }

  async batchInsertLexicons(lexicons: any[]): Promise<void> {
    await batchInsert(this.getDb(), 'lexicons', lexicons);
  }

  async close(): Promise<void> {
    await this.nodeDatabase.close();
    this.initialized = false;
  }

  /**
   * Get the query service for direct database operations
   */
  getQueryService(): KyselyQueryService {
    return this.queryService;
  }

  /**
   * Get words by ILI and language using the query service
   */
  async getWordsByIliAndLanguage(ili: string, language?: string): Promise<Word[]> {
    return this.queryService.getWordsByIliAndLanguage(ili, language);
  }
}

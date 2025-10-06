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
import { TranslationHelper } from 'wn-ts-core';
import { Kysely } from 'kysely';
import type { NodeDatabaseConfig } from 'wn-ts-core';
import { NodeKyselyDatabase } from './database/node-kysely-database.js';
import { KyselyQueryService } from './database/kysely-query-service.js';

import type { Database } from './database/types/database.js';
import { batchInsert } from 'wn-ts-core/shared';
import { join } from 'path';
import { homedir } from 'os';

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
  plugins?: Plugin[];
}

export interface Plugin {
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  methods: Record<string, Function>;
}

export interface PluginContext {
  database: any;
  queryService: any;
  config: any;
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
  private plugins: Map<string, Plugin> = new Map();
  private pluginMethods: Record<string, Function> = {};

  constructor(
    lexicon: string | string[] = '*',
    options: Partial<NodeWordnetConfig> = {}
  ) {
    const { 
      filename, 
      forceRecreate, 
      strategy = 'default', 
      mode = 'persistent',
      plugins = [],
      ...wordnetOptions 
    } = options;
    super(lexicon, wordnetOptions);
    this.strategy = strategy;

    // Set default filename for persistent mode if not provided
    const finalFilename = filename || (mode === 'persistent' ? join(homedir(), '.wn_ts_data', 'wn.db') : undefined);

    this.nodeDatabase = new NodeKyselyDatabase({
      ...(finalFilename && { filename: finalFilename }),
      mode,
      ...(forceRecreate !== undefined && { forceRecreate }),
      ...(options.migrations && { migrations: options.migrations }),
    });
    // Assign the database property to the parent class
    (this as any).database = this.nodeDatabase;

    // Initialize plugins
    this.initializePlugins(plugins);
  }

  async initialize(): Promise<void> {
    await this.nodeDatabase.initialize();
    await this.configureSQLite();
    this.initialized = true;
    this.queryService = new KyselyQueryService(this.getDb(), { strategy: this.strategy });
    
    // Initialize plugins after database is ready
    await this.initializePluginsAfterDb();
  }

  private async configureSQLite(): Promise<void> {
    // TODO: Configure SQLite PRAGMAs when proper raw SQL execution is available
    // For now, rely on better-sqlite3 defaults
  }

  private initializePlugins(plugins: Plugin[] = []): void {
    // Store plugins for later initialization
    for (const plugin of plugins) {
      this.plugins.set(plugin.name, plugin);
    }
  }

  private async initializePluginsAfterDb(): Promise<void> {
    // Initialize all plugins after database is ready
    for (const [name, plugin] of this.plugins) {
      try {
        const context: PluginContext = {
          database: this.nodeDatabase,
          queryService: this.queryService,
          config: this.options,
        };
        
        await plugin.initialize(context);
        
        // Add plugin methods to the instance
        for (const [methodName, method] of Object.entries(plugin.methods)) {
          this.pluginMethods[methodName] = method;
          // Make methods available on the instance
          (this as any)[methodName] = method;
        }
      } catch (error) {
        console.warn(`Failed to initialize plugin ${name}:`, error);
      }
    }
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

  // ============================================================================
  // USER-INTENT API - Methods that match what users naturally want to do
  // ============================================================================

  /**
   * Search for a word - returns synsets with definitions and examples
   * This is the most common operation and what users naturally try first.
   * 
   * @param term - Word to search for
   * @param options - Optional filters (pos, language, limit)
   * @returns Array of synsets containing the word
   * 
   * @example
   * ```typescript
   * // Simple search
   * const results = await wn.search('computer');
   * 
   * // Filter by part of speech
   * const nouns = await wn.search('bank', { pos: 'n' });
   * 
   * // Limit results
   * const top5 = await wn.search('run', { limit: 5 });
   * ```
   */
  async search(term: string, options?: {
    pos?: PartOfSpeech;
    language?: string;
    limit?: number;
  }): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.synsets({ 
      form: term, 
      ...options 
    });
  }

  /**
   * Get definitions for a word - returns simple array of definition texts
   * Convenience method that returns just the definition strings.
   * 
   * @param term - Word to define
   * @param pos - Optional part of speech filter
   * @returns Array of definition objects with text, POS, and synset ID
   * 
   * @example
   * ```typescript
   * const defs = await wn.define('computer');
   * // Returns: [{ text: 'a machine for performing...', pos: 'n', synsetId: '...' }]
   * 
   * // Filter by POS
   * const nounDefs = await wn.define('bank', 'n');
   * ```
   */
  async define(term: string, pos?: PartOfSpeech): Promise<Array<{ text: string; pos: PartOfSpeech; synsetId: string }>> {
    const synsets = await this.search(term, pos ? { pos } : undefined);
    return synsets.flatMap(s => 
      s.definitions.map(d => ({
        text: d.text,
        pos: s.pos,
        synsetId: s.id
      }))
    );
  }

  /**
   * Translate a word from one language to another
   * Returns array of translated word strings.
   * 
   * @param term - Word to translate
   * @param fromLang - Source language code (e.g., 'en')
   * @param toLang - Target language code (e.g., 'fr')
   * @returns Array of translated words
   * 
   * @example
   * ```typescript
   * const translations = await wn.translate('water', 'en', 'fr');
   * // Returns: ['eau']
   * ```
   */
  async translate(term: string, fromLang: string, toLang: string): Promise<string[]> {
    await this.ensureInitialized();
    // Note: TranslationHelper implementation pending - stubbed for now
    // TODO: Implement translation using ILI mapping
    const synsets = await this.synsets({ form: term, language: fromLang, maxResults: 1 });
    if (synsets.length === 0) return [];
    
    // For now, return empty array - full implementation requires cross-lingual ILI mapping
    return [];
  }

  /**
   * Find words related to the search term by a specific relation type
   * 
   * @param term - Word to find relations for
   * @param relationType - Type of relation ('hypernym', 'hyponym', 'meronym', 'holonym')
   * @returns Array of related synsets
   * 
   * @example
   * ```typescript
   * // Find broader terms
   * const broader = await wn.related('car', 'hypernym');
   * // Returns synsets for: vehicle, motor vehicle, etc.
   * 
   * // Find narrower terms  
   * const narrower = await wn.related('car', 'hyponym');
   * // Returns synsets for: sedan, SUV, coupe, etc.
   * ```
   */
  async related(term: string, relationType: 'hypernym' | 'hyponym'): Promise<Synset[]> {
    const synsets = await this.search(term, { limit: 1 });
    if (synsets.length === 0) return [];
    
    // Only hypernyms and hyponyms are currently implemented
    const method = relationType === 'hypernym' ? this.getHypernyms : this.getHyponyms;
    return method.call(this, synsets[0].id);
  }

  /**
   * Calculate semantic similarity between two words
   * Returns a number between 0 (unrelated) and 1 (identical)
   * 
   * @param word1 - First word
   * @param word2 - Second word
   * @param algorithm - Similarity algorithm ('path' or 'wup')
   * @returns Similarity score 0-1
   * 
   * @example
   * ```typescript
   * const similarity = await wn.similar('car', 'automobile');
   * // Returns: ~0.95 (very similar)
   * 
   * const similarity = await wn.similar('car', 'banana');
   * // Returns: ~0.1 (not similar)
   * ```
   */
  /**
   * NOTE: Similarity methods require the similarity plugin
   * This is a placeholder that will be implemented when similarity plugin is integrated
   */
  async similar(word1: string, word2: string, algorithm: 'path' | 'wup' = 'path'): Promise<number> {
    // TODO: Integrate similarity plugin methods
    // For now, return 0 (not implemented)
    return 0;
  }

  /**
   * Auto-initialize the database on first query
   * Users don't need to call initialize() explicitly anymore
   */
  private initPromise: Promise<void> | null = null;
  private autoInit: boolean = true;

  private async ensureInitialized(): Promise<void> {
    if (!this.autoInit) return;  // Respect manual initialization
    
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    
    await this.initPromise;
  }
}

/**
 * Create a WordNet instance with simplified configuration
 * 
 * @param lexicon - Lexicon ID or array of lexicon IDs (default: 'oewn:2024')
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * // Simple - auto-initializes on first query
 * const wn = createWordnet('oewn:2024');
 * const results = await wn.search('computer');  // No initialize() needed!
 * 
 * // In-memory database
 * const wn = createWordnet('oewn:2024', { mode: 'memory' });
 * 
 * // Disable auto-initialize (advanced)
 * const wn = createWordnet('oewn:2024', { autoInitialize: false });
 * await wn.initialize();  // Manual control
 * 
 * // Custom database path
 * const wn = createWordnet('oewn:2024', { 
 *   filename: '/path/to/db', 
 *   mode: 'persistent' 
 * });
 * ```
 */
export function createWordnet(
  lexicon: string | string[] = 'oewn:2024',  // Default to latest stable
  options: Partial<NodeWordnetConfig> & { autoInitialize?: boolean } = {}
): KyselyWordnet {
  const instance = new KyselyWordnet(lexicon, options);
  
  // Set auto-initialize preference
  (instance as any).autoInit = options.autoInitialize ?? true;
  
  // Auto-close on process exit (Node.js only)
  if (typeof process !== 'undefined') {
    process.on('beforeExit', async () => {
      try {
        await instance.close();
      } catch (e) {
        // Ignore errors during shutdown
      }
    });
  }
  
  return instance;
}

/**
 * Create a WordNet instance with plugins
 * 
 * @param lexicon - Lexicon identifier
 * @param plugins - Array of plugins to load
 * @param options - Configuration options
 * 
 * @example
 * ```typescript
 * import { createWordnetWithPlugins } from 'wn-ts-node';
 * import { relationsPlugin, similarityPlugin } from 'wn-ts-node/plugins';
 * 
 * const wn = createWordnetWithPlugins('oewn:2024', [
 *   relationsPlugin,
 *   similarityPlugin
 * ]);
 * 
 * // Now you have access to plugin methods
 * const hypernyms = await wn.getHypernyms(synsetId);
 * const similarity = await wn.getPathSimilarity(synset1, synset2);
 * ```
 */
export function createWordnetWithPlugins(
  lexicon: string | string[] = 'oewn:2024',
  plugins: Plugin[] = [],
  options: Partial<NodeWordnetConfig> & { autoInitialize?: boolean } = {}
): KyselyWordnet {
  return createWordnet(lexicon, { ...options, plugins });
}

/**
 * Browser-compatible WordNet implementation
 * Extends BaseWordnet with @sqlite.org/sqlite-wasm database operations
 * Now uses Kysely for type-safe database operations
 */

import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  Definition,
  Relation,
  Form,
  ILI,
  Example
} from 'wn-ts-core';
import { BaseWordnet } from 'wn-ts-core';
import { WebDatabase } from './web-database.js';
import { KyselyQueryService } from './database/kysely-query-service.js';
import type { Database } from './types/database.js';
import { Kysely } from 'kysely';
import { createSqliteWasmDialect } from './database/sqlite-wasm-dialect.js';

export class WebWordnet extends BaseWordnet {
  private database: WebDatabase;
  private kyselyDb: Kysely<Database> | undefined;
  private queryService: KyselyQueryService | undefined;
  private _lexiconId: string;
  private _lexiconVersion?: string;
  private _expand: string[];
  private _normalizer?: ((form: string) => string) | undefined;
  private _lemmatizer?: ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>) | undefined;
  private _searchAllForms: boolean;
  private _lang?: string;
  private initialized = false;
  private lexiconSpec: string;

  constructor(
    lexicon: string = '*',
    options: WordnetOptions = {}
  ) {
    // Create options object with lexicon property
    const baseOptions = {
      ...options,
      lexicon
    };
    super(baseOptions);

    this.lexiconSpec = lexicon;
    this.database = new WebDatabase();
    const [id, version] = lexicon.split(':');
    this._lexiconId = id;
    this._lexiconVersion = version;
    this._expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    this._normalizer = options.normalizer;
    this._lemmatizer = options.lemmatizer;
    this._searchAllForms = options.searchAllForms ?? true;

    if (options.lang) {
      this._lang = options.lang;
    }
  }

  async initialize(sqlJsModule: any): Promise<void> {
    console.log('🔍 WebWordnet.initialize() called');
    await this.database.initializeWithModule(sqlJsModule);
    await this.database.createDatabase();
    
    const dialect = createSqliteWasmDialect(this.database.getDatabase());
    this.kyselyDb = new Kysely<Database>({ dialect });
    this.queryService = new KyselyQueryService(this.kyselyDb);
    
    // Create tables using Kysely
    await this.queryService.createTables();

    console.log('🔍 WebWordnet.initialize() completed, queryService:', this.queryService ? 'available' : 'undefined');
    this.initialized = true;
  }

  /**
   * Get the database instance (for internal use by DataLoader)
   */
  getDatabase(): WebDatabase {
    return this.database;
  }

  /**
   * Get the Kysely query service (for internal use by DataLoader)
   */
  getQueryService(): KyselyQueryService | undefined {
    console.log('🔍 WebWordnet.getQueryService() called, queryService:', this.queryService ? 'available' : 'undefined', 'initialized:', this.initialized);
    return this.queryService;
  }

  async lexicons(): Promise<Lexicon[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getLexicons();
  }

  async expandedLexicons(): Promise<Lexicon[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    
    if (this._expand.length === 0) {
      return [];
    }
    
    return this.queryService.getLexicons({ ids: this._expand });
  }

  async words(
    form?: string,
    pos?: PartOfSpeech
  ): Promise<Word[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    try {
      const started = performance.now();
      const result = await this.queryService.getWords({
        form,
        pos,
        lexicon: this._lexiconId,
        language: this._lang,
        searchAllForms: this._searchAllForms,
      });
      const ms = performance.now() - started;
      console.log(`🕒 words("${form ?? ''}") → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`);
      return result;
    } catch (error) {
      console.error('Failed to get words:', error);
      return [];
    }
  }

  async synsets(
    form: string,
    pos?: PartOfSpeech,
    _ili?: string | ILI
  ): Promise<Synset[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    const started = performance.now();
    const synsets = await this.queryService.getSynsets({
      form,
      pos,
      lexicon: this._lexiconId,
      language: this._lang,
      searchAllForms: this._searchAllForms,
    });

    // Load definitions for each synset
    const loadDefsStarted = performance.now();
    const synsetsWithDefinitions: Synset[] = [];
    for (const synset of synsets) {
      const definitions = await this.queryService.getDefinitionsBySynsetId(synset.id);
      synsetsWithDefinitions.push({
        ...synset,
        definitions,
      });
    }
    const totalMs = performance.now() - started;
    const defsMs = performance.now() - loadDefsStarted;
    console.log(`🕒 synsets("${form}") → ${synsets.length} (defs loaded in ${defsMs.toFixed(1)}ms, total ${totalMs.toFixed(1)}ms)`);
    return synsetsWithDefinitions;
  }

  async getSynset(synsetId: string): Promise<Synset | undefined> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getSynsetById(synsetId);
  }

  async getSenses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    return this.queryService.getSenses({
      wordIdOrForm,
      pos,
      lexicon: this._lexiconId,
    });
  }

  async getWord(wordId: string): Promise<Word | undefined> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getWordById(wordId);
  }

  async getSense(senseId: string): Promise<Sense | undefined> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getSenseById(senseId);
  }

  async getIli(iliId: string): Promise<ILI | undefined> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getIliById(iliId);
  }

  async word(id: string): Promise<Word> {
    const word = await this.getWord(id);
    if (!word) throw new Error(`Word not found: ${id}`);
    return word;
  }

  async synset(id: string): Promise<Synset> {
    const synset = await this.getSynset(id);
    if (!synset) throw new Error(`Synset not found: ${id}`);
    return synset;
  }

  async sense(id: string): Promise<Sense> {
    const sense = await this.getSense(id);
    if (!sense) throw new Error(`Sense not found: ${id}`);
    return sense;
  }

  async ili(id: string): Promise<ILI> {
    const ili = await this.getIli(id);
    if (!ili) throw new Error(`ILI not found: ${id}`);
    return ili;
  }

  async senses(form?: string, pos?: PartOfSpeech): Promise<Sense[]> {
    if (!form) {
      throw new Error('Form parameter is required for senses query');
    }
    return this.getSenses(form, pos);
  }

  async getWordOrUndefined(wordId: string): Promise<Word | undefined> {
    return this.getWord(wordId);
  }

  async getSynsetOrUndefined(synsetId: string): Promise<Synset | undefined> {
    return this.getSynset(synsetId);
  }

  async getSenseOrUndefined(senseId: string): Promise<Sense | undefined> {
    return this.getSense(senseId);
  }

  async ilis(status?: string): Promise<ILI[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getIlis({ status });
  }

  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    return this.queryService.getStatistics();
  }

  async getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
  }[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    return this.queryService.getLexiconStatistics(lexiconId);
  }

  async close(): Promise<void> {
    if (this.database) {
      this.database.close();
    }
  }

  async getProjects(): Promise<any[]> {
    // For now, return an empty array since we don't have project loading implemented
    // This could be enhanced to load from a projects index file
    return [];
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  }> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    return this.queryService.getDataQualityMetrics();
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    return this.queryService.getPartOfSpeechDistribution();
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    return this.queryService.getSynsetSizeAnalysis();
  }

  /**
   * Search for words using the query service
   */
  async searchWords(searchTerm: string, options: any = {}): Promise<any[]> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');
    const started = performance.now();
    const result = await this.queryService.searchWords(searchTerm, options);
    const ms = performance.now() - started;
    console.log(`🕒 searchWords("${searchTerm}") → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`);
    return result;
  }

  /**
   * Export data from the database
   */
  async exportData(): Promise<any> {
    if (!this.initialized || !this.queryService) throw new Error('WebWordnet not initialized');

    const exportData: any = {
      lexicons: [],
      exportDate: new Date().toISOString(),
      format: 'json',
    };

    // Get all lexicons
    const lexicons = await this.queryService.getLexicons();
    
    for (const lexicon of lexicons) {
      const lexiconData: any = {
        ...lexicon,
        entries: [],
        synsets: [],
      };

      // Get words (entries) for this lexicon
      const words = await this.queryService.getWordsByLexicon(lexicon.id);
      for (const word of words) {
        const entry: any = {
          id: word.id,
          lemma: {
            writtenForm: word.lemma,
            partOfSpeech: word.pos,
          },
          senses: [],
        };

        // Get senses for this word
        const senses = await this.queryService.getSensesByWordId(word.id);
        for (const sense of senses) {
          entry.senses.push({
            id: sense.id,
            synset: sense.synset_id,
          });
        }

        lexiconData.entries.push(entry);
      }

      // Get synsets for this lexicon
      const synsets = await this.queryService.getSynsetsByLexicon(lexicon.id);
      for (const synset of synsets) {
        const synsetData: any = {
          id: synset.id,
          ili: synset.ili,
          partOfSpeech: synset.pos,
          definitions: [],
          examples: [],
          relations: [],
        };

        // Get definitions for this synset
        const definitions = await this.queryService.getDefinitionsBySynsetId(synset.id);
        for (const def of definitions) {
          synsetData.definitions.push({
            id: def.id,
            definition: def.text,
            language: def.language,
          });
        }

        // Get examples for this synset
        const examples = await this.queryService.getExamplesBySynsetId(synset.id);
        for (const ex of examples) {
          synsetData.examples.push({
            id: ex.id,
            example: ex.text,
            language: ex.language,
          });
        }

        // Get relations for this synset
        const relations = await this.queryService.getRelationsBySynsetId(synset.id);
        for (const rel of relations) {
          synsetData.relations.push({
            id: rel.id,
            target: rel.target_id,
            relation: rel.type,
          });
        }

        lexiconData.synsets.push(synsetData);
      }

      exportData.lexicons.push(lexiconData);
    }

    return exportData;
  }
} 

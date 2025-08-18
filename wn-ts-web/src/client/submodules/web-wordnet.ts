/**
 * Browser-compatible WordNet implementation
 * Extends BaseWordnet with @sqlite.org/sqlite-wasm database operations
 * Now uses Kysely for type-safe database operations
 * 
 * This class is now streamlined to focus on core WordNet operations,
 * with higher-level orchestration handled by WordNetOrchestrator
 */

import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  ILI,
  WordQuery,
  SynsetQuery,
  SenseQuery,
} from "wn-ts-core";
import { BaseWordnet } from "wn-ts-core";
import { WebDatabase } from "./web-database.js";
import { KyselyQueryService } from "../../database/kysely-query-service.js";
import type { Database } from "../../types/database.js";
import { Kysely } from "kysely";
import { createSqliteWasmDialect } from "../../database/sqlite-wasm-dialect.js";
import { WordNetEventEmitter, WordNetEvents } from "../../event-emitter.js";
import type { EventCallback } from "../../event-emitter.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger("WebWordnet");

/**
 * WebWordnet provides a streamlined interface for WordNet operations in the browser.
 * It extends BaseWordnet and implements the core database operations using SQLite WASM.
 * 
 * This class is designed to work alongside WordNetOrchestrator, which handles
 * higher-level operations like lexicon management and cross-lexicon queries.
 */
export class WebWordnet extends BaseWordnet {
  private database: WebDatabase;
  private kyselyDb: Kysely<Database> | undefined;
  private queryService: KyselyQueryService | undefined;
  private _lexiconId: string;
  private _lexiconVersion?: string;
  private _expand: string[];
  private _normalizer?: ((form: string) => string) | undefined;
  private _lemmatizer?:
    | ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>)
    | undefined;
  private _searchAllForms: boolean;
  private _lang?: string;
  private initialized = false;
  private lexiconSpec: string;
  private eventEmitter: WordNetEventEmitter;

  constructor(lexicon: string = "*", options: WordnetOptions = {}) {
    // Create options object with lexicon property
    const baseOptions = {
      ...options,
      lexicon,
    };
    super(baseOptions);

    this.lexiconSpec = lexicon;
    this.database = new WebDatabase();
    this.eventEmitter = new WordNetEventEmitter();
    const [id, version] = lexicon.split(":");
    this._lexiconId = id;
    this._lexiconVersion = version;
    this._expand = Array.isArray(options.expand)
      ? options.expand
      : options.expand
        ? [options.expand]
        : [];
    this._normalizer = options.normalizer;
    this._lemmatizer = options.lemmatizer;
    this._searchAllForms = options.searchAllForms ?? true;

    if (options.lang) {
      this._lang = options.lang;
    }
  }

  // Event handling methods
  on(event: string, callback: EventCallback): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Update the lexicon ID after initialization
   * This is used when the actual loaded package ID differs from the initial requirement ID
   */
  updateLexiconId(newLexiconId: string): void {
    this.lexiconSpec = newLexiconId;
    const [id, version] = newLexiconId.split(":");
    this._lexiconId = id;
    this._lexiconVersion = version;
  }

  /**
   * Emit statistics updated event
   * This should be called whenever statistics change
   */
  async emitStatisticsUpdated(): Promise<void> {
    if (!this.initialized) return;

    try {
      const statistics = await this.getStatistics();
      const posDistribution = await this.getPartOfSpeechDistribution();
      const lexiconStats = await this.getLexiconStatistics();

      this.eventEmitter.emit(WordNetEvents.STATISTICS_UPDATED, {
        statistics,
        posDistribution,
        lexiconStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.eventEmitter.emit(WordNetEvents.ERROR, {
        operation: "getStatistics",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Emit data changed event
   * This should be called whenever the database content changes
   */
  emitDataChanged(operation: string, details?: any): void {
    this.eventEmitter.emit(WordNetEvents.DATA_CHANGED, {
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit progress event
   * This should be called during long-running operations
   */
  emitProgress(progress: number, stage: string): void {
    this.eventEmitter.emit(WordNetEvents.PROGRESS, {
      progress,
      stage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit error event
   * This should be called when operations fail
   */
  emitError(operation: string, error: Error | string): void {
    this.eventEmitter.emit(WordNetEvents.ERROR, {
      operation,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }

  off(event: string, callback: EventCallback): void {
    this.eventEmitter.off(event, callback);
  }

  removeAllListeners(event?: string): void {
    this.eventEmitter.removeAllListeners(event);
  }

  listenerCount(event: string): number {
    return this.eventEmitter.listenerCount(event);
  }

  // Core initialization and lifecycle
  async initialize(sqlJsModule: Sqlite3Static): Promise<void> {
    try {
      logger.info("🔍 WebWordnet.initialize() called");
      await this.database.initializeWithModule(sqlJsModule);
      await this.database.createDatabase();

      const dialect = createSqliteWasmDialect({
        database: this.database.getDatabase(),
        sqlModule: sqlJsModule,
      });
      this.kyselyDb = new Kysely<Database>({ dialect });
      this.queryService = new KyselyQueryService(this.kyselyDb);

      // Create tables using Kysely
      await this.queryService.createTables();

      logger.info(
        "🔍 WebWordnet.initialize() completed, queryService:",
        this.queryService ? "available" : "undefined"
      );
      this.initialized = true;

      // Emit initialized event
      this.eventEmitter.emit(WordNetEvents.INITIALIZED, {
        lexicon: this.lexiconSpec,
      });
    } catch (error) {
      this.eventEmitter.emit(WordNetEvents.ERROR, {
        operation: "initialize",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Refresh Kysely connections after the underlying database handle changes
   */
  refreshConnections(): void {
    const dialect = createSqliteWasmDialect({
      database: this.database.getDatabase(),
      sqlModule: this.database.getSqlModule(),
    });
    this.kyselyDb = new Kysely<Database>({ dialect });
    this.queryService = new KyselyQueryService(this.kyselyDb);
  }

  // Database access methods (for internal use)
  getDatabase(): WebDatabase {
    return this.database;
  }

  getQueryService(): KyselyQueryService | undefined {
    logger.info(
      `🔍 WebWordnet.getQueryService() called, queryService: ${this.queryService ? "available" : "undefined"}, ${this.initialized ? "initialized" : "not initialized"}`
    );
    return this.queryService;
  }

  // Core WordNet interface implementation
  async lexicons(): Promise<Lexicon[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getLexicons();
  }

  async expandedLexicons(): Promise<Lexicon[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    if (this._expand.length === 0) {
      return [];
    }

    return this.queryService.getLexicons({ ids: this._expand });
  }

  async words(query?: WordQuery): Promise<Word[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    try {
      const started = performance.now();
      const result = await this.queryService.getWords({
        form: query?.form,
        pos: query?.pos,
        lexicon: query?.lexicon || this.lexiconSpec,
        language: query?.lang || this._lang,
        searchAllForms: this._searchAllForms,
      });
      const ms = performance.now() - started;
      logger.info(
        `🕒 words(${query?.form ? `"${query.form}"` : ""}) → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`
      );
      return result;
    } catch (error) {
      logger.error("Failed to get words:", error);
      return [];
    }
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    const { form, pos, ili, lexicon, lang } = query || {};
    
    if (!form) {
      // If no form specified, return all synsets (with filters)
      return this.queryService.getSynsets({
        form: undefined,
        pos,
        lexicon: lexicon || this.lexiconSpec,
        language: lang || this._lang,
        searchAllForms: this._searchAllForms,
      });
    }

    const started = performance.now();
    const synsets = await this.queryService.getSynsets({
      form,
      pos,
      lexicon: lexicon || this.lexiconSpec,
      language: lang || this._lang,
      searchAllForms: this._searchAllForms,
    });

    // Load definitions for each synset
    const loadDefsStarted = performance.now();
    const synsetsWithDefinitions: Synset[] = [];
    for (const synset of synsets) {
      const definitions = await this.queryService.getDefinitionsBySynsetId(
        synset.id
      );
      synsetsWithDefinitions.push({
        ...synset,
        definitions,
      });
    }
    const totalMs = performance.now() - started;
    const defsMs = performance.now() - loadDefsStarted;
    logger.info(
      `🕒 synsets("${form}") → ${synsets.length} (defs loaded in ${defsMs.toFixed(1)}ms, total ${totalMs.toFixed(1)}ms)`
    );
    return synsetsWithDefinitions;
  }

  async synset(synsetId: string): Promise<Synset> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    const synset = await this.queryService.getSynsetById(synsetId);
    if (!synset) throw new Error(`Synset not found: ${synsetId}`);
    return synset;
  }

  async word(wordId: string): Promise<Word> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    const word = await this.queryService.getWordById(wordId);
    if (!word) throw new Error(`Word not found: ${wordId}`);
    return word;
  }

  async sense(senseId: string): Promise<Sense> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    const sense = await this.queryService.getSenseById(senseId);
    if (!sense) throw new Error(`Sense not found: ${senseId}`);
    return sense;
  }

  async ili(iliId: string): Promise<ILI> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    const ili = await this.queryService.getIliById(iliId);
    if (!ili) throw new Error(`ILI not found: ${iliId}`);
    return ili;
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    const { form, pos, lexicon, lang, wordIdOrForm } = query || {};
    
    if (wordIdOrForm && !form) {
      // Query by word ID
      return this.queryService.getSenses({
        wordIdOrForm,
        pos,
        lexicon: lexicon || this.lexiconSpec,
      });
    }

    // Query by word form
    return this.queryService.getSenses({
      wordIdOrForm: form || '',
      pos,
      lexicon: lexicon || this.lexiconSpec,
    });
  }

  async ilis(status?: string): Promise<ILI[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getIlis({ status });
  }

  // Convenience methods that return undefined for non-existent items
  async getSenses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    return this.queryService.getSenses({
      wordIdOrForm,
      pos,
      lexicon: this.lexiconSpec,
    });
  }

  async getWord(wordId: string): Promise<Word | undefined> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getWordById(wordId);
  }

  async getSynset(synsetId: string): Promise<Synset | undefined> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getSynsetById(synsetId);
  }

  async getSense(senseId: string): Promise<Sense | undefined> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getSenseById(senseId);
  }

  async getIli(iliId: string): Promise<ILI | undefined> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getIliById(iliId);
  }



  // Statistics and analysis methods
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    return this.queryService.getStatistics();
  }

  async getLexiconStatistics(lexiconId?: string): Promise<
    {
      lexiconId: string;
      label: string;
      language: string;
      version: string;
      wordCount: number;
      synsetCount: number;
    }[]
  > {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    return this.queryService.getLexiconStatistics(lexiconId);
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  }> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    return this.queryService.getDataQualityMetrics();
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    return this.queryService.getPartOfSpeechDistribution();
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    return this.queryService.getSynsetSizeAnalysis();
  }

  // Utility methods
  async hasLoadedLexicons(): Promise<boolean> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    try {
      const lexiconStats = await this.getLexiconStatistics();
      return lexiconStats.length > 0;
    } catch (error) {
      // If we can't get lexicon stats, try a simpler approach
      try {
        const lexicons = await this.lexicons();
        return lexicons.length > 0;
      } catch {
        // If all else fails, return false
        return false;
      }
    }
  }

  async hasSpecificLexiconLoaded(lexiconId: string): Promise<boolean> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    try {
      const lexicons = await this.lexicons();
      return lexicons.some(lexicon => lexicon.id === lexiconId);
    } catch (error) {
      // If we can't check lexicons, return false to be safe
      return false;
    }
  }

  async getQuickStatus(options: { includeExpensive?: boolean } = {}): Promise<{
    lexiconStats: Awaited<ReturnType<WebWordnet["getLexiconStatistics"]>>;
    statistics?: Awaited<ReturnType<WebWordnet["getStatistics"]>>;
    posDistribution?: Awaited<
      ReturnType<WebWordnet["getPartOfSpeechDistribution"]>
    >;
  }> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    const { includeExpensive = false } = options;

    const lexiconStats = await this.getLexiconStatistics();
    const result: any = { lexiconStats };

    if (includeExpensive) {
      try {
        result.statistics = await this.getStatistics();
      } catch {
        // ignore to keep it lightweight
      }
      try {
        result.posDistribution = await this.getPartOfSpeechDistribution();
      } catch {
        // ignore to keep it lightweight
      }
    }

    return result;
  }

  // Search functionality
  async searchWords(searchTerm: string, options: any = {}): Promise<any[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    const started = performance.now();
    const result = await this.queryService.searchWords(searchTerm, options);
    const ms = performance.now() - started;
    logger.info(
      `🕒 searchWords("${searchTerm}") → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`
    );
    return result;
  }

  /**
   * Export data from the database
   */
  async exportData(): Promise<any> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    const exportData: any = {
      lexicons: [],
      exportDate: new Date().toISOString(),
      format: "json",
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
        const definitions = await this.queryService.getDefinitionsBySynsetId(
          synset.id
        );
        for (const def of definitions) {
          synsetData.definitions.push({
            id: def.id,
            definition: def.text,
            language: def.language,
          });
        }

        // Get examples for this synset
        const examples = await this.queryService.getExamplesBySynsetId(
          synset.id
        );
        for (const ex of examples) {
          synsetData.examples.push({
            id: ex.id,
            example: ex.text,
            language: ex.language,
          });
        }

        // Get relations for this synset
        const relations = await this.queryService.getRelationsBySynsetId(
          synset.id
        );
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

  /**
   * Export the underlying SQLite database bytes
   */
  exportDataBytes(): Uint8Array {
    if (typeof (this.database as any).exportBytes === "function") {
      return (this.database as any).exportBytes();
    }
    throw new Error("Export not supported");
  }

  // Cleanup
  async close(): Promise<void> {
    try {
      if (this.database) {
        this.database.close();
      }
      this.initialized = false;

      // Emit database cleared event
      this.eventEmitter.emit(WordNetEvents.DATABASE_CLEARED);
    } catch (error) {
      this.eventEmitter.emit(WordNetEvents.ERROR, {
        operation: "close",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Placeholder for projects (not implemented in web version)
  async getProjects(): Promise<any[]> {
    return [];
  }
}

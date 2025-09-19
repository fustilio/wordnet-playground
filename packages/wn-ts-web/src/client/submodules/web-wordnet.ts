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

// Type aliases for better reusability
type LexiconStatistics = Awaited<ReturnType<WebWordnet['getLexiconStatistics']>>[0];
type Statistics = Awaited<ReturnType<WebWordnet['getStatistics']>>;
type PartOfSpeechDistribution = Awaited<ReturnType<WebWordnet['getPartOfSpeechDistribution']>>;

// Export data structure types
type ExportEntry = {
  id: string;
  lemma: {
    writtenForm: string;
    partOfSpeech: string;
  };
  senses: Array<{
    id: string;
    synset: string;
  }>;
};

type ExportSynset = {
  id: string;
  ili: string | null;
  partOfSpeech: string;
  definitions: Array<{
    id: string;
    definition: string;
    language: string;
  }>;
  examples: Array<{
    id: string;
    example: string;
    language: string;
  }>;
  relations: Array<{
    id: string;
    target: string;
    relation: string;
  }>;
};

type ExportLexicon = {
  id: string;
  label: string;
  language: string;
  version: string;
  entries: ExportEntry[];
  synsets: ExportSynset[];
};

type ExportData = {
  lexicons: ExportLexicon[];
  exportDate: string;
  format: string;
};

// Frame and translation types
type FrameInfo = {
  id: string;
  frame: string;
  synsetId: string;
};

type TranslationInfo = {
  id: string;
  sourceSynsetId: string;
  targetSynsetId: string;
  language: string;
  confidence?: number;
};

type ProjectInfo = {
  id: string;
  label: string;
  description?: string;
  url?: string;
  license?: string;
  citation?: string;
};
import type { WordNetCore } from "wn-ts-core";
import { WebDatabase } from "./web-database.js";
import { KyselyQueryService } from "../../database/kysely-query-service.js";
import type { Database } from "../../types/database.js";
import { Kysely } from "kysely";
import { createSqliteWasmDialect } from "../../database/sqlite-wasm-dialect.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { createScopedLogger } from "utils/logger";
import { WordNetEventEmitter, WordNetEvents } from "../../event-emitter.js";

const logger = createScopedLogger("WebWordnet");

/**
 * WebWordnet provides a streamlined interface for WordNet operations in the browser.
 * It implements the WordNetCore interface and provides database operations using SQLite WASM.
 * 
 * This class is designed to work alongside WordNetOrchestrator, which handles
 * higher-level operations like lexicon management and cross-lexicon queries.
 * 
 * NOTE: Event emission is now handled by the orchestrator to avoid duplication.
 * This class focuses purely on database operations and WordNet queries.
 */
export class WebWordnet implements WordNetCore {
  private database: WebDatabase;
  private kyselyDb: Kysely<Database> | undefined;
  private queryService: KyselyQueryService | undefined;
  private _lexiconIds: string[]; // Support multiple lexicons
  private _expand: string[];
  private _normalizer?: ((form: string) => string) | undefined;
  private _lemmatizer?:
    | ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>)
    | undefined;
  private _searchAllForms: boolean;
  private _lang?: string;
  private initialized = false;
  
  // Event emitter for backward compatibility with tests
  private eventEmitter: WordNetEventEmitter;

  constructor(lexicon: string | string[] = "*", options: WordnetOptions = {}) {
    // Initialize properties directly since we're implementing WordNetCore interface
    this.eventEmitter = new WordNetEventEmitter();

    // Parse lexicon specifier(s) for special presets
    if (Array.isArray(lexicon)) {
      this._lexiconIds = lexicon;
    } else {
      // Handle special presets and single lexicon specs
      this._lexiconIds = this.parseLexiconSpec(lexicon);
    }

    this.database = new WebDatabase();
    this.eventEmitter = new WordNetEventEmitter();
    
    this._expand = Array.isArray(options.expand)
      ? options.expand
      : options.expand
        ? [options.expand]
        : [];
    this._normalizer = options.normalizer;
    this._lemmatizer = options.lemmatizer;
    this._searchAllForms = options.searchAllForms ?? true;

    if (options.language) {
      this._lang = options.language;
    }
  }

  /**
   * Subscribe to an event
   * @param event - Event name to listen for
   * @param callback - Function to call when event occurs
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name to stop listening for
   * @param callback - Function to remove from listeners
   */
  off(event: string, callback: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Emit an event
   * @param event - Event name to emit
   * @param args - Arguments to pass to event callbacks
   */
  emit(event: string, ...args: unknown[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * Emit data changed event (for backward compatibility with tests)
   * @param eventType - Type of data change event
   * @param data - Event data
   */
  emitDataChanged(eventType: string, data: Record<string, unknown>): void {
    this.eventEmitter.emit('dataChanged', { eventType, ...data });
  }

  /**
   * Emit statistics updated event (for backward compatibility with tests)
   */
  emitStatisticsUpdated(): void {
    this.eventEmitter.emit('statisticsUpdated');
  }

  /**
   * Parse lexicon specifier to handle special presets and multiple lexicons
   */
  private parseLexiconSpec(lexicon: string): string[] {
    // Handle special presets
    switch (lexicon) {
      case "en-th":
        // English-Thai dictionary: English WordNet + Thai WordNet + CILI
        return ["oewn:2024", "omw-th:1.4", "cili:1.0"];
      case "en-fr":
        // English-French dictionary: English WordNet + French WordNet + CILI
        return ["oewn:2024", "omw-fr:1.4", "cili:1.0"];
      case "en-de":
        // English-German dictionary: English WordNet + German WordNet + CILI
        return ["oewn:2024", "odenet:1.4", "cili:1.0"];
      case "multilingual":
        // Full multilingual support: OMW aggregate + CILI
        return ["omw:1.4", "cili:1.0"];
      case "*":
        // All available lexicons (will be resolved at runtime)
        return ["*"];
      default:
        // Single lexicon or custom format
        return [lexicon];
    }
  }

  /**
   * Get the current lexicon IDs
   */
  getLexiconIds(): string[] {
    return [...this._lexiconIds];
  }

  /**
   * Get the primary lexicon ID (first in the array)
   */
  getPrimaryLexiconId(): string {
    return this._lexiconIds[0];
  }

  /**
   * Update the lexicon IDs after initialization
   */
  updateLexiconIds(newLexiconIds: string[]): void {
    this._lexiconIds = [...newLexiconIds];
  }

  /**
   * Add a lexicon to the current set
   */
  addLexicon(lexiconId: string): void {
    if (!this._lexiconIds.includes(lexiconId)) {
      this._lexiconIds.push(lexiconId);
    }
  }

  /**
   * Remove a lexicon from the current set
   */
  removeLexicon(lexiconId: string): void {
    const index = this._lexiconIds.indexOf(lexiconId);
    if (index > -1) {
      this._lexiconIds.splice(index, 1);
    }
  }

  /**
   * Check if a specific lexicon is loaded in the database
   */
  async hasSpecificLexiconLoaded(lexiconId: string): Promise<boolean> {
    if (!this.initialized || !this.queryService) {
      return false;
    }
    
    try {
      // Check if the lexicon exists in the database
      const lexicons = await this.lexicons();
      
      // Try exact match first
      if (lexicons.some(lexicon => lexicon.id === lexiconId)) {
        return true;
      }
      
      // If exact match fails, try to find by base lexicon ID (e.g., "oewn" from "oewn:2024")
      const baseLexiconId = lexiconId.split(':')[0];
      if (lexicons.some(lexicon => lexicon.id === baseLexiconId)) {
        return true;
      }
      
      return false;
    } catch (error) {
      logger.warn(`Error checking if lexicon ${lexiconId} is loaded:`, error);
      return false;
    }
  }

  // Event handling methods removed - events are now handled by the orchestrator
  // The orchestrator will call these methods and emit events as needed

  /**
   * Get statistics for event emission (called by orchestrator)
   * This method is now internal and should not be called directly
   */
  async getStatisticsForEvents(): Promise<{
    statistics: Statistics;
    posDistribution: PartOfSpeechDistribution;
    lexiconStats: LexiconStatistics[];
  }> {
    if (!this.initialized) {
      throw new Error("WebWordnet not initialized");
    }

    try {
      const statistics = await this.getStatistics();
      const posDistribution = await this.getPartOfSpeechDistribution();
      const lexiconStats = await this.getLexiconStatistics();

      return {
        statistics,
        posDistribution,
        lexiconStats
      };
    } catch (error) {
      throw error;
    }
  }

  // Core initialization and lifecycle
  async initialize(sqlJsModule: Sqlite3Static): Promise<void> {
    try {
      logger.info("🔍 WebWordnet.initialize() called");
      await this.database.initializeWithModule(sqlJsModule);
      await this.database.createDatabase();

      // Log database storage information
      const storageInfo = this.database.getStorageInfo();
      logger.info(`🗄️ Database storage: ${storageInfo.type} (persistent: ${storageInfo.persistent})${storageInfo.path ? ` at ${storageInfo.path}` : ''}`);

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

      // Emit initialization event for backward compatibility with tests
      this.eventEmitter.emit(WordNetEvents.INITIALIZED, {
        lexicons: this._lexiconIds,
      });
    } catch (error) {
      // Note: Events are now emitted by the orchestrator, not here
      // this.eventEmitter.emit(WordNetEvents.ERROR, {
      //   operation: "initialize",
      //   error: error instanceof Error ? error.message : String(error),
      // });
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
      
      // Handle multi-lexicon queries
      let lexiconFilter: string | undefined;
      if (query?.lexicon) {
        if (Array.isArray(query.lexicon)) {
          // For now, use the first lexicon in the array
          // TODO: Implement proper multi-lexicon query support
          lexiconFilter = query.lexicon[0];
        } else {
          lexiconFilter = query.lexicon;
        }
      } else {
        // Use the base lexicon ID (without version) for database queries
        const primaryLexiconId = this.getPrimaryLexiconId();
        lexiconFilter = primaryLexiconId.includes(':') ? primaryLexiconId.split(':')[0] : primaryLexiconId;
      }
      
      const result = await this.queryService.getWords({
        form: query?.form,
        pos: query?.pos,
        lexicon: lexiconFilter,
        language: query?.language || this._lang,
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

    const { form, pos, ili, lexicon, language } = query || {};
    
    // Handle multi-lexicon queries
    let lexiconFilter: string | undefined;
    if (lexicon) {
      if (Array.isArray(lexicon)) {
        // For now, use the first lexicon in the array
        // TODO: Implement proper multi-lexicon query support
        lexiconFilter = lexicon[0];
      } else {
        lexiconFilter = lexicon;
      }
    } else {
      // Use the base lexicon ID (without version) for database queries
      const primaryLexiconId = this.getPrimaryLexiconId();
      lexiconFilter = primaryLexiconId.includes(':') ? primaryLexiconId.split(':')[0] : primaryLexiconId;
    }
    
    if (!form) {
      // If no form specified, return all synsets (with filters)
      return this.queryService.getSynsets({
        form: undefined,
        pos,
        lexicon: lexiconFilter,
        language: language || this._lang,
        searchAllForms: this._searchAllForms,
      });
    }

    const started = performance.now();
    const synsets = await this.queryService.getSynsets({
      form: form,
      pos,
      lexicon: lexiconFilter,
      language: language || this._lang,
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

    const { wordIdOrForm, pos, lexicon } = query || {};
    const searchTerm = wordIdOrForm;
    
    // Handle multi-lexicon queries
    let lexiconFilter: string | undefined;
    if (lexicon) {
      if (Array.isArray(lexicon)) {
        // For now, use the first lexicon in the array
        // TODO: Implement proper multi-lexicon query support
        lexiconFilter = lexicon[0];
      } else {
        lexiconFilter = lexicon;
      }
    } else {
      // Use the base lexicon ID (without version) for database queries
      const primaryLexiconId = this.getPrimaryLexiconId();
      lexiconFilter = primaryLexiconId.includes(':') ? primaryLexiconId.split(':')[0] : primaryLexiconId;
    }
    
    if (!searchTerm) {
      // If no search term specified, return empty array
      return [];
    }

    // Query by search term (can be either word ID or form)
    return this.queryService.getSenses({
      wordIdOrForm: searchTerm,
      pos,
      lexicon: lexiconFilter,
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

    // Use the base lexicon ID (without version) for database queries
    const primaryLexiconId = this.getPrimaryLexiconId();
    const lexiconFilter = primaryLexiconId.includes(':') ? primaryLexiconId.split(':')[0] : primaryLexiconId;

    return this.queryService.getSenses({
      wordIdOrForm,
      pos,
      lexicon: lexiconFilter,
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

  async getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
  }[]> {
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
    synsetsWithExamples: number;
    averageSynsetSize: number;
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
    const result: {
      lexiconStats: LexiconStatistics[];
      statistics?: Statistics;
      posDistribution?: PartOfSpeechDistribution;
    } = { lexiconStats };

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

  // Enhanced search functionality that better utilizes the full query capabilities
  async searchWords(query: WordQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeForms?: boolean;
  }): Promise<Word[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const started = performance.now();
    
    // Extract search parameters from the query
    const {
      form,
      pos,
      lexicon,
      language: lang,
      fuzzy = false,
      maxResults,
      includeForms = false
    } = query;
    
    // Use the enhanced getWords method with full query options
    const result = await this.queryService.getWords({
      form,
      pos,
      lexicon,
      language: lang,
      searchAllForms: includeForms,
      fuzzy,
      maxResults,
      includeInflected: includeForms
    });
    
    const ms = performance.now() - started;
    logger.info(
      `🕒 searchWords(${JSON.stringify(query)}) → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`
    );
    return result;
  }

  // Enhanced synset search with full query capabilities
  async searchSynsets(query: SynsetQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeDefinitions?: boolean;
    includeExamples?: boolean;
  }): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const started = performance.now();
    
    const {
      form,
      pos,
      lexicon,
    language: language,
      ili,
      fuzzy = false,
      maxResults,
      includeDefinitions = false,
      includeExamples = false
    } = query;
    
    // Use the enhanced getSynsets method
    const result = await this.queryService.getSynsets({
      form,
      pos,
      lexicon,
      language,
      searchAllForms: false, // For synsets, we typically don't need inflected forms
      ili: ili ? String(ili) : undefined, // Convert ILI to string if present
      fuzzy,
      maxResults,
      includeDefinitions,
      includeExamples,
      includeRelations: false
    });
    
    const ms = performance.now() - started;
    logger.info(
      `🕒 searchSynsets(${JSON.stringify(query)}) → ${Array.isArray(result) ? result.length : 0} in ${ms.toFixed(1)}ms`
    );
    return result;
  }

  // Enhanced word form search
  async wordsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    language?: string;
    includeInflected?: boolean;
  }): Promise<Word[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const {
      pos,
      lexicon,
      language,
      includeInflected = true
    } = options || {};
    
    return this.queryService.getWords({
      form,
      pos,
      lexicon,
      language,
      searchAllForms: includeInflected,
      includeInflected
    });
  }

  // Enhanced synset form search
  async synsetsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    lang?: string;
  }): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const {
      pos,
      lexicon,
      lang
    } = options || {};
    
    return this.queryService.getSynsets({
      form,
      pos,
      lexicon,
      language: lang,
      searchAllForms: false
    });
  }

  // ============================================================================
  // MISSING ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Get synsets by ILI (cross-language concept lookup)
   */
  async synsetsByILI(iliId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    return this.queryService.getSynsets({ ili: iliId });
  }

  /**
   * Get all forms of a word (including inflections)
   */
  async getWordForms(wordId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const word = await this.queryService.getWordById(wordId);
    if (!word) return [];
    
    // Get forms from the forms table
    const forms = await this.queryService.getFormsByWordId(wordId);
    return [word.lemma, ...forms.map(f => f.written_form)];
  }

  /**
   * Get the canonical form (lemma) of a word
   */
  async getWordLemma(wordId: string): Promise<string> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const word = await this.queryService.getWordById(wordId);
    if (!word) throw new Error(`Word not found: ${wordId}`);
    
    return word.lemma;
  }

  /**
   * Find base forms of a word using morphological analysis
   */
  async morphy(form: string, pos?: PartOfSpeech): Promise<Record<PartOfSpeech, Set<string>>> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // Simple implementation - search for words with similar forms
    const words = await this.queryService.getWords({
      form,
      pos,
      searchAllForms: true,
      fuzzy: true
    });
    
    const result: Record<PartOfSpeech, Set<string>> = {} as Record<PartOfSpeech, Set<string>>;
    for (const word of words) {
      if (!result[word.pos]) {
        result[word.pos] = new Set();
      }
      result[word.pos].add(word.lemma);
    }
    
    return result;
  }

  /**
   * Get derived words (morphologically related)
   */
  async getDerivedWords(wordId: string): Promise<Word[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This is a placeholder implementation
    // In a full implementation, this would use morphological rules
    return [];
  }

  /**
   * Normalize a word form using the configured normalizer
   */
  async normalizeForm(form: string): Promise<string> {
    if (this._normalizer) {
      return this._normalizer(form);
    }
    return form.toLowerCase();
  }

  /**
   * Get hypernyms (more general concepts)
   */
  async getHypernyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for hypernym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get hyponyms (more specific concepts)
   */
  async getHyponyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for hyponym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get meronyms (part-of relationships)
   */
  async getMeronyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for meronym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get holonyms (whole-of relationships)
   */
  async getHolonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for holonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get antonyms (opposite concepts)
   */
  async getAntonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for antonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get synonyms (similar concepts)
   */
  async getSynonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for synonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get entailments (logical implications)
   */
  async getEntailments(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for entailment relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get causes (causal relationships)
   */
  async getCauses(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for cause relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get similar to (similarity relationships)
   */
  async getSimilarTo(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for similarity relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get verb groups (verb clustering)
   */
  async getVerbGroups(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for verb group relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get substance meronyms (substance relationships)
   */
  async getSubstanceMeronyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for substance meronym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get substance holonyms (substance relationships)
   */
  async getSubstanceHolonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for substance holonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get member meronyms (member relationships)
   */
  async getMemberMeronyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for member meronym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get member holonyms (member relationships)
   */
  async getMemberHolonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for member holonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get part meronyms (part relationships)
   */
  async getPartMeronyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for part meronym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get part holonyms (part relationships)
   */
  async getPartHolonyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for part holonym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get attributes (attribute relationships)
   */
  async getAttributes(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for attribute relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get pertainyms (pertainym relationships)
   */
  async getPertainyms(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for pertainym relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get derived from (derivation relationships)
   */
  async getDerivedFrom(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for derivation relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get derived to (derivation relationships)
   */
  async getDerivedTo(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for derivation relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get topic domains (domain relationships)
   */
  async getTopicDomains(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for topic domain relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get region domains (domain relationships)
   */
  async getRegionDomains(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for region domain relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get usage domains (domain relationships)
   */
  async getUsageDomains(synsetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the relations table for usage domain relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get frames (frame relationships)
   */
  async getFrames(synsetId: string): Promise<FrameInfo[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the frames table for frame relationships
    // For now, return empty array
    return [];
  }

  /**
   * Get translations (cross-language mappings)
   */
  async getTranslations(synsetId: string): Promise<TranslationInfo[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      // Get the synset to find its ILI
      const synset = await this.queryService.getSynsetById(synsetId);
      if (!synset || !synset.ili) {
        return [];
      }

      // Find all synsets with the same ILI in different languages
      const db = (this.queryService as any).db;
      if (!db) {
        return [];
      }

      const relatedSynsets = await db
        .selectFrom('synsets')
        .select(['id', 'language', 'lexicon'])
        .where('ili', '=', synset.ili)
        .where('id', '!=', synsetId)
        .execute();

      // Get words for each related synset
      const translations: TranslationInfo[] = [];
      for (const relatedSynset of relatedSynsets) {
        const words = await this.queryService.getWordsBySynsetAndLanguage(relatedSynset.id, relatedSynset.language);
        if (words.length > 0) {
          translations.push({
            id: `${synsetId}-${relatedSynset.id}`,
            sourceSynsetId: synsetId,
            targetSynsetId: relatedSynset.id,
            language: relatedSynset.language,
            confidence: 1.0
          });
        }
      }

      return translations;
    } catch (error) {
      console.error('Error getting translations:', error);
      return [];
    }
  }

  // ============================================================================
  // REMAINING ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Get related synsets (general relationship query)
   */
  async getRelatedSynsets(synsetId: string, relationType?: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      const db = (this.queryService as any).db;
      if (!db) {
        return [];
      }

      // Query relations table for related synsets
      let query = db
        .selectFrom('relations')
        .select(['target_id', 'type'])
        .where('source_id', '=', synsetId);

      if (relationType) {
        query = query.where('type', '=', relationType);
      }

      const relations = await query.execute();
      
      if (relations.length === 0) {
        return [];
      }

      // Get the related synsets
      const relatedSynsetIds = relations.map((rel: any) => rel.target_id);
      const relatedSynsets: Synset[] = [];
      
      for (const synsetId of relatedSynsetIds) {
        const synset = await this.queryService.getSynsetById(synsetId);
        if (synset) {
          relatedSynsets.push(synset);
        }
      }

      return relatedSynsets;
    } catch (error) {
      console.error('Error getting related synsets:', error);
      return [];
    }
  }

  /**
   * Get related senses (general relationship query)
   */
  async getRelatedSenses(senseId: string, relationType?: string): Promise<Sense[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      const db = (this.queryService as any).db;
      if (!db) {
        return [];
      }

      // Query relations table for related senses
      let query = db
        .selectFrom('relations')
        .select(['target_id', 'type'])
        .where('source_id', '=', senseId);

      if (relationType) {
        query = query.where('type', '=', relationType);
      }

      const relations = await query.execute();
      
      if (relations.length === 0) {
        return [];
      }

      // Get the related senses
      const relatedSenseIds = relations.map((rel: any) => rel.target_id);
      const relatedSenses: Sense[] = [];
      
      for (const senseId of relatedSenseIds) {
        const sense = await this.queryService.getSenseById(senseId);
        if (sense) {
          relatedSenses.push(sense);
        }
      }

      return relatedSenses;
    } catch (error) {
      console.error('Error getting related senses:', error);
      return [];
    }
  }

  /**
   * Get shortest path between two synsets
   */
  async getShortestPath(sourceId: string, targetId: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      // Simple BFS implementation for shortest path
      const visited = new Set<string>();
      const queue: { synsetId: string; path: Synset[] }[] = [];
      
      // Start with source synset
      const sourceSynset = await this.queryService.getSynsetById(sourceId);
      if (!sourceSynset) {
        return [];
      }
      
      queue.push({ synsetId: sourceId, path: [sourceSynset] });
      visited.add(sourceId);
      
      while (queue.length > 0) {
        const { synsetId, path } = queue.shift()!;
        
        if (synsetId === targetId) {
          return path;
        }
        
        // Get related synsets
        const relatedSynsets = await this.getRelatedSynsets(synsetId);
        
        for (const relatedSynset of relatedSynsets) {
          if (!visited.has(relatedSynset.id)) {
            visited.add(relatedSynset.id);
            queue.push({ 
              synsetId: relatedSynset.id, 
              path: [...path, relatedSynset] 
            });
          }
        }
      }
      
      return []; // No path found
    } catch (error) {
      console.error('Error getting shortest path:', error);
      return [];
    }
  }

  /**
   * Get synset depth in hierarchy
   */
  async getSynsetDepth(synsetId: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      // Find the root of the hierarchy by following hypernym relations upward
      let currentId = synsetId;
      let depth = 0;
      const visited = new Set<string>();
      
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        
        // Get hypernym relations (parent synsets)
        const hypernyms = await this.getRelatedSynsets(currentId, 'hypernym');
        
        if (hypernyms.length === 0) {
          break; // Reached root
        }
        
        currentId = hypernyms[0].id; // Take first hypernym
        depth++;
      }
      
      return depth;
    } catch (error) {
      console.error('Error getting synset depth:', error);
      return 0;
    }
  }

  /**
   * Get synset height in hierarchy
   */
  async getSynsetHeight(synsetId: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate height in hierarchy
    // For now, return 0
    return 0;
  }

  /**
   * Get lowest common subsumer
   */
  async getLowestCommonSubsumer(synsetId1: string, synsetId2: string): Promise<Synset | null> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would find the lowest common subsumer
    // For now, return null
    return null;
  }

  /**
   * Get path similarity between two synsets
   */
  async getPathSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    try {
      // Find shortest path between synsets
      const path = await this.getShortestPath(synsetId1, synsetId2);
      
      if (path.length === 0) {
        return 0; // No path found
      }
      
      // Path similarity = 1 / (path_length + 1)
      return 1 / (path.length + 1);
    } catch (error) {
      console.error('Error getting path similarity:', error);
      return 0;
    }
  }

  /**
   * Get Leacock-Chodorow similarity
   */
  async getLeacockChodorowSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate Leacock-Chodorow similarity
    // For now, return 0
    return 0;
  }

  /**
   * Get Wu-Palmer similarity
   */
  async getWuPalmerSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate Wu-Palmer similarity
    // For now, return 0
    return 0;
  }

  /**
   * Get Resnik similarity
   */
  async getResnikSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate Resnik similarity
    // For now, return 0
    return 0;
  }

  /**
   * Get Jiang-Conrath similarity
   */
  async getJiangConrathSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate Jiang-Conrath similarity
    // For now, return 0
    return 0;
  }

  /**
   * Get Lin similarity
   */
  async getLinSimilarity(synsetId1: string, synsetId2: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate Lin similarity
    // For now, return 0
    return 0;
  }

  /**
   * Get information content for a synset
   */
  async getInformationContent(synsetId: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate information content
    // For now, return 0
    return 0;
  }

  /**
   * Get maximum information content
   */
  async getMaxInformationContent(): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would get maximum information content
    // For now, return 0
    return 0;
  }

  /**
   * Get minimum information content
   */
  async getMinInformationContent(): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would get minimum information content
    // For now, return 0
    return 0;
  }

  /**
   * Get average information content
   */
  async getAverageInformationContent(): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate average information content
    // For now, return 0
    return 0;
  }

  /**
   * Get information content for a word
   */
  async getWordInformationContent(wordId: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate word information content
    // For now, return 0
    return 0;
  }

  /**
   * Get information content for a sense
   */
  async getSenseInformationContent(senseId: string): Promise<number> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would calculate sense information content
    // For now, return 0
    return 0;
  }

  // ============================================================================
  // TRANSLATION AND CROSS-LINGUAL QUERIES (inspired by wn-ts-node)
  // ============================================================================

  /**
   * Translate a word to target language(s)
   * Equivalent to Word.translate() in Python Wn
   */
  async translateWord(wordId: string, targetLang: string): Promise<Record<string, Word[]>> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would require implementing cross-lingual mappings
    // For now, return empty result
    return {};
  }

  /**
   * Translate a synset to target language(s)
   * Equivalent to Synset.translate() in Python Wn
   */
  async translateSynset(synsetId: string, targetLang: string): Promise<Synset[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synset = await this.synset(synsetId);
    if (synset.ili) {
      return this.synsetsByILI(synset.ili);
    }
    return [];
  }

  /**
   * Translate a sense to target language(s)
   * Equivalent to Sense.translate() in Python Wn
   */
  async translateSense(senseId: string, targetLang: string): Promise<Sense[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would require implementing sense-level translations
    // For now, return empty array
    return [];
  }

  /**
   * Get cross-lingual synsets by ILI
   * Enhanced interlingual lookup
   */
  async getCrossLingualSynsets(iliId: string, targetLangs?: string[]): Promise<Record<string, Synset[]>> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synsets = await this.synsetsByILI(iliId);
    const result: Record<string, Synset[]> = {};
    
    for (const synset of synsets) {
      const lang = synset.language;
      if (!targetLangs || targetLangs.includes(lang)) {
        if (!result[lang]) {
          result[lang] = [];
        }
        result[lang].push(synset);
      }
    }
    
    return result;
  }

  // ============================================================================
  // CONTENT AND METADATA QUERIES (inspired by wn-ts-node)
  // ============================================================================

  /**
   * Get definitions for a synset
   * Equivalent to Synset.definition() in Python Wn
   */
  async getDefinitions(synsetId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synset = await this.synset(synsetId);
    return synset.definitions.map(d => d.text);
  }

  /**
   * Get examples for a synset
   * Equivalent to Synset.examples() in Python Wn
   */
  async getExamples(synsetId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synset = await this.synset(synsetId);
    return synset.examples.map(e => e.text);
  }

  /**
   * Get examples for a sense
   * Equivalent to Sense.examples() in Python Wn
   */
  async getSenseExamples(senseId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would query the examples table for sense-level examples
    // For now, return empty array
    return [];
  }

  /**
   * Get all words in a synset
   * Equivalent to Synset.words() in Python Wn
   */
  async getSynsetWords(synsetId: string): Promise<Word[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synset = await this.synset(synsetId);
    const words: Word[] = [];
    
    for (const memberId of synset.memberIds) {
      try {
        const word = await this.word(memberId);
        words.push(word);
      } catch (error) {
        // Skip invalid word IDs
      }
    }
    
    return words;
  }

  /**
   * Get all lemmas in a synset
   * Equivalent to Synset.lemmas() in Python Wn
   */
  async getSynsetLemmas(synsetId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const words = await this.getSynsetWords(synsetId);
    return words.map(w => w.lemma);
  }

  /**
   * Get all senses in a synset
   * Equivalent to Synset.senses() in Python Wn
   */
  async getSynsetSenses(synsetId: string): Promise<Sense[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const synset = await this.synset(synsetId);
    const senses: Sense[] = [];
    
    for (const senseId of synset.senseIds) {
      try {
        const sense = await this.sense(senseId);
        senses.push(sense);
      } catch (error) {
        // Skip invalid sense IDs
      }
    }
    
    return senses;
  }

  // ============================================================================
  // UTILITY AND CONFIGURATION METHODS (inspired by wn-ts-node)
  // ============================================================================

  /**
   * Check if a lexicon is available
   * Utility method for lexicon availability
   */
  async hasLexicon(lexiconId: string): Promise<boolean> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const lexicons = await this.lexicons();
    return lexicons.some(l => l.id === lexiconId);
  }

  /**
   * Get supported languages
   * Utility method for language support
   */
  async getSupportedLanguages(): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    const lexicons = await this.lexicons();
    const languages = new Set<string>();
    
    for (const lexicon of lexicons) {
      if (lexicon.language) {
        languages.add(lexicon.language);
      }
    }
    
    return Array.from(languages);
  }

  /**
   * Get lexicon dependencies
   * Utility method for dependency management
   */
  async getLexiconDependencies(lexiconId: string): Promise<string[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");
    
    // This would require implementing dependency tracking
    // For now, return empty array
    return [];
  }





  /**
   * Export data from the database
   */
  async exportData(): Promise<ExportData> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    const exportData: ExportData = {
      lexicons: [],
      exportDate: new Date().toISOString(),
      format: "json",
    };

    // Get all lexicons
    const lexicons = await this.queryService.getLexicons();

    for (const lexicon of lexicons) {
      const lexiconData: ExportLexicon = {
        id: lexicon.id,
        label: lexicon.label,
        language: lexicon.language,
        version: lexicon.version || '1.0',
        entries: [],
        synsets: [],
      };

      // Get words (entries) for this lexicon
      const words = await this.queryService.getWordsByLexicon(lexicon.id);
      for (const word of words) {
        const entry: ExportEntry = {
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
        const synsetData: ExportSynset = {
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
    if (typeof (this.database as { exportBytes?: () => Uint8Array }).exportBytes === "function") {
      return (this.database as { exportBytes: () => Uint8Array }).exportBytes();
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
      // this.eventEmitter.emit(WordNetEvents.DATABASE_CLEARED); // Removed
    } catch (error) {
      // this.eventEmitter.emit(WordNetEvents.ERROR, { // Removed
      //   operation: "close",
      //   error: error instanceof Error ? error.message : String(error),
      // });
      throw error;
    }
  }

  // Placeholder for projects (not implemented in web version)
  async getProjects(): Promise<ProjectInfo[]> {
    return [];
  }

  // Required WordNetCore interface methods
  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    try {
      return await this.queryService.query(sql, params);
    } catch (error) {
      logger.error("Error executing query:", error);
      throw error;
    }
  }

  async getRelations(synsetId: string, type?: string): Promise<any[]> {
    if (!this.initialized || !this.queryService)
      throw new Error("WebWordnet not initialized");

    try {
      return await this.queryService.getRelations(synsetId, type);
    } catch (error) {
      logger.error("Error getting relations:", error);
      throw error;
    }
  }
}

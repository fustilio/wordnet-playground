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
  WordNetCore,
  Definition
} from 'wn-ts-core';
import { KyselyWordnet } from './kysely-wordnet.js';
import { config } from './config.js';

export class Wordnet implements WordNetCore {
  private kyselyWordnet: KyselyWordnet;
  private _expand: string[];
  private _defaultNormalizer: (form: string) => string;
  private _defaultLemmatizer: (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>;

  private _initialized = false;

  constructor(
    lexicon: string = '*',
    options: WordnetOptions = {}
  ) {
    // Initialize properties directly since we're implementing WordNetCore interface
    this._expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    
    // Set default normalizer and lemmatizer
    this._defaultNormalizer = options.normalizer || this._createDefaultNormalizer();
    this._defaultLemmatizer = options.lemmatizer || this._createDefaultLemmatizer();
    


    // Initialize the KyselyWordnet instance
    const { strategy, ...otherOptions } = options;
    this.kyselyWordnet = new KyselyWordnet(lexicon, {
      filename: config.databasePath,
      normalizer: this._defaultNormalizer,
      strategy: strategy ?? 'default',
      ...otherOptions
    });
  }

  /**
   * Initialize the database if not already initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this._initialized) {
      await this.kyselyWordnet.initialize();
      this._initialized = true;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this._initialized) {
      await this.kyselyWordnet.close();
      this._initialized = false;
    }
  }

  /**
   * Create a default normalizer function
   */
  private _createDefaultNormalizer(): (form: string) => string {
    return (form: string) => form.toLowerCase().trim();
  }

  /**
   * Create a default lemmatizer function
   */
  private _createDefaultLemmatizer(): (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>> {
    return (form: string, pos?: PartOfSpeech) => {
      const result: Record<PartOfSpeech, Set<string>> = {
        'n': new Set(),
        'v': new Set(),
        'a': new Set(),
        'r': new Set(),
        's': new Set(),
        'c': new Set(),
        'p': new Set(),
        'x': new Set(),
        'u': new Set(),
        'i': new Set()
      };
      
      // Always include the original form
      if (pos) {
        result[pos] = new Set([form]);
      } else {
        // Add to all POS
        Object.keys(result).forEach(posKey => {
          result[posKey as PartOfSpeech] = new Set([form]);
        });
      }
      
      return result;
    };
  }

  async lexicons(): Promise<Lexicon[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.lexicons();
  }

  // Required WordNetCore interface method
  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> {
    await this.ensureInitialized();
    // KyselyWordnet doesn't have a direct query method, so we'll need to implement this
    // For now, return empty array - this would need to be implemented using the database directly
    console.warn('Direct SQL queries not implemented in Wordnet. Use specific methods instead.');
    return [];
  }

  /**
   * Get synsets with various query options
   */
  async synsets(query?: SynsetQuery): Promise<Synset[]>;
  async synsets(form: string, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Synset[]>;
  async synsets(formOrQuery?: string | SynsetQuery, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Synset[]> {
    await this.ensureInitialized();
    
    // Handle the overloaded call pattern
    if (typeof formOrQuery === 'string') {
      // Called as synsets(form, pos?, options?)
      const form = formOrQuery;
      const query: SynsetQuery = { form, pos, ...options };
      return this.kyselyWordnet.synsets(query);
    } else {
      // Called as synsets(query?)
      return this.kyselyWordnet.synsets(formOrQuery);
    }
  }

  /**
   * Get senses with various query options
   */
  async senses(query?: SenseQuery): Promise<Sense[]>;
  async senses(form: string, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Sense[]>;
  async senses(formOrQuery?: string | SenseQuery, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Sense[]> {
    await this.ensureInitialized();
    
    // Handle the overloaded call pattern
    if (typeof formOrQuery === 'string') {
      // Called as senses(form, pos?, options?)
      const form = formOrQuery;
      const query: SenseQuery = { 
        wordIdOrForm: form, 
        pos, 
        lexicon: Array.isArray(options?.lexicon) ? options.lexicon[0] : options?.lexicon 
      };
      return this.kyselyWordnet.senses(query);
    } else {
      // Called as senses(query?)
      return this.kyselyWordnet.senses(formOrQuery);
    }
  }

  /**
   * Get words with various query options
   */
  async words(query?: WordQuery): Promise<Word[]>;
  async words(form: string, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Word[]>;
  async words(formOrQuery?: string | WordQuery, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Word[]> {
    await this.ensureInitialized();
    
    // Handle the overloaded call pattern
    if (typeof formOrQuery === 'string') {
      // Called as words(form, pos?, options?)
      const form = formOrQuery;
      const query: WordQuery = { form, pos, ...options };
      return this.kyselyWordnet.words(query);
    } else {
      // Called as words(query?)
      return this.kyselyWordnet.words(formOrQuery);
    }
  }

  async getWord(form: string): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.words({ form });
  }

  async getSynset(id: string): Promise<Synset | null> {
    await this.ensureInitialized();
    const result = await this.kyselyWordnet.getSynset(id);
    return result || null;
  }

  /**
   * Alias for getSynset for consistency with other methods
   */
  async getSynsetById(id: string): Promise<Synset | null> {
    return this.getSynset(id);
  }

  async getSenses(form: string, pos?: PartOfSpeech, options?: { lexicon?: string | string[] }): Promise<Sense[]> {
    await this.ensureInitialized();
    const lexicon = Array.isArray(options?.lexicon) ? options.lexicon[0] : options?.lexicon;
    return this.kyselyWordnet.senses({ wordIdOrForm: form, pos, lexicon });
  }

  async getRelations(_synsetId: string, _relationType?: string): Promise<any[]> {
    await this.ensureInitialized();
    // This is a placeholder implementation - would need to be implemented based on the actual relations module
    console.warn('getRelations not fully implemented in Wordnet class');
    return [];
  }

  async getSense(id: string): Promise<Sense | undefined> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSense(id);
  }

  async getIli(id: string): Promise<ILI | undefined> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getIli(id);
  }

  // Add the missing "OrUndefined" methods that tests expect
  async getWordOrUndefined(id: string): Promise<Word | undefined> {
    return this.word(id).catch(() => undefined);
  }

  async getSynsetOrUndefined(id: string): Promise<Synset | undefined> {
    return this.synset(id).catch(() => undefined);
  }

  async getSenseOrUndefined(id: string): Promise<Sense | undefined> {
    return this.sense(id).catch(() => undefined);
  }

  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getStatistics();
  }

    async expandedLexicons(): Promise<Lexicon[]> {
    await this.ensureInitialized();
    
    if (this._expand.length === 0) {
      return [];
    }

    // Use the Kysely implementation to get expanded lexicons
    return this.kyselyWordnet.lexicons();
  }

  // Add the missing normalizer and lemmatizer methods that tests expect
  async normalizeForm(form: string): Promise<string> {
    return this._defaultNormalizer(form);
  }

  async morphy(form: string, pos?: PartOfSpeech): Promise<Record<PartOfSpeech, Set<string>>> {
    return this._defaultLemmatizer(form, pos);
  }

  async ilis(status?: string): Promise<ILI[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.ilis(status);
  }

  async word(wordId: string): Promise<Word> {
    await this.ensureInitialized();
    const result = await this.kyselyWordnet.getWord(wordId);
    if (!result) {
      throw new Error(`Word not found: ${wordId}`);
    }
    return result;
  }

  async synset(synsetId: string): Promise<Synset> {
    await this.ensureInitialized();
    const result = await this.kyselyWordnet.getSynset(synsetId);
    if (!result) {
      throw new Error(`Synset not found: ${synsetId}`);
    }
    return result;
  }

  async sense(senseId: string): Promise<Sense> {
    await this.ensureInitialized();
    const result = await this.kyselyWordnet.getSense(senseId);
    if (!result) {
      throw new Error(`Sense not found: ${senseId}`);
    }
    return result;
  }

  async ili(iliId: string): Promise<ILI> {
    await this.ensureInitialized();
    const ili = await this.kyselyWordnet.getIli(iliId);
    if (!ili) {
      throw new Error(`ILI not found: ${iliId}`);
    }
    return ili;
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.synsetsByILI(iliId);
  }

  // Implement missing abstract methods by delegating to KyselyWordnet
  async getProjects(): Promise<any[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getProjects();
  }

  async searchWords(query: any): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.searchWords(query);
  }

  async searchSynsets(query: any): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.searchSynsets(query);
  }

  async wordsByForm(form: string, options?: any): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.wordsByForm(form, options);
  }

  async synsetsByForm(form: string, options?: any): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.synsetsByForm(form, options);
  }

  async getWordForms(wordId: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getWordForms(wordId);
  }

  async getWordLemma(wordId: string): Promise<string> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getWordLemma(wordId);
  }

  async getDerivedWords(wordId: string): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getDerivedWords(wordId);
  }

  async getHypernyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getHypernyms(synsetId);
  }

  async getHyponyms(synsetId: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getHyponyms(synsetId);
  }

  async getRelatedSynsets(synsetId: string, relationType: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getRelatedSynsets(synsetId, relationType);
  }

  async getRelatedSenses(senseId: string, relationType: string): Promise<Sense[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getRelatedSenses(senseId, relationType);
  }

  async getShortestPath(synsetId1: string, synsetId2: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getShortestPath(synsetId1, synsetId2);
  }

  async getSynsetDepth(synsetId: string): Promise<number> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSynsetDepth(synsetId);
  }

  async translateWord(wordId: string, targetLang: string): Promise<Record<string, Word[]>> {
    await this.ensureInitialized();
    return this.kyselyWordnet.translateWord(wordId, targetLang);
  }

  async translateSynset(synsetId: string, targetLang: string): Promise<Synset[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.translateSynset(synsetId, targetLang);
  }

  async translateSense(senseId: string, targetLang: string): Promise<Sense[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.translateSense(senseId, targetLang);
  }

  async getCrossLingualSynsets(iliId: string, targetLangs?: string[]): Promise<Record<string, Synset[]>> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getCrossLingualSynsets(iliId, targetLangs);
  }

  async getDefinitions(synsetId: string): Promise<Definition[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getDefinitions(synsetId);
  }

  async getExamples(synsetId: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getExamples(synsetId);
  }

  async getSenseExamples(senseId: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSenseExamples(senseId);
  }

  async getSynsetWords(synsetId: string): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSynsetWords(synsetId);
  }

  async getSynsetLemmas(synsetId: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSynsetLemmas(synsetId);
  }

  async getSynsetSenses(synsetId: string): Promise<Sense[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSynsetSenses(synsetId);
  }

  async hasLexicon(lexiconId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.kyselyWordnet.hasLexicon(lexiconId);
  }

  async getSupportedLanguages(): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getSupportedLanguages();
  }

  async getLexiconDependencies(lexiconId: string): Promise<string[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getLexiconDependencies(lexiconId);
  }

  /**
   * Get words by ILI and language
   */
  async getWordsByIliAndLanguage(ili: string, language?: string): Promise<Word[]> {
    await this.ensureInitialized();
    return this.kyselyWordnet.getWordsByIliAndLanguage(ili, language);
  }

  // Additional methods that may not be in KyselyWordnet but are required by BaseWordnet
  async getLexiconStatistics(lexiconId?: string): Promise<any[]> {
    await this.ensureInitialized();
    // This method might not exist in KyselyWordnet, so we'll implement a basic version
    const lexicons = await this.kyselyWordnet.lexicons();
    if (lexiconId) {
      return lexicons.filter(l => l.id === lexiconId).map(l => ({
        lexiconId: l.id,
        label: l.label,
        language: l.language,
        version: l.version || '',
        wordCount: 0, // Would need to implement actual counting
        synsetCount: 0,
        senseCount: 0,
        iliCount: 0
      }));
    }
    return lexicons.map(l => ({
      lexiconId: l.id,
      label: l.label,
      language: l.language,
      version: l.version || '',
      wordCount: 0,
      synsetCount: 0,
      senseCount: 0,
      iliCount: 0
    }));
  }

  async getDataQualityMetrics(): Promise<any> {
    await this.ensureInitialized();
    // Basic implementation - would need to implement actual metrics
    return {
      synsetsWithILI: 0,
      synsetsWithoutILI: 0,
      iliCoveragePercentage: 0,
      emptySynsets: 0,
      synsetsWithDefinitions: 0,
      synsetsWithExamples: 0,
      averageSynsetSize: 0
    };
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    await this.ensureInitialized();
    // Basic implementation - would need to implement actual distribution
    return {};
  }

  async getSynsetSizeAnalysis(): Promise<any> {
    await this.ensureInitialized();
    // Basic implementation - would need to implement actual analysis
    return {
      averageSize: 0,
      maxSize: 0,
      minSize: 0,
      sizeDistribution: {}
    };
  }

  /**
   * Get the query service for direct database operations
   */
  async getQueryService() {
    await this.ensureInitialized();
    return this.kyselyWordnet.getQueryService();
  }
}
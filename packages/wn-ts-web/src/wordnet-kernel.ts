/**
 * Kernel-based WordNet for Web/Browser
 * 
 * This provides a kernel-based WordNet implementation that uses the new plugin system
 * while maintaining compatibility with the existing Web architecture.
 */

import { createWordNet, type WordNetWithPlugins } from 'wn-ts-core';
import { relations, similarity, translation, enhancedRelations } from 'wn-ts-core/plugins';
import { WebWordnet } from './client/submodules/web-wordnet.js';
import type { 
  WordQuery, 
  SynsetQuery, 
  SenseQuery,
  Word,
  Synset,
  Sense,
  Lexicon,
  ILI
} from 'wn-ts-core';
import type { 
  WordNetKernelOptions,
  WordNetEventData
} from './types/index.js';
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

// Type for relation results (matches the structure returned by enhanced relations plugin)
type RelationResult = {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
  relationType: string;
};

/**
 * Kernel-based WordNet for Web/Browser
 * Provides the new plugin system with full type safety
 */
export class WebWordNetKernel {
  private wordnet: WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation, typeof enhancedRelations]>;
  private core: WebWordnet;

  constructor(lexicon: string | string[] = '*', options: WordNetKernelOptions = {}) {
    // Ensure language property is present for WebWordnet compatibility
    const webWordnetOptions = { ...options, language: options.language || undefined };
    this.core = new WebWordnet(lexicon, webWordnetOptions);
    this.wordnet = createWordNet({
      core: this.core,
      plugins: [relations, similarity, translation, enhancedRelations] as const
    });
  }

  // Initialize the WordNet instance
  async initialize(sqlJsModule: Sqlite3Static): Promise<void> {
    await this.core.initialize(sqlJsModule);
  }

  // Close the WordNet instance
  async close(): Promise<void> {
    await this.core.close();
  }

  // Core WordNet methods (delegate to wordnet)
  async words(query?: WordQuery): Promise<Word[]> {
    return this.wordnet.words(query);
  }

  async word(wordId: string): Promise<Word> {
    return this.wordnet.word(wordId);
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    return this.wordnet.synsets(query);
  }

  async synset(synsetId: string): Promise<Synset> {
    return this.wordnet.synset(synsetId);
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    return this.wordnet.senses(query);
  }

  async sense(senseId: string): Promise<Sense> {
    return this.wordnet.sense(senseId);
  }

  async lexicons(): Promise<Lexicon[]> {
    return this.wordnet.lexicons();
  }

  async ili(iliId: string): Promise<ILI> {
    return this.wordnet.ili(iliId);
  }

  async ilis(status?: string): Promise<ILI[]> {
    return this.wordnet.ilis(status);
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    return this.wordnet.synsetsByILI(iliId);
  }

  // Plugin methods - Relations
  async getHypernyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getHypernyms(synsetId, lexicon);
  }

  async getHyponyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getHyponyms(synsetId, lexicon);
  }

  async getMeronyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getMeronyms(synsetId, lexicon);
  }

  async getHolonyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getHolonyms(synsetId, lexicon);
  }

  async getEntailments(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getEntailments(synsetId, lexicon);
  }

  async getSimilarTos(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>> {
    return this.wordnet.getSimilarTos(synsetId, lexicon);
  }

  async getRelationsByType(synsetId: string, relationType: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    type: string;
  }>> {
    return this.wordnet.getRelationsByType(synsetId, relationType, lexicon);
  }

  async getAllRelations(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    sourceId: string;
    targetId: string;
    type: string;
    sourceLemma: string;
    targetLemma: string;
    sourceLexicon: string;
    targetLexicon: string;
    direction: 'incoming' | 'outgoing';
  }>> {
    return this.wordnet.getAllRelations(synsetId, lexicon);
  }

  async getRelationTypes(synsetId: string, lexicon?: string): Promise<string[]> {
    return this.wordnet.getRelationTypes(synsetId, lexicon);
  }

  async getRelationStats(synsetId: string, lexicon?: string): Promise<Array<{
    type: string;
    count: number;
    direction: 'incoming' | 'outgoing';
  }>> {
    return this.wordnet.getRelationStats(synsetId, lexicon);
  }

  // Enhanced Relations Methods - Comprehensive WordNet Relations
  // Hierarchical relations
  async getInstanceHypernyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getInstanceHypernyms?.(synsetId, lexicon) || [];
  }

  async getInstanceHyponyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getInstanceHyponyms?.(synsetId, lexicon) || [];
  }

  // Part-whole relations
  async getPartMeronyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getPartMeronyms?.(synsetId, lexicon) || [];
  }

  async getMemberMeronyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getMemberMeronyms?.(synsetId, lexicon) || [];
  }

  async getSubstanceMeronyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getSubstanceMeronyms?.(synsetId, lexicon) || [];
  }

  // Semantic role relations
  async getAgents(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getAgents?.(synsetId, lexicon) || [];
  }

  async getPatients(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getPatients?.(synsetId, lexicon) || [];
  }

  async getInstruments(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getInstruments?.(synsetId, lexicon) || [];
  }

  async getResults(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getResults?.(synsetId, lexicon) || [];
  }

  async getSources(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getSources?.(synsetId, lexicon) || [];
  }

  async getTargets(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getTargets?.(synsetId, lexicon) || [];
  }

  async getLocations(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getLocations?.(synsetId, lexicon) || [];
  }

  async getDirections(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getDirections?.(synsetId, lexicon) || [];
  }

  async getManners(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getManners?.(synsetId, lexicon) || [];
  }

  async getRoles(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getRoles?.(synsetId, lexicon) || [];
  }

  // Domain relations
  async getDomainTopics(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getDomainTopics?.(synsetId, lexicon) || [];
  }

  async getDomainRegions(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getDomainRegions?.(synsetId, lexicon) || [];
  }

  // Causal relations
  async getCauses(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getCauses?.(synsetId, lexicon) || [];
  }

  // Similarity relations
  async getSimilar(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getSimilar?.(synsetId, lexicon) || [];
  }

  // Opposition relations
  async getAntonyms(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getAntonyms?.(synsetId, lexicon) || [];
  }

  // Gender relations
  async getFeminine(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getFeminine?.(synsetId, lexicon) || [];
  }

  async getMasculine(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getMasculine?.(synsetId, lexicon) || [];
  }

  // Size relations
  async getDiminutives(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getDiminutives?.(synsetId, lexicon) || [];
  }

  async getAugmentatives(synsetId: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getAugmentatives?.(synsetId, lexicon) || [];
  }

  // Generic query methods
  async getRelationsByCategory(synsetId: string, category: string, lexicon?: string): Promise<RelationResult[]> {
    return this.wordnet.getRelationsByCategory?.(synsetId, category, lexicon) || [];
  }

  async getAvailableRelationTypes(synsetId: string, lexicon?: string): Promise<string[]> {
    return this.wordnet.getAvailableRelationTypes?.(synsetId, lexicon) || [];
  }

  async getRelationStatsByCategory(synsetId: string, lexicon?: string): Promise<Record<string, number>> {
    return this.wordnet.getRelationStatsByCategory?.(synsetId, lexicon) || {};
  }

  // Utility methods
  async getRelationDescriptions(): Promise<Record<string, string>> {
    return this.wordnet.getRelationDescriptions?.() || {};
  }

  async getRelationCategories(): Promise<Record<string, string[]>> {
    return this.wordnet.getRelationCategories?.() || {};
  }

  async isValidRelationType(relationType: string): Promise<boolean> {
    return this.wordnet.isValidRelationType?.(relationType) || false;
  }

  async getRelationTypesByCategory(category: string): Promise<string[]> {
    return this.wordnet.getRelationTypesByCategory?.(category) || [];
  }

  // Plugin methods - Similarity
  async getPathSimilarity(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getPathSimilarity(synset1, synset2);
  }

  async getWuPalmerSimilarity(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getWuPalmerSimilarity(synset1, synset2);
  }

  async getLeacockChodorowSimilarity(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getLeacockChodorowSimilarity(synset1, synset2);
  }

  async getJaccardSimilarity(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getJaccardSimilarity(synset1, synset2);
  }

  async getBestSimilarity(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getBestSimilarity(synset1, synset2);
  }

  async findMostSimilar(synsetId: string, limit?: number): Promise<Array<{
    id: string;
    similarity: number;
  }>> {
    return this.wordnet.findMostSimilar(synsetId, limit);
  }

  // Plugin methods - Translation
  async getTranslations(synsetId: string, targetLanguage?: string): Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    lemma: string;
    pos: string;
  }>> {
    return this.wordnet.getTranslations(synsetId, targetLanguage);
  }

  async getTranslationsByWord(wordForm: string, sourceLanguage: string, targetLanguage: string): Promise<Array<{
    sourceSynset: string;
    ili: string;
    translations: Array<{
      lemma: string;
      pos: string;
      lexicon: string;
    }>;
  }>> {
    return this.wordnet.getTranslationsByWord(wordForm, sourceLanguage, targetLanguage);
  }

  async getAvailableLanguages(synsetId: string): Promise<Array<{
    language: string;
    word_count: number;
  }>> {
    return this.wordnet.getAvailableLanguages(synsetId);
  }

  async getSynsetsByIli(ili: string): Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    pos: string;
    words: string;
  }>> {
    return this.wordnet.getSynsetsByIli(ili);
  }

  async getTranslationConfidence(synset1: string, synset2: string): Promise<number> {
    return this.wordnet.getTranslationConfidence(synset1, synset2);
  }

  async getTranslationSuggestions(wordForm: string, sourceLanguage: string, targetLanguage: string): Promise<Array<{
    sourceSynset: string;
    ili: string;
    confidence: number;
    targetWords: string[];
  }>> {
    return this.wordnet.getTranslationSuggestions(wordForm, sourceLanguage, targetLanguage);
  }

  // Schema management (if Kysely database is available)
  get schemaManager() {
    return this.wordnet.schemaManager;
  }

  // Plugin management
  getPlugins(): string[] {
    return this.wordnet.getPlugins();
  }

  has(pluginName: string): boolean {
    return this.wordnet.has(pluginName);
  }

  // Get the underlying core for advanced usage
  getCore(): WebWordnet {
    return this.core;
  }

  // Get the underlying wordnet instance for advanced usage
  getWordnet(): WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation]> {
    return this.wordnet as WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation]>;
  }
}

// ============================================================================
// FACTORY FUNCTION - The main way to create WordNet instances
// ============================================================================

/**
 * Create a WordNet instance for web browsers
 * 
 * @param lexicon - Lexicon identifier (e.g., 'oewn:2024')
 * @param options - Configuration options
 * @returns WordNet instance
 * 
 * @example
 * ```typescript
 * import { createWebWordnet } from 'wn-ts-web';
 * 
 * // Simple usage
 * const wn = createWebWordnet('oewn:2024');
 * const results = await wn.search('computer');
 * 
 * // With options
 * const wn = createWebWordnet('oewn:2024', {
 *   storage: 'opfs',
 *   cache: true
 * });
 * ```
 */
export function createWebWordnet(
  lexicon: string | string[] = 'oewn:2024',
  options: WordNetKernelOptions = {}
): WebWordNetKernel {
  return new WebWordNetKernel(lexicon, options);
}

// ============================================================================
// TYPES
// ============================================================================

export type { WordNetKernelOptions } from './types/index.js';



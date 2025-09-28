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

/**
 * Kernel-based WordNet for Web/Browser
 * Provides the new plugin system with full type safety
 */
export class WebWordNetKernel {
  private wordnet: WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation, typeof enhancedRelations]>;
  private core: WebWordnet;

  constructor(lexicon: string | string[] = '*', options: WordNetKernelOptions = {}) {
    this.core = new WebWordnet(lexicon, options);
    this.wordnet = createWordNet({
      core: this.core,
      plugins: [relations, similarity, translation, enhancedRelations] as const
    });
  }

  // Initialize the WordNet instance
  async initialize(): Promise<void> {
    await this.core.initialize();
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
  async getInstanceHypernyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getInstanceHypernyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getInstanceHyponyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getInstanceHyponyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Part-whole relations
  async getPartMeronyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getPartMeronyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getMemberMeronyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getMemberMeronyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getSubstanceMeronyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getSubstanceMeronyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Semantic role relations
  async getAgents(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getAgents?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getPatients(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getPatients?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getInstruments(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getInstruments?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getResults(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getResults?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getSources(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getSources?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getTargets(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getTargets?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getLocations(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getLocations?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getDirections(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getDirections?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getManners(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getManners?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getRoles(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRoles?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Domain relations
  async getDomainTopics(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getDomainTopics?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getDomainRegions(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getDomainRegions?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Causal relations
  async getCauses(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getCauses?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Similarity relations
  async getSimilar(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getSimilar?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Opposition relations
  async getAntonyms(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getAntonyms?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Gender relations
  async getFeminine(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getFeminine?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getMasculine(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getMasculine?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Size relations
  async getDiminutives(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getDiminutives?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getAugmentatives(synsetId: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getAugmentatives?.(this.wordnet, synsetId, lexicon) || [];
  }

  // Generic query methods
  async getRelationsByCategory(synsetId: string, category: string, lexicon?: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    relationType: string;
  }>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRelationsByCategory?.(this.wordnet, synsetId, category, lexicon) || [];
  }

  async getAvailableRelationTypes(synsetId: string, lexicon?: string): Promise<string[]> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getAvailableRelationTypes?.(this.wordnet, synsetId, lexicon) || [];
  }

  async getRelationStatsByCategory(synsetId: string, lexicon?: string): Promise<Record<string, number>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRelationStatsByCategory?.(this.wordnet, synsetId, lexicon) || {};
  }

  // Utility methods
  async getRelationDescriptions(): Promise<Record<string, string>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRelationDescriptions?.() || {};
  }

  async getRelationCategories(): Promise<Record<string, string[]>> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRelationCategories?.() || {};
  }

  async isValidRelationType(relationType: string): Promise<boolean> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.isValidRelationType?.(relationType) || false;
  }

  async getRelationTypesByCategory(category: string): Promise<string[]> {
    return this.wordnet.plugins.get('enhanced-relations')?.methods.getRelationTypesByCategory?.(category) || [];
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
  getCore(): WebWordNetCore {
    return this.core;
  }

  // Get the underlying wordnet instance for advanced usage
  getWordnet(): WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation]> {
    return this.wordnet as WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation]>;
  }
}



/**
 * Kernel-based WordNet for Web/Browser
 * 
 * This provides a kernel-based WordNet implementation that uses the new plugin system
 * while maintaining compatibility with the existing Web architecture.
 */

import { createWordNet, type WordNetWithPlugins } from 'wn-ts-core';
import { relations, similarity, translation } from 'wn-ts-core/plugins';
import { WebWordNetCore } from './wordnet-core.js';

/**
 * Kernel-based WordNet for Web/Browser
 * Provides the new plugin system with full type safety
 */
export class WebWordNetKernel {
  private wordnet: WordNetWithPlugins<readonly [typeof relations, typeof similarity, typeof translation]>;
  private core: WebWordNetCore;

  constructor(lexicon: string | string[] = '*', options: any = {}) {
    this.core = new WebWordNetCore(lexicon, options);
    this.wordnet = createWordNet({
      core: this.core,
      plugins: [relations, similarity, translation] as const
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
  async words(query?: any): Promise<any[]> {
    return this.wordnet.words(query);
  }

  async word(wordId: string): Promise<any> {
    return this.wordnet.word(wordId);
  }

  async synsets(query?: any): Promise<any[]> {
    return this.wordnet.synsets(query);
  }

  async synset(synsetId: string): Promise<any> {
    return this.wordnet.synset(synsetId);
  }

  async senses(query?: any): Promise<any[]> {
    return this.wordnet.senses(query);
  }

  async sense(senseId: string): Promise<any> {
    return this.wordnet.sense(senseId);
  }

  async ili(iliId: string): Promise<any> {
    return this.wordnet.ili(iliId);
  }

  async ilis(status?: string): Promise<any[]> {
    return this.wordnet.ilis(status);
  }

  async synsetsByILI(iliId: string): Promise<any[]> {
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



/**
 * Kernel-based WordNet for Node.js
 * 
 * This provides a kernel-based WordNet implementation that uses the new plugin system
 * while maintaining compatibility with the existing Node.js architecture.
 */

import { createWordNet, type WordNetWithPlugins } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';
import { NodeWordNetCore } from './wordnet-core.js';
import type { NodeWordnetConfig } from './kysely-wordnet.js';
import { config } from './config.js';

/**
 * Kernel-based WordNet for Node.js
 * Provides the new plugin system with full type safety
 */
export class NodeWordNetKernel {
  private wordnet: WordNetWithPlugins<readonly [typeof similarity, typeof translation]>;
  private core: NodeWordNetCore;

  constructor(lexicon: string | string[] = '*', options: Partial<NodeWordnetConfig> = {}) {
    // Provide default filename if not specified - use config.databasePath instead of :memory:
    // This ensures NodeWordNetKernel uses the same database as download()
    // This fixes Bug #2: Empty database queries
    const kernelConfig: NodeWordnetConfig = {
      filename: options.filename || config.databasePath,
      ...options
    };
    this.core = new NodeWordNetCore(lexicon, kernelConfig);
    this.wordnet = createWordNet({
      core: this.core,
      plugins: [similarity, translation] as const
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
  async getHypernyms(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getHypernyms?.(synsetId) || [];
  }

  async getHyponyms(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getHyponyms?.(synsetId) || [];
  }

  async getMeronyms(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getMeronyms?.(synsetId) || [];
  }

  async getHolonyms(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getHolonyms?.(synsetId) || [];
  }

  async getEntailments(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getEntailments?.(synsetId) || [];
  }

  async getSimilarTos(synsetId: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
  }>> {
    return (this.wordnet as any).getSimilarTos?.(synsetId) || [];
  }

  async getRelationsByType(synsetId: string, relationType: string): Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    type: string;
  }>> {
    return (this.wordnet as any).getRelationsByType?.(synsetId, relationType) || [];
  }

  async getAllRelations(synsetId: string): Promise<Array<{
    id: string;
    source_id: string;
    target_id: string;
    type: string;
    source_lemma: string;
    target_lemma: string;
    direction: 'incoming' | 'outgoing';
  }>> {
    return (this.wordnet as any).getAllRelations?.(synsetId) || [];
  }

  // Plugin methods - Similarity
  async getPathSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getPathSimilarity?.(synset1, synset2) || 0;
  }

  async getWuPalmerSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getWuPalmerSimilarity?.(synset1, synset2) || 0;
  }

  async getLeacockChodorowSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getLeacockChodorowSimilarity?.(synset1, synset2) || 0;
  }

  async getJaccardSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getJaccardSimilarity?.(synset1, synset2) || 0;
  }

  async getBestSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getBestSimilarity?.(synset1, synset2) || 0;
  }

  async findMostSimilar(synsetId: string, limit?: number): Promise<Array<{
    id: string;
    similarity: number;
  }>> {
    return (this.wordnet as any).findMostSimilar?.(synsetId, limit) || [];
  }

  // Cross-lingual similarity methods
  async getCrossLingualSimilarity(synset1: string | any, synset2: string | any): Promise<number> {
    return (this.wordnet as any).getCrossLingualSimilarity?.(synset1, synset2) || 0;
  }

  // Plugin methods - Translation
  async getTranslations(synsetId: string, targetLanguage?: string): Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    lemma: string;
    pos: string;
  }>> {
    return (this.wordnet as any).getTranslations?.(synsetId, targetLanguage) || [];
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
    return (this.wordnet as any).getTranslationsByWord?.(wordForm, sourceLanguage, targetLanguage) || [];
  }

  async getAvailableLanguages(synsetId: string): Promise<Array<{
    language: string;
    word_count: number;
  }>> {
    return (this.wordnet as any).getAvailableLanguages?.(synsetId) || [];
  }

  async getSynsetsByIli(ili: string): Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    pos: string;
    words: string;
  }>> {
    return (this.wordnet as any).getSynsetsByIli?.(ili) || [];
  }

  async getTranslationConfidence(synset1: string, synset2: string): Promise<number> {
    return (this.wordnet as any).getTranslationConfidence?.(synset1, synset2) || 0;
  }

  async getTranslationSuggestions(wordForm: string, sourceLanguage: string, targetLanguage: string): Promise<Array<{
    sourceSynset: string;
    ili: string;
    confidence: number;
    targetWords: string[];
  }>> {
    return (this.wordnet as any).getTranslationSuggestions?.(wordForm, sourceLanguage, targetLanguage) || [];
  }

  // Schema management (if Kysely database is available)
  get schemaManager() {
    return (this.wordnet as any).schemaManager;
  }

  // Plugin management
  getPlugins(): string[] {
    return this.wordnet.getPlugins();
  }

  has(pluginName: string): boolean {
    return this.wordnet.has(pluginName);
  }

  // Get the underlying core for advanced usage
  getCore(): NodeWordNetCore {
    return this.core;
  }

  // Get the underlying wordnet instance for advanced usage
  getWordnet(): WordNetWithPlugins<readonly [typeof similarity, typeof translation]> {
    return this.wordnet;
  }
}



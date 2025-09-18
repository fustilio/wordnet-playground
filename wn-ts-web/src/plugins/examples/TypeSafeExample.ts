/**
 * Type-Safe Plugin System Example
 * Demonstrates full TypeScript type safety with autocomplete and compile-time checking
 */

import { createWordNet } from 'wn-ts-core/plugins';
import { relations, similarity, translation } from 'wn-ts-core/plugins';
import type { WordNetCore, WordNetWithPlugins } from 'wn-ts-core/plugins';

// Mock core implementation with proper types
const mockCore: WordNetCore = {
  query: async (sql: string, params?: unknown[]) => {
    console.log('Query:', sql, params);
    return [
      { id: 'synset1', lemma: 'computer', pos: 'n', language: 'en' },
      { id: 'synset2', lemma: 'machine', pos: 'n', language: 'en' }
    ];
  },
  // Required BaseWordnet methods
  words: async (query?: any) => [],
  word: async (wordId: string) => ({ id: wordId, lemma: 'test' }),
  synsets: async (query?: any) => [],
  synset: async (synsetId: string) => ({ id: synsetId, lemma: 'test' }),
  senses: async (query?: any) => [],
  sense: async (senseId: string) => ({ id: senseId, lemma: 'test' }),
  // ILI methods are not part of WordNetCore interface
  // ili: async (iliId: string) => ({ id: iliId, status: 'active' }),
  // ilis: async (status?: string) => [],
  // synsetsByILI: async (iliId: string) => [],
  // Additional methods for plugin system
  getWord: async (form: string) => [],
  getSynset: async (id: string) => ({ id, lemma: 'test' }),
  getSenses: async (wordId: string) => [],
  getDefinitions: async (synsetId: string) => [],
  getRelations: async (synsetId: string, type?: string) => []
};

/**
 * Example 1: Basic type-safe usage
 */
export async function basicTypeSafeExample() {
  console.log('=== Basic Type-Safe Usage ===');

  // Create WordNet with plugins - fully type-safe
  const wordnet = createWordNet({
    core: mockCore,
    plugins: [relations, similarity, translation] as const // 'as const' preserves exact types
  });

  // TypeScript knows all available methods and their signatures
  const hypernyms = await wordnet.getHypernyms('computer-synset');
  //    ^? Array<{ id: string; lemma: string; pos: string; language: string; }>

  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
  //    ^? number

  const translations = await wordnet.getTranslations('computer-synset', 'fr');
  //    ^? Array<{ id: string; language: string; lexicon: string; lemma: string; pos: string; }>

  // TypeScript will catch errors at compile time
  // const error = await wordnet.getHypernyms(); // ❌ Error: Expected 1 argument, but got 0
  // const error2 = await wordnet.getPathSimilarity('car'); // ❌ Error: Expected 2 arguments, but got 1
  // const error3 = await wordnet.nonExistentMethod(); // ❌ Error: Property 'nonExistentMethod' does not exist

  console.log('Hypernyms:', hypernyms);
  console.log('Similarity:', sim);
  console.log('Translations:', translations);
}

/**
 * Example 2: Lazy loading with type safety
 */
export async function lazyLoadingTypeSafeExample() {
  console.log('=== Lazy Loading Type Safety ===');

  // Create WordNet with all plugins at once - TypeScript knows all methods are available
  const wordnet = createWordNet({ 
    core: mockCore,
    plugins: [relations, similarity, translation]
  });
  //    ^? WordNetWithPlugins<readonly [Plugin<RelationsMethods>, Plugin<SimilarityMethods>, Plugin<TranslationMethods>]>

  // TypeScript knows all methods are available
  const words = await wordnet.getWord('computer');
  const hypernyms = await wordnet.getHypernyms('computer-synset');
  //    ^? Array<{ id: string; lemma: string; pos: string; language: string; }>
  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
  //    ^? number

  console.log('Words:', words);
  console.log('Hypernyms:', hypernyms);
  console.log('Similarity:', sim);
}

/**
 * Example 3: Type-safe plugin composition
 */
export async function typeSafeCompositionExample() {
  console.log('=== Type-Safe Plugin Composition ===');

  // Create custom plugin with proper types
  const advancedSimilarity = {
    name: 'advanced-similarity',
    methods: {
      getBestSimilarity: async (core: WordNetCore, synset1: string, synset2: string): Promise<number> => {
        // Use core query method to get similarity data
        const pathResult = await core.query(`
          SELECT COUNT(*) as path_length FROM relations 
          WHERE source_id = ? AND target_id = ? AND type = 'hypernym'
        `, [synset1, synset2]);
        
        const wuPalmerResult = await core.query(`
          SELECT COUNT(*) as common_hypernyms FROM relations 
          WHERE source_id IN (?, ?) AND target_id IN (?, ?) AND type = 'hypernym'
        `, [synset1, synset2, synset1, synset2]);
        
        // Calculate similarity scores (simplified)
        const pathResultObj = pathResult[0] as { path_length?: number } | undefined;
        const wuPalmerResultObj = wuPalmerResult[0] as { common_hypernyms?: number } | undefined;
        
        const pathSim = pathResultObj?.path_length && pathResultObj.path_length > 0 ? 1 / (pathResultObj.path_length + 1) : 0;
        const wuPalmerSim = wuPalmerResultObj?.common_hypernyms && wuPalmerResultObj.common_hypernyms > 0 ? 
          (2 * wuPalmerResultObj.common_hypernyms) / (4 + wuPalmerResultObj.common_hypernyms) : 0;
        
        return Math.max(pathSim, wuPalmerSim);
      }
    }
  } as const;

  // Start with similarity plugin
  const wordnet = createWordNet({
    core: mockCore,
    plugins: [similarity, advancedSimilarity] as const
  });

  // TypeScript knows all available methods
  const bestSim = await wordnet.getBestSimilarity('car', 'vehicle');
  //    ^? number

  const pathSim = await wordnet.getPathSimilarity('car', 'vehicle');
  //    ^? number

  console.log('Best similarity:', bestSim);
  console.log('Path similarity:', pathSim);
}

/**
 * Example 4: Type-safe conditional loading
 */
export async function typeSafeConditionalExample() {
  console.log('=== Type-Safe Conditional Loading ===');

  // Conditional loading with proper types
  const userPrefs = {
    needsSimilarity: true,
    needsTranslation: false,
    needsRelations: true
  };

  // Build plugin array conditionally
  const plugins: (typeof relations | typeof similarity | typeof translation)[] = [];
  if (userPrefs.needsRelations) plugins.push(relations);
  if (userPrefs.needsSimilarity) plugins.push(similarity);
  if (userPrefs.needsTranslation) plugins.push(translation);

  // Create WordNet with selected plugins
  const wordnet = createWordNet({ 
    core: mockCore,
    plugins: plugins
  });

  // TypeScript knows exactly which methods are available based on loaded plugins
  if (userPrefs.needsRelations) {
    const hypernyms = await wordnet.getHypernyms('computer-synset');
    console.log('Hypernyms:', hypernyms);
  }

  if (userPrefs.needsSimilarity) {
    const sim = await wordnet.getPathSimilarity('car', 'vehicle');
    console.log('Similarity:', sim);
  }

  // This would cause a TypeScript error if translation plugin wasn't loaded
  // const translations = await wordnet.getTranslations('test'); // ❌ Error: translation plugin not loaded

  console.log('Conditional loading completed');
}

/**
 * Example 5: Type-safe plugin management
 */
export async function typeSafeManagementExample() {
  console.log('=== Type-Safe Plugin Management ===');

  // Start with all plugins
  let wordnet = createWordNet({
    core: mockCore,
    plugins: [relations, similarity, translation] as const
  });

  // TypeScript knows all methods are available
  const hypernyms = await wordnet.getHypernyms('computer-synset');
  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
  const translations = await wordnet.getTranslations('computer-synset', 'fr');

  console.log('All methods available:', {
    hypernyms: hypernyms.length,
    similarity: sim,
    translations: translations.length
  });

  // Create a new instance without translation plugin
  const wordnetWithoutTranslation = createWordNet({
    core: mockCore,
    plugins: [relations, similarity] as const
  });
  //    ^? WordNetWithPlugins<readonly [Plugin<RelationsMethods>, Plugin<SimilarityMethods>]>

  // TypeScript knows translation methods are not available
  const hypernyms2 = await wordnetWithoutTranslation.getHypernyms('computer-synset');
  const sim2 = await wordnetWithoutTranslation.getPathSimilarity('car', 'vehicle');
  // const translations2 = await wordnetWithoutTranslation.getTranslations('test'); // ❌ Error: translation plugin not loaded

  console.log('Without translation plugin:', {
    hypernyms: hypernyms2.length,
    similarity: sim2
  });
}

/**
 * Example 6: Type inference and autocomplete
 */
export async function typeInferenceExample() {
  console.log('=== Type Inference and Autocomplete ===');

  const wordnet = createWordNet({
    core: mockCore,
    plugins: [relations, similarity, translation] as const
  });

  // TypeScript provides full autocomplete for all methods
  // Try typing: wordnet.get
  // You'll see: getHypernyms, getHyponyms, getMeronyms, getHolonyms, getEntailments, getSimilarTos, getRelationsByType, getAllRelations, getPathSimilarity, getWuPalmerSimilarity, getLeacockChodorowSimilarity, getJaccardSimilarity, getBestSimilarity, findMostSimilar, getTranslations, getTranslationsByWord, getAvailableLanguages, getSynsetsByIli, getTranslationConfidence, getTranslationSuggestions

  // TypeScript infers return types automatically
  const result = await wordnet.getHypernyms('computer-synset');
  // TypeScript knows: result is Array<{ id: string; lemma: string; pos: string; language: string; }>

  // TypeScript provides parameter hints
  // Try typing: wordnet.getPathSimilarity(
  // You'll see: (synset1: string, synset2: string) => Promise<number>

  // TypeScript catches type errors at compile time
  // const error = await wordnet.getPathSimilarity(123, 'vehicle'); // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'string'

  console.log('Type inference working:', result);
}

/**
 * Run all type-safe examples
 */
export async function runAllTypeSafeExamples() {
  console.log('🚀 Type-Safe Plugin System Examples\n');

  try {
    await basicTypeSafeExample();
    await lazyLoadingTypeSafeExample();
    await typeSafeCompositionExample();
    await typeSafeConditionalExample();
    await typeSafeManagementExample();
    await typeInferenceExample();

    console.log('\n✅ All type-safe examples completed!');
  } catch (error) {
    console.error('❌ Type-safe example failed:', error);
  }
}

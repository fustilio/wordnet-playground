/**
 * Dead Simple Plugin Example - Just like Jotai/Jest
 */

import { createWordNet } from 'wn-ts-core/plugins';
import { relations, similarity, translation } from 'wn-ts-core/plugins';

// Mock core implementation
const mockCore = {
  query: async (sql: string, params?: any[]) => {
    console.log('Query:', sql, params);
    // Return mock data
    return [
      { id: 'synset1', lemma: 'computer', pos: 'n', language: 'en' },
      { id: 'synset2', lemma: 'machine', pos: 'n', language: 'en' }
    ];
  },
  getWord: async (form: string) => [],
  getSynset: async (id: string) => ({ id, lemma: 'test' }),
  getSenses: async (wordId: string) => [],
  getDefinitions: async (synsetId: string) => [],
  getRelations: async (synsetId: string, type?: string) => []
};

/**
 * Example 1: Basic usage with plugins
 */
export async function basicExample() {
  console.log('=== Basic Plugin Usage ===');

  // Create WordNet with plugins - just like Jotai atoms
  const wordnet = createWordNet({
    core: mockCore,
    plugins: [relations, similarity, translation]
  });

  // All methods are now available
  const hypernyms = await wordnet.getHypernyms('computer-synset');
  console.log('Hypernyms:', hypernyms);

  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
  console.log('Similarity:', sim);

  const translations = await wordnet.getTranslations('computer-synset', 'fr');
  console.log('Translations:', translations);
}

/**
 * Example 2: Lazy loading
 */
export async function lazyLoadingExample() {
  console.log('=== Lazy Loading ===');

  // Start with no plugins
  const wordnet = createWordNet({ core: mockCore });

  console.log('Has relations?', wordnet.has('relations')); // false
  console.log('Has similarity?', wordnet.has('similarity')); // false

  // Add plugins on demand
  wordnet.use(relations);
  console.log('Has relations?', wordnet.has('relations')); // true

  wordnet.use(similarity);
  console.log('Has similarity?', wordnet.has('similarity')); // true

  // Now methods are available
  const hypernyms = await wordnet.getHypernyms('computer-synset');
  const sim = await wordnet.getPathSimilarity('car', 'vehicle');
}

/**
 * Example 3: Plugin composition
 */
export async function compositionExample() {
  console.log('=== Plugin Composition ===');

  const wordnet = createWordNet({ core: mockCore });

  // Create custom plugin that uses others
  const advancedSimilarity = {
    name: 'advanced-similarity',
    methods: {
      getBestSimilarity: async (core: any, synset1: string, synset2: string) => {
        // Use other plugins
        const pathSim = await core.getPathSimilarity(synset1, synset2);
        const wuPalmerSim = await core.getWuPalmerSimilarity(synset1, synset2);
        return Math.max(pathSim, wuPalmerSim);
      }
    }
  };

  // Add dependencies first
  wordnet.use(similarity);
  wordnet.use(advancedSimilarity);

  // Use composed functionality
  const bestSim = await wordnet.getBestSimilarity('car', 'vehicle');
  console.log('Best similarity:', bestSim);
}

/**
 * Example 4: Conditional loading
 */
export async function conditionalLoadingExample() {
  console.log('=== Conditional Loading ===');

  const wordnet = createWordNet({ core: mockCore });

  // Only load what you need based on user preferences
  const userPrefs = {
    needsSimilarity: true,
    needsTranslation: false,
    needsRelations: true
  };

  if (userPrefs.needsRelations) {
    wordnet.use(relations);
  }

  if (userPrefs.needsSimilarity) {
    wordnet.use(similarity);
  }

  if (userPrefs.needsTranslation) {
    wordnet.use(translation);
  }

  console.log('Loaded plugins:', wordnet.getPlugins());
}

/**
 * Example 5: Plugin management
 */
export async function pluginManagementExample() {
  console.log('=== Plugin Management ===');

  const wordnet = createWordNet({ 
    core: mockCore,
    plugins: [relations, similarity, translation]
  });

  console.log('Initial plugins:', wordnet.getPlugins());

  // Remove a plugin
  wordnet.remove('translation');
  console.log('After removing translation:', wordnet.getPlugins());

  // Add it back
  wordnet.use(translation);
  console.log('After adding translation back:', wordnet.getPlugins());
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Dead Simple Plugin System Examples\n');

  try {
    await basicExample();
    await lazyLoadingExample();
    await compositionExample();
    await conditionalLoadingExample();
    await pluginManagementExample();

    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}


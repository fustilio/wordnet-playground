/**
 * Schema Management Example - Basic Plugin Usage
 * Demonstrates how to use the WordNet kernel with plugins
 */

import { createWordNet } from 'wn-ts-core';
import type { 
  WordNetCore, 
  WordNetWithPlugins, 
  KyselyDatabase,
  PluginSchemaRequirements,
  HealthCheckResult,
  ConflictResolutionStrategy
} from 'wn-ts-core';
import type { Database, Word, Synset, Sense, Definition, Relation } from 'wn-ts-core';

// Mock core implementation
const mockCore: WordNetCore = {
  query: async (sql: string, params?: unknown[]) => {
    console.log('Query:', sql, params);
    return [];
  },
  getWord: async (form: string) => [],
  getSynset: async (id: string) => ({
    id,
    pos: 'n' as const,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    ili: undefined,
    memberIds: [],
    senseIds: []
  }),
  getSenses: async (wordId: string) => [],
  getDefinitions: async (synsetId: string) => [],
  getRelations: async (synsetId: string, type?: string) => [],
  words: async () => [],
  word: async (wordId: string) => ({
    id: wordId,
    lemma: 'test',
    pos: 'n' as const,
    forms: [],
    pronunciations: [],
    tags: [],
    counts: [],
    language: 'en',
    lexicon: 'test',
    senses: [],
    syntacticBehaviours: []
  }),
  synsets: async () => [],
  synset: async (synsetId: string) => ({
    id: synsetId,
    pos: 'n' as const,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    ili: undefined,
    memberIds: [],
    senseIds: []
  }),
  senses: async () => [],
  sense: async (senseId: string) => ({
    id: senseId,
    wordId: 'test-word',
    synsetId: 'test-synset',
    examples: [],
    counts: [],
    tags: [],
    language: 'en',
    lexicon: 'test',
    register: undefined
  }),
  ili: async (iliId: string) => ({
    id: iliId,
    definition: 'test definition',
    status: 'standard' as const
  }),
  ilis: async () => [],
  synsetsByILI: async (iliId: string) => [],
  lexicons: async () => []
};

// Create WordNet with plugins
const wordnet = createWordNet({ 
  core: mockCore
});

// Example: Basic plugin usage
async function demonstrateBasicUsage() {
  try {
    console.log('=== Basic Plugin Usage Demo ===\n');
    
    // Use relation plugins
    const words = await wordnet.getWord('test');
    console.log('Words found:', words.length);
    
    // Use similarity plugins (if available)
    if ('getSimilarity' in wordnet) {
      const similarity = await (wordnet as any).getSimilarity('word1', 'word2');
      console.log('Similarity:', similarity);
    }
    
    // Use translation plugins (if available)
    if ('translate' in wordnet) {
      const translation = await (wordnet as any).translate('hello', 'en', 'es');
      console.log('Translation:', translation);
    }
    
    console.log('\n=== Demo Complete ===');
  } catch (error) {
    console.error('Plugin usage error:', error);
  }
}

// Export for use in other examples
export {
  wordnet,
  demonstrateBasicUsage
};
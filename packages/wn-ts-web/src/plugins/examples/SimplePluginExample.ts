/**
 * Simple Plugin Example
 * Demonstrates basic plugin usage with WordNet kernel
 */

import { createWordNet } from 'wn-ts-core';
import type { WordNetCore, Word, Synset, Sense } from 'wn-ts-core';

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

// Example usage
async function demonstrateSimpleUsage() {
  try {
    console.log('=== Simple Plugin Demo ===\n');
    
    // Basic WordNet operations
    const words = await wordnet.getWord('test');
    console.log('Words found:', words.length);
    
    console.log('\n=== Demo Complete ===');
  } catch (error) {
    console.error('Simple plugin error:', error);
  }
}

export {
  wordnet,
  demonstrateSimpleUsage
};
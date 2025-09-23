/**
 * Cross-Platform Test Framework for wn-ts-core
 * 
 * This framework provides Vitest fixtures for testing platform-specific implementations
 * (wn-ts-node and wn-ts-web) to ensure they correctly implement the core interfaces
 * and maintain behavioral consistency across platforms.
 */

import { test as baseTest } from 'vitest';
import type { WordNetCore, WordNetWithPlugins, KyselyDatabase } from '../../src/wordnet-kernel';
import type { Word, Synset, Sense, Definition, Relation, Lexicon } from '../../src/core/types';

/**
 * Test context containing platform-specific instances
 */
export interface PlatformTestContext {
  wordnet: WordNetWithPlugins<any>;
  kyselyDb: KyselyDatabase;
  core: WordNetCore;
  testData: TestData;
}

/**
 * Standardized test data for cross-platform testing
 */
export interface TestData {
  lexicons: Lexicon[];
  words: Word[];
  synsets: Synset[];
  senses: Sense[];
  definitions: Definition[];
  relations: Relation[];
}

/**
 * Test data factory for consistent cross-platform testing
 */
export class TestDataFactory {
  static createBasicTestData(): TestData {
    return {
      lexicons: [
        {
          id: 'test-lexicon',
          label: 'Test Lexicon',
          language: 'en',
          version: '1.0',
          license: 'MIT',
          url: 'https://example.com',
          citation: 'Test Citation'
        }
      ],
      words: [
        {
          id: 'word-1',
          lemma: 'computer',
          pos: 'n',
          language: 'en',
          lexicon: 'test-lexicon',
          forms: [],
          pronunciations: [],
          tags: [],
          counts: []
        },
        {
          id: 'word-2',
          lemma: 'machine',
          pos: 'n',
          language: 'en',
          lexicon: 'test-lexicon',
          forms: [],
          pronunciations: [],
          tags: [],
          counts: []
        }
      ],
      synsets: [
        {
          id: 'synset-1',
          pos: 'n',
          language: 'en',
          lexicon: 'test-lexicon',
          definitions: [],
          examples: [],
          relations: [],
          memberIds: ['word-1'],
          senseIds: ['sense-1']
        },
        {
          id: 'synset-2',
          pos: 'n',
          language: 'en',
          lexicon: 'test-lexicon',
          definitions: [],
          examples: [],
          relations: [],
          memberIds: ['word-2'],
          senseIds: ['sense-2']
        }
      ],
      senses: [
        {
          id: 'sense-1',
          wordId: 'word-1',
          synsetId: 'synset-1',
          examples: [],
          counts: [],
          tags: []
        },
        {
          id: 'sense-2',
          wordId: 'word-2',
          synsetId: 'synset-2',
          examples: [],
          counts: [],
          tags: []
        }
      ],
      definitions: [
        {
          id: 'def-1',
          language: 'en',
          text: 'A computer is an electronic device',
          source: 'test'
        },
        {
          id: 'def-2',
          language: 'en',
          text: 'A machine is a mechanical device',
          source: 'test'
        }
      ],
      relations: [
        {
          id: 'rel-1',
          type: 'hypernym',
          target: 'synset-2',
          source: 'test'
        },
        {
          id: 'rel-2',
          type: 'hyponym',
          target: 'synset-1',
          source: 'test'
        }
      ]
    };
  }
}

/**
 * Base test with common fixtures for cross-platform testing
 * 
 * This provides the base test with common fixtures that both platforms can extend.
 * Each platform (node/web) should extend this with their specific platformContext fixture.
 */
export const test = baseTest.extend<{
  testData: TestData;
}>({
  // Test data fixture - provides consistent test data across all tests
  testData: async ({}, use) => {
    const testData = TestDataFactory.createBasicTestData();
    await use(testData);
  }
});

/**
 * Utility functions for cross-platform testing
 */
export class PlatformTestUtils {
  /**
   * Assert that two values are equal, with platform-specific error messages
   */
  static assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  /**
   * Assert that a value is truthy
   */
  static assertTrue(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected truthy value, but got ${value}`);
    }
  }

  /**
   * Assert that a value is falsy
   */
  static assertFalse(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected falsy value, but got ${value}`);
    }
  }

  /**
   * Assert that an array has a specific length
   */
  static assertLength<T>(array: T[], expectedLength: number, message?: string): void {
    if (array.length !== expectedLength) {
      throw new Error(message || `Expected array length ${expectedLength}, but got ${array.length}`);
    }
  }

  /**
   * Assert that a promise rejects
   */
  static async assertRejects<T>(
    promise: Promise<T>, 
    expectedError?: string | RegExp,
    message?: string
  ): Promise<void> {
    try {
      await promise;
      throw new Error(message || 'Expected promise to reject, but it resolved');
    } catch (error) {
      if (expectedError) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (typeof expectedError === 'string') {
          if (!errorMessage.includes(expectedError)) {
            throw new Error(message || `Expected error to contain "${expectedError}", but got "${errorMessage}"`);
          }
        } else {
          if (!expectedError.test(errorMessage)) {
            throw new Error(message || `Expected error to match ${expectedError}, but got "${errorMessage}"`);
          }
        }
      }
    }
  }

  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
}

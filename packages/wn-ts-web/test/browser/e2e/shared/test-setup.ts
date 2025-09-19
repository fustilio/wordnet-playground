/**
 * Shared Test Setup for wn-ts-web Browser E2E Tests
 * 
 * This file provides common test setup utilities and patterns
 * that mirror the structure from wn-ts-node/tests/e2e/shared/test-setup.ts
 * but adapted for the browser environment.
 */

import { createWordNetInstance } from "../../../../src/factory";
import type { WebWordnet } from "../../../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../../../src/data-loader";

export interface BrowserTestContext {
  wordnet: WebWordnet;
  dataLoader: DataLoader;
  cleanup: () => Promise<void>;
}

/**
 * Setup a shared test environment with common lexicons for browser E2E tests
 */
export async function setupBrowserTestEnvironment(
  testName: string,
  lexicons: string[] = ['oewn:2024']
): Promise<BrowserTestContext> {
  console.log(`🚀 Setting up browser test environment for: ${testName}`);
  console.log(`📚 Loading lexicons: ${lexicons.join(', ')}`);

  // Create WordNet instance
  const instance = await createWordNetInstance(lexicons[0]);
  const { wordnet, dataLoader } = instance;

  // Load the specified lexicons
  for (const lexicon of lexicons) {
    console.log(`📥 Loading lexicon: ${lexicon}`);
    await dataLoader.downloadAndLoad(lexicon);
  }

  // Verify data was loaded
  const stats = await wordnet.getStatistics();
  console.log(`✅ Data loaded successfully:`);
  console.log(`   Words: ${stats.totalWords.toLocaleString()}`);
  console.log(`   Synsets: ${stats.totalSynsets.toLocaleString()}`);
  console.log(`   Senses: ${stats.totalSenses.toLocaleString()}`);

  const cleanup = async () => {
    console.log(`🧹 Cleaning up test environment for: ${testName}`);
    await wordnet.close();
  };

  return {
    wordnet,
    dataLoader,
    cleanup
  };
}

/**
 * Common test assertions for query results
 */
export const queryAssertions = {
  /**
   * Asserts that a query result is a valid array
   */
  isValidArray: (result: any, message?: string) => {
    expect(Array.isArray(result)).toBe(true);
    if (message) {
      expect(result.length).toBeGreaterThan(0);
    }
  },

  /**
   * Asserts that a query result has the expected structure
   */
  hasValidStructure: (result: any, expectedFields: string[]) => {
    expect(result).toBeDefined();
    expectedFields.forEach(field => {
      expect(result).toHaveProperty(field);
    });
  },

  /**
   * Asserts that all items in an array have a specific property
   */
  allHaveProperty: (items: any[], property: string) => {
    items.forEach(item => {
      expect(item).toHaveProperty(property);
    });
  },

  /**
   * Asserts that all items in an array have a specific value for a property
   */
  allHavePropertyValue: (items: any[], property: string, value: any) => {
    items.forEach(item => {
      expect(item[property]).toBe(value);
    });
  }
};

/**
 * Common test utilities for browser E2E tests
 */
export const testUtils = {
  /**
   * Creates a test timeout for long-running operations
   */
  createTimeout: (ms: number = 30000) => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout')), ms);
    });
  },

  /**
   * Waits for a condition to be true
   */
  waitFor: async (condition: () => boolean, timeout: number = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error('Condition not met within timeout');
    }
  },

  /**
   * Measures performance of a function
   */
  measurePerformance: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  /**
   * Runs multiple performance measurements and returns statistics
   */
  measurePerformanceMultiple: async <T>(
    fn: () => Promise<T>, 
    iterations: number = 5
  ): Promise<{ result: T; times: number[]; average: number; min: number; max: number }> => {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const { result: iterResult, duration } = await testUtils.measurePerformance(fn);
      times.push(duration);
      if (i === 0) result = iterResult; // Use first result
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { result: result!, times, average, min, max };
  }
};

/**
 * Common test data for browser E2E tests
 */
export const testData = {
  commonWords: ['computer', 'run', 'test', 'book', 'water'],
  commonVerbs: ['run', 'walk', 'talk', 'think', 'see'],
  commonNouns: ['computer', 'book', 'water', 'house', 'car'],
  testQueries: [
    { form: 'computer' },
    { form: 'run', pos: 'v' },
    { form: 'test', maxResults: 10 },
    { form: 'book', pos: 'n' }
  ]
};

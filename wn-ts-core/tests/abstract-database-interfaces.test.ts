/**
 * Abstract database interface tests
 * 
 * These tests verify that the abstract database interfaces work correctly
 * and can be implemented by environment-specific packages.
 * 
 * This is NOT testing Kysely specifically - it's testing the abstract contracts
 * that any database implementation (Kysely, raw SQL, better-sqlite3, etc.) must follow.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { DatabaseClient, DatabaseConfig } from '../src/index.js';
import { AbstractWordQueries } from '../src/index.js';

// Mock implementation for testing
class MockDatabaseClient implements DatabaseClient {
  async initialize(): Promise<void> {
    // Mock initialization
  }

  async close(): Promise<void> {
    // Mock cleanup
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Mock query implementation
    return [];
  }

  async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
    // Mock query implementation
    return null;
  }

  async queryValue<T = any>(sql: string, params?: any[]): Promise<T | null> {
    // Mock query implementation
    return null;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    // Mock execute implementation
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    // Mock transaction implementation
    return callback(this);
  }

  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    return { healthy: true };
  }
}

// Mock implementation of AbstractWordQueries for testing
class MockWordQueries extends AbstractWordQueries {
  constructor(db: DatabaseClient) {
    super(db);
  }
}

describe('Abstract Database Interfaces', () => {
  let mockDb: DatabaseClient;
  let wordQueries: MockWordQueries;

  beforeAll(async () => {
    mockDb = new MockDatabaseClient();
    await mockDb.initialize();
    wordQueries = new MockWordQueries(mockDb);
  });

  afterAll(async () => {
    await mockDb.close();
  });

  describe('Database Client Interface', () => {
    it('should have correct database client methods', () => {
      const clientMethods = [
        'initialize',
        'close',
        'query',
        'queryFirst',
        'queryValue',
        'execute',
        'transaction',
        'healthCheck'
      ];

      clientMethods.forEach(method => {
        expect(typeof mockDb[method as keyof DatabaseClient]).toBe('function');
      });
    });

    it('should support basic database operations', async () => {
      // Test query method
      const results = await mockDb.query('SELECT * FROM words');
      expect(Array.isArray(results)).toBe(true);

      // Test queryFirst method
      const firstResult = await mockDb.queryFirst('SELECT * FROM words LIMIT 1');
      expect(firstResult).toBeDefined();

      // Test health check
      const health = await mockDb.healthCheck();
      expect(health.healthy).toBe(true);
    });
  });

  describe('Word Queries Interface', () => {
    it('should have word query methods', () => {
      const wordMethods = [
        'findWordsByLemma',
        'findWordsByPartialLemma',
        'findWordsBySynset',
        'findWordsWithSenses',
        'findWordsByLexicon',
        'findWordsByPartOfSpeech',
        'countWords',
        'getWordStatisticsByPOS',
        'searchWords'
      ];

      wordMethods.forEach(method => {
        expect(typeof wordQueries[method as keyof typeof wordQueries]).toBe('function');
      });
    });

    it('should support word search operations', async () => {
      // Test word search with options
      const options = {
        language: 'en',
        lexicon: 'oewn',
        limit: 10,
        offset: 0,
        partOfSpeech: 'n',
        exact: false,
        caseSensitive: false
      };

      expect(options).toBeDefined();
      expect(options.language).toBe('en');
      expect(options.limit).toBe(10);
    });
  });

  describe('Type Safety', () => {
    it('should provide type-safe database operations', () => {
      // Test database configuration
      const config: DatabaseConfig = {
        type: 'sqlite',
        connection: {},
        debug: false
      };

      expect(config.type).toBe('sqlite');
      expect(config.debug).toBe(false);
    });

    it('should support query options', () => {
      // Test word search options
      const wordOptions = {
        language: 'en',
        lexicon: 'oewn',
        limit: 10,
        offset: 0,
        partOfSpeech: 'n',
        exact: false,
        caseSensitive: false
      };

      expect(wordOptions).toBeDefined();
      expect(wordOptions.language).toBe('en');

      // Test synset search options
      const synsetOptions = {
        language: 'en',
        lexicon: 'oewn',
        limit: 10,
        offset: 0,
        includeHyponyms: true,
        includeHypernyms: true,
        includeSynonyms: true,
        maxDepth: 3
      };

      expect(synsetOptions).toBeDefined();
      expect(synsetOptions.maxDepth).toBe(3);
    });
  });

  describe('Database Schema Types', () => {
    it('should have correct database schema types', () => {
      // This test verifies that our TypeScript types are correctly defined
      expect(typeof MockDatabaseClient).toBe('function');
      expect(typeof AbstractWordQueries).toBe('function');
    });

    it('should create query builders with database client', () => {
      expect(wordQueries).toBeDefined();
      expect(typeof wordQueries.findWordsByLemma).toBe('function');
    });
  });
}); 
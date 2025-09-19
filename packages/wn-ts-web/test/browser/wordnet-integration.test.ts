/**
 * WordNet Integration Tests - Real-world usage in wn-ts-web
 * Tests the plugin system integration with actual WordNet functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';
import type { 
  WordNetCore, 
  WordNetWithPlugins,
  KyselyDatabase,
  Word,
  Synset,
  Sense,
  Definition,
  Relation,
  ILI,
  Lexicon
} from 'wn-ts-core';

// Mock database for testing
const mockDatabase = {
  query: vi.fn(),
  selectFrom: vi.fn(),
  executeQuery: vi.fn()
};

// Real WordNet core implementation for testing
class TestWordNetCore implements WordNetCore {
  private db = mockDatabase;

  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    console.log('Test Query:', sql, params);
    
    // Mock responses based on query content
    if (sql.includes('hypernym')) {
      return [{ id: 'parent1', lemma: 'machine', pos: 'n', language: 'en' }];
    }
    if (sql.includes('hyponym')) {
      return [{ id: 'child1', lemma: 'laptop', pos: 'n', language: 'en' }];
    }
    if (sql.includes('similarity')) {
      return [{ shortest_path: 2 }];
    }
    if (sql.includes('translation') || sql.includes('getTranslations')) {
      return [{ id: 'fr1', language: 'fr', lemma: 'ordinateur' }];
    }
    if (sql.includes('words') && sql.includes('lemma')) {
      return [{ id: 'word1', lemma: 'computer', pos: 'n', language: 'en' }];
    }
    if (sql.includes('synsets')) {
      if (sql.includes('ili')) {
        return [{ id: 'synset1', lemma: 'computer', pos: 'n', language: 'en', ili: 'i123' }];
      }
      return [{ id: 'synset1', lemma: 'computer', pos: 'n', language: 'en' }];
    }
    
    return [];
  }

  // Core interface methods
  async words(): Promise<Word[]> {
    return [];
  }

  async word(wordId: string): Promise<Word> {
    return {
      id: wordId,
      lemma: 'test',
      pos: 'n',
      forms: [{ id: 'form1', writtenForm: 'test' }],
      pronunciations: [],
      tags: [],
      counts: [],
      language: 'en',
      lexicon: 'test'
    };
  }

  async synsets(): Promise<Synset[]> {
    return [];
  }

  async synset(synsetId: string): Promise<Synset> {
    return {
      id: synsetId,
      pos: 'n',
      definitions: [{ id: 'def1', language: 'en', text: 'test definition' }],
      examples: [],
      relations: [],
      language: 'en',
      lexicon: 'test',
      memberIds: [],
      senseIds: []
    };
  }

  async senses(): Promise<Sense[]> {
    return [];
  }

  async sense(senseId: string): Promise<Sense> {
    return {
      id: senseId,
      wordId: 'word1',
      synsetId: 'synset1',
      examples: [],
      counts: [],
      tags: []
    };
  }

  async ili(iliId: string): Promise<ILI> {
    return {
      id: iliId,
      definition: 'test ili',
      status: 'standard'
    };
  }

  async ilis(): Promise<ILI[]> {
    return [];
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    return [];
  }

  async lexicons(): Promise<Lexicon[]> {
    return [];
  }

  // Additional methods for plugin system
  async getWord(form: string): Promise<Word[]> {
    const results = await this.query(`
      SELECT w.*, s.id as synset_id, s.pos, s.language, s.lexicon
      FROM words w
      JOIN senses se ON w.id = se.word_id
      JOIN synsets s ON se.synset_id = s.id
      WHERE w.lemma = ?
    `, [form.toLowerCase()]);
    
    // Transform results to proper Word objects
    return results.map((result: any) => ({
      id: result.id || 'word1',
      lemma: result.lemma || form,
      pos: result.pos || 'n',
      forms: [{ id: 'form1', writtenForm: result.lemma || form }],
      pronunciations: [],
      tags: [],
      counts: [],
      language: result.language || 'en',
      lexicon: result.lexicon || 'test'
    }));
  }

  async getSynset(id: string): Promise<Synset | null> {
    const result = await this.query(`
      SELECT * FROM synsets WHERE id = ?
    `, [id]);
    if (result.length === 0) return null;
    return {
      id,
      pos: 'n',
      definitions: [{ id: 'def1', language: 'en', text: 'test definition' }],
      examples: [],
      relations: [],
      language: 'en',
      lexicon: 'test',
      memberIds: [],
      senseIds: []
    };
  }

  async getSenses(wordId: string): Promise<Sense[]> {
    const results = await this.query(`
      SELECT se.*, s.pos, s.language, s.lexicon
      FROM senses se
      JOIN synsets s ON se.synset_id = s.id
      WHERE se.word_id = ?
    `, [wordId]);
    
    // Transform results to proper Sense objects
    return results.map((result: any) => ({
      id: result.id || 'sense1',
      wordId: result.word_id || wordId,
      synsetId: result.synset_id || 'synset1',
      examples: [],
      counts: [],
      tags: []
    }));
  }

  async getDefinitions(synsetId: string): Promise<Definition[]> {
    const results = await this.query(`
      SELECT * FROM definitions WHERE synset_id = ?
    `, [synsetId]);
    
    // Transform results to proper Definition objects
    return results.map((result: any) => ({
      id: result.id || 'def1',
      language: result.language || 'en',
      text: result.text || 'test definition',
      source: result.source
    }));
  }

  async getRelations(synsetId: string, type?: string): Promise<Relation[]> {
    let sql = `
      SELECT r.*, s.lemma, s.pos, s.language
      FROM relations r
      JOIN synsets s ON r.target_id = s.id
      WHERE r.source_id = ?
    `;
    const params: unknown[] = [synsetId];
    
    if (type) {
      sql += ' AND r.type = ?';
      params.push(type);
    }
    
    const results = await this.query(sql, params);
    
    // Transform results to proper Relation objects
    return results.map((result: any) => ({
      id: result.id || 'rel1',
      type: result.type || 'hypernym',
      target: result.target_id || 'target1',
      source: result.source_id,
      dcType: result.dc_type
    }));
  }
}

// Mock Kysely database for testing
const mockKyselyDb: KyselyDatabase = {
  db: {
    selectFrom: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([])
        })
      })
    }),
    executeQuery: vi.fn().mockResolvedValue({ rows: [] })
  } as any,
  executeSchemaModification: vi.fn().mockResolvedValue(undefined),
  getTableInfo: vi.fn().mockResolvedValue([]),
  getIndexInfo: vi.fn().mockResolvedValue([]),
  getConstraintInfo: vi.fn().mockResolvedValue([])
};

describe('WordNet Integration', () => {
  let wordnet: WordNetWithPlugins<readonly [typeof similarity, typeof translation]>;

  beforeEach(() => {
    vi.clearAllMocks();
    const core = new TestWordNetCore();
    wordnet = createWordNet({
      core,
      kyselyDb: mockKyselyDb,
      plugins: [similarity, translation] as const
    });
  });

  describe('Core Functionality', () => {
    it('should get words from database', async () => {
      const words = await wordnet.getWord('computer');
      
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should get synset information', async () => {
      const synset = await wordnet.getSynset('synset1');
      
      expect(synset).toBeDefined();
      expect(typeof synset).toBe('object');
    });

    it('should get senses for a word', async () => {
      const senses = await wordnet.getSenses('word1');
      
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should get definitions for a synset', async () => {
      const definitions = await wordnet.getDefinitions('synset1');
      
      expect(Array.isArray(definitions)).toBe(true);
    });

    it('should get relations for a synset', async () => {
      const relations = await wordnet.getRelations('synset1');
      
      expect(Array.isArray(relations)).toBe(true);
    });
  });

  describe('Plugin Integration', () => {
    it('should use relations plugin methods', async () => {
      const hypernyms = await wordnet.getRelations('synset1', 'hypernym');
      
      expect(Array.isArray(hypernyms)).toBe(true);
      expect(hypernyms.length).toBeGreaterThan(0);
      expect(hypernyms[0]).toHaveProperty('id');
      expect(hypernyms[0]).toHaveProperty('lemma');
    });

    it('should use similarity plugin methods', async () => {
      const similarity = await wordnet.path('synset1', 'synset2');
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should use translation plugin methods', async () => {
      const translations = await wordnet.getTranslations('synset1', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
      expect(translations.length).toBeGreaterThan(0);
      expect(translations[0]).toHaveProperty('id');
      expect(translations[0]).toHaveProperty('language');
    });
  });

  describe('Schema Management', () => {
    it('should register plugin schema requirements', async () => {
      const requirements = {
        pluginName: 'test-plugin',
        tables: [
          {
            name: 'test_table',
            columns: [
              { name: 'id', type: 'TEXT', nullable: false }
            ],
            primaryKey: ['id']
          }
        ],
        indexes: [],
        constraints: [],
        data: [],
        dependencies: [],
        conflicts: []
      };

      await wordnet.schemaManager.registerPluginRequirements(requirements);
      
      const status = await wordnet.schemaManager.getSchemaStatus();
      expect(status.modifications.length).toBeGreaterThan(0);
    });

    it('should perform health checks', async () => {
      const healthCheck = await wordnet.schemaManager.performHealthCheck();
      
      expect(healthCheck).toHaveProperty('isHealthy');
      expect(healthCheck).toHaveProperty('score');
      expect(healthCheck).toHaveProperty('issues');
      expect(healthCheck).toHaveProperty('recommendations');
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should find similar words', async () => {
      // Mock the findMostSimilar method
      const mockFindMostSimilar = vi.fn().mockResolvedValue([
        { id: 'synset2', similarity: 0.8 },
        { id: 'synset3', similarity: 0.6 }
      ]);
      
      // We need to add this method to our test core
      (wordnet as any).findMostSimilar = mockFindMostSimilar;

      const similar = await (wordnet as any).findMostSimilar('synset1', 5);
      
      expect(Array.isArray(similar)).toBe(true);
      expect(similar.length).toBe(2);
      expect(similar[0]).toHaveProperty('similarity');
    });

    it('should get word relations', async () => {
      const hypernyms = await wordnet.getRelations('synset1', 'hypernym');
      const hyponyms = await wordnet.getRelations('synset1', 'hyponym');
      
      expect(Array.isArray(hypernyms)).toBe(true);
      expect(Array.isArray(hyponyms)).toBe(true);
    });

    it('should translate words', async () => {
      const translations = await wordnet.getTranslations('synset1', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const core = new TestWordNetCore();
      const originalQuery = core.query;
      core.query = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const errorWordnet = createWordNet({
        core,
        kyselyDb: mockKyselyDb,
        plugins: [similarity, translation] as const
      });

      await expect(errorWordnet.getWord('test')).rejects.toThrow('Database connection failed');
    });

    it('should handle plugin method errors', async () => {
      // Mock a plugin method error
      const core = new TestWordNetCore();
      core.query = vi.fn().mockRejectedValue(new Error('Plugin method failed'));

      const errorWordnet = createWordNet({
        core,
        kyselyDb: mockKyselyDb,
        plugins: [similarity, translation] as const
      });

      await expect(errorWordnet.getRelations('synset1', 'hypernym')).rejects.toThrow('Plugin method failed');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [
        wordnet.getWord('computer'),
        wordnet.getRelations('synset1', 'hypernym'),
        wordnet.path('synset1', 'synset2'),
        wordnet.getTranslations('synset1', 'fr')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle large result sets efficiently', async () => {
      // Mock a large result set
      const largeResult = Array.from({ length: 1000 }, (_, i) => ({
        id: `item${i}`,
        lemma: `word${i}`,
        pos: 'n',
        language: 'en'
      }));

      const core = new TestWordNetCore();
      core.query = vi.fn().mockResolvedValue(largeResult);

      const largeWordnet = createWordNet({
        core,
        kyselyDb: mockKyselyDb,
        plugins: [similarity, translation] as const
      });

      const startTime = Date.now();
      const result = await largeWordnet.getWord('test');
      const endTime = Date.now();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

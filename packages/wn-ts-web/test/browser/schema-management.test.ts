/**
 * Schema Management System Tests
 * Tests the built-in database schema management with Kysely integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';
import type { 
  WordNetCore, 
  WordNetWithPlugins, 
  KyselyDatabase,
  PluginSchemaRequirements,
  HealthCheckResult,
  ConflictResolutionStrategy,
  Word,
  Synset,
  Sense,
  Definition,
  Relation
} from 'wn-ts-core';

// Mock core implementation
const mockCore: WordNetCore = {
  query: async (sql: string, params?: unknown[]) => {
    console.log('Mock Query:', sql, params);
    return [];
  },
  words: async () => [],
  word: async (wordId: string) => ({
    id: wordId,
    lemma: 'test',
    pos: 'n' as const,
    forms: [{ id: 'form1', writtenForm: 'test' }],
    pronunciations: [],
    tags: [],
    counts: [],
    language: 'en',
    lexicon: 'test'
  }),
  synsets: async () => [],
  synset: async (synsetId: string) => ({
    id: synsetId,
    pos: 'n' as const,
    definitions: [{ id: 'def1', language: 'en', text: 'test definition' }],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: []
  }),
  senses: async () => [],
  sense: async (senseId: string) => ({
    id: senseId,
    wordId: 'word1',
    synsetId: 'synset1',
    examples: [],
    counts: [],
    tags: []
  }),
  ili: async (iliId: string) => ({
    id: iliId,
    definition: 'test ili',
    status: 'standard' as const
  }),
  ilis: async () => [],
  synsetsByILI: async () => [],
  lexicons: async () => [],
  getWord: async (form: string) => [],
  getSynset: async (id: string) => ({
    id,
    pos: 'n' as const,
    definitions: [{ id: 'def1', language: 'en', text: 'test definition' }],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    memberIds: [],
    senseIds: []
  }),
  getSenses: async (wordId: string) => [],
  getDefinitions: async (synsetId: string) => [],
  getRelations: async (synsetId: string, type?: string) => []
};

// Mock Kysely database
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

describe('Schema Management System', () => {
  let wordnet: WordNetWithPlugins<readonly []>;

  beforeEach(() => {
    vi.clearAllMocks();
    wordnet = createWordNet({ 
      core: mockCore,
      kyselyDb: mockKyselyDb
    });
  });

  describe('Plugin Schema Requirements', () => {
    it('should register plugin schema requirements', async () => {
      const requirements: PluginSchemaRequirements = {
        pluginName: 'analytics',
        tables: [
          {
            name: 'analytics_events',
            columns: [
              { name: 'id', type: 'TEXT', nullable: false, unique: true },
              { name: 'event_type', type: 'TEXT', nullable: false },
              { name: 'timestamp', type: 'DATETIME', nullable: false },
              { name: 'data', type: 'JSON', nullable: true }
            ],
            primaryKey: ['id']
          }
        ],
        indexes: [
          { name: 'idx_analytics_timestamp', table: 'analytics_events', columns: ['timestamp'], type: 'index' }
        ],
        constraints: [],
        data: [],
        dependencies: [],
        conflicts: []
      };

      await wordnet.schemaManager.registerPluginRequirements(requirements);

      // Verify the requirements were registered
      const status = await wordnet.schemaManager.getSchemaStatus();
      expect(status.modifications.length).toBeGreaterThan(0);
    });

    it('should unregister plugin schema requirements', async () => {
      const requirements: PluginSchemaRequirements = {
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
      await wordnet.schemaManager.unregisterPluginRequirements('test-plugin');

      // Verify the requirements were unregistered
      const status = await wordnet.schemaManager.getSchemaStatus();
      expect(status.modifications.length).toBe(0);
    });
  });

  describe('Health Check System', () => {
    it('should perform health check', async () => {
      const healthCheck: HealthCheckResult = await wordnet.schemaManager.performHealthCheck();

      expect(healthCheck).toHaveProperty('isHealthy');
      expect(healthCheck).toHaveProperty('score');
      expect(healthCheck).toHaveProperty('issues');
      expect(healthCheck).toHaveProperty('recommendations');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(typeof healthCheck.isHealthy).toBe('boolean');
      expect(typeof healthCheck.score).toBe('number');
      expect(Array.isArray(healthCheck.issues)).toBe(true);
      expect(Array.isArray(healthCheck.recommendations)).toBe(true);
    });

    it('should detect schema issues', async () => {
      // Register a plugin with missing table
      const requirements: PluginSchemaRequirements = {
        pluginName: 'missing-table-plugin',
        tables: [
          {
            name: 'non_existent_table',
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
      const healthCheck = await wordnet.schemaManager.performHealthCheck();

      expect(healthCheck.issues.length).toBeGreaterThan(0);
      expect(healthCheck.issues.some(issue => issue.type === 'missing_schema')).toBe(true);
    });
  });

  describe('Schema Modifications', () => {
    it('should apply schema modifications', async () => {
      const requirements: PluginSchemaRequirements = {
        pluginName: 'test-plugin',
        tables: [
          {
            name: 'test_table',
            columns: [
              { name: 'id', type: 'TEXT', nullable: false },
              { name: 'name', type: 'TEXT', nullable: false }
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
      const modificationIds = status.modifications.map(mod => mod.id);

      const result = await wordnet.schemaManager.applyModifications(modificationIds);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('applied');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.applied)).toBe(true);
      expect(Array.isArray(result.failed)).toBe(true);
      expect(Array.isArray(result.conflicts)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle modification failures gracefully', async () => {
      // Mock a failure in schema modification
      (mockKyselyDb.executeSchemaModification as any).mockRejectedValueOnce(new Error('Database error'));

      const requirements: PluginSchemaRequirements = {
        pluginName: 'failing-plugin',
        tables: [
          {
            name: 'failing_table',
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
      const modificationIds = status.modifications.map(mod => mod.id);

      const result = await wordnet.schemaManager.applyModifications(modificationIds);

      expect(result.success).toBe(false);
      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with different strategies', async () => {
      const strategies: ConflictResolutionStrategy[] = ['merge', 'override', 'skip', 'rollback', 'manual'];

      for (const strategy of strategies) {
        const resolved = await wordnet.schemaManager.resolveConflicts('test-conflict', strategy);
        expect(typeof resolved).toBe('boolean');
      }
    });

    it('should handle manual conflict resolution', async () => {
      const resolved = await wordnet.schemaManager.resolveConflicts('manual-conflict', 'manual');
      expect(resolved).toBe(false); // Manual resolution requires human intervention
    });
  });

  describe('Schema Status', () => {
    it('should get schema status', async () => {
      const status = await wordnet.schemaManager.getSchemaStatus();

      expect(status).toHaveProperty('tables');
      expect(status).toHaveProperty('columns');
      expect(status).toHaveProperty('indexes');
      expect(status).toHaveProperty('constraints');
      expect(status).toHaveProperty('modifications');
      expect(status).toHaveProperty('conflicts');
      expect(status).toHaveProperty('healthScore');
      expect(Array.isArray(status.tables)).toBe(true);
      expect(typeof status.columns).toBe('object');
      expect(typeof status.indexes).toBe('object');
      expect(typeof status.constraints).toBe('object');
      expect(Array.isArray(status.modifications)).toBe(true);
      expect(Array.isArray(status.conflicts)).toBe(true);
      expect(typeof status.healthScore).toBe('number');
    });
  });

  describe('Integration with Plugins', () => {
    it('should work with existing plugins', async () => {
      const wordnetWithPlugins = createWordNet({
        core: mockCore,
        kyselyDb: mockKyselyDb,
        plugins: [similarity, translation]
      });

      // Test that schema management still works with plugins
      const requirements: PluginSchemaRequirements = {
        pluginName: 'analytics',
        tables: [
          {
            name: 'analytics_events',
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

      await wordnetWithPlugins.schemaManager.registerPluginRequirements(requirements);
      const healthCheck = await wordnetWithPlugins.schemaManager.performHealthCheck();

      expect(healthCheck).toHaveProperty('isHealthy');
      expect(healthCheck).toHaveProperty('score');

      // Test that plugin methods still work
      const hypernyms = await wordnetWithPlugins.getRelations('test-synset', 'hypernym');
      expect(Array.isArray(hypernyms)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Kysely database gracefully', async () => {
      const wordnetWithoutKysely = createWordNet({ core: mockCore });

      // Should not throw when Kysely is not available
      const healthCheck = await wordnetWithoutKysely.schemaManager.performHealthCheck();
      expect(healthCheck).toHaveProperty('isHealthy');
    });

    it('should handle invalid plugin requirements', async () => {
      const invalidRequirements = {
        pluginName: 'invalid',
        tables: [],
        indexes: [],
        constraints: [],
        data: [],
        dependencies: [],
        conflicts: []
      } as PluginSchemaRequirements;

      // Should not throw with invalid requirements
      await expect(wordnet.schemaManager.registerPluginRequirements(invalidRequirements))
        .resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple plugin registrations efficiently', async () => {
      const startTime = Date.now();

      // Register multiple plugins
      for (let i = 0; i < 10; i++) {
        const requirements: PluginSchemaRequirements = {
          pluginName: `plugin-${i}`,
          tables: [
            {
              name: `table_${i}`,
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
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);
    });
  });
});

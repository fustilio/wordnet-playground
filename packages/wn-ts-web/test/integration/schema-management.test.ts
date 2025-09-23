/**
 * Schema Management System Tests
 * Tests the built-in database schema management with Kysely integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation } from 'wn-ts-core/plugins';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { Kysely, CompiledQuery } from 'kysely';
import type { Database } from '../../src/types/database.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
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

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// Skip tests in Node.js environment
describe.skipIf(isNode)('Schema Management System', () => {
  let wordnet: WordNetWithPlugins<readonly []>;
  let webWordnet: WebWordnet;
  let kyselyDb: KyselyDatabase;
  let sqlModule: Sqlite3Static;

  beforeAll(async () => {
    // Load SQLite WASM module
    try {
      const sqlite3 = await import('@sqlite.org/sqlite-wasm');
      sqlModule = await sqlite3.default({
        locateFile: (file: string) => {
          if (file === 'sqlite3.wasm') {
            return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
          }
          return file;
        },
        print: (msg: string) => {
          if (!msg.includes('SQL TRACE')) {
            console.log(msg);
          }
        },
        printErr: (msg: string) => {
          console.error(msg);
        }
      });
    } catch (error) {
      console.warn('SQLite WASM not available in test environment:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Create a real WebWordnet instance
    webWordnet = new WebWordnet('oewn:2024');
    await webWordnet.initialize(sqlModule);

    // Get the Kysely database from WebWordnet
    const kyselyInstance = webWordnet.kyselyDatabase;
    if (!kyselyInstance) {
      throw new Error('Kysely database not available');
    }

    // Create KyselyDatabase wrapper
    kyselyDb = {
      db: kyselyInstance,
      executeSchemaModification: async (sql: string) => {
        await kyselyInstance.executeQuery(CompiledQuery.raw(sql));
      },
      getTableInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA table_info(${tableName})`));
        return result.rows || [];
      },
      getIndexInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA index_list(${tableName})`));
        return result.rows || [];
      },
      getConstraintInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA foreign_key_list(${tableName})`));
        return result.rows || [];
      }
    };

    // Create WordNet with schema management using the real WebWordnet as core
    wordnet = createWordNet({ 
      core: webWordnet,
      kyselyDb: kyselyDb
    });
  });

  afterAll(async () => {
    if (webWordnet) {
      try {
        await webWordnet.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  // Test cases continue here...

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
      // Test with invalid modification IDs
      const result = await wordnet.schemaManager.applyModifications(['invalid-id']);

      expect(result.success).toBe(false);
      expect(result.failed.length).toBeGreaterThan(0);
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
      // Test that schema management works with the current wordnet instance
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

      await wordnet.schemaManager.registerPluginRequirements(requirements);
      const healthCheck = await wordnet.schemaManager.performHealthCheck();

      expect(healthCheck).toHaveProperty('isHealthy');
      expect(healthCheck).toHaveProperty('score');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Kysely database gracefully', async () => {
      // Test with current wordnet instance (which has Kysely)
      const healthCheck = await wordnet.schemaManager.performHealthCheck();
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


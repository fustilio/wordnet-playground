/**
 * Schema Management Example - Built-in Database Schema Management
 * Demonstrates how plugins can declare schema requirements and the system handles conflicts
 */

import { createWordNet } from 'wn-ts-core/plugins';
import { relations, similarity, translation } from 'wn-ts-core/plugins';
import { KyselySchemaManager } from 'wn-ts-core/plugins/schema/KyselySchemaManager';
import type { 
  WordNetCore, 
  WordNetWithPlugins, 
  PluginSchemaRequirements,
  HealthCheckResult,
  ConflictResolutionStrategy,
  KyselyDatabase
} from 'wn-ts-core/plugins';
import type { Database } from 'wn-ts-core/types/database';

// Mock core implementation
const mockCore: WordNetCore = {
  query: async (sql: string, params?: unknown[]) => {
    console.log('Query:', sql, params);
    return [];
  },
  getWord: async (form: string) => [],
  getSynset: async (id: string) => ({ id, lemma: 'test' }),
  getSenses: async (wordId: string) => [],
  getDefinitions: async (synsetId: string) => [],
  getRelations: async (synsetId: string, type?: string) => []
};

// Mock Kysely database for demonstration
const mockKyselyDb: KyselyDatabase = {
  db: {} as unknown, // Mock Kysely instance
  executeSchemaModification: async (sql: string) => {
    console.log('Executing schema modification:', sql);
  },
  getTableInfo: async (tableName: string) => {
    console.log('Getting table info for:', tableName);
    return [];
  },
  getIndexInfo: async (tableName: string) => {
    console.log('Getting index info for:', tableName);
    return [];
  },
  getConstraintInfo: async (tableName: string) => {
    console.log('Getting constraint info for:', tableName);
    return [];
  }
};

/**
 * Example 1: Plugin Schema Requirements
 */
export async function pluginSchemaRequirementsExample() {
  console.log('=== Plugin Schema Requirements ===');

  const wordnet = createWordNet({ 
    core: mockCore,
    kyselyDb: mockKyselyDb
  });

  // Define schema requirements for a plugin
  const analyticsPluginRequirements: PluginSchemaRequirements = {
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
        primaryKey: ['id'],
        indexes: [
          { name: 'idx_analytics_timestamp', table: 'analytics_events', columns: ['timestamp'], type: 'index' },
          { name: 'idx_analytics_event_type', table: 'analytics_events', columns: ['event_type'], type: 'index' }
        ]
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  };

  // Register plugin requirements
  await wordnet.schemaManager.registerPluginRequirements(analyticsPluginRequirements);
  console.log('Analytics plugin requirements registered');

  // Define another plugin with conflicting requirements
  const loggingPluginRequirements: PluginSchemaRequirements = {
    pluginName: 'logging',
    tables: [
      {
        name: 'analytics_events', // Same table name - potential conflict!
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, unique: true }, // Different type - conflict!
          { name: 'level', type: 'TEXT', nullable: false },
          { name: 'message', type: 'TEXT', nullable: false },
          { name: 'created_at', type: 'DATETIME', nullable: false }
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

  // Register conflicting requirements
  await wordnet.schemaManager.registerPluginRequirements(loggingPluginRequirements);
  console.log('Logging plugin requirements registered (with conflicts)');
}

/**
 * Example 2: Health Check and Conflict Detection
 */
export async function healthCheckExample() {
  console.log('=== Health Check and Conflict Detection ===');

  const wordnet = createWordNet({ 
    core: mockCore,
    kyselyDb: mockKyselyDb
  });

  // Register some plugin requirements
  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'relations',
    tables: [
      {
        name: 'relations',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false },
          { name: 'source_id', type: 'TEXT', nullable: false },
          { name: 'target_id', type: 'TEXT', nullable: false },
          { name: 'type', type: 'TEXT', nullable: false }
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  // Perform health check
  const healthCheck: HealthCheckResult = await wordnet.schemaManager.performHealthCheck();
  
  console.log('Health Check Results:', {
    isHealthy: healthCheck.isHealthy,
    score: healthCheck.score,
    issues: healthCheck.issues.length,
    recommendations: healthCheck.recommendations.length
  });

  // Show specific issues
  if (healthCheck.issues.length > 0) {
    console.log('Issues found:');
    healthCheck.issues.forEach(issue => {
      console.log(`- ${issue.severity.toUpperCase()}: ${issue.title}`);
      console.log(`  ${issue.description}`);
      console.log(`  Suggested fix: ${issue.suggestedFix}`);
    });
  }

  // Show recommendations
  if (healthCheck.recommendations.length > 0) {
    console.log('Recommendations:');
    healthCheck.recommendations.forEach(rec => {
      console.log(`- ${rec.priority.toUpperCase()}: ${rec.title}`);
      console.log(`  ${rec.description}`);
      console.log(`  Benefits: ${rec.benefits.join(', ')}`);
    });
  }
}

/**
 * Example 3: Schema Modifications and Conflict Resolution
 */
export async function schemaModificationsExample() {
  console.log('=== Schema Modifications and Conflict Resolution ===');

  const wordnet = createWordNet({ 
    core: mockCore,
    kyselyDb: mockKyselyDb
  });

  // Register plugin requirements
  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'similarity',
    tables: [
      {
        name: 'similarity_cache',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false },
          { name: 'synset1', type: 'TEXT', nullable: false },
          { name: 'synset2', type: 'TEXT', nullable: false },
          { name: 'similarity_score', type: 'REAL', nullable: false },
          { name: 'created_at', type: 'DATETIME', nullable: false }
        ],
        primaryKey: ['id'],
        indexes: [
          { name: 'idx_similarity_synsets', table: 'similarity_cache', columns: ['synset1', 'synset2'], type: 'index' }
        ]
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  // Get schema status
  const schemaStatus = await wordnet.schemaManager.getSchemaStatus();
  console.log('Schema Status:', {
    tables: schemaStatus.tables,
    modifications: schemaStatus.modifications.length,
    conflicts: schemaStatus.conflicts.length,
    healthScore: schemaStatus.healthScore
  });

  // Apply modifications
  const modificationIds = schemaStatus.modifications.map(mod => mod.id);
  if (modificationIds.length > 0) {
    console.log('Applying schema modifications...');
    const result = await wordnet.schemaManager.applyModifications(modificationIds);
    
    console.log('Modification Results:', {
      success: result.success,
      applied: result.applied.length,
      failed: result.failed.length,
      conflicts: result.conflicts.length,
      errors: result.errors
    });

    // Handle conflicts if any
    if (result.conflicts.length > 0) {
      console.log('Resolving conflicts...');
      for (const conflictId of result.conflicts) {
        const resolved = await wordnet.schemaManager.resolveConflicts(conflictId, 'merge');
        console.log(`Conflict ${conflictId} resolved: ${resolved}`);
      }
    }
  }
}

/**
 * Example 4: Plugin with Write Operations
 */
export async function writeOperationsExample() {
  console.log('=== Plugin with Write Operations ===');

  // Create a plugin that needs to write data
  const analyticsPlugin = {
    name: 'analytics',
    methods: {
      trackEvent: async (core: WordNetCore, eventType: string, data: any) => {
        // This plugin needs to write to the database
        await core.query(`
          INSERT INTO analytics_events (id, event_type, timestamp, data) 
          VALUES (?, ?, ?, ?)
        `, [
          `event_${Date.now()}`,
          eventType,
          new Date().toISOString(),
          JSON.stringify(data)
        ]);
      },

      getAnalytics: async (core: WordNetCore, eventType?: string) => {
        let sql = 'SELECT * FROM analytics_events';
        const params: any[] = [];
        
        if (eventType) {
          sql += ' WHERE event_type = ?';
          params.push(eventType);
        }
        
        return core.query(sql, params);
      }
    }
  };

  const wordnet = createWordNet({ 
    core: mockCore,
    kyselyDb: mockKyselyDb,
    plugins: [analyticsPlugin] as const
  });

  // Register schema requirements for this plugin
  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'analytics',
    tables: [
      {
        name: 'analytics_events',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false, unique: true },
          { name: 'event_type', type: 'TEXT', nullable: false },
          { name: 'timestamp', type: 'DATETIME', nullable: false },
          { name: 'data', type: 'TEXT', nullable: true }
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  // Use the plugin methods
  await wordnet.trackEvent('user_action', { userId: '123', action: 'search' });
  await wordnet.trackEvent('performance', { query: 'computer', duration: 150 });
  
  const events = await wordnet.getAnalytics('user_action');
  console.log('Analytics events:', events);
}

/**
 * Example 5: Conflict Resolution Strategies
 */
export async function conflictResolutionExample() {
  console.log('=== Conflict Resolution Strategies ===');

  const wordnet = createWordNet({ 
    core: mockCore,
    kyselyDb: mockKyselyDb
  });

  // Register two plugins with conflicting schema requirements
  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'plugin-a',
    tables: [
      {
        name: 'shared_table',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false },
          { name: 'data', type: 'TEXT', nullable: false }
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'plugin-b',
    tables: [
      {
        name: 'shared_table',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false }, // Different type!
          { name: 'value', type: 'TEXT', nullable: false }  // Different column name!
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  // Perform health check to detect conflicts
  const healthCheck = await wordnet.schemaManager.performHealthCheck();
  
  if (healthCheck.issues.some(issue => issue.type === 'conflict')) {
    console.log('Conflicts detected, resolving...');
    
    // Try different resolution strategies
    const strategies: ConflictResolutionStrategy[] = ['merge', 'override', 'skip', 'rollback'];
    
    for (const strategy of strategies) {
      console.log(`Trying strategy: ${strategy}`);
      const resolved = await wordnet.schemaManager.resolveConflicts('conflict_id', strategy);
      console.log(`Strategy ${strategy} result: ${resolved}`);
    }
  }
}

/**
 * Example 6: Schema Health Monitoring
 */
export async function schemaHealthMonitoringExample() {
  console.log('=== Schema Health Monitoring ===');

  const wordnet = createWordNet({ core: mockCore });

  // Register multiple plugins
  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'relations',
    tables: [
      {
        name: 'relations',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false },
          { name: 'source_id', type: 'TEXT', nullable: false },
          { name: 'target_id', type: 'TEXT', nullable: false },
          { name: 'type', type: 'TEXT', nullable: false }
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  await wordnet.schemaManager.registerPluginRequirements({
    pluginName: 'similarity',
    tables: [
      {
        name: 'similarity_cache',
        columns: [
          { name: 'id', type: 'TEXT', nullable: false },
          { name: 'synset1', type: 'TEXT', nullable: false },
          { name: 'synset2', type: 'TEXT', nullable: false },
          { name: 'score', type: 'REAL', nullable: false }
        ],
        primaryKey: ['id']
      }
    ],
    indexes: [],
    constraints: [],
    data: [],
    dependencies: [],
    conflicts: []
  });

  // Monitor schema health over time
  for (let i = 0; i < 3; i++) {
    console.log(`\nHealth Check ${i + 1}:`);
    
    const healthCheck = await wordnet.schemaManager.performHealthCheck();
    const schemaStatus = await wordnet.schemaManager.getSchemaStatus();
    
    console.log(`Health Score: ${healthCheck.score}/100`);
    console.log(`Is Healthy: ${healthCheck.isHealthy}`);
    console.log(`Issues: ${healthCheck.issues.length}`);
    console.log(`Recommendations: ${healthCheck.recommendations.length}`);
    console.log(`Tables: ${schemaStatus.tables.length}`);
    console.log(`Modifications: ${schemaStatus.modifications.length}`);
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Run all schema management examples
 */
export async function runAllSchemaManagementExamples() {
  console.log('🚀 Schema Management Examples\n');

  try {
    await pluginSchemaRequirementsExample();
    await healthCheckExample();
    await schemaModificationsExample();
    await writeOperationsExample();
    await conflictResolutionExample();
    await schemaHealthMonitoringExample();

    console.log('\n✅ All schema management examples completed!');
  } catch (error) {
    console.error('❌ Schema management example failed:', error);
  }
}

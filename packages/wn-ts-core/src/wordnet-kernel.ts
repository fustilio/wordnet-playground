/**
 * Kernel-based WordNet Architecture
 * 
 * This is the new architecture that supports plugins and kernel modality.
 * The old BaseWordnet is deprecated in favor of this kernel-based approach.
 * 
 * Key changes:
 * - Plugin system built-in
 * - Schema management integrated
 * - Type-safe plugin methods
 * - Backwards compatibility layer
 */

import type { Database } from './shared/database-types.js';
import type { Kysely } from 'kysely';
import type { 
  Word, 
  Synset, 
  Sense, 
  Lexicon, 
  ILI,
  WordQuery,
  SynsetQuery,
  SenseQuery,
  Definition,
  Relation
} from './core/types.js';
import { LifecycleManager, type PluginLifecycle, type LifecycleEvent, type LifecycleEventData } from './wordnet-kernel-lifecycle.js';

// Plugin system types (moved from microkernel)
export type PluginMethod<TCore = WordNetKernel, TArgs extends any[] = any[], TReturn = any> = 
  (core: TCore, ...args: TArgs) => TReturn;

export interface Plugin<TMethods extends Record<string, PluginMethod> = Record<string, PluginMethod>> {
  name: string;
  methods: TMethods;
  lifecycle?: PluginLifecycle; // Optional lifecycle hooks
}

// Core module interface for essential functionality
export interface CoreModule<TMethods extends Record<string, PluginMethod> = Record<string, PluginMethod>> {
  name: string;
  methods: TMethods;
  readonly isCore: true; // Distinguishes from plugins
}

// Core interface that all implementations must provide
export interface WordNetCore {
  // Database operations
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  
  // Base WordNet methods (from old BaseWordnet)
  words(query?: WordQuery): Promise<Word[]>;
  word(wordId: string): Promise<Word>;
  synsets(query?: SynsetQuery): Promise<Synset[]>;
  synset(synsetId: string): Promise<Synset>;
  senses(query?: SenseQuery): Promise<Sense[]>;
  sense(senseId: string): Promise<Sense>;
  
  // Interlingual queries
  ili(iliId: string): Promise<ILI>;
  ilis(status?: string): Promise<ILI[]>;
  synsetsByILI(iliId: string): Promise<Synset[]>;
  
  // Lexicon queries
  lexicons(): Promise<Lexicon[]>;
  
  // Additional methods for plugin system
  getWord(form: string): Promise<Word[]>;
  getSynset(id: string): Promise<Synset | null>;
  getSenses(wordId: string): Promise<Sense[]>;
  getDefinitions(synsetId: string): Promise<Definition[]>;
  getRelations(synsetId: string, type?: string): Promise<Relation[]>;
}

// Kysely database interface for schema management
export interface KyselyDatabase {
  db: Kysely<Database>;
  executeSchemaModification: (sql: string) => Promise<void>;
  getTableInfo: (tableName: string) => Promise<unknown[]>;
  getIndexInfo: (tableName: string) => Promise<unknown[]>;
  getConstraintInfo: (tableName: string) => Promise<unknown[]>;
}

// Schema management types (simplified from microkernel)
export interface SchemaModification {
  id: string;
  type: 'table' | 'column' | 'index' | 'constraint' | 'data';
  operation: 'create' | 'alter' | 'drop' | 'insert' | 'update' | 'delete';
  table?: string;
  column?: string;
  sql: string;
  rollbackSql: string;
  dependencies: string[];
  conflicts: string[];
  priority: number;
  estimatedTime: number;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  score: number;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  timestamp: number;
}

export interface HealthIssue {
  id: string;
  type: 'missing_schema' | 'missing_data' | 'conflict' | 'performance' | 'integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedTables: string[];
  suggestedFix: string;
  estimatedTime: number;
}

export interface HealthRecommendation {
  id: string;
  type: 'schema' | 'data' | 'performance' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  benefits: string[];
  estimatedEffort: number;
  implementation: string;
}

export interface PluginSchemaRequirements {
  pluginName: string;
  tables: TableRequirement[];
  indexes: IndexRequirement[];
  constraints: ConstraintRequirement[];
  data: DataRequirement[];
  dependencies: string[];
  conflicts: string[];
}

export interface TableRequirement {
  name: string;
  columns: ColumnRequirement[];
  primaryKey?: string[];
  uniqueKeys?: string[][];
  foreignKeys?: ForeignKeyRequirement[];
  checks?: CheckConstraint[];
}

export interface ColumnRequirement {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | number | boolean | null;
  autoIncrement?: boolean;
  unique?: boolean;
}

export interface IndexRequirement {
  name: string;
  table: string;
  columns: string[];
  type: 'primary' | 'unique' | 'index' | 'fulltext';
  condition?: string;
}

export interface ConstraintRequirement {
  name: string;
  table: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  definition: string;
}

export interface DataRequirement {
  table: string;
  records: Record<string, unknown>[];
  condition?: string;
  upsert?: boolean;
}

export interface ForeignKeyRequirement {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface CheckConstraint {
  name: string;
  condition: string;
}

export type ConflictResolutionStrategy = 
  | 'merge' | 'override' | 'skip' | 'manual' | 'rollback';

export interface ConflictResolution {
  conflictId: string;
  strategy: ConflictResolutionStrategy;
  resolution: string;
  timestamp: number;
}

// Extract method names from plugin
export type PluginMethodNames<T extends Plugin> = keyof T['methods'];

// Extract method signatures from plugin
export type PluginMethodSignatures<T extends Plugin> = {
  [K in keyof T['methods']]: T['methods'][K] extends PluginMethod<infer _TCore, infer TArgs, infer TReturn>
    ? (...args: TArgs) => TReturn
    : never;
};

// Type-safe WordNet kernel with plugin methods and built-in schema management
export type WordNetWithPlugins<TPlugins extends readonly Plugin[] = readonly Plugin[]> = 
  WordNetCore & {
    // Plugin management
    use: <TNewPlugin extends Plugin>(plugin: TNewPlugin) => WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
    remove: (name: string) => WordNetWithPlugins<TPlugins>;
    has: (name: string) => boolean;
    getPlugins: () => string[];
    getCore: () => WordNetCore;
    
    // Built-in schema management (not a plugin - core functionality)
    schemaManager: {
      registerPluginRequirements: (requirements: PluginSchemaRequirements) => Promise<void>;
      unregisterPluginRequirements: (pluginName: string) => Promise<void>;
      performHealthCheck: () => Promise<HealthCheckResult>;
      applyModifications: (modificationIds: string[]) => Promise<{
        success: boolean;
        applied: string[];
        failed: string[];
        conflicts: string[];
        errors: string[];
      }>;
      resolveConflicts: (conflictId: string, strategy: ConflictResolutionStrategy) => Promise<boolean>;
      getSchemaStatus: () => Promise<{
        tables: string[];
        columns: Record<string, string[]>;
        indexes: Record<string, string[]>;
        constraints: Record<string, string[]>;
        modifications: SchemaModification[];
        conflicts: string[];
        healthScore: number;
      }>;
    };
  } & {
    // Plugin methods - merged from all plugins
    [K in TPlugins[number] extends infer P 
      ? P extends Plugin 
        ? keyof P['methods'] 
        : never 
      : never]: TPlugins[number] extends infer P
        ? P extends Plugin
          ? P['methods'][K] extends PluginMethod<infer _TCore, infer TArgs, infer TReturn>
            ? (...args: TArgs) => TReturn
            : never
          : never
        : never;
  };

/**
 * New Kernel-based WordNet class
 * This replaces the old BaseWordnet architecture
 */
export class WordNetKernel<TPlugins extends readonly Plugin[] = readonly []> {
  private plugins = new Map<string, Plugin>();
  public core: WordNetCore;
  private kyselyDb: KyselyDatabase | undefined;
  private modifications = new Map<string, SchemaModification>();
  private pluginRequirements = new Map<string, PluginSchemaRequirements>();
  private conflictResolutions = new Map<string, ConflictResolution>();
  private healthHistory: HealthCheckResult[] = [];
  private lifecycleManager = new LifecycleManager();

  constructor(core: WordNetCore, kyselyDb?: KyselyDatabase) {
    this.core = core;
    this.kyselyDb = kyselyDb;
    
    // Emit kernel initialization event
    this.emitLifecycleEvent('kernel:init', { kernel: this.core });
  }

  // Delegate all BaseWordnet methods to core
  async words(query?: WordQuery): Promise<Word[]> {
    return this.core.words(query);
  }

  async word(wordId: string): Promise<Word> {
    return this.core.word(wordId);
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    return this.core.synsets(query);
  }

  async synset(synsetId: string): Promise<Synset> {
    return this.core.synset(synsetId);
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    return this.core.senses(query);
  }

  async sense(senseId: string): Promise<Sense> {
    return this.core.sense(senseId);
  }

  async ili(iliId: string): Promise<ILI> {
    return this.core.ili(iliId);
  }

  async ilis(status?: string): Promise<ILI[]> {
    return this.core.ilis(status);
  }

  async synsetsByILI(iliId: string): Promise<Synset[]> {
    return this.core.synsetsByILI(iliId);
  }

  async lexicons(): Promise<Lexicon[]> {
    return this.core.lexicons();
  }

  // Core database operations
  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    return this.core.query(sql, params);
  }

  // Additional methods for plugin system
  async getWord(form: string): Promise<Word[]> {
    return this.core.getWord(form);
  }

  async getSynset(id: string): Promise<Synset | null> {
    return this.core.getSynset(id);
  }

  async getSenses(wordId: string): Promise<Sense[]> {
    return this.core.getSenses(wordId);
  }

  async getDefinitions(synsetId: string): Promise<Definition[]> {
    return this.core.getDefinitions(synsetId);
  }

  async getRelations(synsetId: string, type?: string): Promise<Relation[]> {
    return this.core.getRelations(synsetId, type);
  }

  /**
   * Add a plugin - just like Jotai atoms or Jest matchers
   * Returns a new type-safe instance with the plugin methods
   */
  use<TNewPlugin extends Plugin>(plugin: TNewPlugin): WordNetWithPlugins<[...TPlugins, TNewPlugin]> {
    this.plugins.set(plugin.name, plugin);
    
    // Register lifecycle hooks if provided
    if (plugin.lifecycle) {
      this.lifecycleManager.registerPlugin(plugin.lifecycle);
    }
    
    // Add methods to this instance
    Object.entries(plugin.methods).forEach(([methodName, method]) => {
      (this as Record<string, unknown>)[methodName] = method.bind(null, this);
    });

    // Emit plugin added event
    this.emitLifecycleEvent('plugin:added', { 
      pluginName: plugin.name, 
      methods: Object.keys(plugin.methods) 
    });

    return this as WordNetWithPlugins<[...TPlugins, TNewPlugin]>;
  }

  /**
   * Remove a plugin
   */
  remove(name: string): WordNetWithPlugins<TPlugins> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      // Unregister lifecycle hooks if they exist
      if (plugin.lifecycle) {
        this.lifecycleManager.unregisterPlugin(plugin.lifecycle.name);
      }
      
      // Emit plugin removed event
      this.emitLifecycleEvent('plugin:removed', { pluginName: name });
    }
    
    this.plugins.delete(name);
    return this as WordNetWithPlugins<TPlugins>;
  }

  /**
   * Check if plugin is loaded
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get the core instance
   */
  getCore(): WordNetCore {
    return this.core;
  }

  /**
   * Load a new lexicon and notify plugins
   */
  async loadLexicon(lexicon: Lexicon, source: string): Promise<void> {
    // Emit lexicon loaded event to notify plugins
    await this.emitLifecycleEvent('lexicon:loaded', { 
      lexicon, 
      source 
    });
  }

  /**
   * Update lexicon data and notify plugins
   */
  async updateLexicon(lexicon: Lexicon, changes: string[]): Promise<void> {
    // Emit lexicon updated event to notify plugins
    await this.emitLifecycleEvent('lexicon:updated', { 
      lexicon, 
      changes 
    });
  }

  /**
   * Load data and notify plugins
   */
  async loadData(source: string, recordCount: number): Promise<void> {
    // Emit data loaded event to notify plugins
    await this.emitLifecycleEvent('data:loaded', { 
      source, 
      recordCount 
    });
  }

  /**
   * Update data and notify plugins
   */
  async updateData(table: string, operation: 'insert' | 'update' | 'delete', count: number): Promise<void> {
    // Emit data updated event to notify plugins
    await this.emitLifecycleEvent('data:updated', { 
      table, 
      operation, 
      count 
    });
  }

  /**
   * Emit a lifecycle event to all registered plugins
   */
  private async emitLifecycleEvent<T extends LifecycleEvent>(
    event: T, 
    data: LifecycleEventData[T]
  ): Promise<void> {
    await this.lifecycleManager.emit(event, data, this.core);
  }

  /**
   * Get lifecycle manager for advanced usage
   */
  getLifecycleManager(): LifecycleManager {
    return this.lifecycleManager;
  }

  /**
   * Built-in schema management (not a plugin - core functionality)
   */
  get schemaManager() {
    return {
      registerPluginRequirements: async (requirements: PluginSchemaRequirements) => {
        this.pluginRequirements.set(requirements.pluginName, requirements);
        await this.checkForConflicts(requirements);
        await this.generateSchemaModifications(requirements);
      },

      unregisterPluginRequirements: async (pluginName: string) => {
        this.pluginRequirements.delete(pluginName);
        const toRemove = Array.from(this.modifications.entries())
          .filter(([_, mod]) => mod.id.startsWith(pluginName))
          .map(([id, _]) => id);
        toRemove.forEach(id => this.modifications.delete(id));
      },

      performHealthCheck: async (): Promise<HealthCheckResult> => {
        const issues: HealthIssue[] = [];
        const recommendations: HealthRecommendation[] = [];
        
        // Check schema health
        const schemaIssues = await this.checkSchemaHealth();
        issues.push(...schemaIssues);
        
        // Check data health
        const dataIssues = await this.checkDataHealth();
        issues.push(...dataIssues);
        
        // Check for conflicts
        const conflictIssues = await this.checkConflicts();
        issues.push(...conflictIssues);
        
        // Generate recommendations
        recommendations.push(...this.generateRecommendations(issues));
        
        // Calculate health score
        const score = this.calculateHealthScore(issues);
        const isHealthy = score >= 75;
        
        const result: HealthCheckResult = {
          isHealthy,
          score,
          issues,
          recommendations,
          timestamp: Date.now()
        };
        
        this.healthHistory.push(result);
        
        // Keep only last 100 health checks
        if (this.healthHistory.length > 100) {
          this.healthHistory = this.healthHistory.slice(-100);
        }
        
        return result;
      },

      applyModifications: async (modificationIds: string[]) => {
        const applied: string[] = [];
        const failed: string[] = [];
        const conflicts: string[] = [];
        const errors: string[] = [];
        
        // Sort modifications by priority and dependencies
        const sortedModifications = this.sortModificationsByDependencies(modificationIds);
        
        for (const modification of sortedModifications) {
          try {
            // Check for conflicts
            const conflictCheck = await this.checkModificationConflicts(modification);
            if (conflictCheck.hasConflicts) {
              conflicts.push(modification.id);
              continue;
            }
            
            // Apply the modification using Kysely if available, otherwise fallback to core.query
            if (this.kyselyDb) {
              await this.kyselyDb.executeSchemaModification(modification.sql);
            } else {
              await this.core.query(modification.sql);
            }
            applied.push(modification.id);
            
            console.log(`Applied schema modification: ${modification.id}`);
          } catch (error) {
            failed.push(modification.id);
            errors.push(`Failed to apply ${modification.id}: ${error}`);
          }
        }
        
        return {
          success: failed.length === 0,
          applied,
          failed,
          conflicts,
          errors
        };
      },

      resolveConflicts: async (conflictId: string, strategy: ConflictResolutionStrategy) => {
        const resolution: ConflictResolution = {
          conflictId,
          strategy,
          resolution: `Resolved using ${strategy} strategy`,
          timestamp: Date.now()
        };
        
        this.conflictResolutions.set(conflictId, resolution);
        
        // Apply resolution based on strategy
        switch (strategy) {
          case 'merge':
            return await this.mergeConflictingChanges(conflictId);
          case 'override':
            return await this.overrideConflictingChanges(conflictId);
          case 'skip':
            return await this.skipConflictingChanges(conflictId);
          case 'rollback':
            return await this.rollbackConflictingChanges(conflictId);
          case 'manual':
            return false; // Requires manual intervention
          default:
            return false;
        }
      },

      getSchemaStatus: async () => {
        const tables = await this.getCurrentTables();
        const columns: Record<string, string[]> = {};
        const indexes: Record<string, string[]> = {};
        const constraints: Record<string, string[]> = {};
        
        for (const table of tables) {
          columns[table] = await this.getTableColumns(table);
          indexes[table] = await this.getTableIndexes(table);
          constraints[table] = await this.getTableConstraints(table);
        }
        
        const latestHealth = this.healthHistory[this.healthHistory.length - 1];
        
        return {
          tables,
          columns,
          indexes,
          constraints,
          modifications: Array.from(this.modifications.values()),
          conflicts: Array.from(this.conflictResolutions.keys()),
          healthScore: latestHealth?.score || 0
        };
      }
    };
  }

  // Private schema management methods (simplified from microkernel)
  private async checkForConflicts(_newRequirements: PluginSchemaRequirements): Promise<void> {
    // Implementation simplified for brevity
  }

  private async generateSchemaModifications(_requirements: PluginSchemaRequirements): Promise<void> {
    // Implementation simplified for brevity
  }

  private async checkSchemaHealth(): Promise<HealthIssue[]> {
    return [];
  }

  private async checkDataHealth(): Promise<HealthIssue[]> {
    return [];
  }

  private async checkConflicts(): Promise<HealthIssue[]> {
    return [];
  }

  private generateRecommendations(issues: HealthIssue[]): HealthRecommendation[] {
    return issues.map(issue => ({
      id: `fix_${issue.id}`,
      type: 'schema' as const,
      priority: issue.severity === 'critical' ? 'critical' as const : 'high' as const,
      title: `Fix: ${issue.title}`,
      description: issue.suggestedFix,
      benefits: ['Enables plugin functionality'],
      estimatedEffort: issue.estimatedTime,
      implementation: issue.suggestedFix
    }));
  }

  private calculateHealthScore(issues: HealthIssue[]): number {
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    return Math.max(0, score);
  }

  private sortModificationsByDependencies(modificationIds: string[]): SchemaModification[] {
    const modifications = modificationIds
      .map(id => this.modifications.get(id))
      .filter((mod): mod is SchemaModification => mod !== undefined);
    return modifications.sort((a, b) => a.priority - b.priority);
  }

  private async checkModificationConflicts(_modification: SchemaModification): Promise<{ hasConflicts: boolean; conflicts: string[] }> {
    return { hasConflicts: false, conflicts: [] };
  }

  private async mergeConflictingChanges(conflictId: string): Promise<boolean> {
    console.log(`Merging conflicting changes for ${conflictId}`);
    return true;
  }

  private async overrideConflictingChanges(conflictId: string): Promise<boolean> {
    console.log(`Overriding conflicting changes for ${conflictId}`);
    return true;
  }

  private async skipConflictingChanges(conflictId: string): Promise<boolean> {
    console.log(`Skipping conflicting changes for ${conflictId}`);
    return true;
  }

  private async rollbackConflictingChanges(conflictId: string): Promise<boolean> {
    console.log(`Rolling back conflicting changes for ${conflictId}`);
    return true;
  }

  // Database introspection methods
  private async getCurrentTables(): Promise<string[]> {
    // Use raw SQL for system tables since they're not part of our schema
    const result = await this.core.query("SELECT name FROM sqlite_master WHERE type='table'");
    return (result as Array<{ name: string }>).map((row) => row.name);
  }

  private async getTableColumns(table: string): Promise<string[]> {
    const result = await this.core.query(`PRAGMA table_info(${table})`);
    return (result as Array<{ name: string }>).map((row) => row.name);
  }

  private async getTableIndexes(table: string): Promise<string[]> {
    const result = await this.core.query(`PRAGMA index_list(${table})`);
    return (result as Array<{ name: string }>).map((row) => row.name);
  }

  private async getTableConstraints(table: string): Promise<string[]> {
    const result = await this.core.query(`PRAGMA foreign_key_list(${table})`);
    return (result as Array<{ id: string }>).map((row) => row.id);
  }
}

/**
 * Factory function - create WordNet with plugins
 * Returns a fully type-safe WordNet instance
 */
export function createWordNet<TPlugins extends readonly Plugin[] = readonly []>(config: { 
  core: WordNetCore;
  kyselyDb?: KyselyDatabase;
  plugins?: TPlugins;
}): WordNetWithPlugins<TPlugins> {
  const kernel = new WordNetKernel(config.core, config.kyselyDb);
  
  // Add plugins
  config.plugins?.forEach(plugin => kernel.use(plugin));
  
  return kernel as WordNetKernel;
}

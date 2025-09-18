/**
 * Plugin Lifecycle Management for WordNet Kernel
 * 
 * This module provides lifecycle hooks for plugins to be notified when:
 * - A new lexicon is loaded
 * - Data is updated
 * - The kernel is initialized
 * - Plugins are added/removed
 */

import type { WordNetCore } from './wordnet-kernel.js';
import type { Lexicon } from './core/types.js';

// Lifecycle event types
export type LifecycleEvent = 
  | 'kernel:init'
  | 'lexicon:loaded'
  | 'lexicon:updated'
  | 'data:loaded'
  | 'data:updated'
  | 'plugin:added'
  | 'plugin:removed'
  | 'schema:changed';

// Lifecycle event data
export interface LifecycleEventData {
  'kernel:init': { kernel: WordNetCore };
  'lexicon:loaded': { lexicon: Lexicon; source: string };
  'lexicon:updated': { lexicon: Lexicon; changes: string[] };
  'data:loaded': { source: string; recordCount: number };
  'data:updated': { table: string; operation: 'insert' | 'update' | 'delete'; count: number };
  'plugin:added': { pluginName: string; methods: string[] };
  'plugin:removed': { pluginName: string };
  'schema:changed': { modifications: string[] };
}

// Lifecycle hook function type
export type LifecycleHook<T extends LifecycleEvent = LifecycleEvent> = (
  event: T,
  data: LifecycleEventData[T],
  kernel: WordNetCore
) => Promise<void> | void;

// Plugin lifecycle interface
export interface PluginLifecycle {
  name: string;
  hooks: {
    [K in LifecycleEvent]?: LifecycleHook<K>;
  };
  dependencies?: string[]; // Other plugins this plugin depends on
  priority?: number; // Lower numbers run first (0 = highest priority)
}

// Lifecycle manager
export class LifecycleManager {
  private hooks = new Map<LifecycleEvent, Array<{ plugin: string; hook: LifecycleHook; priority: number }>>();
  private pluginDependencies = new Map<string, string[]>();
  private pluginPriorities = new Map<string, number>();

  constructor() {
    // Initialize hook arrays for all event types
    const eventTypes: LifecycleEvent[] = [
      'kernel:init',
      'lexicon:loaded',
      'lexicon:updated', 
      'data:loaded',
      'data:updated',
      'plugin:added',
      'plugin:removed',
      'schema:changed'
    ];
    
    eventTypes.forEach(event => {
      this.hooks.set(event, []);
    });
  }

  /**
   * Register a plugin's lifecycle hooks
   */
  registerPlugin(plugin: PluginLifecycle): void {
    const pluginName = plugin.name;
    const priority = plugin.priority ?? 100; // Default priority
    
    this.pluginPriorities.set(pluginName, priority);
    
    if (plugin.dependencies) {
      this.pluginDependencies.set(pluginName, plugin.dependencies);
    }

    // Register each hook
    Object.entries(plugin.hooks).forEach(([event, hook]) => {
      if (hook) {
        const eventType = event as LifecycleEvent;
        const hooks = this.hooks.get(eventType) || [];
        
        hooks.push({
          plugin: pluginName,
          hook: hook as LifecycleHook,
          priority
        });
        
        // Sort by priority (lower numbers first)
        hooks.sort((a, b) => a.priority - b.priority);
        
        this.hooks.set(eventType, hooks);
      }
    });
  }

  /**
   * Unregister a plugin's lifecycle hooks
   */
  unregisterPlugin(pluginName: string): void {
    this.pluginPriorities.delete(pluginName);
    this.pluginDependencies.delete(pluginName);
    
    // Remove all hooks for this plugin
    this.hooks.forEach((hooks, event) => {
      const filteredHooks = hooks.filter(h => h.plugin !== pluginName);
      this.hooks.set(event, filteredHooks);
    });
  }

  /**
   * Emit a lifecycle event and run all registered hooks in priority order
   */
  async emit<T extends LifecycleEvent>(
    event: T, 
    data: LifecycleEventData[T], 
    kernel: WordNetCore
  ): Promise<void> {
    const hooks = this.hooks.get(event) || [];
    
    // Check dependencies before running hooks
    const validHooks = await this.validateDependencies(hooks, event);
    
    // Run hooks in priority order
    for (const { plugin, hook } of validHooks) {
      try {
        await hook(event, data, kernel);
        console.log(`✅ Lifecycle hook executed: ${plugin} -> ${event}`);
      } catch (error) {
        console.error(`❌ Lifecycle hook failed: ${plugin} -> ${event}`, error);
        // Continue with other hooks even if one fails
      }
    }
  }

  /**
   * Validate that plugin dependencies are satisfied
   */
  private async validateDependencies(
    hooks: Array<{ plugin: string; hook: LifecycleHook; priority: number }>,
    event: LifecycleEvent
  ): Promise<Array<{ plugin: string; hook: LifecycleHook; priority: number }>> {
    const validHooks: Array<{ plugin: string; hook: LifecycleHook; priority: number }> = [];
    
    for (const { plugin, hook, priority } of hooks) {
      const dependencies = this.pluginDependencies.get(plugin) || [];
      
      // Check if all dependencies are satisfied
      const dependenciesSatisfied = dependencies.every(dep => {
        // Check if dependency plugin has hooks registered
        const hasDependencyHooks = Array.from(this.hooks.values())
          .some(hookList => hookList.some(h => h.plugin === dep));
        return hasDependencyHooks;
      });
      
      if (dependenciesSatisfied) {
        validHooks.push({ plugin, hook, priority });
      } else {
        console.warn(`⚠️ Skipping ${plugin} -> ${event}: dependencies not satisfied: ${dependencies.join(', ')}`);
      }
    }
    
    return validHooks;
  }

  /**
   * Get all registered plugins
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.pluginPriorities.keys());
  }

  /**
   * Get hooks for a specific event
   */
  getHooksForEvent(event: LifecycleEvent): Array<{ plugin: string; priority: number }> {
    const hooks = this.hooks.get(event) || [];
    return hooks.map(({ plugin, priority }) => ({ plugin, priority }));
  }
}

// Built-in lifecycle hooks for common plugin patterns
export const builtInHooks = {
  /**
   * Hook for similarity plugins that need to rebuild caches when new data is loaded
   */
  createSimilarityCacheHook: (pluginName: string) => ({
    name: pluginName,
    hooks: {
      'lexicon:loaded': async (event, data, kernel) => {
        console.log(`🔄 Rebuilding similarity cache for ${pluginName} after lexicon load: ${data.lexicon.id}`);
        // Similarity plugins can rebuild their caches here
      },
      'data:loaded': async (event, data, kernel) => {
        console.log(`🔄 Rebuilding similarity cache for ${pluginName} after data load: ${data.recordCount} records`);
        // Similarity plugins can rebuild their caches here
      }
    },
    priority: 50
  }),

  /**
   * Hook for translation plugins that need to rebuild ILI mappings
   */
  createTranslationMappingHook: (pluginName: string) => ({
    name: pluginName,
    hooks: {
      'lexicon:loaded': async (event, data, kernel) => {
        console.log(`🌐 Rebuilding translation mappings for ${pluginName} after lexicon load: ${data.lexicon.id}`);
        // Translation plugins can rebuild their ILI mappings here
      },
      'data:loaded': async (event, data, kernel) => {
        console.log(`🌐 Rebuilding translation mappings for ${pluginName} after data load: ${data.recordCount} records`);
        // Translation plugins can rebuild their ILI mappings here
      }
    },
    priority: 60
  }),

  /**
   * Hook for analytics plugins that need to rebuild statistics
   */
  createAnalyticsHook: (pluginName: string) => ({
    name: pluginName,
    hooks: {
      'lexicon:loaded': async (event, data, kernel) => {
        console.log(`📊 Rebuilding analytics for ${pluginName} after lexicon load: ${data.lexicon.id}`);
        // Analytics plugins can rebuild their statistics here
      },
      'data:loaded': async (event, data, kernel) => {
        console.log(`📊 Rebuilding analytics for ${pluginName} after data load: ${data.recordCount} records`);
        // Analytics plugins can rebuild their statistics here
      }
    },
    priority: 70
  })
};

// Utility function to create a simple lifecycle plugin
export function createLifecyclePlugin(
  name: string,
  hooks: Partial<PluginLifecycle['hooks']>,
  options: { dependencies?: string[]; priority?: number } = {}
): PluginLifecycle {
  return {
    name,
    hooks,
    dependencies: options.dependencies,
    priority: options.priority
  };
}

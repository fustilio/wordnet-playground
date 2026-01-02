/**
 * Plugin registry for managing dictionary plugins
 * Inspired by the kernel architecture from wn-ts-core
 */

import type {
  Plugin,
  PluginMetadata,
  PluginRegistrationOptions,
  PluginHooks,
  PluginContext
} from './types.js';

/**
 * Registered plugin with metadata
 */
interface RegisteredPlugin {
  plugin: Plugin;
  priority: number;
  initialized: boolean;
}

/**
 * Plugin registry for managing and executing plugins
 */
export class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>();
  private sharedData = new Map<string, any>();

  /**
   * Register a plugin
   * @param plugin - The plugin to register
   * @param options - Registration options
   */
  async register(plugin: Plugin, options: PluginRegistrationOptions = {}): Promise<void> {
    const { autoInitialize = true, priority = 100 } = options;

    if (this.plugins.has(plugin.meta.name)) {
      throw new Error(`Plugin "${plugin.meta.name}" is already registered`);
    }

    // Check dependencies
    if (plugin.meta.dependencies) {
      for (const dep of plugin.meta.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin "${plugin.meta.name}" depends on "${dep}", which is not registered`);
        }
      }
    }

    console.log(`[PluginRegistry] Registering plugin: ${plugin.meta.name}@${plugin.meta.version}`);

    this.plugins.set(plugin.meta.name, {
      plugin,
      priority,
      initialized: false
    });

    if (autoInitialize && plugin.initialize) {
      await plugin.initialize();
      const registered = this.plugins.get(plugin.meta.name)!;
      registered.initialized = true;
    }
  }

  /**
   * Unregister a plugin
   * @param name - Plugin name
   */
  async unregister(name: string): Promise<void> {
    const registered = this.plugins.get(name);
    if (!registered) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    console.log(`[PluginRegistry] Unregistering plugin: ${name}`);

    if (registered.plugin.dispose) {
      await registered.plugin.dispose();
    }

    this.plugins.delete(name);
  }

  /**
   * Get a registered plugin
   * @param name - Plugin name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => a.priority - b.priority)
      .map(r => r.plugin);
  }

  /**
   * Execute a specific hook across all plugins
   * @param hookName - Name of the hook to execute
   * @param args - Arguments to pass to the hook
   */
  async executeHook<K extends keyof PluginHooks>(
    hookName: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<any> {
    const plugins = this.getPlugins();
    let result = args[0]; // First argument is usually the data to transform

    for (const plugin of plugins) {
      const hook = plugin.hooks[hookName];
      if (!hook) continue;

      try {
        const context: PluginContext = {
          plugin: plugin.meta,
          shared: this.sharedData
        };

        // Execute hook with context
        const hookResult = await (hook as any)(result, ...args.slice(1), context);

        // If hook returns a value, use it as the new result
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`[PluginRegistry] Error in ${plugin.meta.name}.${hookName}:`, error);
        throw error;
      }
    }

    return result;
  }

  /**
   * Set shared data accessible to all plugins
   * @param key - Data key
   * @param value - Data value
   */
  setShared(key: string, value: any): void {
    this.sharedData.set(key, value);
  }

  /**
   * Get shared data
   * @param key - Data key
   */
  getShared<T = any>(key: string): T | undefined {
    return this.sharedData.get(key);
  }

  /**
   * Clear all shared data
   */
  clearShared(): void {
    this.sharedData.clear();
  }

  /**
   * List all registered plugin names
   */
  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   * @param name - Plugin name
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Clear all plugins
   */
  async clear(): Promise<void> {
    console.log('[PluginRegistry] Clearing all plugins');

    for (const [name, registered] of this.plugins.entries()) {
      if (registered.plugin.dispose) {
        await registered.plugin.dispose();
      }
    }

    this.plugins.clear();
    this.sharedData.clear();
  }
}

/**
 * Global plugin registry instance
 */
export const globalRegistry = new PluginRegistry();

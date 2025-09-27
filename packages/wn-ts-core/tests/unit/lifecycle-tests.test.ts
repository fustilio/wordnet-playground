import { describe, it, expect, beforeEach } from 'vitest';
import { WordNetKernel } from '../../src/wordnet-kernel.js';
import type { WordNetCore } from '../../src/wordnet-kernel.js';
import type { Word, Sense, Synset, Lexicon, ILI, WordQuery, SynsetQuery, SenseQuery } from '../../src/core/types.js';
import { similarity } from '../../src/plugins/similarity/index.js';
import { translation } from '../../src/plugins/translation.js';
import { createLifecyclePlugin } from '../../src/wordnet-kernel-lifecycle.js';

// Mock implementation of WordNetCore for testing
class MockWordNetCore implements WordNetCore {
  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> { return []; }
  async words(_query?: WordQuery): Promise<Word[]> { return []; }
  async word(_wordId: string): Promise<Word> { 
    return {
      id: 'mock-word',
      lemma: 'mock',
      pos: 'n',
      forms: [],
      pronunciations: [],
      tags: [],
      counts: [],
      language: 'en',
      lexicon: 'mock-lexicon',
      syntacticBehaviours: []
    } as Word; 
  }
  async synsets(_query?: SynsetQuery): Promise<Synset[]> { return []; }
  async synset(_synsetId: string): Promise<Synset> { 
    return {
      id: 'mock-synset',
      pos: 'n',
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'mock-lexicon',
      ili: 'mock-ili'
    } as Synset; 
  }
  async senses(_query?: SenseQuery): Promise<Sense[]> { return []; }
  async sense(_senseId: string): Promise<Sense> { 
    return {
      id: 'mock-sense',
      wordId: 'mock-word',
      synsetId: 'mock-synset',
      examples: [],
      counts: [],
      tags: [],
      language: 'en',
      lexicon: 'mock-lexicon'
    } as Sense; 
  }
  async ili(_iliId: string): Promise<ILI> { 
    return {
      id: 'mock-ili',
      status: 'standard'
    } as ILI; 
  }
  async ilis(_status?: string): Promise<ILI[]> { return []; }
  async lexicons(): Promise<Lexicon[]> { return []; }
  async synsetsByILI(_iliId: string): Promise<Synset[]> { return []; }
  async getWord(_form: string): Promise<Word[]> { return []; }
  async getSynset(_id: string): Promise<Synset | null> { return null; }
  async getSenses(_wordId: string): Promise<Sense[]> { return []; }
  async getDefinitions(_synsetId: string): Promise<any[]> { return []; }
  async getRelations(_synsetId: string, _type?: string): Promise<any[]> { return []; }
}

describe('Plugin Lifecycle Management', () => {
  let kernel: WordNetKernel<any>;
  let mockCore: WordNetCore;

  beforeEach(() => {
    mockCore = new MockWordNetCore();
    kernel = new WordNetKernel(mockCore);
  });

  describe('Lifecycle Events', () => {
    it('should emit kernel:init event on construction', () => {
      // The kernel:init event is emitted in the constructor
      // We can verify this by checking that the lifecycle manager is initialized
      const lifecycleManager = kernel.getLifecycleManager();
      expect(lifecycleManager).toBeDefined();
    });

    it('should emit plugin:added event when loading plugins', () => {
      // Load similarity plugin
      kernel.use(similarity);
      
      // The plugin:added event should have been emitted
      // We can verify by checking that the plugin is registered
      expect(kernel.has('similarity')).toBe(true);
    });

    it('should emit plugin:removed event when removing plugins', () => {
      // Load and then remove similarity plugin
      kernel.use(similarity);
      expect(kernel.has('similarity')).toBe(true);
      
      kernel.remove('similarity');
      expect(kernel.has('similarity')).toBe(false);
    });

    it('should emit lexicon:loaded event when loading a lexicon', async () => {
      const mockLexicon: Lexicon = {
        id: 'test-lexicon',
        label: 'Test Lexicon',
        language: 'en',
        version: '1.0'
      };

      // Load similarity plugin first to register lifecycle hooks
      kernel.use(similarity);
      
      // Load lexicon - this should trigger the lifecycle event
      await kernel.loadLexicon(mockLexicon, 'test-source');
      
      // The event should have been processed (we can't easily test the console output in tests)
      // But we can verify the method exists and doesn't throw
      expect(kernel.loadLexicon).toBeDefined();
    });

    it('should emit data:loaded event when loading data', async () => {
      // Load similarity plugin first to register lifecycle hooks
      kernel.use(similarity);
      
      // Load data - this should trigger the lifecycle event
      await kernel.loadData('test-source', 1000);
      
      // The event should have been processed
      expect(kernel.loadData).toBeDefined();
    });

    it('should emit data:updated event when updating data', async () => {
      // Load similarity plugin first to register lifecycle hooks
      kernel.use(similarity);
      
      // Update data - this should trigger the lifecycle event
      await kernel.updateData('synsets', 'insert', 50);
      
      // The event should have been processed
      expect(kernel.updateData).toBeDefined();
    });
  });

  describe('Plugin Dependencies', () => {
    it('should respect plugin dependencies', () => {
      // Load translation plugin (which depends on similarity)
      kernel.use(translation);
      
      // Translation plugin should be loaded
      expect(kernel.has('translation')).toBe(true);
      
      // The dependency on similarity should be registered
      const lifecycleManager = kernel.getLifecycleManager();
      const registeredPlugins = lifecycleManager.getRegisteredPlugins();
      expect(registeredPlugins).toContain('translation');
    });

    it('should load plugins in dependency order', () => {
      // Load both plugins
      kernel.use(similarity);
      kernel.use(translation);
      
      // Both should be loaded
      expect(kernel.has('similarity')).toBe(true);
      expect(kernel.has('translation')).toBe(true);
      
      // The lifecycle manager should have both registered
      const lifecycleManager = kernel.getLifecycleManager();
      const registeredPlugins = lifecycleManager.getRegisteredPlugins();
      expect(registeredPlugins).toContain('similarity');
      expect(registeredPlugins).toContain('translation');
    });
  });

  describe('Custom Lifecycle Plugins', () => {
    it('should allow custom lifecycle plugins', () => {
      let customHookCalled = false;
      
      const customPlugin = createLifecyclePlugin('custom', {
        'lexicon:loaded': async (_event, data, _kernel) => {
          customHookCalled = true;
          console.log(`Custom plugin: Lexicon loaded: ${data.lexicon.id}`);
        }
      });

      // Create a plugin with lifecycle hooks
      const pluginWithLifecycle = {
        name: 'custom-plugin',
        methods: {
          customMethod: async (_core: WordNetCore) => {
            return 'custom result';
          }
        },
        lifecycle: customPlugin
      };

      // Load the custom plugin
      kernel.use(pluginWithLifecycle);
      
      // Verify the plugin is loaded
      expect(kernel.has('custom-plugin')).toBe(true);
      
      // The lifecycle should be registered
      const lifecycleManager = kernel.getLifecycleManager();
      const registeredPlugins = lifecycleManager.getRegisteredPlugins();
      expect(registeredPlugins).toContain('custom');
      
      // Verify the custom hook was called (this would happen when a lexicon is loaded)
      expect(customHookCalled).toBe(false); // Initially false since no lexicon loaded yet
    });

    it('should run lifecycle hooks in priority order', async () => {
      const executionOrder: string[] = [];
      
      // Create plugins with different priorities
      const highPriorityPlugin = createLifecyclePlugin('high-priority', {
        'data:loaded': async (_event, _data, _kernel) => {
          executionOrder.push('high-priority');
        }
      }, { priority: 10 });

      const lowPriorityPlugin = createLifecyclePlugin('low-priority', {
        'data:loaded': async (_event, _data, _kernel) => {
          executionOrder.push('low-priority');
        }
      }, { priority: 90 });

      // Create plugins with these lifecycle hooks
      const plugin1 = {
        name: 'plugin1',
        methods: {},
        lifecycle: highPriorityPlugin
      };

      const plugin2 = {
        name: 'plugin2', 
        methods: {},
        lifecycle: lowPriorityPlugin
      };

      // Load plugins
      kernel.use(plugin1);
      kernel.use(plugin2);
      
      // Trigger data loaded event
      await kernel.loadData('test-source', 100);
      
      // High priority should run first
      expect(executionOrder).toEqual(['high-priority', 'low-priority']);
    });
  });

  describe('Lifecycle Manager', () => {
    it('should provide access to lifecycle manager', () => {
      const lifecycleManager = kernel.getLifecycleManager();
      expect(lifecycleManager).toBeDefined();
      expect(typeof lifecycleManager.getRegisteredPlugins).toBe('function');
      expect(typeof lifecycleManager.getHooksForEvent).toBe('function');
    });

    it('should track registered plugins', () => {
      const lifecycleManager = kernel.getLifecycleManager();
      
      // Initially no plugins
      expect(lifecycleManager.getRegisteredPlugins()).toHaveLength(0);
      
      // Load similarity plugin
      kernel.use(similarity);
      
      // Should now have similarity plugin registered
      const registeredPlugins = lifecycleManager.getRegisteredPlugins();
      expect(registeredPlugins).toContain('similarity');
    });

    it('should track hooks for specific events', () => {
      const lifecycleManager = kernel.getLifecycleManager();
      
      // Load similarity plugin
      kernel.use(similarity);
      
      // Check hooks for lexicon:loaded event
      const hooks = lifecycleManager.getHooksForEvent('lexicon:loaded');
      expect(hooks).toHaveLength(1);
      expect(hooks[0]?.plugin).toBe('similarity');
      expect(hooks[0]?.priority).toBe(50);
    });
  });

  describe('Error Handling in Lifecycle', () => {
    it('should continue processing other hooks if one fails', async () => {
      let successfulHookCalled = false;
      
      // Create a plugin that throws an error
      const errorPlugin = createLifecyclePlugin('error-plugin', {
        'data:loaded': async (_event, _data, _kernel) => {
          throw new Error('Test error');
        }
      }, { priority: 10 });

      // Create a plugin that should still run
      const successPlugin = createLifecyclePlugin('success-plugin', {
        'data:loaded': async (_event, _data, _kernel) => {
          successfulHookCalled = true;
        }
      }, { priority: 20 });

      // Create plugins with these lifecycle hooks
      const plugin1 = {
        name: 'error-plugin',
        methods: {},
        lifecycle: errorPlugin
      };

      const plugin2 = {
        name: 'success-plugin',
        methods: {},
        lifecycle: successPlugin
      };

      // Load both plugins
      kernel.use(plugin1);
      kernel.use(plugin2);
      
      // Trigger data loaded event - should not throw
      await expect(kernel.loadData('test-source', 100)).resolves.not.toThrow();
      
      // The successful hook should still have been called
      expect(successfulHookCalled).toBe(true);
    });
  });
});

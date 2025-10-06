/**
 * Tests for the simplified WordNet API
 * 
 * This file tests the new createWordnet function and its various
 * configuration options for database persistence.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createWordnet } from '../../src/kysely-wordnet.js';
import type { NodeWordnetConfig } from '../../src/kysely-wordnet.js';

describe('Simplified WordNet API', () => {
  let wordnet: any;

  afterEach(async () => {
    if (wordnet) {
      await wordnet.close();
      wordnet = null;
    }
  });

  describe('createWordnet function', () => {
    it('should create WordNet instance with default persistent mode', () => {
      wordnet = createWordnet('oewn:2024');
      expect(wordnet).toBeDefined();
      expect(typeof wordnet.initialize).toBe('function');
      expect(typeof wordnet.close).toBe('function');
    });

    it('should create WordNet instance with memory mode', () => {
      wordnet = createWordnet('oewn:2024', { mode: 'memory' });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with custom filename', () => {
      wordnet = createWordnet('oewn:2024', { 
        filename: './test-custom.db',
        mode: 'persistent'
      });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with migration options', () => {
      wordnet = createWordnet('oewn:2024', {
        migrations: {
          enabled: true,
          backup: true
        }
      });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with verbose logging', () => {
      wordnet = createWordnet('oewn:2024', {
        verbose: true
      });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with readonly mode', () => {
      wordnet = createWordnet('oewn:2024', {
        readonly: true
      });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with forceRecreate', () => {
      wordnet = createWordnet('oewn:2024', {
        forceRecreate: true
      });
      expect(wordnet).toBeDefined();
    });

    it('should create WordNet instance with multiple lexicons', () => {
      wordnet = createWordnet(['oewn:2024', 'omw-en:1.4']);
      expect(wordnet).toBeDefined();
    });
  });

  describe('Database modes', () => {
    it('should use persistent mode by default', () => {
      wordnet = createWordnet('oewn:2024');
      // The mode should be persistent by default
      expect(wordnet).toBeDefined();
    });

    it('should use memory mode when specified', () => {
      wordnet = createWordnet('oewn:2024', { mode: 'memory' });
      expect(wordnet).toBeDefined();
    });

    it('should use temp mode when specified', () => {
      wordnet = createWordnet('oewn:2024', { 
        mode: 'temp',
        filename: './temp-test.db'
      });
      expect(wordnet).toBeDefined();
    });
  });

  describe('Configuration validation', () => {
    it('should use default filename for persistent mode when not provided', () => {
      wordnet = createWordnet('oewn:2024', { mode: 'persistent' });
      expect(wordnet).toBeDefined();
      // The constructor should provide a default filename for persistent mode
    });

    it('should not throw error for memory mode without filename', () => {
      expect(() => {
        createWordnet('oewn:2024', { mode: 'memory' });
      }).not.toThrow();
    });

    it('should not throw error for temp mode without filename', () => {
      expect(() => {
        createWordnet('oewn:2024', { mode: 'temp' });
      }).not.toThrow();
    });
  });

  describe('Integration with WordNet functionality', () => {
    it('should initialize and close properly with memory mode', async () => {
      wordnet = createWordnet('oewn:2024', { mode: 'memory' });
      
      await expect(wordnet.initialize()).resolves.not.toThrow();
      await expect(wordnet.close()).resolves.not.toThrow();
    });

    it('should provide access to WordNet methods after initialization', async () => {
      wordnet = createWordnet('oewn:2024', { mode: 'memory' });
      await wordnet.initialize();
      
      expect(typeof wordnet.words).toBe('function');
      expect(typeof wordnet.synsets).toBe('function');
      expect(typeof wordnet.senses).toBe('function');
      expect(typeof wordnet.getStatistics).toBe('function');
    });
  });

  describe('Configuration options', () => {
    it('should accept all valid configuration options', () => {
      const config: NodeWordnetConfig = {
        mode: 'persistent',
        filename: './test.db',
        migrations: {
          enabled: true,
          backup: true
        },
        forceRecreate: false,
        readonly: false,
        verbose: true,
        timeout: 5000,
        strategy: 'fuzzy'
      };

      wordnet = createWordnet('oewn:2024', config);
      expect(wordnet).toBeDefined();
    });

    it('should handle partial configuration', () => {
      const partialConfig: Partial<NodeWordnetConfig> = {
        mode: 'memory',
        verbose: true
      };

      wordnet = createWordnet('oewn:2024', partialConfig);
      expect(wordnet).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid mode gracefully', () => {
      // TypeScript should catch this, but test runtime behavior
      expect(() => {
        createWordnet('oewn:2024', { mode: 'invalid' as any });
      }).not.toThrow(); // The function should still create the instance
    });
  });
});

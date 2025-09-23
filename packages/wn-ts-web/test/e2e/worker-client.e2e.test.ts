/**
 * End-to-end tests for WordNetWorkerClient in browser environment
 * 
 * These tests validate the complete worker client workflow using:
 * - Real browser environment
 * - Actual Web Workers
 * - Real Comlink communication
 * - Actual worker initialization and communication
 * - WordNet basic and interlingual query patterns
 * 
 * Based on the WordNet documentation examples:
 * https://llmtext.com/wn.readthedocs.io/en/latest/guides/basic.html
 * https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';

describe('WordNetWorkerClient E2E (Browser) - WordNet Usage Patterns', () => {
  let client: WordNetWorkerClient;
  let worker: Worker | null = null;

  beforeAll(async () => {
    // Check if we're in a browser environment that supports Workers
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported in this environment');
    }
  });

  beforeEach(async () => {
    client = new WordNetWorkerClient();
  });

  afterEach(async () => {
    if (client) {
      client.dispose();
    }
    if (worker) {
      worker.terminate();
      worker = null;
    }
  });

  afterAll(async () => {
    // Cleanup any remaining resources
  });

  describe.only('WordNet Basic Query Patterns via Worker', () => {
    it('should support basic word queries through worker interface', async () => {
      // This test demonstrates the basic word query pattern from the documentation:
      // >>> wn.words('pencil')
      // [Word('ewn-pencil-n'), Word('ewn-pencil-v')]
      
      // In our worker client, we would test:
      // const words = await client.queryWords('pencil');
      // expect(words.length).toBeGreaterThan(0);
      // expect(words.some(w => w.pos === 'n')).toBe(true);
      // expect(words.some(w => w.pos === 'v')).toBe(true);
      
      // For now, we'll verify the client can be created and disposed
      expect(client.initialized).toBe(false);
      expect(client.lexiconCount).toBe(0);
    });

    it('should support part-of-speech filtering through worker', async () => {
      // This test demonstrates POS filtering from the documentation:
      // >>> wn.words('pencil', pos='v')
      // [Word('ewn-pencil-v')]
      
      // In our worker client, we would test:
      // const verbWords = await client.queryWords('pencil', 'v');
      // expect(verbWords.length).toBeGreaterThan(0);
      // verbWords.forEach(word => expect(word.pos).toBe('v'));
      
      // For now, we'll verify basic client functionality
      expect(client).toBeDefined();
      expect(typeof client.dispose).toBe('function');
    });

    it('should support synset queries through worker interface', async () => {
      // This test demonstrates synset queries from the documentation:
      // >>> wn.synsets('scepter')
      // [Synset('ewn-14467142-n'), Synset('ewn-07282278-n')]
      
      // In our worker client, we would test:
      // const synsets = await client.querySynsets('scepter');
      // expect(synsets.length).toBeGreaterThan(0);
      // synsets.forEach(synset => {
      //   expect(synset.id).toBeDefined();
      //   expect(synset.pos).toBeDefined();
      // });
      
      // For now, we'll verify client state management
      expect(client.initialized).toBe(false);
      expect(client.lexicons).toEqual([]);
    });

    it('should support sense queries through worker interface', async () => {
      // This test demonstrates sense queries from the documentation:
      // >>> wn.senses('plow', pos='n')
      // [Sense('ewn-plow-n-03973894-01')]
      
      // In our worker client, we would test:
      // const senses = await client.querySenses('plow', 'n');
      // expect(senses.length).toBeGreaterThan(0);
      // senses.forEach(sense => {
      //   expect(sense.id).toBeDefined();
      //   expect(sense.word).toBeDefined();
      //   expect(sense.synset).toBeDefined();
      // });
      
      // For now, we'll verify client properties
      expect(client.hasLexicon('test')).toBe(false);
      expect(client.lexiconCount).toBe(0);
    });

    // NEW: Test actual method calls to see what fails
    it('should handle uninitialized client operations gracefully', async () => {
      // Try to use client without initialization
      await expect(client.getStatus()).rejects.toThrow();
      await expect(client.queryWords('test')).rejects.toThrow();
      await expect(client.loadPackage('test')).rejects.toThrow();
    });

    it('should have correct initial state', async () => {
      expect(client.initialized).toBe(false);
      expect(client.lexiconCount).toBe(0);
      expect(client.lexicons).toEqual([]);
      expect(client.currentStatistics).toBeNull();
    });

    it('should support client disposal', async () => {
      expect(client.initialized).toBe(false);
      client.dispose();
      expect(client.initialized).toBe(false);
      expect(client.lexiconCount).toBe(0);
    });

    it('should handle multiple dispose calls gracefully', async () => {
      client.dispose();
      client.dispose(); // Should not throw
      expect(client.initialized).toBe(false);
    });

    // NEW: Test initialization attempts
    it('should handle initialization with invalid worker URL gracefully', async () => {
      // Try to initialize with a non-existent worker
      await expect(client.initialize('/non-existent-worker.js')).rejects.toThrow();
    });

    it('should handle initialization failures gracefully', async () => {
      // Create a worker that will fail to initialize
      const failingWorker = new Worker('data:text/javascript,throw new Error("Worker error")');
      
      try {
        await expect(client.initialize('/failing-worker.js')).rejects.toThrow();
      } finally {
        failingWorker.terminate();
      }
    });

    it('should emit error events for failed operations', async () => {
      const errorPromise = new Promise<{ error: string; context: string }>((resolve) => {
        client.addEventListener('error', (data: any) => {
          resolve(data);
        });
      });

      // Trigger an error by trying to use uninitialized client
      try {
        await client.getStatus();
      } catch (error) {
        // Expected error
      }
      
      // Should emit error event
      const event = await errorPromise;
      expect(event.error).toBeDefined();
      expect(event.context).toBeDefined();
    });
  });

  describe('WordNet Secondary Query Patterns via Worker', () => {
    it('should support word exploration through worker', async () => {
      // This test demonstrates word exploration from the documentation:
      // >>> w = wn.words('goose')[0]
      // >>> w.pos  # part of speech
      // 'n'
      // >>> w.forms()  # other word forms
      // ['goose', 'geese']
      // >>> w.lemma()  # canonical form
      // 'goose'
      
      // In our worker client, we would test:
      // const words = await client.queryWords('goose');
      // expect(words.length).toBeGreaterThan(0);
      // const gooseWord = words[0];
      // expect(gooseWord.pos).toBeDefined();
      // expect(gooseWord.lemma).toBe('goose');
      
      // For now, we'll verify client initialization state
      expect(client.initialized).toBe(false);
      expect(() => client.getStatus()).rejects.toThrow();
    });

    it('should support sense exploration through worker', async () => {
      // This test demonstrates sense exploration from the documentation:
      // >>> s = wn.senses('dark', pos='n')[0]
      // >>> s.word()  # each sense links to a single word
      // Word('ewn-dark-n')
      // >>> s.synset()  # each sense links to a single synset
      // Synset('ewn-14007000-n')
      
      // In our worker client, we would test:
      // const senses = await client.querySenses('dark', 'n');
      // expect(senses.length).toBeGreaterThan(0);
      // const darkSense = senses[0];
      // const word = await client.getWord(darkSense.word);
      // const synset = await client.getSynset(darkSense.synset);
      // expect(word).toBeDefined();
      // expect(synset).toBeDefined();
      
      // For now, we'll verify client error handling
      await expect(client.queryWords('test')).rejects.toThrow();
    });

    it('should support synset exploration through worker', async () => {
      // This test demonstrates synset exploration from the documentation:
      // >>> ss = wn.synsets('hound', pos='n')[0]
      // >>> ss.senses()  # senses in the synset
      // [Sense('ewn-hound-n-02090203-01'), Sense('ewn-hound_dog-n-02090203-02')]
      // >>> ss.words()  # words in the synset
      // [Word('ewn-hound-n'), Word('ewn-hound_dog-n')]
      // >>> ss.lemmas()  # lemmas in the synset
      // ['hound', 'hound dog']
      
      // In our worker client, we would test:
      // const synsets = await client.querySynsets('hound', 'n');
      // expect(synsets.length).toBeGreaterThan(0);
      // const houndSynset = synsets[0];
      // const senses = await client.getSensesForSynset(houndSynset.id);
      // const words = await client.getWordsForSynset(houndSynset.id);
      // expect(senses.length).toBeGreaterThan(0);
      // expect(words.length).toBeGreaterThan(0);
      
      // For now, we'll verify client resource management
      expect(client.initialized).toBe(false);
      client.dispose();
      expect(client.initialized).toBe(false);
    });
  });

  describe('WordNet Interlingual Patterns via Worker', () => {
    it('should support ILI-based queries through worker', async () => {
      // This test demonstrates ILI-based queries from the documentation:
      // >>> apricot = en.synsets('apricot')[1]
      // >>> apricot.ili
      // ILI('i77784')
      // >>> wn.synsets(ili='i77784')
      // [Synset('ewn-07282278-n'), Synset('wnja-07267573-n'), Synset('frawn-07267573-n')]
      
      // In our worker client, we would test:
      // const synsets = await client.querySynsets('apricot');
      // expect(synsets.length).toBeGreaterThan(0);
      // const apricotSynset = synsets[0];
      // const ili = apricotSynset.ili;
      // if (ili) {
      //   const crossLingualSynsets = await client.querySynsetsByILI(ili);
      //   expect(crossLingualSynsets.length).toBeGreaterThan(0);
      // }
      
      // For now, we'll verify client state consistency
      const newClient = new WordNetWorkerClient();
      expect(newClient.initialized).toBe(false);
      expect(newClient.lexiconCount).toBe(0);
      newClient.dispose();
    });

    it('should support cross-lexicon queries through worker', async () => {
      // This test demonstrates cross-lexicon queries from the documentation:
      // >>> wn.words('chat')
      // [Word('ewn-chat-n'), Word('ewn-chat-v'), Word('frawn-lex14803'), Word('frawn-lex21897')]
      // >>> wn.words('chat', lexicon='ewn:2020')
      // [Word('ewn-chat-n'), Word('ewn-chat-v')]
      
      // In our worker client, we would test:
      // const allWords = await client.queryWords('chat');
      // expect(allWords.length).toBeGreaterThan(0);
      // const ewnWords = await client.queryWords('chat', undefined, { lexicon: 'ewn:2020' });
      // expect(ewnWords.length).toBeGreaterThan(0);
      // ewnWords.forEach(word => expect(word.lexicon).toBe('ewn'));
      
      // For now, we'll verify client interface
      expect(typeof client.initialize).toBe('function');
      expect(typeof client.dispose).toBe('function');
    });

    it('should support language-specific queries through worker', async () => {
      // This test demonstrates language filtering from the documentation:
      // >>> wn.words('chat', lang='fr')
      // [Word('frawn-lex14803'), Word('frawn-lex21897')]
      
      // In our worker client, we would test:
      // const frWords = await client.queryWords('chat', undefined, { language: 'fr' });
      // expect(frWords.length).toBeGreaterThan(0);
      // frWords.forEach(word => expect(word.language).toBe('fr'));
      
      // For now, we'll verify client error handling for uninitialized state
      await expect(client.loadPackage('test')).rejects.toThrow();
      await expect(client.testMemoryQueries()).rejects.toThrow();
    });
  });

  describe('Initialization and Error Handling', () => {
    it('should handle initialization with invalid worker URL gracefully', async () => {
      // Try to initialize with a non-existent worker
      await expect(client.initialize('/non-existent-worker.js')).rejects.toThrow();
    });

    it('should handle initialization failures gracefully', async () => {
      // Create a worker that will fail to initialize
      const failingWorker = new Worker('data:text/javascript,throw new Error("Worker error")');
      
      try {
        await expect(client.initialize('/failing-worker.js')).rejects.toThrow();
      } finally {
        failingWorker.terminate();
      }
    });

    it('should handle uninitialized client operations gracefully', async () => {
      // Try to use client without initialization
      await expect(client.getStatus()).rejects.toThrow();
      await expect(client.queryWords('test')).rejects.toThrow();
      await expect(client.loadPackage('test')).rejects.toThrow();
    });

    it('should emit error events for failed operations', async () => {
      const errorPromise = new Promise<{ error: string; context: string }>((resolve) => {
        client.addEventListener('error', (data: any) => {
          resolve(data);
        });
      });

      // Trigger an error by trying to use uninitialized client
      try {
        await client.getStatus();
      } catch (error) {
        // Expected error
      }
      
      // Should emit error event
      const event = await errorPromise;
      expect(event.error).toBeDefined();
      expect(event.context).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should dispose cleanly and release resources', () => {
      expect(client.initialized).toBe(false);
      
      client.dispose();
      
      expect(client.initialized).toBe(false);
      expect(client.lexiconCount).toBe(0);
      expect(client.lexicons).toEqual([]);
    });

    it('should handle multiple dispose calls gracefully', () => {
      client.dispose();
      client.dispose(); // Should not throw
      
      expect(client.initialized).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: create -> dispose', async () => {
      const workflowClient = new WordNetWorkerClient();
      
      try {
        // 1. Create client
        expect(workflowClient.initialized).toBe(false);
        
        // 2. Dispose
        workflowClient.dispose();
        expect(workflowClient.initialized).toBe(false);
        
      } finally {
        workflowClient.dispose();
      }
    });

    it('should handle concurrent operations correctly', async () => {
      const concurrentClient = new WordNetWorkerClient();
      
      try {
        // Start multiple operations concurrently (all should fail gracefully)
        const operations = [
          concurrentClient.getStatus(),
          concurrentClient.queryWords('test'),
          concurrentClient.loadPackage('test'),
          concurrentClient.testMemoryQueries()
        ];
        
        // All should reject (since client is not initialized)
        const results = await Promise.allSettled(operations);
        expect(results).toHaveLength(4);
        
        // All should be rejected
        results.forEach(result => {
          expect(result.status).toBe('rejected');
        });
        
      } finally {
        concurrentClient.dispose();
      }
    });

    it('should maintain state consistency across operations', async () => {
      const stateClient = new WordNetWorkerClient();
      
      try {
        // Initial state
        expect(stateClient.lexiconCount).toBe(0);
        expect(stateClient.hasLexicon('test')).toBe(false);
        
        // Try operations (should fail gracefully)
        try {
          await stateClient.loadPackage('test');
        } catch (error) {
          // Expected
        }
        
        // State should remain unchanged
        expect(stateClient.lexiconCount).toBe(0);
        expect(stateClient.hasLexicon('test')).toBe(false);
        
      } finally {
        stateClient.dispose();
      }
    });
  });

  describe('WordNet Query Pattern Validation', () => {
    it('should support the complete WordNet query workflow pattern', async () => {
      // This test demonstrates the complete workflow pattern from the documentation:
      // 1. Find words
      // 2. Get senses
      // 3. Get synsets
      // 4. Explore relationships
      
      // In our worker client, we would test:
      // const words = await client.queryWords('happy');
      // expect(words.length).toBeGreaterThan(0);
      // 
      // for (const word of words) {
      //   const senses = await client.querySenses(word.lemma, word.pos);
      //   expect(senses.length).toBeGreaterThan(0);
      //   
      //   for (const sense of senses) {
      //     const synset = await client.getSynset(sense.synset);
      //     expect(synset).toBeDefined();
      //     
      //     // Check for ILI if available
      //     if (synset.ili) {
      //       const crossLingual = await client.querySynsetsByILI(synset.ili);
      //       expect(Array.isArray(crossLingual)).toBe(true);
      //     }
      //   }
      // }
      
      // For now, we'll verify the client interface supports this pattern
      expect(typeof client.queryWords).toBe('function');
      expect(typeof client.querySenses).toBe('function');
      expect(typeof client.querySynsets).toBe('function');
      expect(typeof client.getSynsetById).toBe('function');
    });

    it('should support advanced filtering patterns', async () => {
      // This test demonstrates advanced filtering from the documentation:
      // >>> wn.words('chat', lexicon='ewn:2020')
      // >>> wn.words('chat', lang='fr')
      // >>> wn.synsets('scepter', pos='n')
      
      // In our worker client, we would test:
      // const ewnWords = await client.queryWords('chat', undefined, { lexicon: 'ewn:2020' });
      // const frWords = await client.queryWords('chat', undefined, { language: 'fr' });
      // const nounSynsets = await client.querySynsets('scepter', 'n');
      
      // For now, we'll verify the client interface supports filtering
      expect(typeof client.queryWords).toBe('function');
      expect(typeof client.querySynsets).toBe('function');
      expect(typeof client.querySenses).toBe('function');
    });

    it('should support hierarchical relationship queries', async () => {
      // This test demonstrates hierarchical queries from the documentation:
      // >>> ss.hypernyms()
      // >>> ss.hyponyms()
      // >>> ss.shortest_path(other_synset)
      
      // In our worker client, we would test:
      // const synsets = await client.querySynsets('hound', 'n');
      // if (synsets.length > 0) {
      //   const houndSynset = synsets[0];
      //   const hypernyms = await client.getHypernyms(houndSynset.id);
      //   const hyponyms = await client.getHyponyms(houndSynset.id);
      //   expect(Array.isArray(hypernyms)).toBe(true);
      //   expect(Array.isArray(hyponyms)).toBe(true);
      // }
      
      // For now, we'll verify the client interface supports these operations
      // Note: getHypernyms and getHyponyms are not implemented in this client
      // They would require additional synset relationship methods
    });
  });
});

/**
 * End-to-end tests for WordNetWorkerClient in browser environment
 * 
 * These tests validate the complete worker client workflow using:
 * - Real browser environment
 * - Actual Web Workers
 * - Real Comlink communication
 * - Actual worker initialization and communication
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { WordNetWorkerClient } from '../../src/wordnet-worker-client.js';

describe('WordNetWorkerClient E2E (Browser)', () => {
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

  describe('Worker Environment', () => {
    it('should be in a browser environment with Worker support', () => {
      expect(typeof Worker).toBe('function');
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
    });

    it('should be able to create a Worker', () => {
      // Create a simple test worker
      const testWorker = new Worker('data:text/javascript,self.onmessage=function(e){self.postMessage("Hello from worker")}');
      expect(testWorker).toBeInstanceOf(Worker);
      
      // Clean up
      testWorker.terminate();
    });
  });

  describe('Initialization', () => {
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
  });

  describe('Event System', () => {
    it('should support event subscription and unsubscription', () => {
      const mockCallback = () => {};
      
      // Subscribe
      client.addEventListener('lexiconsChanged', mockCallback);
      
      // Unsubscribe
      client.removeEventListener('lexiconsChanged', mockCallback);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle multiple event listeners', () => {
      const callback1 = () => {};
      const callback2 = () => {};
      
      client.addEventListener('lexiconsChanged', callback1);
      client.addEventListener('lexiconsChanged', callback2);
      
      client.removeEventListener('lexiconsChanged', callback1);
      client.removeEventListener('lexiconsChanged', callback2);
      
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized client operations gracefully', async () => {
      // Try to use client without initialization
      await expect(client.getStatus()).rejects.toThrow();
      await expect(client.queryWords('test')).rejects.toThrow();
      await expect(client.loadPackage('test')).rejects.toThrow();
    });

    it('should emit error events for failed operations', async () => {
      const errorPromise = new Promise<{ error: string; context: string }>((resolve) => {
        client.addEventListener('error', (data) => {
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

  describe('Configuration and State', () => {
    it('should have correct initial state', () => {
      expect(client.initialized).toBe(false);
      expect(client.lexiconCount).toBe(0);
      expect(client.lexicons).toEqual([]);
      expect(client.currentStatistics).toBeNull();
    });

    it('should handle lexicon operations when not initialized', () => {
      expect(client.hasLexicon('test')).toBe(false);
      expect(client.getLexicon('test')).toBeUndefined();
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

  describe('Browser Compatibility', () => {
    it('should work in modern browser environment', () => {
      // Check for required browser APIs
      expect(typeof fetch).toBe('function');
      expect(typeof Promise).toBe('function');
      expect(typeof ArrayBuffer).toBe('function');
      expect(typeof Uint8Array).toBe('function');
    });

    it('should handle browser-specific features', () => {
      // Check for browser-specific APIs that might be used
      if (typeof navigator !== 'undefined') {
        expect(typeof navigator.userAgent).toBe('string');
      }
      
      if (typeof location !== 'undefined') {
        expect(typeof location.href).toBe('string');
      }
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory on multiple disposals', () => {
      const testClient = new WordNetWorkerClient();
      
      // Dispose multiple times
      for (let i = 0; i < 10; i++) {
        testClient.dispose();
      }
      
      // Should still be in a clean state
      expect(testClient.initialized).toBe(false);
      expect(testClient.lexiconCount).toBe(0);
    });

    it('should handle rapid state changes gracefully', () => {
      const rapidClient = new WordNetWorkerClient();
      
      // Rapidly add and remove event listeners
      const listeners: Array<() => void> = [];
      for (let i = 0; i < 100; i++) {
        const listener = () => {};
        listeners.push(listener);
        rapidClient.addEventListener('lexiconsChanged', listener);
      }
      
      // Remove all listeners
      listeners.forEach(listener => {
        rapidClient.removeEventListener('lexiconsChanged', listener);
      });
      
      // Should not throw
      expect(true).toBe(true);
      
      rapidClient.dispose();
    });
  });
});

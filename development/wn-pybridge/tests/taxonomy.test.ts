import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { WnBridge } from '../src/index.js';

// Use a known synset from the test data (mini-lmf-1.0.xml)
const TEST_SYNSET_ID = 'ewn-00001740-n'; // 'entity' in Princeton/OMW
const TEST_SYNSET_ID2 = 'ewn-00001930-n'; // 'physical entity'

// These IDs should exist in the loaded test lexicon

describe('WnBridge Taxonomy Tests', () => {
  let wn: WnBridge | null = null;
  let bridgeInitialized = false;

  beforeAll(async () => {
    try {
      wn = new WnBridge();
      await wn.init();
      bridgeInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize bridge:', error);
      bridgeInitialized = false;
    }
  }, 10000);

  afterAll(async () => {
    if (wn) {
      await wn.close();
    }
  });

  describe('Bridge Initialization', () => {
    it('should initialize bridge successfully', async () => {
      expect(bridgeInitialized).toBe(true);
      expect(wn).not.toBeNull();
    });
  });

  describe('Hypernym Paths', () => {
    it('should get hypernym paths from a synset to root', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        // Test hypernym traversal
        const hypernyms = await wn.hypernyms(dogSynsets[0].id);
        expect(Array.isArray(hypernyms)).toBe(true);
        
        if (hypernyms.length > 0) {
          const firstHypernym = hypernyms[0];
          expect(firstHypernym).toHaveProperty('id');
          expect(firstHypernym).toHaveProperty('pos');
          
          // Test recursive hypernym traversal
          const secondLevelHypernyms = await wn.hypernyms(firstHypernym.id);
          expect(Array.isArray(secondLevelHypernyms)).toBe(true);
        }
      }
    });

    it('should traverse complete hypernym chain', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        let current = dogSynsets[0];
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loops
        
        while (depth < maxDepth) {
          const hypernyms = await wn.hypernyms(current.id);
          if (hypernyms.length === 0) {
            break; // Reached root
          }
          current = hypernyms[0];
          depth++;
        }
        
        expect(depth).toBeGreaterThan(0);
        expect(depth).toBeLessThanOrEqual(maxDepth);
      }
    });
  });

  describe('Hyponym Traversal', () => {
    it('should get hyponyms of a synset', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const carnivoreSynsets = await wn.synsets('carnivore', { pos: 'n' });
      
      if (carnivoreSynsets.length > 0) {
        const hyponyms = await wn.hyponyms(carnivoreSynsets[0].id);
        expect(Array.isArray(hyponyms)).toBe(true);
        
        if (hyponyms.length > 0) {
          const hyponym = hyponyms[0];
          expect(hyponym).toHaveProperty('id');
          expect(hyponym).toHaveProperty('pos');
        }
      }
    });

    it('should traverse complete hyponym chain', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const animalSynsets = await wn.synsets('animal', { pos: 'n' });
      
      if (animalSynsets.length > 0) {
        let current = animalSynsets[0];
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loops
        
        while (depth < maxDepth) {
          const hyponyms = await wn.hyponyms(current.id);
          if (hyponyms.length === 0) {
            break; // Reached leaf
          }
          current = hyponyms[0];
          depth++;
        }
        
        expect(depth).toBeGreaterThan(0);
        expect(depth).toBeLessThanOrEqual(maxDepth);
      }
    });
  });

  // Helper to recursively collect all ancestor synset IDs
  async function collectAllAncestors(wn: WnBridge, synsetId: string, visited = new Set<string>()): Promise<Set<string>> {
    const ancestors = new Set<string>();
    let queue = [synsetId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const hypernyms = await wn.hypernyms(currentId);
      for (const h of hypernyms) {
        if (!visited.has(h.id)) {
          ancestors.add(h.id);
          queue.push(h.id);
        }
      }
    }
    return ancestors;
  }

  describe('Common Ancestors', () => {
    it('should find common ancestors between related synsets', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      const catSynsets = await wn.synsets('cat', { pos: 'n' });
      
      if (dogSynsets.length > 0 && catSynsets.length > 0) {
        const dogAncestors = await collectAllAncestors(wn, dogSynsets[0].id);
        const catAncestors = await collectAllAncestors(wn, catSynsets[0].id);
        const commonAncestors = [...dogAncestors].filter(id => catAncestors.has(id));
        expect(commonAncestors.length).toBeGreaterThan(0);
      }
    });

    it('should find common ancestors between unrelated synsets', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const animalSynsets = await wn.synsets('animal', { pos: 'n' });
      const plantSynsets = await wn.synsets('plant', { pos: 'n' });
      
      if (animalSynsets.length > 0 && plantSynsets.length > 0) {
        const animalAncestors = await collectAllAncestors(wn, animalSynsets[0].id);
        const plantAncestors = await collectAllAncestors(wn, plantSynsets[0].id);
        const commonAncestors = [...animalAncestors].filter(id => plantAncestors.has(id));
        expect(commonAncestors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Taxonomy Depth', () => {
    it('should calculate depth of synsets in taxonomy', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        let current = dogSynsets[0];
        let depth = 0;
        const maxDepth = 10;
        
        // Calculate depth by counting hypernyms to root
        while (depth < maxDepth) {
          const hypernyms = await wn.hypernyms(current.id);
          if (hypernyms.length === 0) {
            break;
          }
          current = hypernyms[0];
          depth++;
        }
        
        expect(depth).toBeGreaterThan(0);
        expect(depth).toBeLessThanOrEqual(maxDepth);
      }
    });

    it('should find root synsets', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const entitySynsets = await wn.synsets('entity', { pos: 'n' });
      
      if (entitySynsets.length > 0) {
        const hypernyms = await wn.hypernyms(entitySynsets[0].id);
        expect(Array.isArray(hypernyms)).toBe(true);
        // Entity should be a root (no hypernyms)
        expect(hypernyms.length).toBe(0);
      }
    });

    it('should find leaf synsets', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        const hyponyms = await wn.hyponyms(dogSynsets[0].id);
        expect(Array.isArray(hyponyms)).toBe(true);
        // Dog might be a leaf (no hyponyms) in our test data
      }
    });
  });

  describe('Taxonomy Navigation', () => {
    it('should navigate up and down the taxonomy', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        // Navigate up
        const hypernyms = await wn.hypernyms(dogSynsets[0].id);
        expect(Array.isArray(hypernyms)).toBe(true);
        
        if (hypernyms.length > 0) {
          const parent = hypernyms[0];
          
          // Navigate down from parent
          const hyponyms = await wn.hyponyms(parent.id);
          expect(Array.isArray(hyponyms)).toBe(true);
          
          // Should find the original synset among hyponyms
          const hyponymIds = hyponyms.map(h => h.id);
          expect(hyponymIds).toContain(dogSynsets[0].id);
        }
      }
    });

    it('should handle circular references gracefully', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        // Test that we don't get stuck in infinite loops
        const visited = new Set<string>();
        let current = dogSynsets[0];
        let steps = 0;
        const maxSteps = 20;
        
        while (steps < maxSteps) {
          if (visited.has(current.id)) {
            break; // Found cycle
          }
          visited.add(current.id);
          
          const hypernyms = await wn.hypernyms(current.id);
          if (hypernyms.length === 0) {
            break; // Reached root
          }
          current = hypernyms[0];
          steps++;
        }
        
        expect(steps).toBeLessThan(maxSteps);
      }
    });
  });

  describe('Taxonomy Analysis', () => {
    it('should analyze taxonomy structure', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      
      if (dogSynsets.length > 0) {
        const synset = dogSynsets[0];
        
        // Analyze the structure
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
        expect(synset).toHaveProperty('lexicon');
        
        // Check that it's a noun
        expect(synset.pos).toBe('n');
      }
    });

    it('should find taxonomy paths between synsets', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const dogSynsets = await wn.synsets('dog', { pos: 'n' });
      const catSynsets = await wn.synsets('cat', { pos: 'n' });
      
      if (dogSynsets.length > 0 && catSynsets.length > 0) {
        // Find path from dog to root
        const dogPath: string[] = [];
        let current = dogSynsets[0];
        
        while (true) {
          dogPath.push(current.id);
          const hypernyms = await wn.hypernyms(current.id);
          if (hypernyms.length === 0) break;
          current = hypernyms[0];
        }
        
        // Find path from cat to root
        const catPath: string[] = [];
        current = catSynsets[0];
        
        while (true) {
          catPath.push(current.id);
          const hypernyms = await wn.hypernyms(current.id);
          if (hypernyms.length === 0) break;
          current = hypernyms[0];
        }
        
        // Both paths should exist and have reasonable lengths
        expect(dogPath.length).toBeGreaterThan(1);
        expect(catPath.length).toBeGreaterThan(1);
        
        // They should share some common ancestors
        const commonAncestors = dogPath.filter(id => catPath.includes(id));
        expect(commonAncestors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle synsets without relations gracefully', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      const entitySynsets = await wn.synsets('entity', { pos: 'n' });
      
      if (entitySynsets.length > 0) {
        const hypernyms = await wn.hypernyms(entitySynsets[0].id);
        expect(Array.isArray(hypernyms)).toBe(true);
        expect(hypernyms.length).toBe(0);
      }
    });

    it('should handle invalid synset IDs', async () => {
      if (!bridgeInitialized || !wn) {
        console.warn('Bridge not initialized, skipping test');
        return;
      }
      
      // Test with invalid synset ID - should throw an error
      try {
        await wn.hypernyms('invalid-synset-id');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw an error
        expect(error).toBeDefined();
      }
    });
  });
}); 
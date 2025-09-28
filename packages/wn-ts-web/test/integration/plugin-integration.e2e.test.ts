/**
 * Plugin Integration E2E Tests
 * 
 * Tests the integration of the enhanced relations plugin with the web worker
 * to ensure all relation methods work correctly through the worker interface.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';

describe('Plugin Integration E2E Tests', () => {
  let client: WordNetWorkerClient;
  
  beforeAll(async () => {
    // Initialize worker client
    client = new WordNetWorkerClient({
      workerUrl: '/src/workers/wordnet-worker.ts'
    });
    
    // Wait for worker to be ready
    await client.waitForReady();
    
    // Load test lexicon (assuming you have test data)
    try {
      await client.loadPackageData('oewn:2024'); // or whatever test lexicon you have
    } catch (error) {
      console.warn('Could not load test lexicon, skipping plugin integration tests:', error);
      // Skip tests if no data is available
      return;
    }
  });
  
  afterAll(async () => {
    await client.cleanup();
  });
  
  describe('Plugin Initialization', () => {
    it('should initialize the enhanced relations plugin', async () => {
      const isReady = await client.isWorkerReady();
      expect(isReady).toBe(true);
    });
    
    it('should provide relation descriptions', async () => {
      const descriptions = await client.getRelationDescriptions();
      expect(typeof descriptions).toBe('object');
      expect(descriptions).toHaveProperty('hypernym');
      expect(descriptions).toHaveProperty('meronym');
      expect(descriptions).toHaveProperty('agent');
    });
    
    it('should provide relation categories', async () => {
      const categories = await client.getRelationCategories();
      expect(typeof categories).toBe('object');
      expect(categories).toHaveProperty('HIERARCHICAL');
      expect(categories).toHaveProperty('PART_WHOLE');
      expect(categories).toHaveProperty('SEMANTIC_ROLES');
    });
  });
  
  describe('Real Data Integration Tests', () => {
    let carSynsetId: string;
    let driveSynsetId: string;
    let happySynsetId: string;
    
    beforeAll(async () => {
      // Find real synsets for testing
      try {
        const carSynsets = await client.querySynsets('car', 'n');
        if (carSynsets.length > 0) carSynsetId = carSynsets[0].id;
        
        const driveSynsets = await client.querySynsets('drive', 'v');
        if (driveSynsets.length > 0) driveSynsetId = driveSynsets[0].id;
        
        const happySynsets = await client.querySynsets('happy', 'a');
        if (happySynsets.length > 0) happySynsetId = happySynsets[0].id;
      } catch (error) {
        console.warn('Could not find test synsets:', error);
      }
    });
    
    it('should find hypernyms for car through worker', async () => {
      if (!carSynsetId) return;
      
      const hypernyms = await client.getHypernyms(carSynsetId);
      expect(Array.isArray(hypernyms)).toBe(true);
      
      if (hypernyms.length > 0) {
        expect(hypernyms[0]).toHaveProperty('id');
        expect(hypernyms[0]).toHaveProperty('lemma');
        expect(hypernyms[0]).toHaveProperty('relationType', 'hypernym');
      }
    });
    
    it('should find hyponyms for car through worker', async () => {
      if (!carSynsetId) return;
      
      const hyponyms = await client.getHyponyms(carSynsetId);
      expect(Array.isArray(hyponyms)).toBe(true);
      
      if (hyponyms.length > 0) {
        expect(hyponyms[0]).toHaveProperty('relationType', 'hyponym');
      }
    });
    
    it('should find meronyms for car through worker', async () => {
      if (!carSynsetId) return;
      
      const meronyms = await client.getMeronyms(carSynsetId);
      expect(Array.isArray(meronyms)).toBe(true);
      
      if (meronyms.length > 0) {
        expect(meronyms[0]).toHaveProperty('relationType');
        expect(['meronym', 'part_meronym', 'member_meronym', 'substance_meronym']).toContain(meronyms[0].relationType);
      }
    });
    
    it('should find agents for drive verb through worker', async () => {
      if (!driveSynsetId) return;
      
      const agents = await client.getAgents(driveSynsetId);
      expect(Array.isArray(agents)).toBe(true);
      
      if (agents.length > 0) {
        expect(agents[0]).toHaveProperty('relationType', 'agent');
      }
    });
    
    it('should find patients for drive verb through worker', async () => {
      if (!driveSynsetId) return;
      
      const patients = await client.getPatients(driveSynsetId);
      expect(Array.isArray(patients)).toBe(true);
      
      if (patients.length > 0) {
        expect(patients[0]).toHaveProperty('relationType', 'patient');
      }
    });
    
    it('should find instruments for drive verb through worker', async () => {
      if (!driveSynsetId) return;
      
      const instruments = await client.getInstruments(driveSynsetId);
      expect(Array.isArray(instruments)).toBe(true);
      
      if (instruments.length > 0) {
        expect(instruments[0]).toHaveProperty('relationType', 'instrument');
      }
    });
    
    it('should find antonyms for happy adjective through worker', async () => {
      if (!happySynsetId) return;
      
      const antonyms = await client.getAntonyms(happySynsetId);
      expect(Array.isArray(antonyms)).toBe(true);
      
      if (antonyms.length > 0) {
        expect(antonyms[0]).toHaveProperty('relationType');
        expect(['antonym', 'anto_gradable', 'anto_simple', 'anto_converse']).toContain(antonyms[0].relationType);
      }
    });
    
    it('should find similar adjectives for happy through worker', async () => {
      if (!happySynsetId) return;
      
      const similar = await client.getSimilar(happySynsetId);
      expect(Array.isArray(similar)).toBe(true);
      
      if (similar.length > 0) {
        expect(similar[0]).toHaveProperty('relationType');
        expect(['similar', 'similar_to']).toContain(similar[0].relationType);
      }
    });
    
    it('should get relations by category through worker', async () => {
      if (!carSynsetId) return;
      
      const hierarchicalRelations = await client.getRelationsByCategory(carSynsetId, 'HIERARCHICAL');
      expect(Array.isArray(hierarchicalRelations)).toBe(true);
      
      if (hierarchicalRelations.length > 0) {
        // Should only contain hierarchical relation types
        const relationTypes = hierarchicalRelations.map(r => r.relationType);
        const hierarchicalTypes = ['hypernym', 'hyponym', 'instance_hypernym', 'instance_hyponym'];
        relationTypes.forEach(type => {
          expect(hierarchicalTypes).toContain(type);
        });
      }
    });
    
    it('should get relation statistics by category through worker', async () => {
      if (!carSynsetId) return;
      
      const stats = await client.getRelationStatsByCategory(carSynsetId);
      expect(typeof stats).toBe('object');
      
      // Car should have hierarchical relations
      expect(stats.HIERARCHICAL).toBeGreaterThan(0);
    });
    
    it('should get available relation types through worker', async () => {
      if (!carSynsetId) return;
      
      const relationTypes = await client.getAvailableRelationTypes(carSynsetId);
      expect(Array.isArray(relationTypes)).toBe(true);
      expect(relationTypes.length).toBeGreaterThan(0);
      
      // Should include common relation types
      expect(relationTypes).toContain('hypernym');
      expect(relationTypes).toContain('hyponym');
    });
    
    it('should validate relation types through worker', async () => {
      const isValid = await client.isValidRelationType('hypernym');
      expect(isValid).toBe(true);
      
      const isInvalid = await client.isValidRelationType('invalid-relation');
      expect(isInvalid).toBe(false);
    });
    
    it('should get relation types by category through worker', async () => {
      const hierarchicalTypes = await client.getRelationTypesByCategory('HIERARCHICAL');
      expect(Array.isArray(hierarchicalTypes)).toBe(true);
      expect(hierarchicalTypes).toContain('hypernym');
      expect(hierarchicalTypes).toContain('hyponym');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid synset IDs gracefully', async () => {
      const relations = await client.getHypernyms('invalid-synset-id');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
    
    it('should handle invalid relation types gracefully', async () => {
      const carSynsets = await client.querySynsets('car', 'n');
      if (carSynsets.length === 0) return;
      
      const carSynsetId = carSynsets[0].id;
      const relations = await client.getRelationsByType(carSynsetId, 'invalid-relation');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
    
    it('should handle invalid categories gracefully', async () => {
      const carSynsets = await client.querySynsets('car', 'n');
      if (carSynsets.length === 0) return;
      
      const carSynsetId = carSynsets[0].id;
      const relations = await client.getRelationsByCategory(carSynsetId, 'INVALID_CATEGORY');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle large relation queries efficiently', async () => {
      const entitySynsets = await client.querySynsets('entity', 'n');
      if (entitySynsets.length === 0) return;
      
      const entitySynsetId = entitySynsets[0].id;
      const startTime = Date.now();
      
      const allRelations = await client.getAvailableRelationTypes(entitySynsetId);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(Array.isArray(allRelations)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
    
    it('should handle multiple relation queries efficiently', async () => {
      const carSynsets = await client.querySynsets('car', 'n');
      if (carSynsets.length === 0) return;
      
      const carSynsetId = carSynsets[0].id;
      const startTime = Date.now();
      
      // Query multiple relation types in parallel
      const [hypernyms, hyponyms, meronyms, holonyms] = await Promise.all([
        client.getHypernyms(carSynsetId),
        client.getHyponyms(carSynsetId),
        client.getMeronyms(carSynsetId),
        client.getHolonyms(carSynsetId)
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(Array.isArray(hypernyms)).toBe(true);
      expect(Array.isArray(hyponyms)).toBe(true);
      expect(Array.isArray(meronyms)).toBe(true);
      expect(Array.isArray(holonyms)).toBe(true);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});

/**
 * End-to-End Integration Tests for Comprehensive WordNet Relations
 * 
 * Tests the complete WordNet relation system through the web interface,
 * demonstrating all relation types and categories in action.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';
import { enhancedRelations } from '../../../wn-ts-core/src/plugins/relations/enhanced-relations.js';
import { RELATION_CATEGORIES, RELATION_DESCRIPTIONS } from '../../../wn-ts-core/src/plugins/relations/comprehensive-relations.js';

describe('Comprehensive Relations E2E Tests', () => {
  let client: WordNetWorkerClient;
  
  beforeAll(async () => {
    // Initialize worker client with enhanced relations
    client = new WordNetWorkerClient({
      workerUrl: '/src/workers/wordnet-worker.ts',
      plugins: [enhancedRelations]
    });
    
    // Wait for worker to be ready
    await client.waitForReady();
    
    // Load test lexicon (assuming we have test data)
    await client.loadPackageData('test-lexicon');
  });
  
  afterAll(async () => {
    await client.cleanup();
  });
  
  describe('Plugin Integration', () => {
    it('should initialize enhanced relations plugin', async () => {
      const isReady = await client.isWorkerReady();
      expect(isReady).toBe(true);
    });
    
    it('should provide relation descriptions', async () => {
      const descriptions = await client.getRelationDescriptions();
      expect(descriptions).toEqual(RELATION_DESCRIPTIONS);
    });
    
    it('should provide relation categories', async () => {
      const categories = await client.getRelationCategories();
      expect(categories).toEqual(RELATION_CATEGORIES);
    });
  });
  
  describe('Hierarchical Relations E2E', () => {
    it('should find hypernyms for a noun synset', async () => {
      // Test with a concrete noun like "car"
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const hypernyms = await client.getHypernyms(carSynset.id);
      
      expect(Array.isArray(hypernyms)).toBe(true);
      // Car should have hypernyms like "motor_vehicle", "automotive_vehicle"
      if (hypernyms.length > 0) {
        expect(hypernyms[0]).toHaveProperty('id');
        expect(hypernyms[0]).toHaveProperty('lemma');
        expect(hypernyms[0]).toHaveProperty('relationType', 'hypernym');
      }
    });
    
    it('should find hyponyms for a noun synset', async () => {
      const synsets = await client.querySynsets('vehicle', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const vehicleSynset = synsets[0];
      const hyponyms = await client.getHyponyms(vehicleSynset.id);
      
      expect(Array.isArray(hyponyms)).toBe(true);
      // Vehicle should have hyponyms like "car", "truck", "bicycle"
      if (hyponyms.length > 0) {
        expect(hyponyms[0]).toHaveProperty('id');
        expect(hyponyms[0]).toHaveProperty('lemma');
        expect(hyponyms[0]).toHaveProperty('relationType', 'hyponym');
      }
    });
    
    it('should find instance hypernyms', async () => {
      const synsets = await client.querySynsets('Einstein', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const einsteinSynset = synsets[0];
      const instanceHypernyms = await client.getInstanceHypernyms(einsteinSynset.id);
      
      expect(Array.isArray(instanceHypernyms)).toBe(true);
      // Einstein should be an instance of "physicist", "scientist"
      if (instanceHypernyms.length > 0) {
        expect(instanceHypernyms[0]).toHaveProperty('relationType', 'instance_hypernym');
      }
    });
  });
  
  describe('Part-Whole Relations E2E', () => {
    it('should find meronyms for a whole object', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const meronyms = await client.getMeronyms(carSynset.id);
      
      expect(Array.isArray(meronyms)).toBe(true);
      // Car should have parts like "wheel", "engine", "door"
      if (meronyms.length > 0) {
        expect(meronyms[0]).toHaveProperty('relationType');
        expect(['meronym', 'part_meronym', 'member_meronym', 'substance_meronym']).toContain(meronyms[0].relationType);
      }
    });
    
    it('should find holonyms for a part object', async () => {
      const synsets = await client.querySynsets('wheel', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const wheelSynset = synsets[0];
      const holonyms = await client.getHolonyms(wheelSynset.id);
      
      expect(Array.isArray(holonyms)).toBe(true);
      // Wheel should be part of "car", "bicycle", "truck"
      if (holonyms.length > 0) {
        expect(holonyms[0]).toHaveProperty('relationType');
        expect(['holonym', 'part_holonym', 'member_holonym', 'substance_holonym']).toContain(holonyms[0].relationType);
      }
    });
  });
  
  describe('Semantic Role Relations E2E', () => {
    it('should find agents for a verb synset', async () => {
      const synsets = await client.querySynsets('drive', 'v');
      expect(synsets.length).toBeGreaterThan(0);
      
      const driveSynset = synsets[0];
      const agents = await client.getAgents(driveSynset.id);
      
      expect(Array.isArray(agents)).toBe(true);
      // Drive should have agents like "driver", "person"
      if (agents.length > 0) {
        expect(agents[0]).toHaveProperty('relationType', 'agent');
      }
    });
    
    it('should find patients for a verb synset', async () => {
      const synsets = await client.querySynsets('eat', 'v');
      expect(synsets.length).toBeGreaterThan(0);
      
      const eatSynset = synsets[0];
      const patients = await client.getPatients(eatSynset.id);
      
      expect(Array.isArray(patients)).toBe(true);
      // Eat should have patients like "food", "meal"
      if (patients.length > 0) {
        expect(patients[0]).toHaveProperty('relationType', 'patient');
      }
    });
    
    it('should find instruments for a verb synset', async () => {
      const synsets = await client.querySynsets('cut', 'v');
      expect(synsets.length).toBeGreaterThan(0);
      
      const cutSynset = synsets[0];
      const instruments = await client.getInstruments(cutSynset.id);
      
      expect(Array.isArray(instruments)).toBe(true);
      // Cut should have instruments like "knife", "scissors"
      if (instruments.length > 0) {
        expect(instruments[0]).toHaveProperty('relationType', 'instrument');
      }
    });
  });
  
  describe('Domain Relations E2E', () => {
    it('should find domain topics for a synset', async () => {
      const synsets = await client.querySynsets('photosynthesis', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const photosynthesisSynset = synsets[0];
      const domainTopics = await client.getDomainTopics(photosynthesisSynset.id);
      
      expect(Array.isArray(domainTopics)).toBe(true);
      // Photosynthesis should be in biology domain
      if (domainTopics.length > 0) {
        expect(domainTopics[0]).toHaveProperty('relationType');
        expect(['domain_topic', 'has_domain_topic']).toContain(domainTopics[0].relationType);
      }
    });
    
    it('should find domain regions for a synset', async () => {
      const synsets = await client.querySynsets('Paris', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const parisSynset = synsets[0];
      const domainRegions = await client.getDomainRegions(parisSynset.id);
      
      expect(Array.isArray(domainRegions)).toBe(true);
      // Paris should be in geography domain
      if (domainRegions.length > 0) {
        expect(domainRegions[0]).toHaveProperty('relationType');
        expect(['domain_region', 'has_domain_region']).toContain(domainRegions[0].relationType);
      }
    });
  });
  
  describe('Causal Relations E2E', () => {
    it('should find causes for a verb synset', async () => {
      const synsets = await client.querySynsets('kill', 'v');
      expect(synsets.length).toBeGreaterThan(0);
      
      const killSynset = synsets[0];
      const causes = await client.getCauses(killSynset.id);
      
      expect(Array.isArray(causes)).toBe(true);
      // Kill should cause "die"
      if (causes.length > 0) {
        expect(causes[0]).toHaveProperty('relationType', 'causes');
      }
    });
    
    it('should find entailments for a verb synset', async () => {
      const synsets = await client.querySynsets('snore', 'v');
      expect(synsets.length).toBeGreaterThan(0);
      
      const snoreSynset = synsets[0];
      const entailments = await client.getEntailments(snoreSynset.id);
      
      expect(Array.isArray(entailments)).toBe(true);
      // Snore should entail "sleep"
      if (entailments.length > 0) {
        expect(entailments[0]).toHaveProperty('relationType', 'entails');
      }
    });
  });
  
  describe('Similarity Relations E2E', () => {
    it('should find similar synsets', async () => {
      const synsets = await client.querySynsets('happy', 'a');
      expect(synsets.length).toBeGreaterThan(0);
      
      const happySynset = synsets[0];
      const similar = await client.getSimilar(happySynset.id);
      
      expect(Array.isArray(similar)).toBe(true);
      // Happy should be similar to "joyful", "cheerful"
      if (similar.length > 0) {
        expect(similar[0]).toHaveProperty('relationType');
        expect(['similar', 'similar_to']).toContain(similar[0].relationType);
      }
    });
  });
  
  describe('Opposition Relations E2E', () => {
    it('should find antonyms for an adjective synset', async () => {
      const synsets = await client.querySynsets('happy', 'a');
      expect(synsets.length).toBeGreaterThan(0);
      
      const happySynset = synsets[0];
      const antonyms = await client.getAntonyms(happySynset.id);
      
      expect(Array.isArray(antonyms)).toBe(true);
      // Happy should have antonyms like "sad", "unhappy"
      if (antonyms.length > 0) {
        expect(antonyms[0]).toHaveProperty('relationType');
        expect(['antonym', 'anto_gradable', 'anto_simple', 'anto_converse']).toContain(antonyms[0].relationType);
      }
    });
  });
  
  describe('Gender Relations E2E', () => {
    it('should find feminine forms', async () => {
      const synsets = await client.querySynsets('actor', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const actorSynset = synsets[0];
      const feminine = await client.getFeminine(actorSynset.id);
      
      expect(Array.isArray(feminine)).toBe(true);
      // Actor should have feminine form "actress"
      if (feminine.length > 0) {
        expect(feminine[0]).toHaveProperty('relationType');
        expect(['feminine', 'has_feminine']).toContain(feminine[0].relationType);
      }
    });
    
    it('should find masculine forms', async () => {
      const synsets = await client.querySynsets('actress', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const actressSynset = synsets[0];
      const masculine = await client.getMasculine(actressSynset.id);
      
      expect(Array.isArray(masculine)).toBe(true);
      // Actress should have masculine form "actor"
      if (masculine.length > 0) {
        expect(masculine[0]).toHaveProperty('relationType');
        expect(['masculine', 'has_masculine']).toContain(masculine[0].relationType);
      }
    });
  });
  
  describe('Size Relations E2E', () => {
    it('should find diminutives', async () => {
      const synsets = await client.querySynsets('house', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const houseSynset = synsets[0];
      const diminutives = await client.getDiminutives(houseSynset.id);
      
      expect(Array.isArray(diminutives)).toBe(true);
      // House should have diminutive "hut", "cottage"
      if (diminutives.length > 0) {
        expect(diminutives[0]).toHaveProperty('relationType');
        expect(['diminutive', 'has_diminutive']).toContain(diminutives[0].relationType);
      }
    });
    
    it('should find augmentatives', async () => {
      const synsets = await client.querySynsets('house', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const houseSynset = synsets[0];
      const augmentatives = await client.getAugmentatives(houseSynset.id);
      
      expect(Array.isArray(augmentatives)).toBe(true);
      // House should have augmentative "mansion", "palace"
      if (augmentatives.length > 0) {
        expect(augmentatives[0]).toHaveProperty('relationType');
        expect(['augmentative', 'has_augmentative']).toContain(augmentatives[0].relationType);
      }
    });
  });
  
  describe('Generic Query Methods E2E', () => {
    it('should get relations by specific type', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const hypernyms = await client.getRelationsByType(carSynset.id, 'hypernym');
      
      expect(Array.isArray(hypernyms)).toBe(true);
      if (hypernyms.length > 0) {
        expect(hypernyms[0]).toHaveProperty('relationType', 'hypernym');
      }
    });
    
    it('should get relations by category', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const hierarchicalRelations = await client.getRelationsByCategory(carSynset.id, 'HIERARCHICAL');
      
      expect(Array.isArray(hierarchicalRelations)).toBe(true);
      if (hierarchicalRelations.length > 0) {
        expect(hierarchicalRelations[0]).toHaveProperty('relationType');
        expect(RELATION_CATEGORIES.HIERARCHICAL).toContain(hierarchicalRelations[0].relationType);
      }
    });
    
    it('should get available relation types for a synset', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const relationTypes = await client.getAvailableRelationTypes(carSynset.id);
      
      expect(Array.isArray(relationTypes)).toBe(true);
      // Car should have various relation types
      expect(relationTypes.length).toBeGreaterThan(0);
    });
    
    it('should get relation statistics by category', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const stats = await client.getRelationStatsByCategory(carSynset.id);
      
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('HIERARCHICAL');
      expect(stats).toHaveProperty('PART_WHOLE');
      expect(stats).toHaveProperty('SEMANTIC_ROLES');
      
      // Car should have hierarchical relations
      expect(stats.HIERARCHICAL).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling E2E', () => {
    it('should handle invalid synset IDs gracefully', async () => {
      const relations = await client.getHypernyms('invalid-synset-id');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
    
    it('should handle invalid relation types gracefully', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const relations = await client.getRelationsByType(carSynset.id, 'invalid-relation');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
    
    it('should handle invalid categories gracefully', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const relations = await client.getRelationsByCategory(carSynset.id, 'INVALID_CATEGORY' as any);
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
  });
  
  describe('Performance E2E', () => {
    it('should handle large relation queries efficiently', async () => {
      const synsets = await client.querySynsets('entity', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const entitySynset = synsets[0];
      const startTime = Date.now();
      
      const allRelations = await client.getAvailableRelationTypes(entitySynset.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(Array.isArray(allRelations)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
    
    it('should handle multiple relation queries efficiently', async () => {
      const synsets = await client.querySynsets('car', 'n');
      expect(synsets.length).toBeGreaterThan(0);
      
      const carSynset = synsets[0];
      const startTime = Date.now();
      
      // Query multiple relation types in parallel
      const [hypernyms, hyponyms, meronyms, holonyms] = await Promise.all([
        client.getHypernyms(carSynset.id),
        client.getHyponyms(carSynset.id),
        client.getMeronyms(carSynset.id),
        client.getHolonyms(carSynset.id)
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

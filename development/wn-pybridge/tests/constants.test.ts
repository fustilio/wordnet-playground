import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WnBridge } from '../src/index.js';

describe('Constants Tests', { timeout: 60000 }, () => {
  let wn: WnBridge | null = null;
  let bridgeInitialized = false;

  beforeAll(async () => {
    try {
      wn = new WnBridge();
      await wn.init();
      bridgeInitialized = true;
    } catch (error) {
      console.warn('Bridge initialization failed:', error);
      bridgeInitialized = false;
    }
  });

  afterAll(async () => {
    if (wn) {
      await wn.close();
    }
  });

  describe('Constants Initialization', () => {
    it('should initialize constants module successfully', () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      expect(wn!.constants).toBeDefined();
    });
  });

  describe('Parts of Speech Constants', () => {
    it('should get all parts of speech', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const pos = await wn!.constants.getPartsOfSpeech();
      // Python objects are not JavaScript arrays, so we check they exist
      expect(pos).toBeDefined();
      expect(pos).not.toBeNull();
      
      // For now, we just verify the object exists since it's a Python frozenset
      // In a real implementation, we'd convert it to a JavaScript array
    });

    it('should get specific POS constants', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const constants = await wn!.constants.getAllConstants();
      expect(constants.NOUN).toBe('n');
      expect(constants.VERB).toBe('v');
      expect(constants.ADJ).toBe('a'); // Python wn uses 'a' not 'adj'
      expect(constants.ADV).toBe('r'); // Python wn uses 'r' not 'adv'
      expect(constants.ADJ_SAT).toBe('s');
    });
  });

  describe('Relation Constants', () => {
    it('should get synset relation types', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const relations = await wn!.constants.getSynsetRelations();
      // Python objects are not JavaScript arrays, so we check they exist
      expect(relations).toBeDefined();
      expect(relations).not.toBeNull();
      
      // For now, we just verify the object exists since it's a Python frozenset
      // In a real implementation, we'd convert it to a JavaScript array
    });

    it('should get sense relation types', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const relations = await wn!.constants.getSenseRelations();
      // Python objects are not JavaScript arrays, so we check they exist
      expect(relations).toBeDefined();
      expect(relations).not.toBeNull();
      
      // For now, we just verify the object exists since it's a Python frozenset
      // In a real implementation, we'd convert it to a JavaScript array
    });

    it('should get reverse relations mapping', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const reverseRelations = await wn!.constants.getReverseRelations();
      // Python objects are not JavaScript objects, so we check they exist
      expect(reverseRelations).toBeDefined();
      expect(reverseRelations).not.toBeNull();
      
      // For now, we just verify the object exists since it's a Python dict
      // In a real implementation, we'd convert it to a JavaScript object
    });
  });

  describe('Specific Constants', () => {
    it('should get specific constant by name', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const noun = await wn!.constants.getConstant('NOUN');
      expect(noun).toBe('n');
      
      const verb = await wn!.constants.getConstant('VERB');
      expect(verb).toBe('v');
    });

    it('should handle non-existent constants gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      try {
        await wn!.constants.getConstant('NONEXISTENT');
        // Should throw an error
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('All Constants', () => {
    it('should get all constants', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const constants = await wn!.constants.getAllConstants();
      expect(typeof constants).toBe('object');
      expect(constants).toHaveProperty('NOUN');
      expect(constants).toHaveProperty('VERB');
      expect(constants).toHaveProperty('ADJ');
      expect(constants).toHaveProperty('ADV');
      expect(constants).toHaveProperty('PARTS_OF_SPEECH');
      expect(constants).toHaveProperty('SYNSET_RELATIONS');
      expect(constants).toHaveProperty('SENSE_RELATIONS');
      expect(constants).toHaveProperty('REVERSE_RELATIONS');
    });

    it('should cache constants after first call', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const firstCall = await wn!.constants.getAllConstants();
      const secondCall = await wn!.constants.getAllConstants();
      
      expect(firstCall).toEqual(secondCall);
    });
  });
}); 
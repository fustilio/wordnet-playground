import { describe, it, expect } from 'vitest';
import { 
  validateSynset, 
  validateSense, 
  validateWord, 
  validateRelation, 
  validateWordnet 
} from '../src/validate';
import type { Synset, Sense, Word, Relation } from '../src/types';
import { WnError } from '../src/types';

describe('Validation', () => {
  const validSynset: Synset = {
    id: 'en-n-0001',
    pos: 'n',
    definitions: [
      {
        id: 'def-1',
        language: 'en',
        text: 'A thing or object that can be perceived by the senses'
      }
    ],
    examples: [
      {
        id: 'ex-1',
        language: 'en',
        text: 'The table is made of wood'
      }
    ],
    relations: [],
    language: 'en',
    lexicon: 'test-en',
    memberIds: [],
    senseIds: [],
  };

  const validWord: Word = {
    id: 'en-example-n',
    lemma: 'example',
    pos: 'n',
    language: 'en',
    lexicon: 'test-en',
    forms: [
      {
        id: 'form-1',
        writtenForm: 'example'
      }
    ],
    tags: [],
    pronunciations: [],
    counts: [],
  };

  const validSense: Sense = {
    id: 'en-example-n-0001-01',
    wordId: 'en-example-n',
    synsetId: 'en-n-0001',
    counts: [],
    examples: [],
    tags: [],
  };

  const validRelation: Relation = {
    id: 'r1',
    type: 'hypernym',
    target: 'en-n-0002',
  };

  describe('validateSynset', () => {
    it('should validate a valid synset', () => {
      expect(validateSynset(validSynset)).toBe(true);
    });

    it('should throw error for missing ID', () => {
      const invalidSynset = { ...validSynset, id: '' };
      expect(() => validateSynset(invalidSynset)).toThrow(WnError);
    });

    it('should throw error for missing part of speech', () => {
      const invalidSynset = { ...validSynset, pos: '' as any };
      expect(() => validateSynset(invalidSynset)).toThrow(WnError);
    });

    it('should throw error for missing language', () => {
      const invalidSynset = { ...validSynset, language: '' };
      expect(() => validateSynset(invalidSynset)).toThrow(WnError);
    });

    it('should throw error for missing lexicon', () => {
      const invalidSynset = { ...validSynset, lexicon: '' };
      expect(() => validateSynset(invalidSynset)).toThrow(WnError);
    });

    it('should validate synset with relations', () => {
      const synsetWithRelations = {
        ...validSynset,
        relations: [validRelation],
      };
      expect(validateSynset(synsetWithRelations)).toBe(true);
    });

    it('should validate synset with members and senses', () => {
      const synsetWithMembers = {
        ...validSynset,
        memberIds: ['test-en-example-n'],
        senseIds: ['test-en-example-n-0001-01'],
      };
      expect(validateSynset(synsetWithMembers)).toBe(true);
    });
  });

  describe('validateSense', () => {
    it('should validate a valid sense', () => {
      expect(validateSense(validSense)).toBe(true);
    });

    it('should throw error for missing ID', () => {
      const invalidSense = { ...validSense, id: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });

    it('should throw error for missing wordId', () => {
      const invalidSense = { ...validSense, wordId: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });

    it('should throw error for missing synsetId', () => {
      const invalidSense = { ...validSense, synsetId: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });
  });

  describe('validateWord', () => {
    it('should validate a valid word', () => {
      expect(validateWord(validWord)).toBe(true);
    });

    it('should throw error for missing ID', () => {
      const invalidWord = { ...validWord, id: '' };
      expect(() => validateWord(invalidWord)).toThrow(WnError);
    });

    it('should throw error for missing lemma', () => {
      const invalidWord = { ...validWord, lemma: '' };
      expect(() => validateWord(invalidWord)).toThrow(WnError);
    });

    it('should throw error for missing part of speech', () => {
      const invalidWord = { ...validWord, pos: '' as any };
      expect(() => validateWord(invalidWord)).toThrow(WnError);
    });

    it('should throw error for missing language', () => {
      const invalidWord = { ...validWord, language: '' };
      expect(() => validateWord(invalidWord)).toThrow(WnError);
    });

    it('should throw error for missing lexicon', () => {
      const invalidWord = { ...validWord, lexicon: '' };
      expect(() => validateWord(invalidWord)).toThrow(WnError);
    });
  });

  describe('validateRelation', () => {
    it('should validate a valid relation', () => {
      expect(validateRelation(validRelation)).toBe(true);
    });

    it('should throw error for missing ID', () => {
      const invalidRelation = { ...validRelation, id: '' };
      expect(() => validateRelation(invalidRelation)).toThrow(WnError);
    });

    it('should throw error for missing type', () => {
      const invalidRelation = { ...validRelation, type: '' };
      expect(() => validateRelation(invalidRelation)).toThrow(WnError);
    });

    it('should throw error for missing target', () => {
      const invalidRelation = { ...validRelation, target: '' };
      expect(() => validateRelation(invalidRelation)).toThrow(WnError);
    });
  });

  describe('validateWordnet', () => {
    it('should validate valid wordnet', () => {
      expect(validateWordnet([validSynset])).toBe(true);
    });

    it('should throw error for invalid synset in wordnet', () => {
      const invalidSynset = { ...validSynset, id: '' };
      expect(() => validateWordnet([invalidSynset])).toThrow(WnError);
    });

    it('should detect circular references', () => {
      const synset1 = {
        ...validSynset,
        id: 'en-n-0001',
        relations: [{ id: 'r1', type: 'hypernym', target: 'en-n-0002' }],
      };
      const synset2 = {
        ...validSynset,
        id: 'en-n-0002',
        relations: [{ id: 'r2', type: 'hypernym', target: 'en-n-0001' }],
      };
      
      expect(() => validateWordnet([synset1, synset2])).toThrow(WnError);
    });

    it('should handle complex hierarchies without circular references', () => {
      const root = { ...validSynset, id: 'en-n-0001', relations: [] };
      const child1 = {
        ...validSynset,
        id: 'en-n-0002',
        relations: [{ id: 'r1', type: 'hypernym', target: 'en-n-0001' }],
      };
      const child2 = {
        ...validSynset,
        id: 'en-n-0003',
        relations: [{ id: 'r2', type: 'hypernym', target: 'en-n-0001' }],
      };
      
      expect(validateWordnet([root, child1, child2])).toBe(true);
    });
  });
}); 

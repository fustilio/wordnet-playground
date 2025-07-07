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
    id: 'test-en-0001-n',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  };

  const validWord: Word = {
    id: 'test-en-example-n',
    lemma: 'example',
    partOfSpeech: 'n',
    language: 'en',
    lexicon: 'test-en',
    forms: [],
    tags: [],
    pronunciations: [],
    counts: [],
  };

  const validSense: Sense = {
    id: 'test-en-example-n-0001-01',
    word: 'test-en-example-n',
    synset: 'test-en-0001-n',
    counts: [],
    examples: [],
    tags: [],
  };

  const validRelation: Relation = {
    id: 'r1',
    type: 'hypernym',
    target: 'test-en-0002-n',
  };

  describe('validateSynset', () => {
    it('should validate a valid synset', () => {
      expect(() => validateSynset(validSynset)).not.toThrow();
    });

    it('should throw error for missing ID', () => {
      const invalidSynset = { ...validSynset, id: '' };
      expect(() => validateSynset(invalidSynset)).toThrow(WnError);
    });

    it('should throw error for missing part of speech', () => {
      const invalidSynset = { ...validSynset, partOfSpeech: '' as any };
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
      expect(() => validateSynset(synsetWithRelations)).not.toThrow();
    });

    it('should validate synset with members and senses', () => {
      const synsetWithMembers = {
        ...validSynset,
        members: ['test-en-example-n'],
        senses: ['test-en-example-n-0001-01'],
      };
      expect(() => validateSynset(synsetWithMembers)).not.toThrow();
    });
  });

  describe('validateSense', () => {
    it('should validate a valid sense', () => {
      expect(() => validateSense(validSense)).not.toThrow();
    });

    it('should throw error for missing ID', () => {
      const invalidSense = { ...validSense, id: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });

    it('should throw error for missing word', () => {
      const invalidSense = { ...validSense, word: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });

    it('should throw error for missing synset', () => {
      const invalidSense = { ...validSense, synset: '' };
      expect(() => validateSense(invalidSense)).toThrow(WnError);
    });
  });

  describe('validateWord', () => {
    it('should validate a valid word', () => {
      expect(() => validateWord(validWord)).not.toThrow();
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
      const invalidWord = { ...validWord, partOfSpeech: '' as any };
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
      expect(() => validateRelation(validRelation)).not.toThrow();
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
      expect(() => validateWordnet([validSynset])).not.toThrow();
    });

    it('should throw error for invalid synset in wordnet', () => {
      const invalidSynset = { ...validSynset, id: '' };
      expect(() => validateWordnet([invalidSynset])).toThrow(WnError);
    });

    it('should detect circular references', () => {
      const synset1 = {
        ...validSynset,
        id: 'synset1',
        relations: [{ id: 'r1', type: 'hypernym', target: 'synset2' }],
      };
      const synset2 = {
        ...validSynset,
        id: 'synset2',
        relations: [{ id: 'r2', type: 'hypernym', target: 'synset1' }],
      };
      
      expect(() => validateWordnet([synset1, synset2])).toThrow(WnError);
    });

    it('should handle complex hierarchies without circular references', () => {
      const root = { ...validSynset, id: 'root', relations: [] };
      const child1 = {
        ...validSynset,
        id: 'child1',
        relations: [{ id: 'r1', type: 'hypernym', target: 'root' }],
      };
      const child2 = {
        ...validSynset,
        id: 'child2',
        relations: [{ id: 'r2', type: 'hypernym', target: 'root' }],
      };
      
      expect(() => validateWordnet([root, child1, child2])).not.toThrow();
    });
  });
}); 
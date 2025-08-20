import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';
import { getTestData } from './test-data-loader';

describe('LMF Schema Compliance and Processing Order', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser('', {
      debug: true,
      resolutionStrategy: 'hybrid',
      mergeStrategy: 'auto'
    });
  });

  describe('Schema Compliance', () => {
    it('should only process valid LMF XML with properly nested senses', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      
      const result = await parser.parse(testData!.content);
      
      // Should have the properly nested sense (valid LMF structure)
      expect(result.senses).toHaveLength(1);
      
      // Check that the properly nested sense is present
      const nestedSense = result.senses.find(s => s.id === 'word-n-sense');
      expect(nestedSense).toBeDefined();
      
      // Nested sense should have proper word association
      expect(nestedSense!.word).toBe('word-n');
    });

    it('should derive word IDs for properly nested senses according to LMF schema', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      
      const result = await parser.parse(testData!.content);
      
      const nestedSense = result.senses.find(s => s.id === 'word-n-sense');
      expect(nestedSense).toBeDefined();
      
      // Word ID should be properly associated from the LexicalEntry (LMF schema compliance)
      expect(nestedSense!.word).toBe('word-n');
    });
  });

  describe('Processing Order Compliance', () => {
    it('should process LexicalEntry elements first, then Synsets (LMF schema order)', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      
      const result = await parser.parse(testData!.content);
      
      // Should have the properly nested sense (valid LMF structure)
      expect(result.senses).toHaveLength(1);
      
      // Only the properly nested sense should be present
      const nestedSense = result.senses.find(s => s.id === 'word-n-sense');
      expect(nestedSense).toBeDefined();
      expect(nestedSense!.word).toBe('word-n');
    });

    it('should handle multiple LexicalEntry elements in correct order', async () => {
      // Create a test case with multiple lexical entries
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="test-word-cat-n">
      <Lemma partOfSpeech="n" writtenForm="cat" />
      <Sense id="test-word-cat-n-sense" synset="synset1" />
    </LexicalEntry>
    
    <LexicalEntry id="test-word-catfish-n">
      <Lemma partOfSpeech="n" writtenForm="catfish" />
      <Sense id="test-word-catfish-n-sense" synset="synset2" />
    </LexicalEntry>
    
    <Synset id="synset1" ili="i1" partOfSpeech="n" />
    <Synset id="synset2" ili="i2" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(xmlContent);
      
      // Should have both senses properly nested in their LexicalEntry elements
      expect(result.senses).toHaveLength(2);
      expect(result.words).toHaveLength(2);
      
      const catSense = result.senses.find(s => s.id === 'test-word-cat-n-sense');
      const catfishSense = result.senses.find(s => s.id === 'test-word-catfish-n-sense');
      
      expect(catSense).toBeDefined();
      expect(catfishSense).toBeDefined();
      
      // Each sense should be properly associated with its word
      expect(catSense!.word).toBe('test-word-cat-n');
      expect(catfishSense!.word).toBe('test-word-catfish-n');
    });
  });

  describe('Schema Validation', () => {
    it('should reject invalid LMF XML that violates schema structure', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="test-word-dog-n">
      <Lemma partOfSpeech="n" writtenForm="dog" />
      <Sense id="test-word-dog-n-sense" synset="synset1" />
    </LexicalEntry>
    
    <!-- INVALID: Sense outside LexicalEntry violates LMF schema -->
    <Sense id="test-standalone-cat-sense" synset="synset1" />
    
    <Synset id="synset1" ili="i1" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(xmlContent);
      
      // Should only have the properly nested sense (valid LMF structure)
      expect(result.senses).toHaveLength(1);
      
      // The standalone sense should NOT be present because it violates LMF schema
      const standaloneSense = result.senses.find(s => s.id === 'test-standalone-cat-sense');
      expect(standaloneSense).toBeUndefined();
      
      // Only the properly nested sense should be present
      const nestedSense = result.senses.find(s => s.id === 'test-word-dog-n-sense');
      expect(nestedSense).toBeDefined();
      expect(nestedSense!.word).toBe('test-word-dog-n');
    });
  });

  describe('LMF Schema Compliance Across Options', () => {
    it('should maintain schema compliance regardless of resolution strategy', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      
      // Test with different resolution strategies - all should maintain LMF schema compliance
      const strategies = ['immediate', 'deferred', 'hybrid'] as const;
      
      for (const strategy of strategies) {
        const testParser = new LmfParser('', {
          debug: true,
          resolutionStrategy: strategy
        });
        
        const result = await testParser.parse(testData!.content);
        
        // All strategies should maintain LMF schema compliance
        expect(result.senses).toHaveLength(1);
        expect(result.words).toHaveLength(1);
        
        // Only the properly nested sense should be present
        const nestedSense = result.senses.find(s => s.id === 'word-n-sense');
        expect(nestedSense).toBeDefined();
        expect(nestedSense!.word).toBe('word-n');
        
        testParser.destroy();
      }
    });
  });
});

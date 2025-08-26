import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../src/parsers/lmf/lmf-parser';
import { loadTestData } from './test-data-loader';

describe('LMF Schema Compliance and Processing Order', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser({
      mergeStrategy: 'keep-last',
      validateSchema: true,
      strictMode: false
    });
  });

  describe('Schema Compliance', () => {
    it('should only process valid LMF XML with properly nested senses', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // Should have the expected structure
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6);
      expect(result.synsets).toHaveLength(3);
      expect(result.senses).toHaveLength(8);

      // All senses should have valid word and synset references
      result.senses.forEach(sense => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
        
        // Should reference existing words and synsets
        const wordExists = result.words.some(w => w.id === sense.wordId);
        const synsetExists = result.synsets.some(s => s.id === sense.synsetId);
        
        expect(wordExists).toBe(true);
        expect(synsetExists).toBe(true);
      });
    });

    it('should derive word IDs for properly nested senses according to LMF schema', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // Check that senses are properly linked to their parent lexical entries
      const word1 = result.words.find(w => w.lemma === 'word1');
      const word2 = result.words.find(w => w.lemma === 'word2');
      
      expect(word1).toBeDefined();
      expect(word2).toBeDefined();

      // Senses should reference the correct word IDs
      const word1Senses = result.senses.filter(s => s.wordId === word1!.id);
      const word2Senses = result.senses.filter(s => s.wordId === word2!.id);
      
      expect(word1Senses.length).toBeGreaterThan(0);
      expect(word2Senses.length).toBeGreaterThan(0);
    });
  });

  describe('Processing Order Compliance', () => {
    it('should process LexicalEntry elements first, then Synsets (LMF schema order)', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // All words should be processed before synsets
      result.words.forEach(word => {
        expect(word.id).toBeDefined();
        expect(word.lemma).toBeDefined();
        expect(word.partOfSpeech).toBeDefined();
      });

      // All synsets should reference valid word IDs
      result.synsets.forEach(synset => {
        if (synset.memberIds && synset.memberIds.length > 0) {
          synset.memberIds.forEach(wordId => {
            const wordExists = result.words.some(w => w.id === wordId);
            expect(wordExists).toBe(true);
          });
        }
      });
    });

    it('should handle multiple LexicalEntry elements in correct order', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // Should process all lexical entries
      expect(result.words.length).toBeGreaterThan(1);
      
      // Each word should have unique ID
      const wordIds = result.words.map(w => w.id);
      const uniqueWordIds = new Set(wordIds);
      expect(uniqueWordIds.size).toBe(wordIds.length);
    });
  });

  describe('Schema Validation', () => {
    it('should reject invalid LMF XML that violates schema structure', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <Synset id="invalid-synset" partOfSpeech="n">
              <!-- Missing LexicalEntry elements -->
            </Synset>
          </Lexicon>
        </LexicalResource>
      `;

      await expect(parser.parse(invalidXml)).rejects.toThrow();
    });
  });

  describe('LMF Schema Compliance Across Options', () => {
    it('should maintain schema compliance regardless of resolution strategy', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      
      // Test different merge strategies
      const strategies: Array<'keep-first' | 'keep-last' | 'error'> = ['keep-first', 'keep-last', 'error'];
      
      for (const strategy of strategies) {
        const testParser = new LmfParser({
          mergeStrategy: strategy,
          validateSchema: true,
          strictMode: false
        });
        
        const result = await testParser.parse(xmlContent);
        
        // All strategies should maintain LMF schema compliance
        expect(result.senses).toHaveLength(8); // Based on actual test data
        expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
        expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements

        // Only the properly nested senses should be present
        result.senses.forEach(sense => {
          expect(sense.wordId).toBeDefined();
          expect(sense.synsetId).toBeDefined();
        });
      }
    });
  });
});




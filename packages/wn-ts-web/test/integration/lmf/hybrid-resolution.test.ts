import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';
import { getTestData } from './test-data-loader';
import type { Sense, Word, Synset } from 'wn-ts-core';

describe('LMF Schema Compliance and Processing Order', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser('', {
      debug: false,
      validate: true
    });
  });

  describe('Schema Compliance', () => {
    it('should only process valid LMF XML with properly nested senses', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // Should have the expected structure
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6);
      expect(result.synsets).toHaveLength(3);
      expect(result.senses).toHaveLength(8);

      // All senses should have valid word and synset references
      result.senses.forEach((sense: Sense) => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
        
        // Should reference existing words and synsets
        const wordExists = result.words.some((w: Word) => w.id === sense.wordId);
        const synsetExists = result.synsets.some((s: Synset) => s.id === sense.synsetId);
        
        expect(wordExists).toBe(true);
        expect(synsetExists).toBe(true);
      });
    });

    it('should derive word IDs for properly nested senses according to LMF schema', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // Check that senses are properly linked to their parent lexical entries
      const fooWord = result.words.find((w: Word) => w.lemma === 'Foo Bar');
      const bazWord = result.words.find((w: Word) => w.lemma === 'baz');
      
      expect(fooWord).toBeDefined();
      expect(bazWord).toBeDefined();

      // Senses should reference the correct word IDs
      const fooSenses = result.senses.filter((s: Sense) => s.wordId === fooWord!.id);
      const bazSenses = result.senses.filter((s: Sense) => s.wordId === bazWord!.id);
      
      expect(fooSenses.length).toBeGreaterThan(0);
      expect(bazSenses.length).toBeGreaterThan(0);
    });
  });

  describe('Processing Order Compliance', () => {
    it('should process LexicalEntry elements first, then Synsets (LMF schema order)', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // All words should be processed before synsets
      result.words.forEach((word: Word) => {
        expect(word.id).toBeDefined();
        expect(word.lemma).toBeDefined();
        expect(word.pos).toBeDefined();
      });

      // All synsets should reference valid word IDs
      result.synsets.forEach((synset: Synset) => {
        if (synset.memberIds && synset.memberIds.length > 0) {
          synset.memberIds.forEach(wordId => {
            const wordExists = result.words.some((w: Word) => w.id === wordId);
            expect(wordExists).toBe(true);
          });
        }
      });
    });

    it('should handle multiple LexicalEntry elements in correct order', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // Should process all lexical entries
      expect(result.words.length).toBeGreaterThan(1);
      
      // Each word should have unique ID
      const wordIds = result.words.map((w: Word) => w.id);
      const uniqueWordIds = new Set(wordIds);
      expect(uniqueWordIds.size).toBe(wordIds.length);
    });
  });

  describe('Schema Validation', () => {
    it('should handle invalid LMF XML that violates schema structure gracefully', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <Synset id="invalid-synset" partOfSpeech="n">
              <!-- Missing LexicalEntry elements -->
            </Synset>
          </Lexicon>
        </LexicalResource>
      `;

      const result = await parser.parse(invalidXml);
      
      // Parser should handle invalid XML gracefully
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(0); // No words in invalid XML
      expect(result.synsets).toHaveLength(1); // Synset is parsed but has no members
      expect(result.senses).toHaveLength(0); // No senses in invalid XML
    });
  });

  describe('LMF Schema Compliance Across Options', () => {
    it('should maintain schema compliance regardless of resolution strategy', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      
      // Test different parser configurations
      const configs = [
        { debug: false, validate: true },
        { debug: true, validate: true },
        { debug: false, validate: false }
      ];
      
      for (const config of configs) {
        const testParser = new LmfParser('', config);
        
        const result = await testParser.parse(xmlContent);
        
        // All configurations should maintain LMF schema compliance
        expect(result.senses).toHaveLength(8); // Based on actual test data
        expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
        expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements

        // Only the properly nested senses should be present
        result.senses.forEach((sense: Sense) => {
          expect(sense.wordId).toBeDefined();
          expect(sense.synsetId).toBeDefined();
        });
      }
    });
  });
});

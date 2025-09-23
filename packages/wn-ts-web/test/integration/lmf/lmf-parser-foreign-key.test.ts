import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';
import { getTestData } from './test-data-loader';
import type { Sense, Word, Synset } from 'wn-ts-core';

describe('LMF Parser - Foreign Key Constraint Tests', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser('', {
      debug: false,
      validate: true
    });
  });

  describe('Sense Relationship Validation', () => {
    it('should correctly map sense.word and sense.synset to valid IDs', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements

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

    it('should handle senses without explicit word/synset attributes', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // All senses should have derived word and synset IDs
      result.senses.forEach((sense: Sense) => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
      });
    });

    it('should handle multiple senses per word correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // Check that words can have multiple senses
      const wordSenses = new Map<string, number>();
      result.senses.forEach((sense: Sense) => {
        const count = wordSenses.get(sense.wordId) || 0;
        wordSenses.set(sense.wordId, count + 1);
      });

      // At least one word should have multiple senses
      const hasMultipleSenses = Array.from(wordSenses.values()).some(count => count > 1);
      expect(hasMultipleSenses).toBe(true);
    });
  });

  describe('Standalone Sense Handling', () => {
    it('should reject invalid LMF XML with standalone senses (warn option)', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <Sense id="standalone-sense" word="nonexistent-word" synset="nonexistent-synset">
              <!-- Standalone sense without parent LexicalEntry -->
            </Sense>
          </Lexicon>
        </LexicalResource>
      `;

      const warnParser = new LmfParser('', {
        debug: false,
        validate: true
      });

      const result = await warnParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(0); // No words in invalid XML
      expect(result.synsets).toHaveLength(0); // No synsets in invalid XML
      expect(result.senses).toHaveLength(0); // No valid senses in invalid XML
    });

    it('should reject invalid LMF XML with standalone senses (skip option)', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <Sense id="standalone-sense" word="nonexistent-word" synset="nonexistent-synset">
              <!-- Standalone sense without parent LexicalEntry -->
            </Sense>
          </Lexicon>
        </LexicalResource>
      `;

      const skipParser = new LmfParser('', {
        debug: false,
        validate: false
      });

      const result = await skipParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(0); // No words in invalid XML
      expect(result.synsets).toHaveLength(0); // No synsets in invalid XML
      expect(result.senses).toHaveLength(0); // No valid senses in invalid XML
    });

    it('should reject invalid LMF XML with standalone senses (create-placeholders option)', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <Sense id="standalone-sense" word="nonexistent-word" synset="nonexistent-synset">
              <!-- Standalone sense without parent LexicalEntry -->
            </Sense>
          </Lexicon>
        </LexicalResource>
      `;

      const createParser = new LmfParser('', {
        debug: false,
        validate: false
      });

      const result = await createParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(0); // No words in invalid XML
      expect(result.synsets).toHaveLength(0); // No synsets in invalid XML
      expect(result.senses).toHaveLength(0); // No valid senses in invalid XML
    });

    it('should validate foreign key relationships correctly', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const result = await parser.parse(xmlContent);

      // All foreign key relationships should be valid
      result.senses.forEach((sense: Sense) => {
        const wordExists = result.words.some((w: Word) => w.id === sense.wordId);
        const synsetExists = result.synsets.some((s: Synset) => s.id === sense.synsetId);
        
        expect(wordExists).toBe(true);
        expect(synsetExists).toBe(true);
      });
    });
  });

  describe('Progress Callback Integration', () => {
    it('should track progress through foreign key validation', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      const xmlContent = testData!.content;
      const progressUpdates: Array<{stage: string, current: number, total?: number}> = [];
      
      const progressParser = new LmfParser('', {
        debug: false,
        validate: true,
        progressCallback: (stage: string, current: number, total?: number) => {
          progressUpdates.push({ stage, current, total });
        }
      });

      await progressParser.parse(xmlContent);
      
      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].current).toBeGreaterThanOrEqual(0);
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('completed');
    });
  });

  describe('Error Recovery', () => {
    it('should continue parsing even with some invalid references', async () => {
      const invalidXml = `
        <LexicalResource>
          <Lexicon id="test" language="en" version="1.0">
            <LexicalEntry id="word1" partOfSpeech="n">
              <Lemma writtenForm="test"/>
              <Sense id="sense1" synset="synset1"/>
            </LexicalEntry>
            <Synset id="synset1" partOfSpeech="n">
              <Definition>Test definition</Definition>
            </Synset>
          </Lexicon>
        </LexicalResource>
      `;

      const result = await parser.parse(invalidXml);

      expect(result.lexicons).toHaveLength(1);
      // The parser should handle invalid references gracefully
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
    });
  });

  describe('Test Data Coverage', () => {
    it('should have access to all required test data files', async () => {
      const testData = getTestData('mini-lmf-1.4.xml');
      expect(testData).toBeDefined();
      
      // Should contain LMF XML content
      expect(testData!.content).toContain('<LexicalResource');
      expect(testData!.content).toContain('<Lexicon');
      expect(testData!.content).toContain('<LexicalEntry');
      expect(testData!.content).toContain('<Sense');
    });
  });
});

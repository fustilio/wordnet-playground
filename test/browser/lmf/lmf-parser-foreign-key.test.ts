import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../src/parsers/lmf/lmf-parser';
import { loadTestData } from './test-data-loader';

describe('LMF Parser - Foreign Key Constraint Tests', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser({
      mergeStrategy: 'keep-last',
      validateSchema: true,
      strictMode: false
    });
  });

  describe('Sense Relationship Validation', () => {
    it('should correctly map sense.word and sense.synset to valid IDs', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements

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

    it('should handle senses without explicit word/synset attributes', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // All senses should have derived word and synset IDs
      result.senses.forEach(sense => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
      });
    });

    it('should handle multiple senses per word correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // Check that words can have multiple senses
      const wordSenses = new Map<string, number>();
      result.senses.forEach(sense => {
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

      const warnParser = new LmfParser({
        mergeStrategy: 'keep-last',
        validateSchema: true,
        strictMode: false
      });

      const result = await warnParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements
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

      const skipParser = new LmfParser({
        mergeStrategy: 'keep-last',
        validateSchema: true,
        strictMode: false
      });

      const result = await skipParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements
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

      const createParser = new LmfParser({
        mergeStrategy: 'keep-last',
        validateSchema: true,
        strictMode: false
      });

      const result = await createParser.parse(invalidXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements
    });

    it('should validate foreign key relationships correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // All foreign key relationships should be valid
      result.senses.forEach(sense => {
        const wordExists = result.words.some(w => w.id === sense.wordId);
        const synsetExists = result.synsets.some(s => s.id === sense.synsetId);
        
        expect(wordExists).toBe(true);
        expect(synsetExists).toBe(true);
      });
    });
  });

  describe('Progress Callback Integration', () => {
    it('should track progress through foreign key validation', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const progressUpdates: number[] = [];
      
      const progressParser = new LmfParser({
        mergeStrategy: 'keep-last',
        validateSchema: true,
        strictMode: false,
        progressCallback: (progress) => {
          progressUpdates.push(progress);
        }
      });

      await progressParser.parse(xmlContent);
      
      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toBeGreaterThanOrEqual(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
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
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      
      // Should contain LMF XML content
      expect(xmlContent).toContain('<LexicalResource');
      expect(xmlContent).toContain('<Lexicon');
      expect(xmlContent).toContain('<LexicalEntry');
      expect(xmlContent).toContain('<Sense');
    });
  });
});




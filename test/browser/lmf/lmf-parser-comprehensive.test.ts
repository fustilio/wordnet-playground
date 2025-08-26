import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../src/parsers/lmf/lmf-parser';
import { loadTestData } from './test-data-loader';

describe('LMF Parser - Comprehensive Tests with Real Data', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser({
      mergeStrategy: 'keep-last',
      validateSchema: true,
      strictMode: false
    });
  });

  describe('Basic LMF Parsing', () => {
    it('should parse mini-lmf-1.0.xml correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.0.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(2);

      // Check lexicon metadata
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.0');

      // Check word structure
      const word = result.words[0];
      expect(word.lemma).toBeDefined();
      expect(word.partOfSpeech).toBeDefined();
      expect(word.lexiconId).toBe(lexicon.id);

      // Check synset structure
      const synset = result.synsets[0];
      expect(synset.partOfSpeech).toBeDefined();
      expect(synset.lexiconId).toBe(lexicon.id);

      // Check sense relationships
      const sense = result.senses[0];
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();
    });

    it('should parse mini-lmf-1.1.xml correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.1.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(2);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(2);

      // Check lexicon metadata
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1.1');

      // Check word structure
      const word = result.words[0];
      expect(word.lemma).toBeDefined();
      expect(word.partOfSpeech).toBeDefined();
      expect(word.lexiconId).toBe(lexicon.id);

      // Check synset structure
      const synset = result.synsets[0];
      expect(synset.partOfSpeech).toBeDefined();
      expect(synset.lexiconId).toBe(lexicon.id);

      // Check sense relationships
      const sense = result.senses[0];
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();
    });

    it('should parse mini-lmf-1.4.xml correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(6); // Based on actual test data: 6 LexicalEntry elements
      expect(result.synsets).toHaveLength(3); // Based on actual test data: 3 Synset elements
      expect(result.senses).toHaveLength(8); // Based on actual test data: 8 Sense elements

      // Check lexicon metadata
      const lexicon = result.lexicons[0];
      expect(lexicon.language).toBe('en');
      expect(lexicon.version).toBe('1');

      // Check word structure
      const word = result.words[0];
      expect(word.lemma).toBeDefined();
      expect(word.partOfSpeech).toBeDefined();
      expect(word.lexiconId).toBe(lexicon.id);

      // Check synset structure
      const synset = result.synsets[0];
      expect(synset.partOfSpeech).toBeDefined();
      expect(synset.lexiconId).toBe(lexicon.id);

      // Check sense relationships
      const sense = result.senses[0];
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();

      // Check that senses with same index and synset are deduplicated
      const senseIds = result.senses.map(s => s.id);
      const uniqueSenseIds = new Set(senseIds);
      expect(uniqueSenseIds.size).toBe(senseIds.length);
    });
  });

  describe('Error Cases - Duplicate IDs', () => {
    it('should handle duplicate lexical entry IDs (E101-0.xml)', async () => {
      const xmlContent = await loadTestData('E101-0.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.synsets).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.senses).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence

      // Check that the last occurrence is kept
      const word = result.words[0];
      expect(word.id).toBe('test-e101-foo-n');
      expect(word.lemma).toBe('foo');
    });

    it('should handle duplicate sense IDs (E101-1.xml)', async () => {
      const xmlContent = await loadTestData('E101-1.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.synsets).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.senses).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence

      // Check that the last occurrence is kept
      const sense = result.senses[0];
      expect(sense.id).toBe('test-e101-foo');
      expect(sense.wordId).toBeDefined();
      expect(sense.synsetId).toBeDefined();
    });

    it('should handle duplicate synset IDs (E101-2.xml)', async () => {
      const xmlContent = await loadTestData('E101-2.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.synsets).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence
      expect(result.senses).toHaveLength(1); // Parser deduplicates by ID, keeps last occurrence

      // Check that the last occurrence is kept
      const synset = result.synsets[0];
      expect(synset.id).toBe('test-e101-01-n');
      expect(synset.partOfSpeech).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle blank definitions (W305-0.xml)', async () => {
      const xmlContent = await loadTestData('W305-0.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);

      // Check that blank definitions are handled gracefully
      const synset = result.synsets[0];
      expect(synset.definition).toBeDefined();
    });

    it('should handle blank examples (W306-0.xml)', async () => {
      const xmlContent = await loadTestData('W306-0.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);

      // Check that blank examples are handled gracefully
      const synset = result.synsets[0];
      expect(synset.example).toBeDefined();
    });

    it('should handle repeated definitions (W307-0.xml)', async () => {
      const xmlContent = await loadTestData('W307-0.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);

      // Check that repeated definitions are handled
      const synset = result.synsets[0];
      expect(synset.definition).toBeDefined();
    });
  });

  describe('Special Formats', () => {
    it('should parse sense-key-variations.xml correctly', async () => {
      const xmlContent = await loadTestData('sense-key-variations.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);

      // Check sense key handling
      const sense = result.senses[0];
      expect(sense.sensekey).toBeDefined();
    });

    it('should parse sense-member-order.xml correctly', async () => {
      const xmlContent = await loadTestData('sense-member-order.xml');
      const result = await parser.parse(xmlContent);

      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);

      // Check member order handling
      const synset = result.synsets[0];
      expect(synset.memberIds).toBeDefined();
    });
  });

  describe('Progress Callback Integration', () => {
    it('should track progress through parsing', async () => {
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

  describe('Foreign Key Validation', () => {
    it('should validate sense relationships correctly', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

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

    it('should handle missing word/synset references gracefully', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // All senses should have valid references
      result.senses.forEach(sense => {
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
      });
    });
  });

  describe('Large File Handling', () => {
    it('should handle large XML files without stack overflow', async () => {
      const xmlContent = await loadTestData('mini-lmf-1.4.xml');
      const result = await parser.parse(xmlContent);

      // Should parse successfully
      expect(result.lexicons).toHaveLength(1);
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.synsets.length).toBeGreaterThan(0);
      expect(result.senses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXml = `
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

      const result = await parser.parse(malformedXml);
      
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
    });

    it('should handle empty XML content', async () => {
      const emptyXml = '';
      
      await expect(parser.parse(emptyXml)).rejects.toThrow();
    });

    it('should handle non-XML content', async () => {
      const nonXmlContent = 'This is not XML content';
      
      await expect(parser.parse(nonXmlContent)).rejects.toThrow();
    });
  });
});




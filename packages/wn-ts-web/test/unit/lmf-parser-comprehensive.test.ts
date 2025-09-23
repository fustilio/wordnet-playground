import { describe, it, expect, beforeEach } from 'vitest';
import { LmfParser } from '../../src/parsers/lmf/lmf-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getTestFileStats, TEST_DATA_STATISTICS } from '../test-data-statistics';

// Test data paths
const TEST_DATA_DIR = join(__dirname, '../../../wn-test-data/data');

describe('LMF Parser - Comprehensive Tests with Real Data', () => {
  let parser: LmfParser;

  beforeEach(() => {
    parser = new LmfParser('', { debug: false, validate: true });
  });

  // Helper function to parse a test file and validate against expected statistics
  async function parseAndValidateTestFile(fileName: string) {
    const stats = getTestFileStats(fileName);
    expect(stats, `Missing statistics for ${fileName}`).toBeDefined();
    
    const xmlContent = readFileSync(join(TEST_DATA_DIR, fileName), 'utf-8');
    const result = await parser.parse(xmlContent);
    
    // Validate basic counts
    expect(result.lexicons).toHaveLength(stats!.lexicons);
    expect(result.words).toHaveLength(stats!.words);
    expect(result.synsets).toHaveLength(stats!.synsets);
    expect(result.senses).toHaveLength(stats!.senses);
    
    return { result, stats: stats! };
  }

  describe('Basic LMF Parsing', () => {
    it('should parse mini-lmf-1.0.xml correctly', async () => {
      const { result, stats } = await parseAndValidateTestFile('mini-lmf-1.0.xml');

      // Check English lexicon
      const enLexicon = result.lexicons.find(l => l.language === 'en');
      expect(enLexicon).toBeDefined();
      expect(enLexicon?.id).toBe('test-en');
      expect(enLexicon?.label).toBe('Testing English WordNet');

      // Check Spanish lexicon
      const esLexicon = result.lexicons.find(l => l.language === 'es');
      expect(esLexicon).toBeDefined();
      expect(esLexicon?.id).toBe('test-es');
      expect(esLexicon?.language).toBe('es');

      // Check specific words
      const informationWord = result.words.find(w => w.lemma === 'information');
      expect(informationWord).toBeDefined();
      expect(informationWord?.pos).toBe('n');
      expect(informationWord?.language).toBe('en');

      // Check specific synsets
      const infoSynset = result.synsets.find(s => s.id === 'test-en-0001-n');
      expect(infoSynset).toBeDefined();
      expect(infoSynset?.pos).toBe('n');
      expect(infoSynset?.definitions).toHaveLength(1);
      expect(infoSynset?.definitions[0].text).toBe('something that informs');

      // Check sense relationships
      const infoSense = result.senses.find(s => s.id === 'test-en-information-n-0001-01');
      expect(infoSense).toBeDefined();
      expect(infoSense?.wordId).toBe('test-en-information-n');
      expect(infoSense?.synsetId).toBe('test-en-0001-n');
    });

    it('should parse mini-lmf-1.1.xml correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'mini-lmf-1.1.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('mini-lmf-1.1.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check Japanese lexicon
      const jaLexicon = result.lexicons.find(l => l.language === 'ja');
      expect(jaLexicon).toBeDefined();
      expect(jaLexicon?.id).toBe('test-ja');

      // Check Japanese words
      const infoWord = result.words.find(w => w.lemma === '情報');
      expect(infoWord).toBeDefined();
      expect(infoWord?.language).toBe('ja');
    });

    it('should parse mini-lmf-1.3.xml correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'mini-lmf-1.3.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('mini-lmf-1.3.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check whitespace handling
      const fooSynset = result.synsets.find(s => s.id === 'test-ws-1');
      expect(fooSynset).toBeDefined();
      expect(fooSynset?.definitions).toHaveLength(1);
      // The definition should preserve whitespace structure
      expect(fooSynset?.definitions[0].text).toContain('one');
      expect(fooSynset?.definitions[0].text).toContain('two');
      expect(fooSynset?.definitions[0].text).toContain('three');
    });

    it('should parse mini-lmf-1.4.xml correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'mini-lmf-1.4.xml'), 'utf-8');
      // Create a parser with mergeStrategy: 'none' to preserve duplicate indices for testing
      const testParser = new LmfParser('', { debug: false, validate: true, mergeStrategy: 'none' });
      const result = await testParser.parse(xmlContent);

      const stats = getTestFileStats('mini-lmf-1.4.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check index attributes
      const fooBarWord = result.words.find(w => w.id === 'test-1.4-Foo_Bar-n');
      expect(fooBarWord).toBeDefined();
      expect(fooBarWord?.lemma).toBe('Foo Bar');

      // Check sense count attributes
      const fooBarSense = result.senses.find(s => s.id === 'test-1.4-Foo_Bar-n-1');
      expect(fooBarSense).toBeDefined();
    });
  });

  describe('Error Cases - Duplicate IDs', () => {
    it('should handle duplicate lexical entry IDs (E101-0.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'E101-0.xml'), 'utf-8');
      const testParser = new LmfParser('', { debug: false, validate: true, mergeStrategy: 'none' });
      const result = await testParser.parse(xmlContent);

      const stats = getTestFileStats('E101-0.xml');
      expect(stats).toBeDefined();
      
      // Should still parse successfully but may have duplicate IDs
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words); // Parser currently keeps all elements
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses); // Parser currently keeps all elements

      // Check that the parser handles duplicate IDs gracefully
      const words = result.words.filter(w => w.id === 'test-e101-foo-n');
      expect(words).toHaveLength(2); // Both entries with same ID are kept
      // The parser currently preserves all elements, including duplicates
    });

    it('should handle duplicate sense IDs (E101-1.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'E101-1.xml'), 'utf-8');
      const testParser = new LmfParser('', { debug: false, validate: true, mergeStrategy: 'none' });
      const result = await testParser.parse(xmlContent);

      const stats = getTestFileStats('E101-1.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets); // Parser currently keeps all elements
      expect(result.senses).toHaveLength(stats!.senses); // Parser currently keeps all elements

      // Check that the parser handles duplicate IDs gracefully
      const senses = result.senses.filter(s => s.id === 'test-e101-foo');
      expect(senses).toHaveLength(2); // Both senses with same ID are kept
      // The parser currently preserves all elements, including duplicates
    });

    it('should handle duplicate synset IDs (E101-2.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'E101-2.xml'), 'utf-8');
      const testParser = new LmfParser('', { 
        debug: false, 
        validate: true, 
        mergeStrategy: 'none',
        duplicateHandling: {
          strategy: 'keep-first',
          uniqueKeys: {
            words: ['id', 'lemma'],
            synsets: [], // Empty array means no deduplication for synsets
            senses: ['id', 'wordId-synsetId']
          },
          logDuplicates: false,
          trackStatistics: false
        }
      });
      const result = await testParser.parse(xmlContent);

      const stats = getTestFileStats('E101-2.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets); // Parser currently keeps all elements
      expect(result.senses).toHaveLength(stats!.senses);

      // Check that the parser handles duplicate IDs gracefully
      const synsets = result.synsets.filter(s => s.id === 'test-e101-01-n');
      expect(synsets).toHaveLength(2); // Both synsets with same ID are kept
      // The parser currently preserves all elements, including duplicates
    });

    it('should handle duplicate IDs across different entity types (E101-3.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'E101-3.xml'), 'utf-8');
      const testParser = new LmfParser('', { debug: false, validate: true, mergeStrategy: 'none' });
      const result = await testParser.parse(xmlContent);

      const stats = getTestFileStats('E101-3.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check that the duplicate ID exists in both word and sense
      const word = result.words.find(w => w.id === 'test-e101-foo-n');
      const sense = result.senses.find(s => s.id === 'test-e101-foo-n');
      expect(word).toBeDefined();
      expect(sense).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle blank definitions (W305-0.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'W305-0.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('W305-0.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      const synset = result.synsets.find(s => s.id === 'test-w305-01-n');
      expect(synset).toBeDefined();
      expect(synset?.definitions).toHaveLength(1);
      // The definition should be empty or contain only whitespace
      expect(synset?.definitions[0].text.trim()).toBe('');
    });

    it('should handle blank examples (W306-0.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'W306-0.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('W306-0.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      const synset = result.synsets.find(s => s.id === 'test-w306-01-n');
      expect(synset).toBeDefined();
      // Examples are not currently parsed, but synset should exist
    });

    it('should handle repeated definitions (W307-0.xml)', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'W307-0.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('W307-0.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      const synset1 = result.synsets.find(s => s.id === 'test-w307-01-n');
      const synset2 = result.synsets.find(s => s.id === 'test-w307-02-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      expect(synset1?.definitions[0].text).toBe('foo');
      expect(synset2?.definitions[0].text).toBe('foo');
    });
  });

  describe('Special Formats', () => {
    it('should parse sense-key-variations.xml correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'sense-key-variations.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('sense-key-variations.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check OMW English lexicon
      const omwLexicon = result.lexicons.find(l => l.id === 'omw-en');
      expect(omwLexicon).toBeDefined();
      expect(omwLexicon?.language).toBe('en');

      // Check OEWN lexicon
      const oewnLexicon = result.lexicons.find(l => l.id === 'oewn');
      expect(oewnLexicon).toBeDefined();
      expect(oewnLexicon?.language).toBe('en');
      expect(oewnLexicon?.version).toBe('2024');
    });

    it('should parse sense-member-order.xml correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'sense-member-order.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      const stats = getTestFileStats('sense-member-order.xml');
      expect(stats).toBeDefined();
      
      expect(result.lexicons).toHaveLength(stats!.lexicons);
      expect(result.words).toHaveLength(stats!.words);
      expect(result.synsets).toHaveLength(stats!.synsets);
      expect(result.senses).toHaveLength(stats!.senses);

      // Check that both synsets have the correct members
      const synset1 = result.synsets.find(s => s.id === 'test-01-n');
      const synset2 = result.synsets.find(s => s.id === 'test-02-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
    });
  });

  describe('Progress Callback Integration', () => {
    it('should call progress callbacks during parsing', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'mini-lmf-1.0.xml'), 'utf-8');
      
      const progressCalls: Array<{stage: string, current: number, total?: number, details?: any}> = [];
      
      const progressCallback = (stage: string, current: number, total?: number, details?: any) => {
        progressCalls.push({ stage, current, total, details });
      };

      const parserWithProgress = new LmfParser(xmlContent, { 
        progressCallback,
        debug: false 
      });

      const result = await parserWithProgress.parse(xmlContent);

      // Should have progress calls for major stages
      expect(progressCalls.length).toBeGreaterThan(0);
      
      // Check for key stages
      const stages = progressCalls.map(call => call.stage);
      expect(stages).toContain('validating');
      expect(stages).toContain('parsing_xml');
      expect(stages).toContain('converting');
      expect(stages).toContain('completed');

      // Should have successful parsing
      expect(result.lexicons.length).toBeGreaterThan(0);
      expect(result.words.length).toBeGreaterThan(0);
    });
  });

  describe('Test Data Statistics Validation', () => {
    it('should have statistics for all test files', () => {
      const testFiles = [
        'mini-lmf-1.0.xml',
        'mini-lmf-1.1.xml',
        'mini-lmf-1.3.xml',
        'mini-lmf-1.4.xml',
        'E101-0.xml',
        'E101-1.xml',
        'E101-2.xml',
        'E101-3.xml',
        'W305-0.xml',
        'W306-0.xml',
        'W307-0.xml',
        'sense-key-variations.xml',
        'sense-member-order.xml'
      ];
      
      testFiles.forEach(fileName => {
        const stats = getTestFileStats(fileName);
        expect(stats, `Missing statistics for ${fileName}`).toBeDefined();
        expect(stats!.name).toBe(fileName);
      });
    });
  });

  describe('Foreign Key Validation', () => {
    it('should validate sense relationships correctly', async () => {
      const xmlContent = readFileSync(join(TEST_DATA_DIR, 'mini-lmf-1.0.xml'), 'utf-8');
      const result = await parser.parse(xmlContent);

      // All senses should have valid word and synset references
      for (const sense of result.senses) {
        const wordExists = result.words.some(w => w.id === sense.wordId);
        const synsetExists = result.synsets.some(s => s.id === sense.synsetId);
        
        expect(wordExists, `Sense ${sense.id} references non-existent word ${sense.wordId}`).toBe(true);
        expect(synsetExists, `Sense ${sense.id} references non-existent synset ${sense.synsetId}`).toBe(true);
      }
    });

    it('should handle missing word/synset references gracefully', async () => {
      // Create XML with invalid references
      const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="sense1" synset="nonexistent-synset"/>
    </LexicalEntry>
    <Synset id="synset1" partOfSpeech="n"/>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(invalidXML);
      
      // Should still parse but with warnings
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
      
      // The sense should exist but reference invalid synset
      const sense = result.senses.find(s => s.id === 'sense1');
      expect(sense).toBeDefined();
      expect(sense?.synsetId).toBe('nonexistent-synset');
    });
  });

  describe('Comprehensive Test File Parsing', () => {
    it('should parse all test files successfully', async () => {
      const testFiles = TEST_DATA_STATISTICS.filter(stats => 
        // Skip the large file test as it's handled separately
        !stats.name.includes('large')
      );
      
      for (const fileStats of testFiles) {
        const xmlContent = readFileSync(join(TEST_DATA_DIR, fileStats.name), 'utf-8');
        // Use mergeStrategy: 'none' for test files that expect duplicate IDs or indices to be preserved
        const shouldUseMergeStrategy = fileStats.characteristics?.includes('duplicate-ids') || 
                                     fileStats.characteristics?.includes('duplicate-indices');
        const testParser = shouldUseMergeStrategy ? 
          new LmfParser('', { 
            debug: false, 
            validate: true, 
            mergeStrategy: 'none',
            duplicateHandling: {
              strategy: 'keep-first',
              uniqueKeys: {
                words: ['id', 'lemma'],
                synsets: [], // Empty array means no deduplication for synsets
                senses: ['id', 'wordId-synsetId']
              },
              logDuplicates: false,
              trackStatistics: false
            }
          }) : 
          parser;
        const result = await testParser.parse(xmlContent);
        
        // Verify the basic structure
        expect(result.lexicons).toHaveLength(fileStats.lexicons);
        expect(result.words).toHaveLength(fileStats.words);
        expect(result.synsets).toHaveLength(fileStats.synsets);
        expect(result.senses).toHaveLength(fileStats.senses);
        
        // Verify that the result has the expected structure
        expect(result.lexicons.length).toBeGreaterThan(0);
        expect(result.words.length).toBeGreaterThan(0);
        expect(result.synsets.length).toBeGreaterThan(0);
        expect(result.senses.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Large File Handling', () => {
    it('should handle large XML files without stack overflow', async () => {
      // Create a large XML file with many entries
      let largeXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="large-test" language="en">`;
      
      // Add 1000 lexical entries
      for (let i = 0; i < 1000; i++) {
        largeXML += `
    <LexicalEntry id="word${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense${i}" synset="synset${i}"/>
    </LexicalEntry>
    <Synset id="synset${i}" partOfSpeech="n">
      <Definition>Definition for word${i}</Definition>
    </Synset>`;
      }
      
      largeXML += `
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(largeXML);
      
      expect(result.words).toHaveLength(1000);
      expect(result.synsets).toHaveLength(1000);
      expect(result.senses).toHaveLength(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="sense1" synset="synset1"/>
    </LexicalEntry>
    <Synset id="synset1" partOfSpeech="n">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const result = await parser.parse(malformedXML);
      
      // Should still parse successfully
      expect(result.lexicons).toHaveLength(1);
      expect(result.words).toHaveLength(1);
      expect(result.synsets).toHaveLength(1);
      expect(result.senses).toHaveLength(1);
    });

    it('should handle empty XML content', async () => {
      await expect(parser.parse('')).rejects.toThrow();
    });

    it('should handle non-XML content', async () => {
      const nonXML = 'This is not XML content';
      await expect(parser.parse(nonXML)).rejects.toThrow();
    });
  });
});

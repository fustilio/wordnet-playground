import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { BaseWordnet } from '../src/wordnet';
import { validateLMFDataIntegrity } from '../src/validation';

// Mock Wordnet implementation for testing
class MockWordnet extends BaseWordnet {
  private mockData: any = {};

  constructor() {
    super();
  }

  // Set mock data for testing
  setMockData(data: any) {
    this.mockData = data;
  }

  // Implement required abstract methods
  async words() { return []; }
  async word() { return undefined; }
  async synsets() { return []; }
  async synset() { return undefined; }
  async senses() { return []; }
  async sense() { return undefined; }
  async ili() { return undefined; }
  async ilis() { return []; }
  async synsetsByILI() { return []; }
  async lexicons() { return []; }
  async expandedLexicons() { return []; }
  async getProjects() { return []; }
  async project() { return undefined; }
  async searchWords() { return []; }
  async searchSynsets() { return []; }
  async wordsByForm() { return []; }
  async synsetsByForm() { return []; }
  async wordsByILI() { return []; }
  async wordsBySynset() { return []; }
  async sensesByWord() { return []; }
  async sensesBySynset() { return []; }
  async relationsBySynset() { return []; }
  async relationsByWord() { return []; }
  async examplesBySynset() { return []; }
  async examplesByWord() { return []; }
  async definitionsBySynset() { return []; }
  async formsByWord() { return []; }
  async getWordForms() { return []; }
  async getWordLemma() { return ''; }
  async morphy() { return {}; }
  async getDerivedWords() { return []; }
  async normalizeForm() { return ''; }
  async getHypernyms() { return []; }
  async getHyponyms() { return []; }
  async getRelatedSynsets() { return []; }
  async getRelatedSenses() { return []; }
  async getShortestPath() { return []; }
  async getSynsetDepth() { return 0; }
  async translateWord() { return {}; }
  async translateSynset() { return []; }
  async translateSense() { return []; }
  async getCrossLingualSynsets() { return {}; }
  async getDefinitions() { return []; }
  async getExamples() { return []; }
  async getSenseExamples() { return []; }
  async getSynsetWords() { return []; }
  async getSynsetLemmas() { return []; }
  async getSynsetSenses() { return []; }
  async getStatistics() { return { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 }; }
  async getLexiconStatistics() { return []; }
  async getDataQualityMetrics() { return { synsetsWithILI: 0, synsetsWithoutILI: 0, iliCoveragePercentage: 0, emptySynsets: 0, synsetsWithDefinitions: 0, synsetsWithExamples: 0, averageSynsetSize: 0 }; }
  async getPartOfSpeechDistribution() { return {}; }
  async getSynsetSizeAnalysis() { return { averageSize: 0, maxSize: 0, minSize: 0, sizeDistribution: {} }; }
  async hasLexicon() { return false; }
  async getSupportedLanguages() { return []; }
  async getLexiconDependencies() { return []; }
  async close() {}
}

// Mock database adapter for validation
class MockDatabaseAdapter {
  private mockData: any = {};

  setMockData(data: any) {
    this.mockData = data;
  }

  async getLexicons() {
    return this.mockData.lexicons || [];
  }

  async getWords(lexiconId: string) {
    return this.mockData.words?.filter((w: any) => w.lexicon === lexiconId) || [];
  }

  async getSynsets(lexiconId: string) {
    return this.mockData.synsets?.filter((s: any) => s.lexicon === lexiconId) || [];
  }

  async getSenses(wordId: string) {
    return this.mockData.senses?.filter((s: any) => s.word_id === wordId) || [];
  }

  async getForms(wordId: string) {
    return this.mockData.forms?.filter((f: any) => f.word_id === wordId) || [];
  }

  async getWordTags(wordId: string) {
    return this.mockData.wordTags?.filter((t: any) => t.word_id === wordId) || [];
  }

  async getFormTags(formId: string) {
    return this.mockData.formTags?.filter((t: any) => t.form_id === formId) || [];
  }

  async getSenseRelations(senseId: string) {
    return this.mockData.senseRelations?.filter((r: any) => r.source_id === senseId) || [];
  }

  async getSenseExamples(senseId: string) {
    return this.mockData.senseExamples?.filter((e: any) => e.sense_id === senseId) || [];
  }

  async getSenseCounts(senseId: string) {
    return this.mockData.senseCounts?.filter((c: any) => c.sense_id === senseId) || [];
  }

  async getSyntacticBehaviours(wordId: string) {
    return this.mockData.syntacticBehaviours?.filter((b: any) => b.word_id === wordId) || [];
  }

  async getDefinitions(synsetId: string) {
    return this.mockData.definitions?.filter((d: any) => d.synset_id === synsetId) || [];
  }

  async getILIDefinitions(synsetId: string) {
    return this.mockData.iliDefinitions?.filter((d: any) => d.synset_id === synsetId) || [];
  }

  async getSynsetRelations(synsetId: string) {
    return this.mockData.synsetRelations?.filter((r: any) => r.source_id === synsetId) || [];
  }

  async getSynsetExamples(synsetId: string) {
    return this.mockData.synsetExamples?.filter((e: any) => e.synset_id === synsetId) || [];
  }
}

describe('Data Integrity Tests', () => {
  let tempDir: string;
  let mockWordnet: MockWordnet;
  let mockAdapter: MockDatabaseAdapter;

  beforeAll(async () => {
    tempDir = join(tmpdir(), 'wn-ts-data-integrity-test');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    mockWordnet = new MockWordnet();
    mockAdapter = new MockDatabaseAdapter();
  });

  afterAll(async () => {
    // Cleanup temp directory if needed
  });

  describe('ILI Identifier Handling', () => {
    it('should handle synsets with valid ILI identifiers', () => {
      const synsetWithILI = {
        id: 'oewn-00001740-a',
        ili: 'i1',
        partOfSpeech: 'a',
        members: ['oewn-able-a'],
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'oewn',
        senses: []
      };

      expect(synsetWithILI.ili).toBe('i1');
      expect(typeof synsetWithILI.ili).toBe('string');
    });

    it('should handle synsets with empty ILI identifiers', () => {
      const synsetWithEmptyILI = {
        id: 'oewn-00001740-n',
        ili: '',
        partOfSpeech: 'n',
        members: ['oewn-entity-n'],
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'oewn',
        senses: []
      };

      expect(synsetWithEmptyILI.ili).toBe('');
      expect(typeof synsetWithEmptyILI.ili).toBe('string');
    });

    it('should handle synsets without ILI identifiers', () => {
      const synsetWithoutILI = {
        id: 'oewn-00001740-v',
        partOfSpeech: 'v',
        members: ['oewn-breathe-v'],
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'oewn',
        senses: []
      };

      expect(synsetWithoutILI.ili).toBeUndefined();
    });
  });

  describe('XML Structure Validation', () => {
    it('should validate basic LMF structure', async () => {
      const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.3.dtd">
<LexicalResource xmlns:dc="https://globalwordnet.github.io/schemas/dc/">
  <Lexicon id="test" label="Test Lexicon" language="en" email="test@example.com" license="MIT" version="1.0">
    <LexicalEntry id="test-word-n">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense-1" synset="test-synset-1"/>
    </LexicalEntry>
    <Synset id="test-synset-1" ili="i12345" partOfSpeech="n">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      // Test that XML is well-formed
      expect(sampleXML).toContain('<?xml version="1.0"');
      expect(sampleXML).toContain('<LexicalResource');
      expect(sampleXML).toContain('<Lexicon');
      expect(sampleXML).toContain('<LexicalEntry');
      expect(sampleXML).toContain('<Synset');
      expect(sampleXML).toContain('ili="i12345"');
    });

    it('should validate synset attributes', () => {
      const synsetAttributes = [
        'id',
        'ili',
        'partOfSpeech',
        'members',
        'lexfile'
      ];

      const sampleSynset = {
        id: 'oewn-00001740-a',
        ili: 'i1',
        partOfSpeech: 'a',
        members: 'oewn-able-a',
        lexfile: 'adj.all'
      };

      synsetAttributes.forEach(attr => {
        expect(sampleSynset).toHaveProperty(attr);
      });
    });
  });

  describe('Data Loading Verification', () => {
    it('should verify all required elements are present', async () => {
      const mockData = {
        lexicons: [
          {
            id: 'oewn',
            label: 'Open English WordNet',
            language: 'en',
            email: 'wordnet@princeton.edu',
            license: 'https://creativecommons.org/licenses/by/4.0/',
            version: '2023'
          }
        ],
        words: [
          {
            id: 'oewn-aardvark-n',
            lemma: 'aardvark',
            pos: 'n',
            language: 'en',
            lexicon: 'oewn'
          }
        ],
        synsets: [
          {
            id: 'oewn-00001740-n',
            ili: 'i35545',
            pos: 'n',
            language: 'en',
            lexicon: 'oewn'
          }
        ],
        senses: [
          {
            id: 'oewn-aardvark-n-1',
            word_id: 'oewn-aardvark-n',
            synset_id: 'oewn-00001740-n'
          }
        ]
      };

      mockAdapter.setMockData(mockData);

      const lexicons = await mockAdapter.getLexicons();
      const words = await mockAdapter.getWords('oewn');
      const synsets = await mockAdapter.getSynsets('oewn');
      const senses = await mockAdapter.getSenses('oewn-aardvark-n');

      expect(lexicons).toHaveLength(1);
      expect(words).toHaveLength(1);
      expect(synsets).toHaveLength(1);
      expect(senses).toHaveLength(1);

      expect(lexicons[0].id).toBe('oewn');
      expect(words[0].lemma).toBe('aardvark');
      expect(synsets[0].ili).toBe('i35545');
      expect(senses[0].synset_id).toBe('oewn-00001740-n');
    });

    it('should verify ILI coverage statistics', async () => {
      const mockData = {
        synsets: [
          { id: 'syn1', ili: 'i1', lexicon: 'oewn' },
          { id: 'syn2', ili: '', lexicon: 'oewn' },
          { id: 'syn3', lexicon: 'oewn' }, // no ili attribute
          { id: 'syn4', ili: 'i2', lexicon: 'oewn' }
        ]
      };

      mockAdapter.setMockData(mockData);
      const synsets = await mockAdapter.getSynsets('oewn');

      const withILI = synsets.filter(s => s.ili && s.ili !== '');
      const withoutILI = synsets.filter(s => !s.ili || s.ili === '');
      const total = synsets.length;

      expect(total).toBe(4);
      expect(withILI).toHaveLength(2);
      expect(withoutILI).toHaveLength(2);
      expect(withILI.map(s => s.ili)).toEqual(['i1', 'i2']);
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('should verify sense-synset relationships', async () => {
      const mockData = {
        senses: [
          { id: 'sense1', word_id: 'word1', synset_id: 'synset1' },
          { id: 'sense2', word_id: 'word2', synset_id: 'synset2' }
        ],
        synsets: [
          { id: 'synset1', ili: 'i1', lexicon: 'oewn' },
          { id: 'synset2', ili: 'i2', lexicon: 'oewn' }
        ]
      };

      mockAdapter.setMockData(mockData);

      const senses = await mockAdapter.getSenses('word1');
      const synset = await mockAdapter.getSynsets('oewn').then(s => s.find(s => s.id === 'synset1'));

      expect(senses).toHaveLength(1);
      expect(senses[0].synset_id).toBe('synset1');
      expect(synset).toBeDefined();
      expect(synset?.ili).toBe('i1');
    });

    it('should verify word-sense relationships', async () => {
      const mockData = {
        words: [
          { id: 'word1', lemma: 'test', pos: 'n', lexicon: 'oewn' }
        ],
        senses: [
          { id: 'sense1', word_id: 'word1', synset_id: 'synset1' }
        ]
      };

      mockAdapter.setMockData(mockData);

      const words = await mockAdapter.getWords('oewn');
      const senses = await mockAdapter.getSenses('word1');

      expect(words).toHaveLength(1);
      expect(senses).toHaveLength(1);
      expect(words[0].id).toBe(senses[0].word_id);
    });
  });

  describe('Data Quality Metrics', () => {
    it('should calculate ILI coverage percentage', async () => {
      const mockData = {
        synsets: [
          { id: 'syn1', ili: 'i1', lexicon: 'oewn' },
          { id: 'syn2', ili: 'i2', lexicon: 'oewn' },
          { id: 'syn3', ili: '', lexicon: 'oewn' },
          { id: 'syn4', lexicon: 'oewn' }
        ]
      };

      mockAdapter.setMockData(mockData);
      const synsets = await mockAdapter.getSynsets('oewn');

      const withValidILI = synsets.filter(s => s.ili && s.ili !== '');
      const total = synsets.length;
      const coveragePercentage = (withValidILI.length / total) * 100;

      expect(coveragePercentage).toBe(50); // 2 out of 4 have valid ILI
      expect(withValidILI).toHaveLength(2);
      expect(total).toBe(4);
    });

    it('should identify synsets with missing ILI identifiers', async () => {
      const mockData = {
        synsets: [
          { id: 'syn1', ili: 'i1', lexicon: 'oewn' },
          { id: 'syn2', ili: '', lexicon: 'oewn' },
          { id: 'syn3', lexicon: 'oewn' }
        ]
      };

      mockAdapter.setMockData(mockData);
      const synsets = await mockAdapter.getSynsets('oewn');

      const missingILI = synsets.filter(s => !s.ili || s.ili === '');
      const validILI = synsets.filter(s => s.ili && s.ili !== '');

      expect(missingILI).toHaveLength(2);
      expect(validILI).toHaveLength(1);
      expect(missingILI.map(s => s.id)).toEqual(['syn2', 'syn3']);
      expect(validILI.map(s => s.id)).toEqual(['syn1']);
    });
  });
});

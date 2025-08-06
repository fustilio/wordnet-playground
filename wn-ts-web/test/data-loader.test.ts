import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoader } from '../src/data-loader.js';
import type { WebDatabase } from '../src/web-database.js';
import type { WebWordnet } from '../src/web-wordnet.js';
import type { KyselyQueryService } from '../src/database/kysely-query-service.js';

// Helper class to expose protected/private methods for testing
class TestDataLoader extends DataLoader {
  public async testInsertBrowserParsedData(parsed: any, projectIdWithVersion: string): Promise<void> {
    // @ts-expect-error: calling private method for testing
    await this.insertBrowserParsedData(parsed, projectIdWithVersion);
  }

  public async testInsertLMFData(lmf: any, projectIdWithVersion: string): Promise<void> {
    // @ts-expect-error: calling private method for testing
    await this.insertLMFData(lmf, projectIdWithVersion);
  }
}

// Mock data that simulates the output of the two different parsers
const MOCK_LMF_DOCUMENT = {
  lexicons: [{
    id: 'test-lexicon:1.0',
    label: 'Test Lexicon',
    language: 'en',
    version: '1.0'
  }],
  words: [{
    id: 'w_test_1',
    lemma: 'test-word',
    partOfSpeech: 'n',
    lexicon: 'test-lexicon:1.0'
  }],
  synsets: [{
    id: 'syn_test_1',
    partOfSpeech: 'n',
    lexicon: 'test-lexicon:1.0',
    definitions: [{
      // Simulate that parseLMFXML returns a string with embedded HTML
      gloss: 'This is a <b>mixed content</b> test.'
    }]
  }],
  senses: [{
    id: 's_test_1',
    word: 'w_test_1',
    synset: 'syn_test_1'
  }]
};

const MOCK_BROWSER_PARSED_DATA = {
  LexicalResource: {
    children: [{
      name: 'Lexicon',
      attributes: {
        id: 'test-lexicon:1.0',
        label: 'Test Lexicon',
        language: 'en',
        version: '1.0'
      },
      children: [{
        name: 'LexicalEntry',
        attributes: { id: 'w_test_1' },
        children: [
          { name: 'Lemma', attributes: { writtenForm: 'test-word', partOfSpeech: 'n' } },
          { name: 'Sense', attributes: { id: 's_test_1', synset: 'syn_test_1' } }
        ]
      }, {
        name: 'Synset',
        attributes: { id: 'syn_test_1', partOfSpeech: 'n' },
        children: [{
          name: 'Definition',
          children: [{
            name: 'gloss',
            children: [
              { name: '#text', text: 'This is a' },
              { name: 'b', children: [{ name: '#text', text: 'mixed content' }] },
              { name: '#text', text: 'test.' }
            ]
          }]
        }]
      }]
    }]
  }
};

describe('DataLoader Functional Tests', () => {
  let dataLoader: TestDataLoader;
  let mockQueryService: KyselyQueryService;
  let mockWordnet: WebWordnet;
  let mockDatabase: WebDatabase;
  const batchInsertSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockQueryService = {
      batchInsert: batchInsertSpy
    } as any;

    mockWordnet = {
      getQueryService: () => mockQueryService
    } as any;

    mockDatabase = {} as any;

    dataLoader = new TestDataLoader(mockDatabase, mockWordnet);
  });

  describe('insertLMFData', () => {
    it('should correctly process and insert definitions from LMF format', async () => {
      await dataLoader.testInsertLMFData(MOCK_LMF_DOCUMENT, 'test-lexicon:1.0');
      
      const definitionsCall = batchInsertSpy.mock.calls.find(call => call[0] === 'definitions');
      expect(definitionsCall).toBeDefined();
      
      const definitionsToInsert = definitionsCall?.[1];
      expect(definitionsToInsert).toHaveLength(1);
      expect(definitionsToInsert[0]).toMatchObject({
        synset_id: 'syn_test_1',
        text: 'This is a mixed content test.'
      });
    });
  });

  describe('insertBrowserParsedData', () => {
    it('should correctly process and insert definitions from browser-parsed format', async () => {
      await dataLoader.testInsertBrowserParsedData(MOCK_BROWSER_PARSED_DATA, 'test-lexicon:1.0');
      
      const definitionsCall = batchInsertSpy.mock.calls.find(call => call[0] === 'definitions');
      expect(definitionsCall).toBeDefined();
      
      const definitionsToInsert = definitionsCall?.[1];
      expect(definitionsToInsert).toHaveLength(1);
      expect(definitionsToInsert[0]).toMatchObject({
        synset_id: 'syn_test_1',
        text: 'This is a mixed content test.'
      });
    });
  });
});

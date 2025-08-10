import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWebWordnet, createWordNetInstance, createDataLoader } from '../src/factory';

// Mock dynamic import
vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const { mockSqliteWasm } = (await vi.importActual('./setup.ts')) as any;
  return {
    default: vi.fn().mockResolvedValue(mockSqliteWasm)
  };
});

describe('Factory Functions', () => {
  let mockSqliteWasm: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamically import the mock to avoid polluting the browser test environment
    const setup = await vi.importActual('./setup.ts') as any;
    mockSqliteWasm = setup.mockSqliteWasm;
  });

  describe('createWebWordnet', () => {
    it('should create WebWordnet instance without options', async () => {
      const wordnet = await createWebWordnet();
      expect(wordnet).toBeDefined();
      expect(wordnet).toHaveProperty('initialize');
      expect(wordnet).toHaveProperty('lexicons');
    });

    it('should create WebWordnet instance with @sqlite.org/sqlite-wasm module', async () => {
      const wordnet = await createWebWordnet({ sqliteWasmModule: mockSqliteWasm });
      expect(wordnet).toBeDefined();
      expect(wordnet).toHaveProperty('initialize');
    });

    it('should create WebWordnet instance with wordnet options', async () => {
      const wordnet = await createWebWordnet({
        sqliteWasmModule: mockSqliteWasm,
        lexicon: 'test-lexicon',
        options: { searchAllForms: false }
      });
      expect(wordnet).toBeDefined();
    });
  });

  describe('createWordNetInstance', () => {
    it('should create WordNet instance with default options', async () => {
      const result = await createWordNetInstance();
      expect(result).toHaveProperty('wordnet');
      expect(result).toHaveProperty('dataLoader');
      expect(result.wordnet).toBeDefined();
      expect(result.dataLoader).toBeDefined();
    });

    it('should create WordNet instance with custom options', async () => {
      const result = await createWordNetInstance('test-lexicon', { searchAllForms: false });
      expect(result).toHaveProperty('wordnet');
      expect(result).toHaveProperty('dataLoader');
      expect(result.wordnet).toBeDefined();
      expect(result.dataLoader).toBeDefined();
    });
  });

  describe('createDataLoader', () => {
    it('should create DataLoader for WordNet instance', async () => {
      const wordnet = await createWebWordnet({ sqliteWasmModule: mockSqliteWasm });
      const dataLoader = await createDataLoader(wordnet);
      expect(dataLoader).toBeDefined();
      expect(dataLoader).toHaveProperty('downloadAndLoad');
      expect(dataLoader).toHaveProperty('clearAllData');
      expect(dataLoader).toHaveProperty('getStatistics');
    });
  });
}); 

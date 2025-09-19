/**
 * Test setup for wn-ts-web
 * Provides browser environment and @sqlite.org/sqlite-wasm mocking
 */

import { vi } from 'vitest';

// Mock @sqlite.org/sqlite-wasm
const createMockDb = () => {
  const demoData = {
    lexicons: [
      { id: 'oewn', label: 'Open English WordNet', language: 'en', version: '2024' }
    ],
    words: [
      { id: 'word_1', lemma: 'happy', part_of_speech: 'a', language: 'en', lexicon: 'oewn' },
      { id: 'word_2', lemma: 'joy', part_of_speech: 'n', language: 'en', lexicon: 'oewn' },
      { id: 'word_3', lemma: 'run', part_of_speech: 'v', language: 'en', lexicon: 'oewn' },
    ],
    senses: [
        { id: 'sense_1', word_id: 'word_1', synset_id: 'synset_1', source: 'oewn' },
        { id: 'sense_2', word_id: 'word_2', synset_id: 'synset_2', source: 'oewn' },
        { id: 'sense_3', word_id: 'word_3', synset_id: 'synset_3', source: 'oewn' },
    ],
    synsets: [
        { id: 'synset_1', ili: 'i1', part_of_speech: 'a', language: 'en', lexicon: 'oewn' },
        { id: 'synset_2', ili: 'i2', part_of_speech: 'n', language: 'en', lexicon: 'oewn' },
        { id: 'synset_3', part_of_speech: 'v', language: 'en', lexicon: 'oewn' }, // No ILI
    ],
    definitions: [
        { id: 'def_1', synset_id: 'synset_1', text: 'marked by good fortune' },
        { id: 'def_2', synset_id: 'synset_2', text: 'a feeling of great pleasure and happiness.' },
        { id: 'def_3', synset_id: 'synset_3', text: 'move at a speed faster than a walk' },
    ]
  };

  const getResults = (sql: string, params: readonly any[] = []) => {
    // Handle counts for statistics
    if (sql.includes('count')) {
      if (sql.includes('ili is not null')) return [{ count: demoData.synsets.filter(s => !!s.ili).length }];
      if (sql.includes('"words"')) return [{ count: demoData.words.length }];
      if (sql.includes('"synsets"')) return [{ count: demoData.synsets.length }];
      if (sql.includes('"senses"')) return [{ count: demoData.senses.length }];
      if (sql.includes('"lexicons"')) return [{ count: demoData.lexicons.length }];
      return [{ count: 0 }];
    }

    // Crude filtering to make E2E tests pass
    if (sql.includes('from "words"') && params.includes('happy')) {
      return demoData.words.filter(w => w.lemma === 'happy');
    }
    if (sql.includes('from "synsets"') && params.includes('joy')) {
      const joyWord = demoData.words.find(w => w.lemma === 'joy');
      const joySense = demoData.senses.find(s => s.word_id === joyWord?.id);
      return demoData.synsets.filter(s => s.id === joySense?.synset_id);
    }
    
    // Fallback logic
    if (sql.includes('from "definitions"')) return demoData.definitions.filter(d => demoData.synsets.some(s => s.id === d.synset_id));
    if (sql.includes('from "words"')) return demoData.words;
    if (sql.includes('from "synsets"')) return demoData.synsets;
    if (sql.includes('from "senses"')) return demoData.senses;
    if (sql.includes('from "lexicons"')) return demoData.lexicons;

    return [];
  };

  return {
    exec: vi.fn((sqlOrOptions: string | { sql: string; bind?: any[] }) => {
      const sql = typeof sqlOrOptions === 'string' ? sqlOrOptions : sqlOrOptions.sql;
      const params = (typeof sqlOrOptions !== 'string' && sqlOrOptions.bind) || [];
      if (sql.toUpperCase().startsWith('CREATE TABLE') || sql.toUpperCase().startsWith('INSERT')) {
        return [];
      }
      return getResults(sql, params);
    }),
    prepare: vi.fn((sqlOrOptions: string | { sql: string }) => {
      const sql = typeof sqlOrOptions === 'string' ? sqlOrOptions : sqlOrOptions.sql;
      const boundParams: any[] = [];
      let stepIndex = -1;

      return {
        bind: vi.fn((index: number, value: any) => {
          boundParams[index - 1] = value;
        }),
        step: vi.fn(() => {
          const results = getResults(sql, boundParams);
          stepIndex++;
          return stepIndex < results.length;
        }),
        getAsObject: vi.fn(() => getResults(sql, boundParams)[stepIndex]),
        all: vi.fn(() => getResults(sql, boundParams)),
        get: vi.fn(() => getResults(sql, boundParams)[0]),
        run: vi.fn(() => ({ changes: 1, lastInsertRowid: 1 })),
        free: vi.fn(),
      };
    }),
    close: vi.fn(),
    export: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
    changes: vi.fn(() => 1),
    sqlite3: {
      capi: {
        sqlite3_last_insert_rowid: vi.fn(() => 1),
      },
    },
  };
};

const mockSqliteWasm = {
  // New oo1 API (current implementation)
  oo1: {
    DB: vi.fn().mockImplementation(createMockDb),
    OpfsDb: vi.fn().mockImplementation(createMockDb)
  },
  
  opfs: {
    Vfs: vi.fn().mockImplementation(() => ({})),
    registerVfs: vi.fn()
  }
};

// Mock dynamic imports for @sqlite.org/sqlite-wasm
vi.mock('@sqlite.org/sqlite-wasm', () => {
  const mock = {
    ...mockSqliteWasm,
    default: mockSqliteWasm
  };
  return mock;
});

// Mock browser APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
});

// Mock fetch for @sqlite.org/sqlite-wasm loading
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: {
    get: vi.fn((name: string) => {
      if (name === 'content-length') {
        return '1024';
      }
      return null;
    })
  },
  body: {
    getReader: vi.fn(() => ({
      read: vi.fn().mockResolvedValue({
        done: true,
        value: new Uint8Array([1, 2, 3, 4])
      })
    }))
  },
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
});

// Mock console methods
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// Mock File System Access API (for OPFS)
Object.defineProperty(window, 'showDirectoryPicker', {
  value: vi.fn().mockResolvedValue({
    getFileHandle: vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn()
      })
    })
  }),
  writable: true
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn().mockReturnValue({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn(),
          get: vi.fn(),
          delete: vi.fn()
        })
      })
    },
    onsuccess: vi.fn(),
    onerror: vi.fn()
  })
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  _data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage._data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage._data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage._data[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage._data = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock sessionStorage
const mockSessionStorage = {
  _data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockSessionStorage._data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage._data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage._data[key];
  }),
  clear: vi.fn(() => {
    mockSessionStorage._data = {};
  })
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Export mock for use in tests
export { mockSqliteWasm }; 

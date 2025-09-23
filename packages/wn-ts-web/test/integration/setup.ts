/**
 * Browser-specific test setup
 * 
 * This setup file is used for browser tests and doesn't mock
 * browser APIs that already exist in the browser environment.
 */

import { vi } from 'vitest';

// Integration tests use real SQLite WASM database, no mock needed

// For integration tests, use the real SQLite WASM database
// Integration tests should test against real database with mock data
vi.mock('@sqlite.org/sqlite-wasm', async (importOriginal) => {
  // Always use the real SQLite WASM for integration tests
  try {
    const original = await importOriginal<typeof import('@sqlite.org/sqlite-wasm')>();
    const sqlite3 = await original.default();
    return {
      default: () => Promise.resolve(sqlite3),
    };
  } catch (e) {
    console.error('Failed to load original @sqlite.org/sqlite-wasm for integration test', e);
    // Return a dummy mock to avoid crashing the test runner completely
    return {
      default: () => Promise.reject(new Error('Failed to load SQLite WASM for integration test')),
    };
  }
});


// Mock console methods (but don't override if they exist)
if (!window.console.log) {
  window.console.log = vi.fn();
}
if (!window.console.error) {
  window.console.error = vi.fn();
}
if (!window.console.warn) {
  window.console.warn = vi.fn();
}
if (!window.console.info) {
  window.console.info = vi.fn();
}

// Mock isSecureContext for browser tests
if (typeof window.isSecureContext === 'undefined') {
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
}

// Mock navigator.storage for consistent testing
const mockFileHandle = {
  kind: 'file' as const,
  getFile: vi.fn().mockResolvedValue({
    name: 'test-file.db',
    size: 1024,
    lastModified: Date.now(),
    type: 'application/octet-stream',
  }),
  createWritable: vi.fn().mockResolvedValue({
    write: vi.fn(),
    close: vi.fn(),
  }),
  createSyncAccessHandle: vi.fn().mockResolvedValue({
    read: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    write: vi.fn(),
    close: vi.fn(),
  }),
};

async function* mockDirectoryEntries(): AsyncGenerator<[string, typeof mockFileHandle]> {
  yield ['test-file.db', mockFileHandle];
}

const mockDirectoryHandle = {
  kind: 'directory' as const,
  getFileHandle: vi.fn().mockResolvedValue(mockFileHandle),
  removeEntry: vi.fn().mockResolvedValue(undefined),
  entries: vi.fn(mockDirectoryEntries),
};

if (!('storage' in navigator)) {
  Object.defineProperty(navigator, 'storage', { value: {}, writable: true });
}

Object.assign(navigator.storage, {
  getDirectory: vi.fn().mockResolvedValue(mockDirectoryHandle),
  estimate: vi.fn().mockResolvedValue({
    quota: 1000000000,
    usage: 1000000,
    usageDetails: {
      indexedDB: 500000,
      caches: 500000,
    },
  }),
});

// Mock SharedArrayBuffer if it doesn't exist
if (typeof SharedArrayBuffer === 'undefined') {
  (window as any).SharedArrayBuffer = class MockSharedArrayBuffer extends ArrayBuffer {
    constructor(length: number) {
      super(length);
    }
  };
}

// Mock performance API if it doesn't exist
if (typeof performance === 'undefined') {
  (window as any).performance = {
    now: vi.fn(() => Date.now())
  };
}

// Mock WebAssembly if it doesn't exist
if (typeof WebAssembly === 'undefined') {
  (window as any).WebAssembly = {
    instantiate: vi.fn().mockResolvedValue({
      instance: {
        exports: {}
      }
    })
  };
}

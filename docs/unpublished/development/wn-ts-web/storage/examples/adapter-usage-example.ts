/**
 * Storage Adapter Usage Examples
 * 
 * This file demonstrates how to use the new storage adapter pattern
 * for hot-swappable database backends.
 */

import { WebDatabase, StorageAdapterFactory } from '../index.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

/**
 * Example 1: Basic usage with auto-detection
 */
export async function basicUsageExample(sqlModule: Sqlite3Static) {
  // Create database with auto-detection of best available storage
  const database = new WebDatabase();
  
  await database.initializeWithModule(sqlModule);
  await database.createDatabase();
  
  console.log('Storage info:', database.getStorageInfo());
  // Output: { type: 'opfs', persistent: true, path: '/wordnet.sqlite3', available: true }
  
  return database;
}

/**
 * Example 2: Explicit storage preference
 */
export async function explicitStorageExample(sqlModule: Sqlite3Static) {
  // Prefer OPFS, fallback to memory if OPFS fails
  const database = new WebDatabase({
    preferredAdapter: 'opfs',
    adapterConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      verbose: true
    }
  });
  
  await database.initializeWithModule(sqlModule);
  await database.createDatabase();
  
  return database;
}

/**
 * Example 3: Hot-swapping between storage adapters
 */
export async function hotSwapExample(sqlModule: Sqlite3Static) {
  const database = new WebDatabase();
  await database.initializeWithModule(sqlModule);
  await database.createDatabase();
  
  console.log('Initial storage:', database.getStorageInfo().type);
  
  // Switch to IndexedDB
  await database.switchAdapter('indexeddb');
  console.log('Switched to:', database.getStorageInfo().type);
  
  // Switch to memory storage
  await database.switchAdapter('memory');
  console.log('Switched to:', database.getStorageInfo().type);
  
  return database;
}

/**
 * Example 4: Using adapters directly
 */
export async function directAdapterExample(sqlModule: Sqlite3Static) {
  // Get the best available adapter
  const adapter = StorageAdapterFactory.getBestAvailableAdapter();
  console.log('Best adapter:', adapter.getName());
  
  // Initialize and use the adapter
  await adapter.initialize(sqlModule);
  await adapter.createDatabase();
  
  console.log('Storage info:', adapter.getStorageInfo());
  
  return adapter;
}

/**
 * Example 5: Testing with different adapters
 */
export async function testingExample(sqlModule: Sqlite3Static) {
  const adapters = StorageAdapterFactory.getAvailableAdapters();
  
  for (const adapter of adapters) {
    console.log(`Testing adapter: ${adapter.getName()}`);
    console.log(`Available: ${adapter.isAvailable()}`);
    
    if (adapter.isAvailable()) {
      try {
        await adapter.initialize(sqlModule);
        await adapter.createDatabase();
        console.log(`✅ ${adapter.getName()} works!`);
        adapter.close();
      } catch (error) {
        console.log(`❌ ${adapter.getName()} failed:`, error);
      }
    }
  }
}

/**
 * Example 6: Migration from old WebDatabase
 */
export async function migrationExample(sqlModule: Sqlite3Static) {
  // Old way (still works)
  const oldDatabase = new WebDatabase();
  await oldDatabase.initializeWithModule(sqlModule);
  await oldDatabase.createDatabase();
  
  // New way (recommended)
  const newDatabase = new WebDatabase({
    preferredAdapter: 'opfs',
    adapterConfig: {
      maxRetries: 5,
      retryDelay: 1000,
      verbose: true
    }
  });
  
  await newDatabase.initializeWithModule(sqlModule);
  await newDatabase.createDatabase();
  
  // Both have the same interface
  console.log('Old database storage:', oldDatabase.getStorageInfo());
  console.log('New database storage:', newDatabase.getStorageInfo());
  
  return { oldDatabase, newDatabase };
}

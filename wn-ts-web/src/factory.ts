/**
 * Factory function for creating WebWordnet instances
 */

import type { WordnetOptions } from 'wn-ts-core';
import { WebWordnet } from './client/submodules/web-wordnet.js';
import { DataLoader } from './data-loader.js';
import sqlite3InitModule, { type Sqlite3Static }  from '@sqlite.org/sqlite-wasm';
 
export interface CreateWebWordnetOptions {
  sqliteWasmModule?: Sqlite3Static;
  lexicon?: string;
  options?: WordnetOptions;
}

/**
 * Create a WebWordnet instance for browser use
 * Uses @sqlite.org/sqlite-wasm for modern browser optimization
 */
export async function createWebWordnet(options: CreateWebWordnetOptions = {}): Promise<WebWordnet> {
  const { sqliteWasmModule, lexicon = '*', options: wordnetOptions = {} } = options;

  // Create database and wordnet instances
  const wordnet = new WebWordnet(lexicon, wordnetOptions);

  // Initialize with SQLite WASM module if provided
  if (sqliteWasmModule) {
    console.log('🔍 Factory: Initializing WebWordnet with SQLite WASM module');
    await wordnet.initialize(sqliteWasmModule);
    console.log('🔍 Factory: WebWordnet initialization completed');
  } else {
    console.log('🔍 Factory: No SQLite WASM module provided, skipping initialization');
  }

  return wordnet;
}

/**
 * Create a DataLoader for downloading and loading WordNet data
 */
export async function createDataLoader(wordnet: WebWordnet): Promise<DataLoader> {
  // Access the database from the wordnet instance using the proper getter
  const database = wordnet.getDatabase();
  return new DataLoader(database, wordnet);
}

/**
 * Convenience function to create a fully configured WordNet instance
 * Uses @sqlite.org/sqlite-wasm for optimal browser performance
 */
export async function createWordNetInstance(
  lexicon: string = 'oewn:2024',
  options: WordnetOptions = {}
): Promise<{ wordnet: WebWordnet; dataLoader: DataLoader }> {
  // I'm guessing that we should allow the user when they create the wordnet instance to bring their own sqlite3 module
  // Use @sqlite.org/sqlite-wasm for modern browser optimization
  let sqlModule: Sqlite3Static;
  try {
    sqlModule = await sqlite3InitModule({
      // locateFile: (file: string) => {
      //   // Use local WASM file from node_modules
      //   if (file === 'sqlite3.wasm') {
      //     return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
      //   }
      //   return file;
      // },

      // Note: I haven't figured out what this actually does yet
      print: (msg: string) => {
        console.log("sqlite3InitModule:", msg);
      },
      printErr: (msg: string) => {
        console.error("sqlite3InitModule:", msg);
      }
    });
    console.log('✅ Using @sqlite.org/sqlite-wasm (modern SQLite with OPFS support)');
  } catch (error) {
    console.error('❌ Failed to load @sqlite.org/sqlite-wasm:', error);
    throw new Error('@sqlite.org/sqlite-wasm is required for wn-ts-web. Please ensure it is installed.');
  }

  const wordnet = await createWebWordnet({
    sqliteWasmModule: sqlModule,
    lexicon,
    options
  });

  const dataLoader = await createDataLoader(wordnet);

  return { wordnet, dataLoader };
}

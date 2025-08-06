/**
 * Browser-compatible database implementation using @sqlite.org/sqlite-wasm
 * Optimized for modern browsers with OPFS support
 */

// Import the correct SQLite WASM types
import type { SqliteWasmDatabase } from './database/types/sqlite-wasm.js';

export class WebDatabase {
  private db: any = null;
  private sqlModule: any = null;
  private _initialized = false;
  private useOPFS = false;

  constructor() {
    // Will be initialized with @sqlite.org/sqlite-wasm
  }

  // Initialize with @sqlite.org/sqlite-wasm module
  async initializeWithModule(sqlModule: any): Promise<void> {
    this.sqlModule = sqlModule;
    
    // Enable OPFS support for persistent storage
    if ('opfs' in sqlModule && sqlModule.opfs) {
      try {
        // Register OPFS VFS for persistent storage
        const vfs = new sqlModule.opfs.Vfs();
        sqlModule.opfs.registerVfs(vfs);
        this.useOPFS = true;
        console.log('✅ OPFS support enabled for persistent storage');
      } catch (error) {
        // This is expected in main thread - OPFS requires worker thread
        console.log('ℹ️ OPFS not available in main thread (requires worker thread)');
        this.useOPFS = false;
      }
    }
    
    this._initialized = true;
  }

  // Interface-compatible initialize method
  async initialize(): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('SQL module not initialized. Call initializeWithModule() first.');
    }
    // Already initialized in initializeWithModule
  }

  isInitialized(): boolean {
    return this._initialized && this.db !== null;
  }

  async loadDatabase(data: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('SQL module not initialized. Call initializeWithModule() first.');
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Create a new in-memory database from the provided buffer.
    // The data is a Uint8Array representing an SQLite database file.
    // Try the new API first, fall back to oo1 if needed
    try {
      this.db = new this.sqlModule.Database(data);
    } catch (error) {
      // Fall back to oo1 API if Database constructor doesn't exist
      if (this.sqlModule.oo1 && this.sqlModule.oo1.DB) {
        this.db = new this.sqlModule.oo1.DB(data);
      } else {
        throw new Error('No compatible database constructor found in SQLite WASM module');
      }
    }
  }

  async createDatabase(data?: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('SQL module not initialized');
    }

    // Try the new API first, fall back to oo1 if needed
    try {
      if (this.useOPFS && 'opfs' in this.sqlModule) {
        // Use OPFS for persistent storage
        this.db = new this.sqlModule.Database('/wordnet.sqlite3');
      } else {
        // Use in-memory database
        this.db = new this.sqlModule.Database(':memory:');
      }
    } catch (error) {
      // Fall back to oo1 API if Database constructor doesn't exist
      if (this.sqlModule.oo1 && this.sqlModule.oo1.DB) {
        if (this.useOPFS && this.sqlModule.oo1.OpfsDb) {
          this.db = new this.sqlModule.oo1.OpfsDb('/wordnet.sqlite3');
        } else {
          this.db = new this.sqlModule.oo1.DB(':memory:', 'ct');
        }
      } else {
        throw new Error('No compatible database constructor found in SQLite WASM module');
      }
    }
    
    await this.createTables();
    
    // Disable SQLite tracing to reduce console noise
    try {
      this.db.exec('PRAGMA trace = 0');
      this.db.exec('PRAGMA vdbe_trace = 0');
    } catch (error) {
      // Ignore if tracing is not available
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Use the exact same schema as wn-ts-node
    const schema = `
      CREATE TABLE IF NOT EXISTS lexicons (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        language TEXT NOT NULL,
        email TEXT,
        license TEXT,
        version TEXT,
        url TEXT,
        citation TEXT,
        logo TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        lemma TEXT NOT NULL,
        part_of_speech TEXT NOT NULL,
        language TEXT NOT NULL,
        lexicon TEXT NOT NULL,
        FOREIGN KEY (lexicon) REFERENCES lexicons (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        written_form TEXT NOT NULL,
        script TEXT,
        tag TEXT,
        FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS synsets (
        id TEXT PRIMARY KEY,
        ili TEXT,
        part_of_speech TEXT NOT NULL,
        language TEXT NOT NULL,
        lexicon TEXT NOT NULL,
        FOREIGN KEY (lexicon) REFERENCES lexicons (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS senses (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        synset_id TEXT NOT NULL,
        source TEXT,
        sensekey TEXT,
        adjposition TEXT,
        subcategory TEXT,
        domain TEXT,
        register TEXT,
        FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE,
        FOREIGN KEY (synset_id) REFERENCES synsets (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS definitions (
        id TEXT PRIMARY KEY,
        synset_id TEXT NOT NULL,
        language TEXT NOT NULL,
        text TEXT NOT NULL,
        source TEXT,
        FOREIGN KEY (synset_id) REFERENCES synsets (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT
      );

      CREATE TABLE IF NOT EXISTS examples (
        id TEXT PRIMARY KEY,
        synset_id TEXT,
        sense_id TEXT,
        language TEXT NOT NULL,
        text TEXT NOT NULL,
        source TEXT,
        FOREIGN KEY (synset_id) REFERENCES synsets (id) ON DELETE CASCADE,
        FOREIGN KEY (sense_id) REFERENCES senses (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ilis (
        id TEXT PRIMARY KEY,
        definition TEXT,
        status TEXT NOT NULL,
        superseded_by TEXT,
        note TEXT,
        meta TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_words_lemma ON words (lemma);
      CREATE INDEX IF NOT EXISTS idx_words_language ON words (language);
      CREATE INDEX IF NOT EXISTS idx_words_lexicon ON words (lexicon);
      CREATE INDEX IF NOT EXISTS idx_synsets_language ON synsets (language);
      CREATE INDEX IF NOT EXISTS idx_synsets_lexicon ON synsets (lexicon);
      CREATE INDEX IF NOT EXISTS idx_senses_word_id ON senses (word_id);
      CREATE INDEX IF NOT EXISTS idx_senses_synset_id ON senses (synset_id);
      CREATE INDEX IF NOT EXISTS idx_examples_synset_id ON examples (synset_id);
      CREATE INDEX IF NOT EXISTS idx_examples_sense_id ON examples (sense_id);
    `;

    // Try the new API first, fall back to oo1 if needed
    try {
      this.db.exec(schema);
    } catch (error) {
      // Fall back to oo1 API if exec doesn't work
      if (this.db.exec) {
        this.db.exec(schema);
      } else {
        throw new Error('No compatible exec method found in database');
      }
    }
  }

  run(sql: string, params: any[] = []): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // Debug logging
    console.log(`🔍 SQL: ${sql}`);
    console.log(`🔍 Params:`, params);
    
    // Try the new API first, fall back to oo1 if needed
    try {
      // Try direct exec first with parameters
      if (params.length > 0) {
        // Replace placeholders with actual values
        let finalSql = sql;
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          const placeholder = '?';
          const replacement = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
          finalSql = finalSql.replace(placeholder, replacement);
        }
        console.log(`🔍 Final SQL: ${finalSql}`);
        this.db.exec(finalSql);
      } else {
        this.db.exec(sql);
      }
    } catch (error) {
      console.log(`🔍 Exec failed, trying prepare:`, error);
      // Fall back to prepare/run if exec doesn't work
      try {
        const stmt = this.db.prepare(sql);
        try {
          if (params.length > 0) {
            console.log(`🔍 Running with params:`, params);
            stmt.run(...params);
          } else {
            stmt.run();
          }
        } finally {
          if (stmt.free) {
            stmt.free();
          }
        }
      } catch (prepareError) {
        console.log(`🔍 Prepare failed, trying exec without params:`, prepareError);
        // Last resort: try without parameters
        this.db.exec(sql);
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;
    const tables = [
      'lexicons', 'words', 'forms', 'synsets', 'senses',
      'definitions', 'relations', 'examples', 'ilis'
    ];
    for (const table of tables) {
      this.run(`DELETE FROM ${table}`);
    }
  }

  async getStatistics(): Promise<any> {
    // This is a mock-like implementation to allow DataLoader to proceed.
    // The actual getStatistics is on WebWordnet and uses Kysely.
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0,
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get the underlying SQLite WASM database instance
   * This is needed for Kysely integration
   */
  getDatabase(): any {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }
}

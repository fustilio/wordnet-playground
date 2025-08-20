import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../config.js';
import { DatabaseError } from 'wn-ts-core';

export type Database = Database.Database;

export class DatabaseManager {
  private db: Database.Database | null = null;

  private get dbPath(): string {
    return join(config.dataDirectory, 'wn.db');
  }

  initialize(): void {

    if (this.db) return;
    const dbExists = existsSync(this.dbPath);

    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('foreign_keys = ON');
      if (!dbExists) {
            
        this.createTables();
            
      }
          
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[DEBUG db.initialize] Error during DB creation:', e);
      throw e;
    }
  }

  private createTables(): void {
    if (!this.db) throw new DatabaseError('Database not initialized');
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
        pos TEXT NOT NULL,
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
        pos TEXT NOT NULL,
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

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        word_id TEXT,
        form_id TEXT,
        category TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE,
        FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS counts (
        id TEXT PRIMARY KEY,
        sense_id TEXT NOT NULL,
        value INTEGER NOT NULL,
        dc_source TEXT,
        FOREIGN KEY (sense_id) REFERENCES senses (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sense_relations (
        id TEXT PRIMARY KEY,
        sense_id TEXT NOT NULL,
        rel_type TEXT NOT NULL,
        target TEXT NOT NULL,
        dc_type TEXT,
        FOREIGN KEY (sense_id) REFERENCES senses (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS synset_relations (
        id TEXT PRIMARY KEY,
        synset_id TEXT NOT NULL,
        rel_type TEXT NOT NULL,
        target TEXT NOT NULL,
        FOREIGN KEY (synset_id) REFERENCES synsets (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ili_definitions (
        id TEXT PRIMARY KEY,
        synset_id TEXT NOT NULL,
        text TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        FOREIGN KEY (synset_id) REFERENCES synsets (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS syntactic_behaviours (
        id TEXT PRIMARY KEY,
        word_id TEXT NOT NULL,
        senses TEXT NOT NULL,
        subcategorization_frame TEXT NOT NULL,
        source TEXT DEFAULT '',
        FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
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
      CREATE INDEX IF NOT EXISTS idx_tags_word_id ON tags (word_id);
      CREATE INDEX IF NOT EXISTS idx_tags_form_id ON tags (form_id);
      CREATE INDEX IF NOT EXISTS idx_counts_sense_id ON counts (sense_id);
      CREATE INDEX IF NOT EXISTS idx_sense_relations_sense_id ON sense_relations (sense_id);
      CREATE INDEX IF NOT EXISTS idx_synset_relations_synset_id ON synset_relations (synset_id);
      CREATE INDEX IF NOT EXISTS idx_ili_definitions_synset_id ON ili_definitions (synset_id);
      CREATE INDEX IF NOT EXISTS idx_syntactic_behaviours_word_id ON syntactic_behaviours (word_id);
    `;
    this.db.exec(schema);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  run(sql: string, params: unknown[] = []): Database.RunResult {
    if (!this.db) throw new DatabaseError('Database not initialized');
    return this.db.prepare(sql).run(...params);
  }

  get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
    if (!this.db) throw new DatabaseError('Database not initialized');
    return this.db.prepare(sql).get(...params) as T;
  }

  all<T = unknown>(sql: string, params: unknown[] = []): T[] {
    if (!this.db) throw new DatabaseError('Database not initialized');
    return this.db.prepare(sql).all(...params) as T[];
  }

  transaction(fn: () => void): void {
    if (!this.db) throw new DatabaseError('Database not initialized');
    this.db.transaction(fn)();
  }

  clearConnections(): void {
    // No-op for better-sqlite3
  }

  reset(): void {
    this.close();
    this.db = null;
  }
}

export const db = new DatabaseManager();

export function isDatabaseLocked(): boolean {
  const dbPath = join(config.dataDirectory, 'wn.db');
  if (!existsSync(dbPath)) return false;
  try {
    const db = new Database(dbPath, { fileMustExist: true, timeout: 100 });
    db.prepare('BEGIN EXCLUSIVE').run();
    db.prepare('ROLLBACK').run();
    db.close();
    return false;
  } catch (e: any) {
    if (e && e.message && e.message.includes('database is locked')) {
      return true;
    }
    throw e;
  }
}

// Gracefully close the database on process exit or unhandled errors
const gracefulShutdown = () => {
  try {
    db.close();
    // On Windows, add a short delay to help release file handles
    if (process.platform === 'win32') {
      const waitUntil = Date.now() + 200;
      while (Date.now() < waitUntil) {}
    }
  } catch (err) {
    // Ignore errors if already closed
  }
};

// These handlers help avoid persistent DB locks if the process is interrupted or crashes.
process.on('exit', gracefulShutdown);
process.on('SIGINT', () => { gracefulShutdown(); process.exit(0); });
process.on('SIGTERM', () => { gracefulShutdown(); process.exit(0); });
process.on('uncaughtException', (err) => { gracefulShutdown(); throw err; });
process.on('unhandledRejection', (reason) => { gracefulShutdown(); throw reason; });

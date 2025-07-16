import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../config.js';
import { DatabaseError } from '../types.js';

export type Database = Database.Database;

export class DatabaseManager {
  private db: Database.Database | null = null;

  private get dbPath(): string {
    return join(config.dataDirectory, 'wn.db');
  }

  initialize(): void {
    if (this.db) return;
    const dbExists = existsSync(this.dbPath);
    this.db = new Database(this.dbPath);
    this.db.pragma('foreign_keys = ON');
    if (!dbExists) {
      this.createTables();
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

// Gracefully close the database on process exit or unhandled errors
const gracefulShutdown = () => {
  try {
    db.close();
  } catch (err) {
    // Ignore errors if already closed
  }
};

process.on('exit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', gracefulShutdown);
process.on('unhandledRejection', gracefulShutdown);

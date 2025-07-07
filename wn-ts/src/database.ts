import Database from 'sqlite3';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { DatabaseError } from './types.js';

export class DatabaseManager {
  private db: Database.Database | null = null;

  private get dbPath(): string {
    return join(config.dataDirectory, 'wn.db');
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const dbExists = existsSync(this.dbPath);
      
      this.db = new Database.Database(this.dbPath, (err) => {
        if (err) {
          reject(new DatabaseError(`Failed to open database: ${err.message}`));
          return;
        }

        this.db!.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(new DatabaseError(`Failed to enable foreign keys: ${err.message}`));
            return;
          }
          if (!dbExists) {
            this.createTables()
              .then(() => resolve())
              .catch(reject);
          } else {
            resolve();
          }
        });
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

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

    return new Promise((resolve, reject) => {
      this.db!.exec(schema, (err) => {
        if (err) {
          reject(new DatabaseError(`Failed to create tables: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(new DatabaseError(`Failed to close database: ${err.message}`));
          } else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<Database.RunResult> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(new DatabaseError(`Database operation failed: ${err.message}`));
        } else {
          resolve(this);
        }
      });
    });
  }

  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(new DatabaseError(`Database query failed: ${err.message}`));
        } else {
          resolve(row as T);
        }
      });
    });
  }

  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(new DatabaseError(`Database query failed: ${err.message}`));
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  clearConnections(): void {
    // This is a placeholder for compatibility with the Python version
    // In Node.js, we don't need to explicitly clear connections
  }

  async reset(): Promise<void> {
    await this.close();
    this.db = null;
  }
}

export const db = new DatabaseManager();

// Gracefully close the database on process exit or unhandled errors
const gracefulShutdown = async () => {
  try {
    await db.close();
  } catch (err) {
    // Ignore errors if already closed
  }
};

process.on('exit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', gracefulShutdown);
process.on('unhandledRejection', gracefulShutdown); 

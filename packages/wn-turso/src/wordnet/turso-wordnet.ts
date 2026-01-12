/**
 * TursoWordnet - Main user-facing class for WordNet queries via Turso
 */

import type { Synset, Word, Sense, Lexicon, PartOfSpeech } from 'wn-ts-core';
import { TursoDatabase } from '../database/turso-database.js';
import type { TursoDatabaseConfig } from '../config.js';

export interface TursoWordnetOptions {
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * TursoWordnet provides a high-level interface for WordNet queries
 * using Turso as the database backend.
 *
 * @example
 * ```typescript
 * const wn = new TursoWordnet({
 *   url: 'libsql://db-org.turso.io',
 *   authToken: process.env.TURSO_AUTH_TOKEN,
 *   mode: 'remote',
 * });
 *
 * await wn.initialize();
 * const synsets = await wn.synsets({ form: 'computer', language: 'en' });
 * await wn.close();
 * ```
 */
export class TursoWordnet {
  private database?: TursoDatabase;
  private config: TursoDatabaseConfig;

  constructor(config: TursoDatabaseConfig, _options: TursoWordnetOptions = {}) {
    this.config = config;
    // Options reserved for future use (e.g., verbose logging)
  }

  /**
   * Initialize the WordNet connection
   */
  async initialize(): Promise<void> {
    this.database = new TursoDatabase(this.config);
    await this.database.initialize();
  }

  /**
   * Query synsets
   */
  async synsets(options?: {
    form?: string;
    pos?: PartOfSpeech;
    language?: string;
  }): Promise<Synset[]> {
    return this.getQueryService().getSynsets(options);
  }

  /**
   * Query words
   */
  async words(options?: {
    form?: string;
    pos?: PartOfSpeech;
    language?: string;
  }): Promise<Word[]> {
    return this.getQueryService().getWords(options);
  }

  /**
   * Query senses
   */
  async senses(options?: {
    wordIdOrForm?: string;
  }): Promise<Sense[]> {
    return this.getQueryService().getSenses(options);
  }

  /**
   * Get all lexicons
   */
  async lexicons(): Promise<Lexicon[]> {
    return this.getQueryService().getLexicons();
  }

  /**
   * Get lemmas for a synset
   */
  async getSynsetLemmas(synsetId: string): Promise<string[]> {
    const words = await this.getQueryService().getWordsBySynsetAndLanguage(
      synsetId
    );
    return words.map((w) => w.lemma);
  }

  /**
   * Sync embedded replica with remote (only for embedded mode)
   */
  async sync(): Promise<void> {
    if (!this.database) {
      throw new Error('Not initialized');
    }
    await this.database.sync();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.database?.isInitialized() ?? false;
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = undefined;
    }
  }

  /**
   * Get the underlying database instance
   */
  getDatabase(): TursoDatabase {
    if (!this.database) {
      throw new Error('Not initialized');
    }
    return this.database;
  }

  private getQueryService() {
    if (!this.database) {
      throw new Error('Not initialized');
    }
    return this.database.getQueryService();
  }
}

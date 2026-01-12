/**
 * Turso query service extending the shared BaseKyselyQueryService
 */

import type { Kysely } from 'kysely';
import {
  BaseKyselyQueryService,
  SchemaBuilder,
  DatabaseUtils,
  type Database,
  type QueryStrategy,
} from 'wn-ts-core/shared';

export interface TursoQueryServiceOptions {
  strategy?: QueryStrategy;
}

/**
 * Turso-specific query service
 * Inherits all query methods from BaseKyselyQueryService
 */
export class TursoQueryService extends BaseKyselyQueryService {
  constructor(db: Kysely<Database>, options?: TursoQueryServiceOptions) {
    super(db, options);
  }

  /**
   * Create all tables in the database
   */
  async createTables(): Promise<void> {
    await SchemaBuilder.createTables(this.db);
    await SchemaBuilder.migrateSchema(this.db);
    await SchemaBuilder.createIndexes(this.db);
  }

  /**
   * Delete a lexicon and all its data
   */
  async deleteLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteLexicon(this.db, lexiconId);
  }

  /**
   * Delete all words for a lexicon
   */
  async deleteWordsByLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteWordsByLexicon(this.db, lexiconId);
  }

  /**
   * Delete all synsets for a lexicon
   */
  async deleteSynsetsByLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteSynsetsByLexicon(this.db, lexiconId);
  }
}

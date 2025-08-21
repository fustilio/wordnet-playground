/**
 * Kysely Query Service for wn-ts-node
 * 
 * This service extends the shared base query service and adds Node.js-specific functionality.
 */

import { Kysely } from 'kysely';
import { BaseKyselyQueryService, SchemaBuilder, DatabaseUtils } from 'wn-ts-core';
import type { Database } from './types/database.js';

export class KyselyQueryService extends BaseKyselyQueryService {
  constructor(db: Kysely<Database>) {
    super(db);
  }

  // Implement the abstract createTables method using shared SchemaBuilder
  async createTables(): Promise<void> {
    await SchemaBuilder.createTables(this.db);
    await SchemaBuilder.createIndexes(this.db);
  }

  // Node.js-specific methods can be added here
  
  // Delete operations for data management - now using shared utilities
  async deleteLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteLexicon(this.db, lexiconId);
  }

  async deleteWordsByLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteWordsByLexicon(this.db, lexiconId);
  }

  async deleteSynsetsByLexicon(lexiconId: string): Promise<void> {
    return DatabaseUtils.deleteSynsetsByLexicon(this.db, lexiconId);
  }

  // Additional Node.js-specific methods can be added here
  // For example, file system operations, system-specific optimizations, etc.
}

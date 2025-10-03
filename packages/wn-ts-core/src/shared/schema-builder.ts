/**
 * Shared database schema builder for wn-ts ecosystem
 * 
 * This provides common schema creation methods that both Node.js and Web implementations
 * can use, eliminating duplication across packages.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../types/database.js';
import {
  createTables as createTablesMutation,
  createIndexes as createIndexesMutation,
  migrateSchema as migrateSchemaMutation
} from '../modules/database-operations/mutations/schema-mutations.js';

/**
 * Builds the complete WordNet database schema
 */
export class SchemaBuilder {
  /**
   * Create all tables in the correct order to respect foreign key constraints
   */
  static async createTables(db: Kysely<Database>): Promise<void> {
    return createTablesMutation(db);
  }

  /**
   * Create all indexes for optimal performance
   */
  static async createIndexes(db: Kysely<Database>): Promise<void> {
    return createIndexesMutation(db);
  }

  /**
   * Migrate existing database schema to add missing columns
   */
  static async migrateSchema(db: Kysely<Database>): Promise<void> {
    return migrateSchemaMutation(db);
  }
}
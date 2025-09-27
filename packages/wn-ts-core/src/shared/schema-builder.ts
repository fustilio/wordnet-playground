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
  createIndexes as createIndexesMutation
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

  // Legacy method - kept for reference but not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createIndexesLegacy(db: Kysely<Database>): Promise<void> {
    const schema = db.schema;

    // Index on words table
    await schema
      .createIndex('idx_words_lemma')
      .ifNotExists()
      .on('words')
      .column('lemma')
      .execute();

    await schema
      .createIndex('idx_words_language')
      .ifNotExists()
      .on('words')
      .column('language')
      .execute();

    await schema
      .createIndex('idx_words_lexicon')
      .ifNotExists()
      .on('words')
      .column('lexicon')
      .execute();

    await schema
      .createIndex('idx_words_pos')
      .ifNotExists()
      .on('words')
      .column('pos')
      .execute();

    // Index on synsets table
    await schema
      .createIndex('idx_synsets_language')
      .ifNotExists()
      .on('synsets')
      .column('language')
      .execute();

    await schema
      .createIndex('idx_synsets_lexicon')
      .ifNotExists()
      .on('synsets')
      .column('lexicon')
      .execute();

    await schema
      .createIndex('idx_synsets_ili')
      .ifNotExists()
      .on('synsets')
      .column('ili')
      .execute();

    // Index on senses table
    await schema
      .createIndex('idx_senses_word_id')
      .ifNotExists()
      .on('senses')
      .column('word_id')
      .execute();

    await schema
      .createIndex('idx_senses_synset_id')
      .ifNotExists()
      .on('senses')
      .column('synset_id')
      .execute();

    // Index on forms table
    await schema
      .createIndex('idx_forms_word_id')
      .ifNotExists()
      .on('forms')
      .column('word_id')
      .execute();

    await schema
      .createIndex('idx_forms_written_form')
      .ifNotExists()
      .on('forms')
      .column('written_form')
      .execute();

    // Index on definitions table
    await schema
      .createIndex('idx_definitions_synset_id')
      .ifNotExists()
      .on('definitions')
      .column('synset_id')
      .execute();

    // Index on examples table
    await schema
      .createIndex('idx_examples_synset_id')
      .ifNotExists()
      .on('examples')
      .column('synset_id')
      .execute();

    await schema
      .createIndex('idx_examples_sense_id')
      .ifNotExists()
      .on('examples')
      .column('sense_id')
      .execute();

    // Index on relations table
    await schema
      .createIndex('idx_relations_source_id')
      .ifNotExists()
      .on('relations')
      .column('source_id')
      .execute();

    await schema
      .createIndex('idx_relations_target_id')
      .ifNotExists()
      .on('relations')
      .column('target_id')
      .execute();

    await schema
      .createIndex('idx_relations_type')
      .ifNotExists()
      .on('relations')
      .column('type')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createLexiconsTable(schema: any): Promise<void> {
    await schema.createTable('lexicons').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('label', 'text', (c: any) => c.notNull())
      .addColumn('language', 'text', (c: any) => c.notNull())
      .addColumn('email', 'text')
      .addColumn('license', 'text')
      .addColumn('version', 'text')
      .addColumn('url', 'text')
      .addColumn('citation', 'text')
      .addColumn('logo', 'text')
      .addColumn('metadata', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createWordsTable(schema: any): Promise<void> {
    await schema.createTable('words').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('lemma', 'text', (c: any) => c.notNull())
      .addColumn('pos', 'text', (c: any) => c.notNull())
      .addColumn('language', 'text', (c: any) => c.notNull())
      .addColumn('lexicon', 'text', (c: any) => c.notNull().references('lexicons.id').onDelete('cascade'))
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createFormsTable(schema: any): Promise<void> {
    await schema.createTable('forms').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('word_id', 'text', (c: any) => c.notNull().references('words.id').onDelete('cascade'))
      .addColumn('written_form', 'text', (c: any) => c.notNull())
      .addColumn('script', 'text')
      .addColumn('tag', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createSynsetsTable(schema: any): Promise<void> {
    await schema.createTable('synsets').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('ili', 'text')
      .addColumn('pos', 'text', (c: any) => c.notNull())
      .addColumn('language', 'text', (c: any) => c.notNull())
      .addColumn('lexicon', 'text', (c: any) => c.notNull().references('lexicons.id').onDelete('cascade'))
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createSensesTable(schema: any): Promise<void> {
    await schema.createTable('senses').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('word_id', 'text', (c: any) => c.notNull().references('words.id').onDelete('cascade'))
      .addColumn('synset_id', 'text', (c: any) => c.notNull().references('synsets.id').onDelete('cascade'))
      .addColumn('source', 'text')
      .addColumn('sensekey', 'text')
      .addColumn('adjposition', 'text')
      .addColumn('subcategory', 'text')
      .addColumn('domain', 'text')
      .addColumn('register', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createDefinitionsTable(schema: any): Promise<void> {
    await schema.createTable('definitions').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('synset_id', 'text', (c: any) => c.notNull().references('synsets.id').onDelete('cascade'))
      .addColumn('language', 'text', (c: any) => c.notNull())
      .addColumn('text', 'text', (c: any) => c.notNull())
      .addColumn('source', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createRelationsTable(schema: any): Promise<void> {
    await schema.createTable('relations').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('source_id', 'text', (c: any) => c.notNull())
      .addColumn('target_id', 'text', (c: any) => c.notNull())
      .addColumn('type', 'text', (c: any) => c.notNull())
      .addColumn('source', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createExamplesTable(schema: any): Promise<void> {
    await schema.createTable('examples').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('synset_id', 'text', (c: any) => c.references('synsets.id').onDelete('cascade'))
      .addColumn('sense_id', 'text', (c: any) => c.references('senses.id').onDelete('cascade'))
      .addColumn('language', 'text', (c: any) => c.notNull())
      .addColumn('text', 'text', (c: any) => c.notNull())
      .addColumn('source', 'text')
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async createIlisTable(schema: any): Promise<void> {
    await schema.createTable('ilis').ifNotExists()
      .addColumn('id', 'text', (c: any) => c.primaryKey())
      .addColumn('definition', 'text')
      .addColumn('status', 'text', (c: any) => c.notNull())
      .addColumn('superseded_by', 'text')
      .addColumn('note', 'text')
      .addColumn('meta', 'text')
      .execute();
  }
}

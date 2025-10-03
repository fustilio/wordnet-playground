import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';

/**
 * Create all database tables
 */
export async function createTables(db: Kysely<Database>): Promise<void> {
  const schema = db.schema;

  // Create tables in dependency order
  await createLexiconsTable(schema);
  await createWordsTable(schema);
  await createFormsTable(schema);
  await createSynsetsTable(schema);
  await createSensesTable(schema);
  await createDefinitionsTable(schema);
  await createRelationsTable(schema);
  await createExamplesTable(schema);
  await createIlisTable(schema);
}

/**
 * Migrate existing database schema to add missing columns
 */
export async function migrateSchema(db: Kysely<Database>): Promise<void> {
  try {
    // Check if requires column exists in lexicons table
    const tableInfo = await db.introspection.getTables();
    const lexiconsTable = tableInfo.find((table: any) => table.name === 'lexicons');
    
    if (lexiconsTable) {
      const hasRequiresColumn = lexiconsTable.columns.some((col: any) => col.name === 'requires');
      if (!hasRequiresColumn) {
        // Add requires column as JSON
        await db.schema.alterTable('lexicons')
          .addColumn('requires', 'json')
          .execute();
      }
      
      // Check if metadata column exists and is JSON type
      const hasMetadataColumn = lexiconsTable.columns.some((col: any) => col.name === 'metadata');
      if (!hasMetadataColumn) {
        // Add metadata column as JSON
        await db.schema.alterTable('lexicons')
          .addColumn('metadata', 'json')
          .execute();
      }
    }
  } catch (error) {
    // If migration fails, it might be because the table doesn't exist yet
    // This is fine, the createTables function will handle it
    console.warn('Schema migration skipped:', error);
  }
}

/**
 * Create all database indexes
 */
export async function createIndexes(db: Kysely<Database>): Promise<void> {
  const schema = db.schema;

  // Create indexes for better query performance
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

  await schema
    .createIndex('idx_definitions_synset_id')
    .ifNotExists()
    .on('definitions')
    .column('synset_id')
    .execute();

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

// Private helper functions for creating individual tables

async function createLexiconsTable(schema: any): Promise<void> {
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
    .addColumn('requires', 'json')
    .addColumn('metadata', 'json')
    .execute();
}

async function createWordsTable(schema: any): Promise<void> {
  await schema.createTable('words').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('lemma', 'text', (c: any) => c.notNull())
    .addColumn('pos', 'text', (c: any) => c.notNull())
    .addColumn('language', 'text', (c: any) => c.notNull())
    .addColumn('lexicon', 'text', (c: any) => c.notNull().references('lexicons.id').onDelete('cascade'))
    .execute();
}

async function createFormsTable(schema: any): Promise<void> {
  await schema.createTable('forms').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('word_id', 'text', (c: any) => c.notNull().references('words.id').onDelete('cascade'))
    .addColumn('written_form', 'text', (c: any) => c.notNull())
    .addColumn('script', 'text')
    .addColumn('tag', 'text')
    .execute();
}

async function createSynsetsTable(schema: any): Promise<void> {
  await schema.createTable('synsets').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('ili', 'text')
    .addColumn('pos', 'text', (c: any) => c.notNull())
    .addColumn('language', 'text', (c: any) => c.notNull())
    .addColumn('lexicon', 'text', (c: any) => c.notNull().references('lexicons.id').onDelete('cascade'))
    .execute();
}

async function createSensesTable(schema: any): Promise<void> {
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

async function createDefinitionsTable(schema: any): Promise<void> {
  await schema.createTable('definitions').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('synset_id', 'text', (c: any) => c.notNull().references('synsets.id').onDelete('cascade'))
    .addColumn('language', 'text', (c: any) => c.notNull())
    .addColumn('text', 'text', (c: any) => c.notNull())
    .addColumn('source', 'text')
    .execute();
}

async function createRelationsTable(schema: any): Promise<void> {
  await schema.createTable('relations').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('source_id', 'text', (c: any) => c.notNull())
    .addColumn('target_id', 'text', (c: any) => c.notNull())
    .addColumn('type', 'text', (c: any) => c.notNull())
    .addColumn('source', 'text')
    .execute();
}

async function createExamplesTable(schema: any): Promise<void> {
  await schema.createTable('examples').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('synset_id', 'text', (c: any) => c.references('synsets.id').onDelete('cascade'))
    .addColumn('sense_id', 'text', (c: any) => c.references('senses.id').onDelete('cascade'))
    .addColumn('language', 'text', (c: any) => c.notNull())
    .addColumn('text', 'text', (c: any) => c.notNull())
    .addColumn('source', 'text')
    .execute();
}

async function createIlisTable(schema: any): Promise<void> {
  await schema.createTable('ilis').ifNotExists()
    .addColumn('id', 'text', (c: any) => c.primaryKey())
    .addColumn('definition', 'text')
    .addColumn('status', 'text', (c: any) => c.notNull())
    .addColumn('superseded_by', 'text')
    .addColumn('note', 'text')
    .addColumn('meta', 'text')
    .execute();
}

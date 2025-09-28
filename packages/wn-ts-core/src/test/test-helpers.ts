import type { Kysely } from 'kysely';
import type { Database as DatabaseSchema } from '../types/database.js';
import type { TestFixture } from './fixture-loader.js';

/**
 * Test helper functions for integration tests
 */
export class TestHelpers {
  constructor(private db: Kysely<DatabaseSchema>) {}

  /**
   * Get a random word from the database
   */
  async getRandomWord() {
    const words = await this.db.selectFrom('words').selectAll().execute();
    if (words.length === 0) {
      throw new Error('No words found in test data');
    }
    return words[0];
  }

  /**
   * Get a random word by part of speech
   */
  async getRandomWordByPos(pos: string) {
    const words = await this.db
      .selectFrom('words')
      .selectAll()
      .where('pos', '=', pos)
      .execute();
    if (words.length === 0) {
      // Fallback to any word if no words with specific POS found
      return this.getRandomWord();
    }
    return words[0];
  }

  /**
   * Get a random synset from the database
   */
  async getRandomSynset() {
    const synsets = await this.db.selectFrom('synsets').selectAll().execute();
    if (synsets.length === 0) {
      throw new Error('No synsets found in test data');
    }
    return synsets[0];
  }

  /**
   * Get a random sense from the database
   */
  async getRandomSense() {
    const senses = await this.db.selectFrom('senses').selectAll().execute();
    if (senses.length === 0) {
      throw new Error('No senses found in test data');
    }
    return senses[0];
  }

  /**
   * Get a random form from the database
   */
  async getRandomForm() {
    const forms = await this.db.selectFrom('forms').selectAll().execute();
    if (forms.length === 0) {
      throw new Error('No forms found in test data');
    }
    return forms[0];
  }

  /**
   * Get all forms for a specific word
   */
  async getFormsForWord(wordId: string) {
    return this.db
      .selectFrom('forms')
      .selectAll()
      .where('word_id', '=', wordId)
      .execute();
  }

  /**
   * Get all senses for a specific word
   */
  async getSensesForWord(wordId: string) {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('word_id', '=', wordId)
      .execute();
  }

  /**
   * Get all senses for a specific synset
   */
  async getSensesForSynset(synsetId: string) {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  /**
   * Get all definitions for a specific synset
   */
  async getDefinitionsForSynset(synsetId: string) {
    return this.db
      .selectFrom('definitions')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  /**
   * Get all examples for a specific synset
   */
  async getExamplesForSynset(synsetId: string) {
    return this.db
      .selectFrom('examples')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  /**
   * Get all relations for a specific synset
   */
  async getRelationsForSynset(synsetId: string) {
    return this.db
      .selectFrom('relations')
      .selectAll()
      .where('source_id', '=', synsetId)
      .execute();
  }

  /**
   * Get all ILIs from the database
   */
  async getAllILIs() {
    return this.db.selectFrom('ilis').selectAll().execute();
  }

  /**
   * Get all lexicons from the database
   */
  async getAllLexicons() {
    return this.db.selectFrom('lexicons').selectAll().execute();
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const [
      words,
      synsets,
      senses,
      forms,
      definitions,
      examples,
      relations,
      ilis,
      lexicons,
    ] = await Promise.all([
      this.db.selectFrom('words').select(this.db.fn.count('id').as('count')).execute(),
      this.db
        .selectFrom('synsets')
        .select(this.db.fn.count('id').as('count'))
        .execute(),
      this.db.selectFrom('senses').select(this.db.fn.count('id').as('count')).execute(),
      this.db.selectFrom('forms').select(this.db.fn.count('id').as('count')).execute(),
      this.db
        .selectFrom('definitions')
        .select(this.db.fn.count('id').as('count'))
        .execute(),
      this.db
        .selectFrom('examples')
        .select(this.db.fn.count('id').as('count'))
        .execute(),
      this.db
        .selectFrom('relations')
        .select(this.db.fn.count('id').as('count'))
        .execute(),
      this.db.selectFrom('ilis').select(this.db.fn.count('id').as('count')).execute(),
      this.db
        .selectFrom('lexicons')
        .select(this.db.fn.count('id').as('count'))
        .execute(),
    ]);

    return {
      words: words[0]?.count || 0,
      synsets: synsets[0]?.count || 0,
      senses: senses[0]?.count || 0,
      forms: forms[0]?.count || 0,
      definitions: definitions[0]?.count || 0,
      examples: examples[0]?.count || 0,
      relations: relations[0]?.count || 0,
      ilis: ilis[0]?.count || 0,
      lexicons: lexicons[0]?.count || 0,
    };
  }

  /**
   * Verify that all foreign key relationships are valid
   */
  async verifyDatabaseIntegrity() {
    const issues: string[] = [];

    // Check that all senses have valid word_id and synset_id
    const invalidSenses = await this.db
      .selectFrom('senses')
      .leftJoin('words', 'senses.word_id', 'words.id')
      .leftJoin('synsets', 'senses.synset_id', 'synsets.id')
      .where(eb => eb('words.id', 'is', null).or('synsets.id', 'is', null))
      .select('senses.id')
      .execute();

    if (invalidSenses.length > 0) {
      issues.push(`Found ${invalidSenses.length} senses with invalid foreign keys`);
    }

    // Check that all forms have valid word_id
    const invalidForms = await this.db
      .selectFrom('forms')
      .leftJoin('words', 'forms.word_id', 'words.id')
      .where('words.id', 'is', null)
      .select('forms.id')
      .execute();

    if (invalidForms.length > 0) {
      issues.push(`Found ${invalidForms.length} forms with invalid word_id`);
    }

    // Check that all definitions have valid synset_id
    const invalidDefinitions = await this.db
      .selectFrom('definitions')
      .leftJoin('synsets', 'definitions.synset_id', 'synsets.id')
      .where('synsets.id', 'is', null)
      .select('definitions.id')
      .execute();

    if (invalidDefinitions.length > 0) {
      issues.push(
        `Found ${invalidDefinitions.length} definitions with invalid synset_id`
      );
    }

    // Check that all examples have valid synset_id or sense_id
    const invalidExamples = await this.db
      .selectFrom('examples')
      .leftJoin('synsets', 'examples.synset_id', 'synsets.id')
      .leftJoin('senses', 'examples.sense_id', 'senses.id')
      .where('synsets.id', 'is', null)
      .where('senses.id', 'is', null)
      .select('examples.id')
      .execute();

    if (invalidExamples.length > 0) {
      issues.push(`Found ${invalidExamples.length} examples with invalid foreign keys`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Create a test helper instance
 */
export function createTestHelpers(db: Kysely<DatabaseSchema>) {
  return new TestHelpers(db);
}

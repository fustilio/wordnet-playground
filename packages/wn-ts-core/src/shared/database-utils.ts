/**
 * Shared database utilities for wn-ts ecosystem
 * 
 * This provides common database operations that both Node.js and Web implementations
 * can use, eliminating duplication across packages.
 */

import type { Kysely } from 'kysely';
import type { Database } from './database-types.js';

/**
 * Common database utility functions
 */
export class DatabaseUtils {
  /**
   * Delete all data from a lexicon in the correct order to respect foreign key constraints
   */
  static async deleteLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    await db.deleteFrom('forms').where('word_id', 'in', 
      db.selectFrom('words').select('id').where('lexicon', '=', lexiconId)
    ).execute();
    
    await db.deleteFrom('definitions').where('synset_id', 'in',
      db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)
    ).execute();
    
    await db.deleteFrom('relations').where((eb) => 
      eb.or([
        eb('source_id', 'in', db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)),
        eb('target_id', 'in', db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId))
      ])
    ).execute();
    
    await db.deleteFrom('examples').where('synset_id', 'in',
      db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId)
    ).execute();
    
    await db.deleteFrom('senses').where('word_id', 'in',
      db.selectFrom('words').select('id').where('lexicon', '=', lexiconId)
    ).execute();
    
    await db.deleteFrom('words').where('lexicon', '=', lexiconId).execute();
    await db.deleteFrom('synsets').where('lexicon', '=', lexiconId).execute();
    await db.deleteFrom('lexicons').where('id', '=', lexiconId).execute();
  }

  /**
   * Delete all words from a lexicon
   */
  static async deleteWordsByLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
    const wordIds = await db.selectFrom('words').select('id').where('lexicon', '=', lexiconId).execute();
    const wordIdList = wordIds.map(w => w.id);
    
    if (wordIdList.length > 0) {
      await db.deleteFrom('forms').where('word_id', 'in', wordIdList).execute();
      await db.deleteFrom('senses').where('word_id', 'in', wordIdList).execute();
      await db.deleteFrom('words').where('id', 'in', wordIdList).execute();
    }
  }

  /**
   * Delete all synsets from a lexicon
   */
  static async deleteSynsetsByLexicon(db: Kysely<Database>, lexiconId: string): Promise<void> {
    const synsetIds = await db.selectFrom('synsets').select('id').where('lexicon', '=', lexiconId).execute();
    const synsetIdList = synsetIds.map(w => w.id);
    
    if (synsetIdList.length > 0) {
      await db.deleteFrom('definitions').where('synset_id', 'in', synsetIdList).execute();
      await db.deleteFrom('relations').where((eb) => 
        eb.or([
          eb('source_id', 'in', synsetIdList),
          eb('target_id', 'in', synsetIdList)
        ])
      ).execute();
      await db.deleteFrom('examples').where('synset_id', 'in', synsetIdList).execute();
      await db.deleteFrom('senses').where('synset_id', 'in', synsetIdList).execute();
      await db.deleteFrom('synsets').where('id', 'in', synsetIdList).execute();
    }
  }

  /**
   * Clear all data from the database in the correct order
   */
  static async clearAllData(db: Kysely<Database>): Promise<void> {
    // We must delete in an order that respects foreign key constraints,
    // as relying on `ON DELETE CASCADE` can be fragile in some environments.
    const tables: (keyof Database)[] = [
      "forms",
      "definitions",
      "relations",
      "examples",
      "senses",
      "words",
      "synsets",
      "lexicons",
      "ilis",
    ];

    for (const table of tables) {
      try {
        await db.deleteFrom(table).execute();
      } catch (error) {
        // Table might not exist, ignore
      }
    }
  }

  /**
   * Get comprehensive lexicon statistics
   */
  static async getLexiconStatistics(db: Kysely<Database>, lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
  }[]> {
    // Use correlated subqueries to avoid large join expansions and DISTINCT
    const query = db
      .selectFrom('lexicons')
      .select((eb) => [
        'lexicons.id',
        'lexicons.label',
        'lexicons.language',
        'lexicons.version',
        eb
          .selectFrom('words')
          .select(eb.fn.countAll().as('wc'))
          .whereRef('words.lexicon', '=', 'lexicons.id')
          .as('word_count'),
        eb
          .selectFrom('synsets')
          .select(eb.fn.countAll().as('sc'))
          .whereRef('synsets.lexicon', '=', 'lexicons.id')
          .as('synset_count'),
        eb
          .selectFrom('senses')
          .innerJoin('words', 'senses.word_id', 'words.id')
          .select(eb.fn.countAll().as('sc'))
          .whereRef('words.lexicon', '=', 'lexicons.id')
          .as('sense_count'),
        eb
          .selectFrom('synsets')
          .select(eb.fn.countAll().as('ic'))
          .whereRef('synsets.lexicon', '=', 'lexicons.id')
          .where('synsets.ili', 'is not', null)
          .as('ili_count'),
      ])
      .$if(!!lexiconId, (qb) => qb.where('lexicons.id', '=', lexiconId!));

    const results = await query.execute();

    return results.map((row) => ({
      lexiconId: row.id,
      label: row.label,
      language: row.language,
      version: row.version ?? '',
      wordCount: Number(row.word_count ?? 0),
      synsetCount: Number(row.synset_count ?? 0),
      senseCount: Number(row.sense_count ?? 0),
      iliCount: Number(row.ili_count ?? 0),
    }));
  }

  /**
   * Get data quality metrics
   */
  static async getDataQualityMetrics(db: Kysely<Database>): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
    synsetsWithExamples: number;
    averageSynsetSize: number;
  }> {
    const totalSynsetsResult = await db.selectFrom('synsets').select(db.fn.countAll().as('count')).executeTakeFirst();
    const synsetsWithILIResult = await db.selectFrom('synsets').where('ili', 'is not', null).select(db.fn.countAll().as('count')).executeTakeFirst();
    const synsetsWithSensesResult = await db.selectFrom('senses').select(db.fn.count('synset_id').distinct().as('count')).executeTakeFirst();
    const synsetsWithDefinitionsResult = await db.selectFrom('definitions').select(db.fn.count('synset_id').distinct().as('count')).executeTakeFirst();
    const synsetsWithExamplesResult = await db.selectFrom('examples').select(db.fn.count('synset_id').distinct().as('count')).executeTakeFirst();
    
    const total = Number(totalSynsetsResult?.count ?? 0);
    const withILI = Number(synsetsWithILIResult?.count ?? 0);
    const withDefinitions = Number(synsetsWithDefinitionsResult?.count ?? 0);
    const withSenses = Number(synsetsWithSensesResult?.count ?? 0);
    const withExamples = Number(synsetsWithExamplesResult?.count ?? 0);

    // Calculate average synset size
    let averageSynsetSize = 0;
    if (withSenses > 0) {
      averageSynsetSize = withSenses / total;
    }

    return {
      synsetsWithILI: withILI,
      synsetsWithoutILI: total - withILI,
      iliCoveragePercentage: total > 0 ? (withILI / total) * 100 : 0,
      emptySynsets: total - withSenses,
      synsetsWithDefinitions: withDefinitions,
      synsetsWithExamples: withExamples,
      averageSynsetSize,
    };
  }

  /**
   * Get part of speech distribution
   */
  static async getPartOfSpeechDistribution(db: Kysely<Database>): Promise<Record<string, number>> {
    const results = await db
      .selectFrom('words')
      .select(['pos', (eb) => eb.fn.countAll().as('count')])
      .groupBy('pos')
      .execute();

    const distribution: Record<string, number> = {};
    results.forEach(row => {
      distribution[row.pos] = Number(row.count);
    });

    return distribution;
  }

  /**
   * Get synset size analysis
   */
  static async getSynsetSizeAnalysis(db: Kysely<Database>): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    const results = await db
      .selectFrom('synsets')
      .leftJoin('senses', 'synsets.id', 'senses.synset_id')
      .select(['synsets.id', (eb) => eb.fn.count('senses.id').as('size')])
      .groupBy('synsets.id')
      .execute();

    if (results.length === 0) {
      return {
        averageSize: 0,
        maxSize: 0,
        minSize: 0,
        sizeDistribution: {},
      };
    }

    const sizes = results.map(row => Number(row.size));
    const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);

    const sizeDistribution: Record<number, number> = {};
    sizes.forEach(size => {
      sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
    });

    return {
      averageSize,
      maxSize,
      minSize,
      sizeDistribution,
    };
  }
}

/**
 * Kysely Query Service for wn-ts-web
 * 
 * This service extends the shared base query service and adds web-specific functionality.
 */

import { Kysely, sql, CompiledQuery } from 'kysely';
import { BaseKyselyQueryService, SchemaBuilder, DatabaseUtils } from 'wn-ts-core';
import type { Database } from '../types/database.js';
import type { PartOfSpeech, Word, Relation } from 'wn-ts-core';

export class KyselyQueryService extends BaseKyselyQueryService {
  constructor(db: Kysely<Database>) {
    super(db);
  }

  // Implement the abstract createTables method using shared SchemaBuilder
  async createTables(): Promise<void> {
    await SchemaBuilder.createTables(this.db);
    await SchemaBuilder.createIndexes(this.db);
  }

  // Web-specific methods can be added here
  
  // Additional statistics and analysis methods - now using shared utilities
  async getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
  }[]> {
    return DatabaseUtils.getLexiconStatistics(this.db, lexiconId);
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
    synsetsWithExamples: number;
    averageSynsetSize: number;
  }> {
    return DatabaseUtils.getDataQualityMetrics(this.db);
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    return DatabaseUtils.getPartOfSpeechDistribution(this.db);
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    return DatabaseUtils.getSynsetSizeAnalysis(this.db);
  }

  // Insert operations
  async insertLexicon(lexicon: Database['lexicons']): Promise<void> {
    await this.db.insertInto('lexicons').values(lexicon).execute();
  }

  async insertWord(word: Database['words']): Promise<void> {
    await this.db.insertInto('words').values(word).execute();
  }

  async insertSynset(synset: Database['synsets']): Promise<void> {
    await this.db.insertInto('synsets').values(synset).execute();
  }

  async insertSense(sense: Database['senses']): Promise<void> {
    await this.db.insertInto('senses').values(sense).execute();
  }

  async insertDefinition(definition: Database['definitions']): Promise<void> {
    await this.db.insertInto('definitions').values(definition).execute();
  }

  async insertForm(form: Database['forms']): Promise<void> {
    await this.db.insertInto('forms').values(form).execute();
  }

  // Clear operations - now using shared utilities
  async clearAllData(): Promise<void> {
    return DatabaseUtils.clearAllData(this.db);
  }

  // Search methods
  async searchWords(searchTerm: string, options: {
    language?: string;
    lexicon?: string;
    limit?: number;
    offset?: number;
    pos?: PartOfSpeech;
    exact?: boolean;
    caseSensitive?: boolean;
  } = {}): Promise<Word[]> {
    const { 
      language = 'en', 
      lexicon, 
      limit = 50, 
      offset = 0, 
      pos,
      exact = false,
      caseSensitive = false 
    } = options;

    let query = this.db.selectFrom('words').selectAll().where('language', '=', language);

    // Build search condition
    if (exact) {
      if (caseSensitive) {
        query = query.where('lemma', '=', searchTerm);
      } else {
        // Kysely doesn't have a built-in `lower`, so we use `sql` helper.
        query = query.where(sql`lower(lemma)`, '=', searchTerm.toLowerCase());
      }
    } else {
      if (caseSensitive) {
        query = query.where('lemma', 'like', `%${searchTerm}%`);
      } else {
        query = query.where(sql`lower(lemma)`, 'like', `%${searchTerm.toLowerCase()}%`);
      }
    }

    if (lexicon) {
      query = query.where('lexicon', '=', lexicon);
    }

    if (pos) {
      query = query.where('pos', '=', pos);
    }

    const results = await query
      .orderBy('lemma')
      .limit(limit)
      .offset(offset)
      .execute();
    return await Promise.all(results.map(this.transformWordRecord.bind(this)));
  }

  // Relations methods
  async getRelations(synsetId: string, type?: string): Promise<Relation[]> {
    // First check if the synset exists
    const synset = await this.getSynsetById(synsetId);
    if (!synset) {
      throw new Error(`Synset not found: ${synsetId}`);
    }
    
    // Use the base query service method
    const relations = await this.getRelationsBySynsetId(synsetId);
    
    // Filter by type if specified
    if (type) {
      return relations.filter(rel => rel.type === type);
    }
    
    return relations;
  }

  // Raw query method for schema management
  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    const result = await this.db.executeQuery(CompiledQuery.raw(sql, params || []));
    return result.rows || [];
  }
} 

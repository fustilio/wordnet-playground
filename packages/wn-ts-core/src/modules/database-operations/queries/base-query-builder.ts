/**
 * Base Query Builder
 * 
 * Provides common query building functionality to reduce duplication
 * across different query types (words, synsets, senses, etc.)
 */

import type { Database } from '../../../types/database.js';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export interface BaseQueryOptions {
  form?: string;
  pos?: string;
  lexicon?: string | string[];
  language?: string;
  fuzzy?: boolean;
  maxResults?: number;
  includeInflected?: boolean;
  searchAllForms?: boolean;
}

export interface QueryJoinConfig {
  table: string;
  leftColumn: string;
  rightColumn: string;
  type: 'inner' | 'left' | 'right';
  required?: boolean;
}

export class BaseQueryBuilder {
  protected db: Kysely<Database>;
  protected baseTable: string;
  protected joins: QueryJoinConfig[] = [];
  protected conditions: Array<{ condition: any; required: boolean }> = [];

  constructor(db: Kysely<Database>, baseTable: string) {
    this.db = db;
    this.baseTable = baseTable;
  }

  /**
   * Add a join to the query
   */
  addJoin(config: QueryJoinConfig): this {
    this.joins.push(config);
    return this;
  }

  /**
   * Add a condition to the query
   */
  addCondition(condition: any, required: boolean = true): this {
    this.conditions.push({ condition, required });
    return this;
  }

  /**
   * Apply common filters based on options
   */
  applyCommonFilters(options: BaseQueryOptions): this {
    const {
      form,
      pos,
      lexicon,
      language,
      fuzzy = false,
      maxResults,
      searchAllForms = false
    } = options;

    // Handle form filtering
    if (form) {
      this.applyFormFilter(form, fuzzy, searchAllForms);
    }

    // Handle POS filtering
    if (pos) {
      this.applyPosFilter(pos);
    }

    // Handle lexicon filtering
    if (lexicon && lexicon !== '*') {
      this.applyLexiconFilter(lexicon);
    }

    // Handle language filtering
    if (language) {
      this.applyLanguageFilter(language);
    }

    // Handle max results
    if (maxResults) {
      this.addCondition(sql`LIMIT ${maxResults}`, false);
    }

    return this;
  }

  /**
   * Apply form-based filtering
   */
  protected applyFormFilter(
    form: string, 
    fuzzy: boolean, 
    searchAllForms: boolean
  ): this {
    const formLower = form.toLowerCase();
    
    // For synsets, we need to join through senses to get to words
    if (this.baseTable === 'synsets') {
      if (!this.joins.some(j => j.table === 'senses')) {
        this.addJoin({
          table: 'senses',
          leftColumn: 'synsets.id',
          rightColumn: 'senses.synset_id',
          type: 'inner',
          required: true
        });
      }
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: 'senses.word_id',
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    } else {
      // For other tables, join directly to words
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: `${this.baseTable}.word_id`,
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    }
    
    if (searchAllForms) {
      // Search in both words.lemma and forms.written_form
      this.addJoin({
        table: 'forms',
        leftColumn: 'words.id',
        rightColumn: 'forms.word_id',
        type: 'left',
        required: false
      });

      if (fuzzy) {
        this.addCondition(
          sql`(words.lemma LIKE ${`%${formLower}%`} OR forms.written_form LIKE ${`%${formLower}%`})`,
          true
        );
      } else {
        this.addCondition(
          sql`(words.lemma = ${formLower} OR forms.written_form = ${formLower})`,
          true
        );
      }
    } else {
      // Search only in words.lemma
      if (fuzzy) {
        this.addCondition(sql`words.lemma LIKE ${`%${formLower}%`}`, true);
      } else {
        this.addCondition(sql`words.lemma = ${formLower}`, true);
      }
    }

    return this;
  }

  /**
   * Apply POS filtering
   */
  protected applyPosFilter(pos: string): this {
    // For synsets, we need to join through senses to get to words
    if (this.baseTable === 'synsets') {
      if (!this.joins.some(j => j.table === 'senses')) {
        this.addJoin({
          table: 'senses',
          leftColumn: 'synsets.id',
          rightColumn: 'senses.synset_id',
          type: 'inner',
          required: true
        });
      }
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: 'senses.word_id',
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    } else {
      // For other tables, join directly to words
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: `${this.baseTable}.word_id`,
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    }

    this.addCondition(sql`words.pos = ${pos}`, true);
    return this;
  }

  /**
   * Apply lexicon filtering
   */
  protected applyLexiconFilter(lexicon: string | string[]): this {
    if (Array.isArray(lexicon)) {
      if (lexicon.length > 0) {
        this.addCondition(sql`${this.baseTable}.lexicon IN (${sql.join(lexicon.map(l => sql`${l}`), sql`, `)})`, true);
      }
    } else {
      this.addCondition(sql`${this.baseTable}.lexicon = ${lexicon}`, true);
    }
    return this;
  }

  /**
   * Apply language filtering
   */
  protected applyLanguageFilter(language: string): this {
    // For synsets, we need to join through senses to get to words
    if (this.baseTable === 'synsets') {
      if (!this.joins.some(j => j.table === 'senses')) {
        this.addJoin({
          table: 'senses',
          leftColumn: 'synsets.id',
          rightColumn: 'senses.synset_id',
          type: 'inner',
          required: true
        });
      }
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: 'senses.word_id',
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    } else {
      // For other tables, join directly to words
      if (!this.joins.some(j => j.table === 'words')) {
        this.addJoin({
          table: 'words',
          leftColumn: `${this.baseTable}.word_id`,
          rightColumn: 'words.id',
          type: 'inner',
          required: true
        });
      }
    }

    this.addCondition(sql`words.language = ${language}`, true);
    return this;
  }

  /**
   * Build the final query
   */
  build(selectFields: string[] = ['*']): any {
    let query = this.db.selectFrom(this.baseTable as any);

    // Apply joins using proper Kysely syntax
    for (const join of this.joins) {
      if (join.type === 'inner') {
        query = query.innerJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      } else if (join.type === 'left') {
        query = query.leftJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      } else if (join.type === 'right') {
        query = query.rightJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      }
    }

    // Apply select fields
    if (selectFields.includes('*')) {
      // Select all fields from the base table only to avoid ambiguous column names
      query = query.selectAll(this.baseTable as any);
    } else {
      for (const field of selectFields) {
        if (field.includes('.')) {
          query = query.select(field as any);
        } else {
          query = query.select(`${this.baseTable}.${field}` as any);
        }
      }
    }

    // Apply conditions
    for (const { condition, required } of this.conditions) {
      if (required) {
        query = query.where(condition);
      } else {
        // For non-required conditions like LIMIT, we need to handle them differently
        if (typeof condition === 'object' && condition.sql) {
          // This is a raw SQL condition like LIMIT - handle it properly
          if (condition.sql.includes('LIMIT')) {
            const limitMatch = condition.sql.match(/LIMIT\s+(\d+)/);
            if (limitMatch) {
              query = query.limit(parseInt(limitMatch[1]));
            }
          } else if (condition.sql.includes('OFFSET')) {
            const offsetMatch = condition.sql.match(/OFFSET\s+(\d+)/);
            if (offsetMatch) {
              query = query.offset(parseInt(offsetMatch[1]));
            }
          }
        } else {
          query = query.where(condition);
        }
      }
    }

    return query;
  }

  /**
   * Build a distinct query
   */
  buildDistinct(selectFields: string[] = ['*']): any {
    const query = this.build(selectFields);
    return query.distinct();
  }

  /**
   * Build a count query
   */
  buildCount(): any {
    let query = this.db.selectFrom(this.baseTable as any);

    // Apply joins
    for (const join of this.joins) {
      if (join.type === 'inner') {
        query = query.innerJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      } else if (join.type === 'left') {
        query = query.leftJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      } else if (join.type === 'right') {
        query = query.rightJoin(join.table as any, (jb) => 
          jb.onRef(join.leftColumn, '=', join.rightColumn)
        );
      }
    }

    // Apply conditions (excluding LIMIT for count queries)
    for (const { condition, required } of this.conditions) {
      if (required && !(typeof condition === 'object' && condition.sql && condition.sql.includes('LIMIT'))) {
        query = query.where(condition);
      }
    }

    return query.select(sql`COUNT(*)`.as('count'));
  }
}

/**
 * Specialized query builders for common patterns
 */

export class WordQueryBuilder extends BaseQueryBuilder {
  constructor(db: Kysely<Database>) {
    super(db, 'words');
  }

  /**
   * Build a query for words with form filtering
   */
  buildWordsQuery(options: BaseQueryOptions = {}): any {
    this.applyCommonFilters(options);
    return this.buildDistinct();
  }

  /**
   * Build a query for words by synset
   */
  buildWordsBySynsetQuery(synsetId: string, language?: string): any {
    this.addJoin({
      table: 'senses',
      leftColumn: 'senses.word_id',
      rightColumn: 'words.id',
      type: 'inner',
      required: true
    });

    this.addCondition(sql`senses.synset_id = ${synsetId}`, true);

    if (language) {
      this.addCondition(sql`words.language = ${language}`, true);
    }

    return this.buildDistinct();
  }
}

export class SynsetQueryBuilder extends BaseQueryBuilder {
  constructor(db: Kysely<Database>) {
    super(db, 'synsets');
  }

  /**
   * Build a query for synsets with form filtering
   */
  buildSynsetsQuery(options: BaseQueryOptions = {}): any {
    this.applyCommonFilters(options);
    return this.buildDistinct();
  }

  /**
   * Build a query for synsets by ILI
   */
  buildSynsetsByIliQuery(ili: string): any {
    this.addCondition(sql`synsets.ili = ${ili}`, true);
    return this.build();
  }
}

export class SenseQueryBuilder extends BaseQueryBuilder {
  constructor(db: Kysely<Database>) {
    super(db, 'senses');
  }

  /**
   * Build a query for senses with form filtering
   */
  buildSensesQuery(options: BaseQueryOptions = {}): any {
    this.applyCommonFilters(options);
    return this.buildDistinct();
  }

  /**
   * Build a query for senses by word ID
   */
  buildSensesByWordQuery(wordId: string): any {
    this.addCondition(sql`senses.word_id = ${wordId}`, true);
    return this.build();
  }

  /**
   * Build a query for senses by synset ID
   */
  buildSensesBySynsetQuery(synsetId: string): any {
    this.addCondition(sql`senses.synset_id = ${synsetId}`, true);
    return this.build();
  }
}

/**
 * Factory function to create query builders
 */
export function createQueryBuilder(db: Kysely<Database>, type: 'words' | 'synsets' | 'senses'): BaseQueryBuilder {
  switch (type) {
    case 'words':
      return new WordQueryBuilder(db);
    case 'synsets':
      return new SynsetQueryBuilder(db);
    case 'senses':
      return new SenseQueryBuilder(db);
    default:
      throw new Error(`Unknown query builder type: ${type}`);
  }
}

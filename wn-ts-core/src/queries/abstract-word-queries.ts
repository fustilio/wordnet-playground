/**
 * Abstract word query builders
 * 
 * This module provides abstract query builders for word-related operations.
 * Environment-specific packages implement these using their preferred database technology.
 */

import type { DatabaseClient, WordRecord, WordSearchOptions, WordWithSenses } from '../types/database.js';

/**
 * Abstract query builder class for word-related operations
 */
export abstract class AbstractWordQueries {
  constructor(protected db: DatabaseClient) {}

  /**
   * Find words by lemma (exact match)
   */
  async findWordsByLemma(lemma: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { language = 'en', lexicon, limit, offset, partOfSpeech } = options;

    let sql = 'SELECT * FROM words WHERE lemma = ? AND language = ?';
    const params: any[] = [lemma, language];

    if (lexicon) {
      sql += ' AND lexicon = ?';
      params.push(lexicon);
    }

    if (partOfSpeech) {
      sql += ' AND part_of_speech = ?';
      params.push(partOfSpeech);
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return this.db.query<WordRecord>(sql, params);
  }

  /**
   * Find words by partial lemma match
   */
  async findWordsByPartialLemma(partialLemma: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { language = 'en', lexicon, limit, offset, partOfSpeech } = options;

    let sql = 'SELECT * FROM words WHERE lemma LIKE ? AND language = ?';
    const params: any[] = [`%${partialLemma}%`, language];

    if (lexicon) {
      sql += ' AND lexicon = ?';
      params.push(lexicon);
    }

    if (partOfSpeech) {
      sql += ' AND part_of_speech = ?';
      params.push(partOfSpeech);
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return this.db.query<WordRecord>(sql, params);
  }

  /**
   * Find words by synset ID
   */
  async findWordsBySynset(synsetId: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { limit, offset } = options;

    let sql = `
      SELECT w.* FROM words w
      INNER JOIN senses s ON w.id = s.word_id
      WHERE s.synset_id = ?
    `;
    const params: any[] = [synsetId];

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return this.db.query<WordRecord>(sql, params);
  }

  /**
   * Find words with their senses
   */
  async findWordsWithSenses(wordId: string): Promise<WordWithSenses | null> {
    const word = await this.db.queryFirst<WordRecord>(
      'SELECT * FROM words WHERE id = ?',
      [wordId]
    );

    if (!word) {
      return null;
    }

    const senses = await this.db.query(
      'SELECT * FROM senses WHERE word_id = ?',
      [wordId]
    );

    return {
      ...word,
      senses
    };
  }

  /**
   * Find all words in a lexicon
   */
  async findWordsByLexicon(lexicon: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { language, limit, offset, partOfSpeech } = options;

    let sql = 'SELECT * FROM words WHERE lexicon = ?';
    const params: any[] = [lexicon];

    if (language) {
      sql += ' AND language = ?';
      params.push(language);
    }

    if (partOfSpeech) {
      sql += ' AND part_of_speech = ?';
      params.push(partOfSpeech);
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return this.db.query<WordRecord>(sql, params);
  }

  /**
   * Find words by part of speech
   */
  async findWordsByPartOfSpeech(partOfSpeech: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { language = 'en', lexicon, limit, offset } = options;

    let sql = 'SELECT * FROM words WHERE part_of_speech = ? AND language = ?';
    const params: any[] = [partOfSpeech, language];

    if (lexicon) {
      sql += ' AND lexicon = ?';
      params.push(lexicon);
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }

    return this.db.query<WordRecord>(sql, params);
  }

  /**
   * Count words by various criteria
   */
  async countWords(criteria: Partial<WordSearchOptions> = {}): Promise<number> {
    const { language = 'en', lexicon, partOfSpeech } = criteria;

    let sql = 'SELECT COUNT(*) as count FROM words WHERE language = ?';
    const params: any[] = [language];

    if (lexicon) {
      sql += ' AND lexicon = ?';
      params.push(lexicon);
    }

    if (partOfSpeech) {
      sql += ' AND part_of_speech = ?';
      params.push(partOfSpeech);
    }

    const result = await this.db.queryFirst<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  /**
   * Get word statistics by part of speech
   */
  async getWordStatisticsByPOS(language: string = 'en', lexicon?: string): Promise<Array<{ part_of_speech: string; count: number }>> {
    let sql = `
      SELECT part_of_speech, COUNT(*) as count 
      FROM words 
      WHERE language = ?
      GROUP BY part_of_speech 
      ORDER BY count DESC
    `;
    const params: any[] = [language];

    if (lexicon) {
      sql = sql.replace('WHERE language = ?', 'WHERE language = ? AND lexicon = ?');
      params.push(lexicon);
    }

    return this.db.query<{ part_of_speech: string; count: number }>(sql, params);
  }

  /**
   * Search words with advanced criteria
   */
  async searchWords(searchTerm: string, options: WordSearchOptions = {}): Promise<WordRecord[]> {
    const { 
      language = 'en', 
      lexicon, 
      limit = 50, 
      offset = 0, 
      partOfSpeech,
      exact = false,
      caseSensitive = false 
    } = options;

    let sql = 'SELECT * FROM words WHERE language = ?';
    const params: any[] = [language];

    // Build search condition
    if (exact) {
      sql += caseSensitive ? ' AND lemma = ?' : ' AND LOWER(lemma) = ?';
      params.push(caseSensitive ? searchTerm : searchTerm.toLowerCase());
    } else {
      sql += ' AND lemma LIKE ?';
      params.push(`%${searchTerm}%`);
    }

    if (lexicon) {
      sql += ' AND lexicon = ?';
      params.push(lexicon);
    }

    if (partOfSpeech) {
      sql += ' AND part_of_speech = ?';
      params.push(partOfSpeech);
    }

    sql += ' ORDER BY lemma LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return this.db.query<WordRecord>(sql, params);
  }
} 
/**
 * Abstract Wordnet class for wn-ts-core
 * This package is environment-agnostic and defines the interface for concrete implementations
 */

import { config } from './config.js';
import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  ILI
} from './types.js';
import { DatabaseError } from './types.js';

// Import clean module functions for delegation
import {
  word,
  words,
  sense,
  senses,
  synset,
  synsets,
  ili,
  ilis,
  lexicons
} from './module-functions.js';

export abstract class BaseWordnet {
  protected lexiconId: string;
  protected lexiconVersion?: string;
  protected expand: string[];
  protected normalizer?: ((form: string) => string) | undefined;
  protected lexicon?: Lexicon;

  constructor(options: WordnetOptions = {}) {
    this.lexiconId = options.lexicon || config.defaultLexicon;
    this.lexiconVersion = options.version;
    this.expand = options.expand || [];
    this.normalizer = options.normalizer;
  }

  // Abstract methods that must be implemented by concrete classes
  abstract lexicons(): Promise<Lexicon[]>;
  abstract expandedLexicons(): Promise<Lexicon[]>;
  abstract words(form: string, pos?: PartOfSpeech): Promise<Word[]>;
  abstract synsets(form: string, pos?: PartOfSpeech, ili?: string | ILI): Promise<Synset[]>;
  abstract synset(synsetId: string): Promise<Synset | undefined>;
  abstract senses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]>;
  abstract word(wordId: string): Promise<Word | undefined>;
  abstract sense(senseId: string): Promise<Sense | undefined>;
  abstract ili(iliId: string): Promise<ILI | undefined>;
  abstract ilis(status?: string): Promise<ILI[]>;
  abstract getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }>;
  abstract getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
  }[]>;
  abstract getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  }>;
  abstract getPartOfSpeechDistribution(): Promise<Record<string, number>>;
  abstract getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }>;
  abstract close(): Promise<void>;

  // Convenience methods that delegate to module functions
  async word(id: string): Promise<Word> {
    return word(this, id);
  }

  async words(form?: string, pos?: PartOfSpeech): Promise<Word[]> {
    return words(this, form, pos);
  }

  async sense(id: string): Promise<Sense> {
    return sense(this, id);
  }

  async senses(form?: string, pos?: PartOfSpeech): Promise<Sense[]> {
    return senses(this, form, pos);
  }

  async synset(id: string): Promise<Synset> {
    return synset(this, id);
  }

  async synsets(form?: string, pos?: PartOfSpeech): Promise<Synset[]> {
    return synsets(this, form, pos);
  }

  async ili(id: string): Promise<ILI> {
    return ili(this, id);
  }

  async ilis(status?: string): Promise<ILI[]> {
    return ilis(this, status);
  }

  async lexicons(): Promise<Lexicon[]> {
    return lexicons(this);
  }
}

/**
 * Placeholder implementation for wn-ts-core
 * This throws DatabaseError to indicate that concrete database implementation is required
 */
export class Wordnet extends BaseWordnet {
  async lexicons(): Promise<Lexicon[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async expandedLexicons(): Promise<Lexicon[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async words(
    _form: string,
    _pos?: PartOfSpeech
  ): Promise<Word[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async synsets(
    _form: string,
    _pos?: PartOfSpeech,
    _ili?: string | ILI
  ): Promise<Synset[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async synset(_synsetId: string): Promise<Synset | undefined> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async senses(_wordIdOrForm: string, _pos?: PartOfSpeech): Promise<Sense[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async word(_wordId: string): Promise<Word | undefined> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async sense(_senseId: string): Promise<Sense | undefined> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async ili(_iliId: string): Promise<ILI | undefined> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async ilis(_status?: string): Promise<ILI[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async getLexiconStatistics(_lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
  }[]> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  }> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  async close(): Promise<void> {
    // No-op for placeholder
  }
} 

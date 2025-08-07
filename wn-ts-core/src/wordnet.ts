/**
 * Abstract Wordnet class for wn-ts-core
 * This package is environment-agnostic and defines the interface for concrete implementations
 */

import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  ILI,
  Project
} from './types.js';

export abstract class BaseWordnet {
  protected lexiconId: string;
  protected lexiconVersion: string | undefined;
  protected expand: string[];
  protected normalizer?: ((form: string) => string) | undefined;
  protected lemmatizer?: ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>) | undefined;
  protected searchAllForms: boolean;
  protected lang: string | undefined;
  protected lexicon?: Lexicon;

  constructor(options: WordnetOptions = {}) {
    // Parse lexicon specifier if provided as first argument
    let lexiconSpecifier = options.lexicon || 'oewn'; // Default to oewn if no lexicon specified
    let version: string | undefined;
    
    // Parse lexicon:version format
    if (lexiconSpecifier.includes(':')) {
      const [lexicon, ver] = lexiconSpecifier.split(':');

      if (lexicon) {
        lexiconSpecifier = lexicon;
      }
      if (ver) {
        version = ver;
      }
    }
    
    this.lexiconId = lexiconSpecifier;
    this.lexiconVersion = version ?? options.version;
    this.expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    if (options.normalizer) {
      this.normalizer = options.normalizer;
    }
    if (options.lemmatizer) {
      this.lemmatizer = options.lemmatizer;
    }
    this.searchAllForms = options.searchAllForms !== false; // Default to true
    this.lang = options.lang;
  }

  // Abstract methods that must be implemented by concrete classes
  abstract lexicons(): Promise<Lexicon[]>;
  abstract expandedLexicons(): Promise<Lexicon[]>;
  abstract words(form: string, pos?: PartOfSpeech, options?: { lexicon: string }): Promise<Word[]>;
  abstract synsets(form: string, pos?: PartOfSpeech, ili?: string | ILI): Promise<Synset[]>;
  abstract synset(synsetId: string): Promise<Synset | undefined>;
  abstract senses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]>;
  abstract word(wordId: string): Promise<Word | undefined>;
  abstract sense(senseId: string): Promise<Sense | undefined>;
  abstract ili(iliId: string): Promise<ILI | undefined>;
  abstract ilis(status?: string): Promise<ILI[]>;
  abstract getProjects(): Promise<Project[]>;
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
} 

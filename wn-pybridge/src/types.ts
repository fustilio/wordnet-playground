// Core types for wn-pybridge

export interface WnBridgeOptions {
  // Python wn configuration
  dataDirectory?: string;
  logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  
  // Bridge configuration
  timeout?: number;
  retries?: number;
  pythonPath?: string;
}

export interface QueryOptions {
  pos?: string;
  lexicon?: string;
  lang?: string;
}

export interface ILI {
  id: string;
  definition?: string;
  status?: string;
}

export interface Lexicon {
  id: string;
  label: string;
  language: string;
  version: string;
  license?: string;
  url?: string;
  email?: string;
  citation?: string;
}

export interface Project {
  id: string;
  label: string;
  version: string;
  language: string;
  license?: string;
  url?: string;
  citation?: string;
}

// Core WordNet objects
export interface Synset {
  id: string;
  pos: string;
  
  // Basic properties
  definition(): Promise<string>;
  examples(): Promise<string[]>;
  lemmas(): Promise<string[]>;
  members(): Promise<Sense[]>;
  
  // Relations
  hypernyms(): Promise<Synset[]>;
  hyponyms(): Promise<Synset[]>;
  relations(type?: string): Promise<Synset[]>;
  meronyms(): Promise<Synset[]>;
  holonyms(): Promise<Synset[]>;
  entailments(): Promise<Synset[]>;
  causes(): Promise<Synset[]>;
  similar(): Promise<Synset[]>;
  also(): Promise<Synset[]>;
  attribute(): Promise<Synset[]>;
  domain_topic(): Promise<Synset[]>;
  domain_region(): Promise<Synset[]>;
  exemplifies(): Promise<Synset[]>;
  
  // Similarity
  path_similarity(other: Synset): Promise<number>;
  wup_similarity(other: Synset): Promise<number>;
  lch_similarity(other: Synset): Promise<number>;
  res_similarity(other: Synset, ic: any): Promise<number>;
  lin_similarity(other: Synset, ic: any): Promise<number>;
  jiang_conrath_similarity(other: Synset, ic: any): Promise<number>;
  
  // Metadata
  ili(): Promise<ILI | null>;
  lexicalized(): Promise<boolean>;
  lexicon(): Promise<Lexicon>;
  
  // Interlingual
  interlingual_relations(relation: string, target_lexicon: string): Promise<Synset[]>;
}

export interface Word {
  id: string;
  pos: string;
  
  // Basic properties
  lemma(): Promise<string>;
  forms(): Promise<string[]>;
  pronunciations(): Promise<string[]>;
  
  // Relations
  senses(): Promise<Sense[]>;
  synsets(): Promise<Synset[]>;
  derived_words(): Promise<Word[]>;
  
  // Metadata
  lexicon(): Promise<Lexicon>;
  
  // Translation
  translate(lang: string): Promise<Word[]>;
}

export interface Sense {
  id: string;
  pos: string;
  
  // Basic properties
  word(): Promise<Word>;
  synset(): Promise<Synset>;
  lemma(): Promise<string>;
  lemmas(): Promise<string[]>;
  definition(): Promise<string>;
  examples(): Promise<string[]>;
  
  // Relations
  relations(type?: string): Promise<Sense[]>;
  antonyms(): Promise<Sense[]>;
  derivationally_related(): Promise<Sense[]>;
  
  // Metadata
  sensekey(): Promise<string>;
  tags(): Promise<Record<string, any>>;
  lexicon(): Promise<Lexicon>;
  
  // Translation
  translate(lang: string): Promise<Sense[]>;
}

// Similarity types
export interface SimilarityOptions {
  ic?: any;
}

// Taxonomy types
export interface TaxonomyPath {
  path: Synset[];
  length: number;
}

// Morphy types
export interface MorphyOptions {
  pos?: string;
  lexicon?: string;
}

// Error types
export class WnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnError';
  }
}

export class WnConfigurationError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'WnConfigurationError';
  }
}

export class WnDatabaseError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'WnDatabaseError';
  }
}

export class WnProjectError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'WnProjectError';
  }
}

// Utility types
export interface PythonObject {
  [key: string]: any;
}

export interface BridgeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
} 
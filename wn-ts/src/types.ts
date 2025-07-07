/**
 * Core types and interfaces for the wn-ts library
 */

export type PartOfSpeech = 'n' | 'v' | 'a' | 'r' | 's' | 'c' | 'p' | 'i' | 'x' | 'u';

export interface Form {
  id: string;
  writtenForm: string;
  script?: string;
  tag?: string;
}

export interface Pronunciation {
  id: string;
  value: string;
  variety?: string;
  notation?: string;
  geographic?: string;
}

export interface Tag {
  id: string;
  category: string;
  value: string;
}

export interface Count {
  id: string;
  value: number;
  writtenForm: string;
  partOfSpeech: PartOfSpeech;
}

export interface Example {
  id: string;
  language: string;
  text: string;
  source?: string;
}

export interface Definition {
  id: string;
  language: string;
  text: string;
  source?: string;
}

export interface Relation {
  id: string;
  type: string;
  target: string;
  source?: string;
}

export interface Word {
  id: string;
  lemma: string;
  partOfSpeech: PartOfSpeech;
  forms: Form[];
  pronunciations: Pronunciation[];
  tags: Tag[];
  counts: Count[];
  language: string;
  lexicon: string;
}

export interface Sense {
  id: string;
  word: string;
  synset: string;
  examples: Example[];
  counts: Count[];
  tags: Tag[];
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}

export interface Synset {
  id: string;
  ili?: string;
  partOfSpeech: PartOfSpeech;
  definitions: Definition[];
  examples: Example[];
  relations: Relation[];
  language: string;
  lexicon: string;
  members: string[];
  senses: string[];
}

export interface ILI {
  id: string;
  definition?: string;
  status: 'standard' | 'proposed' | 'deprecated';
  supersededBy?: string;
  note?: string;
}

export interface Lexicon {
  id: string;
  label: string;
  language: string;
  email?: string;
  license?: string;
  version?: string;
  url?: string;
  citation?: string;
  logo?: string;
  metadata?: Record<string, unknown>;
}

export interface Project {
  id: string;
  label: string;
  description?: string;
  url?: string;
  license?: string;
  citation?: string;
  metadata?: Record<string, unknown>;
}

export interface WordnetConfig {
  dataDirectory: string;
  downloadDirectory?: string;
  cacheDirectory?: string;
}

export interface WordnetOptions {
  expand?: string | string[];
  normalizer?: (form: string) => string;
  lemmatizer?: (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>;
  searchAllForms?: boolean;
  lang?: string;
}

export interface DownloadOptions {
  force?: boolean;
  progress?: (progress: number) => void;
}

export interface AddOptions {
  force?: boolean;
  progress?: (progress: number) => void;
}

export interface ExportOptions {
  format: 'json' | 'xml' | 'csv';
  output?: string;
  include?: string[];
  exclude?: string[];
}

// Error types
export class WnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnError';
  }
}

export class DatabaseError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProjectError extends WnError {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class WnWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WnWarning';
  }
} 
/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 */

// Core classes
export { Wordnet } from './wordnet.js';
export { config, ConfigManager } from './config.js';
// Note: db export is for internal debugging only - use Wordnet instance methods instead

// New Kysely-based implementation
export { KyselyWordnet, type NodeWordnetConfig } from './kysely-wordnet.js';
export * from './database/index.js';

// Download utilities
export { downloadFile, DownloadError } from 'wn-ts-core';
export type { DownloadOptions } from 'wn-ts-core';

// Data management functions - matching Python wn API exactly
// These are now available at the top level for easy importing
export {
  download,
  add,
  addLexicalResource,
  remove,
  exportData as export,
} from './data-management-new.js';

// Module functions - matching Python wn API exactly
export {
  projects,
  lexicons,
  word,
  words,
  sense,
  senses,
  synset,
  synsets,
  ili,
  ilis,
} from './module-functions.js';

// Project management functions
export {
  getProjects,
  getProject,
  getProjectVersions,
  getProjectVersionUrls,
  getProjectVersionError,
  loadProjectIndex,
  clearProjectIndexCache,
} from 'wn-ts-core';
export type { ProjectIndex, ProjectVersion } from 'wn-ts-core';

// Types and interfaces
export type {
  Word,
  Sense,
  Synset,
  Lexicon,
  Project,
  ILI,
  Form,
  Pronunciation,
  Tag,
  Count,
  Example,
  Definition,
  Relation,
  PartOfSpeech,
  WordnetConfig,
  WordnetOptions,
  AddOptions,
  ExportOptions,
} from 'wn-ts-core';

// Error classes - matching Python wn API exactly
export {
  Error as WnError,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning,
} from 'wn-ts-core';

// LMF Parsers module
export {
  parseLMFXML,
  createMinimalLMF,
} from 'wn-ts-core';
export {
  loadLMF,
  isLMF,
} from './lmf.js';
export type { LMFDocument, LMFLoadOptions } from 'wn-ts-core';

// Database exports - removed during Kysely migration
// Use KyselyWordnet or Wordnet instance methods instead

// Version
export const __version__ = '0.1.1';

 

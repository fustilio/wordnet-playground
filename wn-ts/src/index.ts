/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 */

// Core classes
export { Wordnet } from './wordnet.js';
export { config, ConfigManager } from './config.js';
export { db } from './database.js';

// Download utilities
export { downloadFile, DownloadError } from './utils/download.js';
export type { DownloadOptions } from './utils/download.js';

// Data management functions - matching Python wn API exactly
// These are now available at the top level for easy importing
export {
  download,
  add,
  addLexicalResource,
  remove,
  exportData as export,
} from './data-management.js';

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
} from './project.js';
export type { ProjectIndex, ProjectVersion } from './project.js';

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
} from './types.js';

// Error classes - matching Python wn API exactly
export {
  WnError as Error,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning,
} from './types.js';

// LMF Parsers module
export * from './parsers/index.js';

// Version
export const __version__ = '0.1.0';

 
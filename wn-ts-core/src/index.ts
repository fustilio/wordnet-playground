/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 */

// Core classes
export { Wordnet, BaseWordnet } from './wordnet.js';
export { config, ConfigManager } from './config.js';

// Download utilities
export { downloadFile, DownloadError } from './utils/download.js';
export type { DownloadOptions } from './types.js';

// Logger utility
export { logger, Logger, LogLevel } from './utils/logger.js';

// Archive utilities
export { extractTarArchive, decompressXz, decompressGz, findLMFiles } from './utils/archive.js';

// Data management functions - environment-agnostic
export {
  download,
  loadLexicalResource,
} from './data-management.js';

// ILI functions
export { isILI, loadILI } from './ili.js';

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

// Browser data generation tool - moved to environment-specific packages

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
export { parseLMFXML } from './lmf.js';

// Database interface (environment-agnostic)
export * from './db/interface.js';
export * from './db/database.js';

// Additional exports
export { Morphy, createMorphy } from './morphy.js';
export { path, wup, lch, res, jcn, lin } from './similarity.js';
export { hypernyms, shortestPath, maxDepth, lowestCommonHypernyms } from './synset-utils.js';
export { minDepth, taxonomyShortestPath, roots, leaves, taxonomyDepth, hypernymPaths } from './taxonomy.js';
export { validateSynset, validateSense, validateWord, validateRelation, validateWordnet } from './validate.js';
export type { Freq } from './ic.js';

// Version
export const __version__ = '0.1.1';

 
/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 * This package is environment-agnostic and provides interfaces and abstract classes.
 * Concrete implementations are provided by environment-specific packages.
 */

// Core abstract classes only
export { BaseWordnet } from './wordnet.js';
export { config, ConfigManager } from './config.js';

// Download utilities (environment-agnostic)
export { downloadFile, DownloadError } from './utils/download.js';
export type { DownloadOptions } from './types.js';

// Logger utility (environment-agnostic)
export { logger, Logger, LogLevel } from './utils/logger.js';

// Archive utilities (environment-agnostic)
export { extractTarArchive, decompressXz, decompressGz, findLMFiles } from './utils/archive.js';

// Package ID utilities (environment-agnostic)
export { parsePackageId, formatPackageId, isValidPackageId, getPackageBase, getPackageVersion } from './utils/package-id.js';
export type { PackageIdParts } from './utils/package-id.js';

// Data management functions - environment-agnostic
export {
  download,
  loadLexicalResource,
} from './data-management.js';

// ILI functions (environment-agnostic)
export { isILI, loadILI } from './ili.js';

// Module functions - environment-agnostic stubs
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

// Project management functions (environment-agnostic)
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

// Types and interfaces (environment-agnostic)
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
  WordQuery,
  SynsetQuery,
  SenseQuery,
} from './types.js';

// Error classes (environment-agnostic)
export {
  WnError as Error,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning,
} from './types.js';

// LMF Parsers module (environment-agnostic)
export * from './parsers/index.js';
export { parseLMFXML, diagnoseDownloadIssue, analyzeXMLContent } from './lmf.js';

// LMF Validation system (environment-agnostic)
export * from './validation.js';

// Database interface (environment-agnostic)
export * from './db/interface.js';
export * from './db/database.js';

// Abstract database interfaces and query builders (environment-agnostic)
export * from './types/database.js';
export * from './queries/abstract-word-queries.js';

// Utility functions (environment-agnostic)
export { Morphy, createMorphy } from './morphy.js';
export { path, wup, lch, res, jcn, lin } from './similarity.js';
export { hypernyms, shortestPath, maxDepth, lowestCommonHypernyms } from './synset-utils.js';
export { minDepth, taxonomyShortestPath, roots, leaves, taxonomyDepth, hypernymPaths } from './taxonomy.js';
export { validateSynset, validateSense, validateWord, validateRelation, validateWordnet } from './validate.js';
export type { Freq } from './ic.js';

// Version
export const __version__ = '0.1.1';

 
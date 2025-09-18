/**
 * Data Management Module
 * 
 * Provides functions for downloading, loading, and managing WordNet data,
 * including project management and ILI handling.
 * 
 * This is a CORE MODULE - essential for WordNet functionality.
 */

// Re-export individual functions for direct use
export { download, loadLexicalResource } from './data-management.js';
export { 
  getProjects, 
  getProject, 
  getProjectVersions, 
  getProjectVersionUrls, 
  getProjectVersionError, 
  loadProjectIndex, 
  clearProjectIndexCache 
} from './project.js';
export { isILI, loadILI } from './ili.js';
export type { IliRecord } from './ili.js';

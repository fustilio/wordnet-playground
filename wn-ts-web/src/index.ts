/**
 * wn-ts-web - Browser-compatible WordNet implementation
 * Based on wn-ts-core with @sqlite.org/sqlite-wasm for database operations
 */

// Import the index data for browser environments
import indexData from './index.json' assert { type: 'json' };

// Export the main classes and types
export { WebWordnet } from './web-wordnet.js';
export { WebDatabase } from './web-database.js';
export { DataLoader } from './data-loader.js';
export { createWebWordnet, createDataLoader, createWordNetInstance } from './factory.js';
export { OPFSManager } from './opfs-manager.js';
export { DataManager } from './data-manager.js';

// Export database types and interfaces
export type { Database, WordRecord, SynsetRecord, SenseRecord, DefinitionRecord, RelationRecord, ExampleRecord, IliRecord, LexiconRecord } from './types/database.js';

// Export the index data for browser environments
export { default as indexData } from './index.json' assert { type: 'json' };

// Export project-related types and utilities
export interface ProjectData {
  label?: string;
  language?: string;
  license?: string;
  description?: string;
  url?: string;
  citation?: string;
  versions: Record<string, { url?: string; error?: string }>;
}

export interface ProjectInfo {
  id: string;
  label: string;
  language?: string;
  license?: string;
  description?: string;
  url?: string;
  citation?: string;
  versions: string[];
}

/**
 * Get all available projects with their versions
 */
export function getAvailableProjects(): ProjectInfo[] {
  return Object.entries(indexData as unknown as Record<string, ProjectData>)
    .filter(([, project]) => project.label) // Only include projects with labels
    .map(([id, project]) => ({
      id,
      label: project.label!,
      language: project.language,
      license: project.license,
      description: project.description,
      url: project.url,
      citation: project.citation,
      versions: Object.keys(project.versions)
    }));
}

/**
 * Get project details
 */
export function getProjectDetails(projectId: string): ProjectInfo | null {
  const project = (indexData as unknown as Record<string, ProjectData>)[projectId];
  if (!project || !project.label) return null;
  
  return {
    id: projectId,
    label: project.label,
    language: project.language,
    license: project.license,
    description: project.description,
    url: project.url,
    citation: project.citation,
    versions: Object.keys(project.versions)
  };
}

// Export OPFS and data management types
export type { 
  OPFSStorageInfo,
  DownloadProgress,
  DownloadOptions,
  OPFSFileInfo
} from './opfs-manager.js';

export type {
  LexiconInfo,
  DatabaseStatistics,
  ExportOptions,
  CleanupOptions
} from './data-manager.js';

// Export Kysely-related functionality
export { KyselyQueryService } from './database/kysely-query-service.js';

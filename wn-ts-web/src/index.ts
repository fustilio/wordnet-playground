/**
 * wn-ts-web - Browser-compatible WordNet implementation
 * Based on wn-ts-core with @sqlite.org/sqlite-wasm for database operations
 */

// Project/index utilities
import { Project } from './project.js';

// Core exports
export { createWebWordnet, createDataLoader, createWordNetInstance } from './factory.js';
export { WebWordnet } from './web-wordnet.js';
export { WebDatabase } from './web-database.js';
export { DataLoader } from './data-loader.js';
export { OPFSManager } from './opfs-manager.js';
export { DataManager } from './data-manager.js';

// Orchestration and worker exports
export { WordNetOrchestrator } from './wordnet-orchestrator.js';
export { WordNetWorkerClient } from './wordnet-worker-client.js';
export type { 
  LexiconState, 
  OrchestratorOptions, 
  LoadLexiconOptions, 
  QueryOptions
} from './wordnet-orchestrator.js';
export type {
  WordNetWorkerAPI,
  LexiconInfo,
  WordNetEventMap,
  WordNetEventListener
} from './wordnet-worker-client.js';

// Worker factory exports (framework-agnostic)
export { createWordNetWorker } from './worker-factory';

// Note: React hooks are not exported here to keep wn-ts-web framework-agnostic
// They can be imported separately from './react-hooks' if needed, or moved to a separate package

// Export event system
export { WordNetEventEmitter, WordNetEvents } from './event-emitter.js';
export type { EventCallback, WordNetEventName } from './event-emitter.js';

// Export database types and interfaces
export type { Database, WordRecord, SynsetRecord, SenseRecord, DefinitionRecord, RelationRecord, ExampleRecord, IliRecord, LexiconRecord } from './types/database.js';

// Export the index data for browser environments
// TODO: I don't think we need this as we should get the info from project class
// export { default as indexData } from './index.json' assert { type: 'json' };

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
  const merged = Project.getIndex() as unknown as Record<string, ProjectData>;
  return Object.entries(merged)
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
  const merged = Project.getIndex() as unknown as Record<string, ProjectData>;
  const project = merged[projectId];
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
  DatabaseStatistics,
  ExportOptions,
  CleanupOptions
} from './data-manager.js';

// Export Kysely-related functionality
export { KyselyQueryService } from './database/kysely-query-service.js';

// Re-export Project for consumers who want to work with the index directly
export { Project } from './project.js';

// Convenience wrappers for extending the project index at runtime
export function extendProjectIndex(indexLike: Record<string, unknown>): void {
  Project.extendIndex(indexLike);
}

export async function extendProjectIndexFromUrl(url: string): Promise<void> {
  await Project.extendIndexFromUrl(url);
}

export function clearCustomProjectIndex(): void {
  Project.clearCustomIndex();
}

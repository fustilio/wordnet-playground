/**
 * wn-ts-web - Browser-compatible WordNet implementation
 * Based on wn-ts-core with @sqlite.org/sqlite-wasm for database operations
 */

// Project/index utilities
import { Project } from './project.js';

// Core exports (deprecated - use WebWordNetKernel instead)
export { createWebWordnet, createDataLoader, createWordNetInstance } from './factory.js';
export { WebWordnet } from './client/submodules/web-wordnet.js';
export { WebDatabase } from './client/submodules/web-database.js';
export { WebDataManager as DataLoader } from './data-management/index.js';

// New kernel-based architecture (recommended)
export { WebWordNetKernel } from './wordnet-kernel.js';
export { WebWordNetCore } from './wordnet-core.js';

// React components for kernel architecture
export { 
  useWordNetKernel, 
  WordNetKernelProvider, 
  useWordNetKernelContext 
} from './react/index.js';


// Orchestration and worker exports
export { WordNetOrchestrator } from './workers/wordnet-orchestrator.js';
export { WordNetWorkerClient } from './client/wordnet-worker-client.js';
export type { 
  LexiconState, 
  OrchestratorOptions, 
  LoadLexiconOptions, 
  QueryOptions
} from './workers/wordnet-orchestrator.js';
export type {
  LexiconInfo,
  WordNetEventMap,
  WordNetEventListener
} from './types/index.js';
export type { WordNetWorkerAPI } from './workers/type.js';

// Worker factory exports (framework-agnostic)
export { createWordNetWorker } from './client/utils/worker-factory.js';
export { parsePackageId, formatPackageId, isValidPackageId, getPackageBase, getPackageVersion } from 'wn-ts-core';
export type { PackageIdParts } from 'wn-ts-core';

// Translation utilities (re-exported from wn-ts-core)
export {
  TranslationHelper,
  createTranslationHelper,
  quickTranslate,
} from 'wn-ts-core';
export type {
  TranslationResult,
  BilingualQueryOptions,
} from 'wn-ts-core';

// Export all types from centralized location
export type * from './types/index.js';

// Note: React hooks are not exported here to keep wn-ts-web framework-agnostic
// They can be imported separately from './react-hooks' if needed, or moved to a separate package

// Export event system
export { WordNetEventEmitter, WordNetEvents } from './event-emitter.js';
export type { EventCallback, WordNetEventName } from './event-emitter.js';

// Export database types and interfaces
export type { Database } from './types/database.js';

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
  language: string;
  license: string;
  description: string;
  url: string;
  citation: string;
  versions: string[];
}

/**
 * Get all available projects with their versions
 */
export function getAvailableProjects(): ProjectInfo[] {
  const merged = Project.getIndex() as unknown as Record<string, ProjectData>;
  return Object.entries(merged)
    .filter(([, project]) => project && !('error' in project) && project.label) // Only include valid projects with labels
    .map(([id, project]) => {
      // Filter out versions that have errors
      const validVersions = Object.entries(project.versions)
        .filter(([, versionData]) => !('error' in versionData))
        .map(([version]) => version);
      
      if (validVersions.length === 0) {
        // Skip projects with no valid versions
        return null;
      }
      
      // Create a temporary Project instance to get computed properties using the first valid version
      const version = validVersions[0];
      const tempProject = new Project(`${id}:${version}`);
      return {
        id,
        label: project.label!,
        language: project.language || 'en',
        license: project.license || 'https://creativecommons.org/licenses/by/4.0/',
        description: 'WordNet project',
        url: tempProject.primaryUrl,
        citation: tempProject.citation,
        versions: validVersions
      };
    })
    .filter((project): project is ProjectInfo => project !== null); // Remove null entries
}

/**
 * Get project details
 */
export function getProjectDetails(projectId: string): ProjectInfo | null {
  const merged = Project.getIndex() as unknown as Record<string, ProjectData>;
  const project = merged[projectId];
  if (!project || 'error' in project || !project.label) return null;
  
  // Create a temporary Project instance to get computed properties
  const version = Object.keys(project.versions)[0] || 'latest';
  const tempProject = new Project(`${projectId}:${version}`);
  
  return {
    id: projectId,
    label: project.label,
    language: project.language || 'en',
    license: project.license || 'https://creativecommons.org/licenses/by/4.0/',
    description: 'WordNet project',
    url: tempProject.primaryUrl,
    citation: tempProject.citation,
    versions: Object.keys(project.versions)
  };
}



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

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Type imports for Node.js modules
import type { readFileSync as NodeReadFileSync, existsSync as NodeExistsSync, copyFileSync as NodeCopyFileSync } from 'fs';
import type { join as NodeJoin, dirname as NodeDirname } from 'path';
import type { fileURLToPath as NodeFileURLToPath } from 'url';

// Browser-compatible stubs with proper signatures
const browserReadFileSync = (_path: string, _encoding?: any) => '';
const browserExistsSync = (_path: string) => false;
const browserCopyFileSync = (_src: string, _dest: string) => {};
const browserJoin = (...paths: string[]) => paths.join('/');
const browserDirname = (path: string) => path.split('/').slice(0, -1).join('/') || '.';
const browserFileURLToPath = (url: string) => url;

// Use browser stubs by default, will be overridden in Node.js
let readFileSync: typeof NodeReadFileSync = browserReadFileSync as any;
let existsSync: typeof NodeExistsSync = browserExistsSync as any;
let copyFileSync: typeof NodeCopyFileSync = browserCopyFileSync as any;
let join: typeof NodeJoin = browserJoin as any;
let dirname: typeof NodeDirname = browserDirname as any;
let fileURLToPath: typeof NodeFileURLToPath = browserFileURLToPath as any;

// Initialize Node.js functions if available
if (isNode) {
  try {
    // Use dynamic imports for ESM compatibility
    import('fs').then(fs => {
      readFileSync = fs.readFileSync;
      existsSync = fs.existsSync;
      copyFileSync = fs.copyFileSync;
    }).catch(() => {});
    
    import('path').then(path => {
      join = path.join;
      dirname = path.dirname;
    }).catch(() => {});
    
    import('url').then(url => {
      fileURLToPath = url.fileURLToPath;
    }).catch(() => {});
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

import { parse } from 'smol-toml';
import { config } from '../../../modules/environment/config.js';

// ESM-compatible __dirname (only in Node.js)
const __dirname = isNode ? dirname(fileURLToPath(import.meta.url)) : '.';
import type { Project } from '../../../core/types.js';
import { ProjectError } from '../../../core/errors.js';

export interface ProjectVersion {
  url?: string;
  urls?: string[];
  error?: string;
}

export interface ProjectIndex {
  [projectId: string]: {
    type?: string;
    label: string;
    language?: string;
    license?: string;
    description?: string;
    url?: string;
    citation?: string;
    metadata?: Record<string, unknown>;
    versions: {
      [version: string]: ProjectVersion;
    };
  };
}

let cachedProjectIndex: ProjectIndex | null = null;

/**
 * Load the project index from the TOML file
 */
export function loadProjectIndex(): ProjectIndex {
  if (cachedProjectIndex) {
    return cachedProjectIndex;
  }

  const dataIndexPath = join(config.dataDirectory, 'index.toml');

  // If index.toml doesn't exist in the data directory, copy it from the package source.
  if (!existsSync(dataIndexPath)) {
    try {
      const sourceIndexPath = join(__dirname, 'index.toml');
      if (existsSync(sourceIndexPath)) {
        // The config.dataDirectory getter ensures the directory exists.
        copyFileSync(sourceIndexPath, dataIndexPath);
      }
    } catch (copyError) {
      // If copy fails, we can still try to load from source directly.
      console.warn(`Could not copy project index to data directory: ${copyError}`);
    }
  }

  // First, try loading from the user's data directory.
  try {
    const tomlContent = readFileSync(dataIndexPath, 'utf8');
    const parsed = parse(tomlContent) as unknown as ProjectIndex;
    cachedProjectIndex = parsed;
    return parsed;
  } catch (error) {
    // If that fails, fall back to loading from the package's source directory.
    try {
      const sourceIndexPath = join(__dirname, 'index.toml');
      const tomlContent = readFileSync(sourceIndexPath, 'utf8');
      const parsed = parse(tomlContent) as unknown as ProjectIndex;
      cachedProjectIndex = parsed;
      return parsed;
    } catch (fallbackError) {
      const originalError = error instanceof Error ? error.message : String(error);
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new ProjectError(`Failed to load project index from both data directory and package source. Error (data dir): ${originalError}. Error (package source): ${fallbackErrorMessage}`);
    }
  }
}

/**
 * Get all available projects
 */
export function getProjects(): Project[] {
  const index = loadProjectIndex();
  const projects: Project[] = [];

  for (const [id, project] of Object.entries(index)) {
    const projectData: Project = {
      id,
      label: project.label,
      description: project.description || '',
      ...(project.url && { url: project.url }),
    };
    if (project.license) projectData.license = project.license;
    if (project.citation) projectData.citation = project.citation;
    if (project.metadata) projectData.metadata = project.metadata;
    
    projects.push(projectData);
  }

  return projects;
}

/**
 * Get a specific project by ID
 */
export function getProject(projectId: string): Project | undefined {
  const index = loadProjectIndex();
  const project = index[projectId];

  if (!project) {
    return undefined;
  }

  const projectData: Project = {
    id: projectId,
    label: project.label,
    description: project.description || '',
    ...(project.url && { url: project.url }),
  };
  if (project.license) projectData.license = project.license;
  if (project.citation) projectData.citation = project.citation;
  if (project.metadata) projectData.metadata = project.metadata;

  return projectData;
}

/**
 * Get available versions for a project
 */
export function getProjectVersions(projectId: string): string[] {
  const index = loadProjectIndex();
  const project = index[projectId];

  if (!project) {
    return [];
  }

  return Object.keys(project.versions);
}

/**
 * Get download URL for a specific project version
 */
export function getProjectVersionUrls(projectId: string, version: string): string[] {
  const index = loadProjectIndex();
  const project = index[projectId];

  if (!project || !project.versions[version]) {
    return [];
  }

  const projectVersion = project.versions[version];
  
  if (projectVersion.error) {
    throw new ProjectError(`Project version error: ${projectVersion.error}`);
  }

  const urlString = projectVersion.url;
  if (urlString) {
    return urlString.split(/\s+/).filter(Boolean);
  }

  return [];
}

/**
 * Check if a project version has an error
 */
export function getProjectVersionError(projectId: string, version: string): string | undefined {
  const index = loadProjectIndex();
  const project = index[projectId];

  if (!project || !project.versions[version]) {
    return undefined;
  }

  return project.versions[version].error;
}

/**
 * Clear the cached project index (useful for testing)
 */
export function clearProjectIndexCache(): void {
  cachedProjectIndex = null;
} 

import { readFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'smol-toml';
import { config } from './config.js';

// ESM-compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));
import type { Project } from './types.js';
import { ProjectError } from './types.js';

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
    };
    
    if (project.description) projectData.description = project.description;
    if (project.url) projectData.url = project.url;
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
  };
  
  if (project.description) projectData.description = project.description;
  if (project.url) projectData.url = project.url;
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

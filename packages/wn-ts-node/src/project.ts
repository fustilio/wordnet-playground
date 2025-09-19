/**
 * Project management for wn-ts-node
 * Uses Node.js-specific config and file system operations
 */

import { config } from './config.js';
import { parse } from 'smol-toml';
import { readFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Project, ProjectIndex } from 'wn-ts-core';
import { ProjectError } from 'wn-ts-core';

// ESM-compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedProjectIndex: ProjectIndex | null = null;

/**
 * Load the project index from the TOML file using Node.js config
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
      throw new Error(`Failed to load project index from both data directory and package source. Error (data dir): ${originalError}. Error (package source): ${fallbackErrorMessage}`);
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
 * Clear the project index cache
 */
export function clearProjectIndexCache(): void {
  cachedProjectIndex = null;
} 

/**
 * Get download URL for a specific project version (Node.js implementation)
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
 * Check if a project version has an error (Node.js implementation)
 */
export function getProjectVersionError(projectId: string, version: string): string | undefined {
  const index = loadProjectIndex();
  const project = index[projectId];

  if (!project || !project.versions[version]) {
    return undefined;
  }

  return project.versions[version].error;
} 
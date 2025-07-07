import { join, dirname } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import toml from 'smol-toml';
import { ConfigurationError, ProjectError } from './types.js';
import { fileURLToPath } from 'url';
import { statSync } from 'fs';
import { logger } from './utils/logger.js';

// ESM-compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProjectVersion {
  resource_urls?: string[];
  error?: string;
  license?: string;
}

export interface Project {
  type?: string;
  label?: string | undefined;
  language?: string | undefined;
  license?: string | undefined;
  error?: string | undefined;
  versions: Record<string, ProjectVersion>;
}

export interface ProjectInfo {
  id: string;
  version: string;
  type: string;
  label: string;
  language: string;
  license: string;
  resource_urls: string[];
  cache?: string | undefined;
}

export interface Config {
  dataDirectory: string;
  downloadDirectory: string;
  databasePath: string;
  allowMultithreading: boolean;
}

class ConfigManager {
  private _dataDirectory: string;
  private _projects: Record<string, Project>;
  private _allowMultithreading: boolean;

  constructor() {
    const homeDir = homedir();
    this._dataDirectory = join(homeDir, '.wn_ts_data');
    this._projects = {};
    this._allowMultithreading = false;
    
    // Load the default index
    this.loadIndex(join(__dirname, 'index.toml'));
  }

  get dataDirectory(): string {
    this.ensureDirectory(this._dataDirectory);
    return this._dataDirectory;
  }

  set dataDirectory(path: string) {
    const expandedPath = path.startsWith('~') ? join(homedir(), path.slice(1)) : path;
    logger.config(`Setting dataDirectory to: ${expandedPath}`);
    logger.config(`Path exists: ${existsSync(expandedPath)}`);
    if (existsSync(expandedPath)) {
      logger.config(`Is directory: ${this.isDirectory(expandedPath)}`);
    }
    // Only check if it's not a directory if it exists, but don't require it to exist
    if (existsSync(expandedPath) && !this.isDirectory(expandedPath)) {
      throw new ConfigurationError(`Path exists and is not a directory: ${expandedPath}`);
    }
    this._dataDirectory = expandedPath;
    logger.success(`dataDirectory set successfully to: ${this._dataDirectory}`);
  }

  get databasePath(): string {
    return join(this.dataDirectory, 'wn.db');
  }

  get downloadDirectory(): string {
    const dir = join(this.dataDirectory, 'downloads');
    this.ensureDirectory(dir);
    return dir;
  }

  get allowMultithreading(): boolean {
    return this._allowMultithreading;
  }

  set allowMultithreading(value: boolean) {
    this._allowMultithreading = value;
  }

  get index(): Record<string, Project> {
    return { ...this._projects };
  }

  getCachePath(url: string): string {
    // Generate a consistent cache path based on URL hash
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return join(this.downloadDirectory, hash);
  }

  addProject(
    id: string,
    type: string = 'wordnet',
    label?: string,
    language?: string,
    license?: string,
    error?: string
  ): void {
    if (id in this._projects) {
      throw new Error(`Project already added: ${id}`);
    }
    this._projects[id] = {
      type,
      label,
      language,
      versions: {},
      license,
    };
    if (error) {
      this._projects[id].error = error;
    }
  }

  addProjectVersion(
    id: string,
    version: string,
    url?: string,
    error?: string,
    license?: string
  ): void {
    const versionData: ProjectVersion = {};
    
    if (url && !error) {
      versionData.resource_urls = url.split(/\s+/).filter(Boolean);
    } else if (error && !url) {
      versionData.error = error;
    } else if (url && error) {
      throw new ConfigurationError(`${id}:${version} specifies both url and error`);
    }
    
    if (license) {
      versionData.license = license;
    }
    
    const project = this._projects[id];
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    project.versions[version] = versionData;
  }

  getProjectInfo(arg: string): ProjectInfo {
    const [id, version] = this.splitLexiconSpecifier(arg);
    if (!(id in this._projects)) {
      throw new ProjectError(`No such project id: ${id}`);
    }
    const project = this._projects[id]!;
    if (project.error) {
      throw new ProjectError(project.error);
    }
    const versions = project.versions;
    let targetVersion = version;
    if (!targetVersion || targetVersion === '*') {
      targetVersion = Object.keys(versions)[0] || '';
    }
    if (!targetVersion) {
      throw new ProjectError(`No versions available for ${id}`);
    } else if (!(targetVersion in versions)) {
      throw new ProjectError(`No such version: '${targetVersion}' (${id})`);
    }
    const info = versions[targetVersion]!;
    if (info.error) {
      throw new ProjectError(info.error);
    }
    const urls = info.resource_urls || [];
    return {
      id,
      version: targetVersion,
      type: project.type || 'wordnet',
      label: project.label || '',
      language: project.language || '',
      license: info.license || project.license || '',
      resource_urls: urls,
      cache: undefined,
    };
  }

  loadIndex(path: string): void {
    try {
      const content = readFileSync(path, 'utf-8');
      const index = toml.parse(content) as Record<string, any>;
      this.update({ index });
    } catch (error: any) {
      if (error && (error.name === 'TomlError' || error.constructor?.name === 'TomlError')) {
        throw new ConfigurationError('malformed index file');
      }
      throw error;
    }
  }

  ensureDirectory(path: string): void {
    if (!existsSync(path)) {
      try {
        mkdirSync(path, { recursive: true });
      } catch (error) {
        throw new ConfigurationError(
          `Failed to create directory ${path}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  isDirectory(path: string): boolean {
    try {
      const stats = statSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  splitLexiconSpecifier(spec: string): [string, string] {
    const parts = spec.split(':');
    if (parts.length === 1) {
      return [parts[0]!, ''];
    }
    return [parts[0]!, parts.slice(1).join(':')];
  }

  update(data: Record<string, any>): void {
    const index = data.index || {};
    for (const [id, project] of Object.entries(index)) {
      const projectData = project as any;
      if (id in this._projects) {
        // Validate that they are the same
        const existingProject = this._projects[id]!;
        for (const attr of ['label', 'language', 'license'] as const) {
          if (attr in projectData && projectData[attr] !== existingProject[attr]) {
            throw new ConfigurationError(`${attr} mismatch for ${id}`);
          }
        }
      } else {
        this.addProject(
          id,
          projectData.type || 'wordnet',
          projectData.label,
          projectData.language,
          projectData.license,
          projectData.error
        );
      }
      for (const [version, info] of Object.entries(projectData.versions || {})) {
        const versionData = info as any;
        if ('url' in versionData && 'error' in projectData) {
          throw new ConfigurationError(`${id}:${version} url specified with default error`);
        }
        this.addProjectVersion(
          id,
          version,
          versionData.url,
          versionData.error,
          versionData.license
        );
      }
    }
  }
}

export const config = new ConfigManager();
export { ConfigManager };
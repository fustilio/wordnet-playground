/**
 * Environment-agnostic configuration interfaces for wn-ts-core
 * Concrete implementations will be provided by environment-specific packages
 */

import { ConfigurationError, ProjectError } from './types.js';

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
  allowMultithreading: boolean;
}

/**
 * Abstract configuration manager interface
 * Environment-specific packages will provide concrete implementations
 */
export abstract class ConfigManager {
  abstract get dataDirectory(): string;
  abstract set dataDirectory(path: string);
  abstract get downloadDirectory(): string;
  abstract get allowMultithreading(): boolean;
  abstract set allowMultithreading(value: boolean);
  abstract get index(): Record<string, Project>;
  abstract getCachePath(url: string): string;
  abstract addProject(
    id: string,
    type?: string,
    label?: string,
    language?: string,
    license?: string,
    error?: string
  ): void;
  abstract addProjectVersion(
    id: string,
    version: string,
    url?: string,
    error?: string,
    license?: string
  ): void;
  abstract getProjectInfo(arg: string): ProjectInfo;
  abstract loadIndex(path: string): void;
  abstract ensureDirectory(path: string): void;
  abstract isDirectory(path: string): boolean;
  abstract splitLexiconSpecifier(spec: string): [string, string];
  abstract update(data: Record<string, any>): void;
}

/**
 * Placeholder configuration manager for wn-ts-core
 * This will be replaced by concrete implementations in environment-specific packages
 */
export class PlaceholderConfigManager extends ConfigManager {
  get dataDirectory(): string {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  set dataDirectory(_path: string) {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  get downloadDirectory(): string {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  get allowMultithreading(): boolean {
    return false;
  }

  set allowMultithreading(_value: boolean) {
    // No-op for placeholder
  }

  get index(): Record<string, Project> {
    return {};
  }

  getCachePath(_url: string): string {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  addProject(
    _id: string,
    _type: string = 'wordnet',
    _label?: string,
    _language?: string,
    _license?: string,
    _error?: string
  ): void {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  addProjectVersion(
    _id: string,
    _version: string,
    _url?: string,
    _error?: string,
    _license?: string
  ): void {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  getProjectInfo(_arg: string): ProjectInfo {
    throw new ProjectError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  loadIndex(_path: string): void {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  ensureDirectory(_path: string): void {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }

  isDirectory(_path: string): boolean {
    return false;
  }

  splitLexiconSpecifier(spec: string): [string, string] {
    const parts = spec.split(':');
    if (parts.length === 1) {
      return [parts[0]!, ''];
    }
    return [parts[0]!, parts.slice(1).join(':')];
  }

  update(_data: Record<string, any>): void {
    throw new ConfigurationError('Configuration not available in wn-ts-core. Use wn-ts-node for Node.js configuration support.');
  }
}

// Export placeholder config for wn-ts-core
export const config = new PlaceholderConfigManager();
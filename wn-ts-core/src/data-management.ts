/**
 * Environment-agnostic data management functions for wn-ts-core
 * Database-specific functions are moved to environment-specific packages
 */


import type { DownloadOptions } from './types.js';
import { ProjectError } from './types.js';

/**
 * Download a project from the project index
 * This function is environment-agnostic and requires a config parameter
 */
export async function download(
  _projectId: string,
  _options: DownloadOptions = {},
  _config?: { downloadDirectory: string }
): Promise<string> {
  throw new ProjectError('The `download` function is not available in this environment. Please use `wn-ts-node`.');
}

/**
 * Load and parse a lexical resource file
 * This function is environment-agnostic and returns parsed data
 */
export async function loadLexicalResource(
  _path: string,
  _options: { progress?: (progress: number) => void, parser?: string } = {}
): Promise<{ type: 'lmf' | 'ili', data: any }> {
  throw new ProjectError('The `loadLexicalResource` function is not available in this environment. Please use `wn-ts-node`.');
}

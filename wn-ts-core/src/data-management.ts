/**
 * Environment-agnostic data management functions for wn-ts-core
 * Database-specific functions are moved to environment-specific packages
 */

import { join } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { downloadFile } from './utils/download.js';
import { loadLMF, isLMF } from './lmf.js';
import { getProjectVersionUrls, getProjectVersionError } from './project.js';
import type { DownloadOptions } from './types.js';
import { ProjectError } from './types.js';
import {
  extractTarArchive,
  findLMFiles,
  decompressXz,
  decompressGz,
} from './utils/archive.js';
import { isILI, loadILI } from './ili.js';
import { logger } from './utils/logger.js';

/**
 * Download a project from the web
 * This function is environment-agnostic and can be used in any environment
 */
export async function download(
  projectId: string,
  options: DownloadOptions = {}
): Promise<string> {
  const { force = false, progress } = options;
  logger.download(`Downloading project: ${projectId}`);

  // Parse project ID to get version
  const [projectIdClean, version] = projectId.split(':');
  if (!version) {
    throw new ProjectError(
      `Project ID must include version (e.g., 'oewn:2024'): ${projectId}`
    );
  }

  // Check for version errors
  const versionError = getProjectVersionError(projectIdClean || '', version || '');
  if (versionError) {
    throw new ProjectError(`Project version error: ${versionError}`);
  }

  // Get download URL from project index
  const urls = getProjectVersionUrls(projectIdClean || '', version || '');
  if (!urls || urls.length === 0) {
    throw new ProjectError(`No download URL found for project ${projectId}`);
  }

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      // Determine the correct file extension from the URL
      const urlParts = url.split('/');
      const urlFileName = urlParts[urlParts.length - 1];
      const fileName = `${projectIdClean}-${version}-${urlFileName}`;
      const destination = join(config.downloadDirectory, fileName);

      if (existsSync(destination) && !force) {
        logger.info(`File already exists: ${destination}. Use --force to re-download.`);
        return destination;
      }

      logger.download(`Downloading from ${url}...`);
      await downloadFile(
        url,
        destination,
        progress ? { onProgress: progress } : undefined
      );
      logger.success(`Successfully downloaded to ${destination}`);
      return destination;
    } catch (error) {
      logger.error(`Failed to download from ${url}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new ProjectError(
    `Failed to download project ${projectId} from all sources: ${lastError?.message}`
  );
}

/**
 * Load and parse a lexical resource file
 * This function is environment-agnostic and returns parsed data
 */
export async function loadLexicalResource(
  path: string,
  options: { progress?: (progress: number) => void, parser?: string } = {}
): Promise<{ type: 'lmf' | 'ili', data: any }> {
  const { progress, parser = "" } = options;
  if (progress) progress(0.1); // Initialize progress

  if (!existsSync(path)) {
    throw new ProjectError(`File not found: ${path}`);
  }

  try {
    let processedPath = path;

    if (path.endsWith('.tar.xz') || path.endsWith('.tar.gz')) {
      logger.extract(`Extracting archive: ${path}...`);
      const extractedPath = await extractTarArchive(path);
      logger.success(`Extracted to: ${extractedPath}`);
      const lmfFiles = await findLMFiles(extractedPath);
      if (lmfFiles.length === 0) {
        throw new ProjectError(`No LMF files found in extracted archive: ${path}`);
      }
      processedPath = lmfFiles[0] || '';
    } else if (path.endsWith('.xz')) {
      logger.extract(`Decompressing file: ${path}...`);
      const decompressedPath = path.slice(0, -3);
      await decompressXz(path, decompressedPath);
      processedPath = decompressedPath;
    } else if (path.endsWith('.gz')) {
      logger.extract(`Decompressing file: ${path}...`);
      const decompressedPath = path.slice(0, -3);
      await decompressGz(path, decompressedPath);
      processedPath = decompressedPath;
    }

    const isLmfFile = await isLMF(processedPath);
    const isIliFile = !isLmfFile && (await isILI(processedPath));

    if (isLmfFile) {
      const lmfOptions: any = { debug: false };
      if (parser) lmfOptions.parser = parser;
      if (progress) lmfOptions.progress = progress;
      const lmfData = await loadLMF(processedPath, lmfOptions);
      return { type: 'lmf', data: lmfData };
    } else if (isIliFile) {
      const iliData = await loadILI(processedPath);
      return { type: 'ili', data: iliData };
    } else {
      throw new ProjectError(`File is not a valid LMF or ILI file: ${processedPath}`);
    }
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new ProjectError(
      `Failed to load lexical resource: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

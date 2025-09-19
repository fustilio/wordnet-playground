/**
 * Download utilities for file downloads
 * This is a stub for browser environments.
 * The Node.js implementation is in 'wn-ts-node/src/utils/download.ts'.
 */

import { ProjectError } from '../core/errors.js';

export interface DownloadOptions {
  timeout?: number;
  onProgress?: (progress: number) => void;
}

export class DownloadError extends Error {
  public status: number;
  public statusText: string;

  constructor(
    message: string,
    status: number,
    statusText: string
  ) {
    super(message);
    this.name = 'DownloadError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Download file with progress callback
 */
export async function downloadFile(
  _url: string,
  _destination: string,
  _options: DownloadOptions = {}
): Promise<void> {
  throw new ProjectError('The `downloadFile` function is not available in this environment. Please use `wn-ts-node`.');
}

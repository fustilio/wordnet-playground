/**
 * Download utilities for file downloads
 */

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
const browserReadable = class BrowserReadable {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: any) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on(event: string, callback: any) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  push(chunk: any) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  destroy(error?: any) {}
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserPipeline = async (source: any, destination: any) => {
  throw new Error('Download utilities not available in browser environment');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserCreateWriteStream = (path: string) => {
  throw new Error('File system operations not available in browser environment');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserMkdir = async (path: string, options: any) => {
  throw new Error('File system operations not available in browser environment');
};

const browserDirname = (path: string) => path.split('/').slice(0, -1).join('/') || '.';

// Use browser stubs by default, will be overridden in Node.js
let Readable = browserReadable;
let pipeline = browserPipeline;
let createWriteStream = browserCreateWriteStream;
let mkdir = browserMkdir;
let dirname = browserDirname;

// Initialize Node.js functions if available
if (isNode) {
  try {
    const stream = require('stream');
    const fs = require('fs');
    const path = require('path');
    
    Readable = stream.Readable;
    pipeline = require('stream/promises').pipeline;
    createWriteStream = fs.createWriteStream;
    mkdir = require('fs/promises').mkdir;
    dirname = path.dirname;
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

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
  url: string,
  destination: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { timeout = 10000, onProgress } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new DownloadError(
        `Failed to download file: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let downloaded = 0;

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body;

    await mkdir(dirname(destination), { recursive: true });
    const writer = createWriteStream(destination);

    const progressStream = new Readable({
      read() {}
    });

    // Patch: cast as any to resolve type error
    const readerStream = Readable.fromWeb(reader as any);

    readerStream.on('data', (chunk) => {
      downloaded += chunk.length;
      if (onProgress && total > 0) {
        onProgress(downloaded / total);
      }
      progressStream.push(chunk);
    });

    readerStream.on('end', () => {
      progressStream.push(null);
    });

    readerStream.on('error', (err) => {
      progressStream.destroy(err);
    });

    await pipeline(progressStream, writer);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Download utilities for file downloads
 */

import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

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

    const readerStream = Readable.fromWeb(reader as ReadableStream<Uint8Array>);

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

import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { DownloadOptions } from 'wn-ts-core';
import { DownloadError } from 'wn-ts-core';

/**
 * Download file with progress callback
 */
export async function downloadFile(
  url: string,
  destination: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { timeout = 10000, progress } = options;
  
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

    // The 'as any' cast is necessary because Readable.fromWeb is not in all @types/node versions
    const readerStream = Readable.fromWeb(reader as any);

    readerStream.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      if (progress && total > 0) {
        progress(downloaded / total);
      }
      progressStream.push(chunk);
    });

    readerStream.on('end', () => {
      progressStream.push(null);
    });

    readerStream.on('error', (err: Error) => {
      progressStream.destroy(err);
    });

    await pipeline(progressStream, writer);
  } finally {
    clearTimeout(timeoutId);
  }
}

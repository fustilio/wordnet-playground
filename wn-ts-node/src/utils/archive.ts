/// <reference path="../../types/lzma-native.d.ts" />

import path from 'path';
import fs from 'fs';
import lzma from 'lzma-native';
import zlib from 'zlib';
import tar from 'tar-stream';

const { join, dirname, extname } = path;
const { existsSync, mkdirSync, readdirSync, statSync, createReadStream, createWriteStream } = fs;
const { createGunzip } = zlib;

/**
 * Extract a tar archive using tar-stream for better reliability
 */
export async function extractTarArchive(archivePath: string): Promise<string> {
  const extractDir = join(dirname(archivePath), 'extracted_' + Date.now());

  if (!existsSync(extractDir)) {
    mkdirSync(extractDir, { recursive: true });
  }

  console.log(`  Extracting to: ${extractDir}`);

  return new Promise((resolve, reject) => {
    const reader = createReadStream(archivePath);
    const extract = tar.extract();

    extract.on('entry', (header, stream, next) => {
      const filePath = join(extractDir, header.name);

      if (header.type === 'directory') {
        mkdirSync(filePath, { recursive: true });
        stream.on('end', next);
        stream.resume(); // Gulp requirement
        return;
      }

      // Ensure parent directory exists before writing file
      mkdirSync(dirname(filePath), { recursive: true });

      const writer = createWriteStream(filePath);
      stream.pipe(writer);
      stream.on('end', next);
      stream.on('error', reject);
    });

    extract.on('finish', () => {
      console.log('  Extraction complete.');
      resolve(extractDir);
    });

    extract.on('error', reject);
    reader.on('error', reject);

    reader.pipe(extract);
  });
}

/**
 * Decompress an xz file.
 */
export async function decompressXz(sourcePath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = createReadStream(sourcePath);
    const writer = createWriteStream(destPath);
    const decompressor = lzma.createDecompressor();

    reader.pipe(decompressor).pipe(writer);

    writer.on('finish', () => resolve());
    writer.on('error', (err: Error) => reject(err));
    reader.on('error', (err: Error) => reject(err));
    decompressor.on('error', (err: Error) => reject(err));
  });
}

/**
 * Decompress a gz file.
 */
export async function decompressGz(sourcePath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = createReadStream(sourcePath);
    const writer = createWriteStream(destPath);
    const decompressor = createGunzip();

    reader.pipe(decompressor).pipe(writer);

    writer.on('finish', () => resolve());
    writer.on('error', (err: Error) => reject(err));
    reader.on('error', (err: Error) => reject(err));
    decompressor.on('error', (err: Error) => reject(err));
  });
}

/**
 * Find LMF files in a directory (recursively)
 */
export async function findLMFiles(directory: string): Promise<string[]> {
  const lmfFiles: string[] = [];

  function scanDir(dir: string): void {
    if (!existsSync(dir)) return;

    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);

      try {
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          scanDir(fullPath);
        } else if (stats.isFile() && extname(item) === '.xml') {
          lmfFiles.push(fullPath);
        }
      } catch (err) {
        console.warn(`Warning: Could not access path ${fullPath}. Skipping.`);
      }
    }
  }

  scanDir(directory);
  return lmfFiles;
}

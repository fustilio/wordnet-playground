import { join, dirname, extname } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, createReadStream, createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import lzma from 'lzma-native';
import { createGunzip } from 'zlib';

const execAsync = promisify(exec);

/**
 * Extract a tar archive (tar.xz or tar.gz)
 */
export async function extractTarArchive(archivePath: string): Promise<string> {
  const extractDir = join(dirname(archivePath), 'extracted_' + Date.now());
  
  if (!existsSync(extractDir)) {
    mkdirSync(extractDir, { recursive: true });
  }
  
  console.log(`  Extracting to: ${extractDir}`);
  
  try {
    if (archivePath.endsWith('.tar.xz')) {
      await execAsync(`tar -xf "${archivePath}" -C "${extractDir}"`);
    } else if (archivePath.endsWith('.tar.gz')) {
      await execAsync(`tar -xzf "${archivePath}" -C "${extractDir}"`);
    } else {
      throw new Error(`Unsupported archive format: ${archivePath}`);
    }
    
    console.log('  Extraction complete.');
    return extractDir;
  } catch (error) {
    throw new Error(`Failed to extract archive ${archivePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
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

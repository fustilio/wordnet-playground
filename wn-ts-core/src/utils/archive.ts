/// <reference path="../../types/lzma-native.d.ts" />

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
const browserJoin = (...paths: string[]) => paths.join('/');
const browserDirname = (path: string) => path.split('/').slice(0, -1).join('/') || '.';
const browserExtname = (path: string) => {
  const parts = path.split('.');
  return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserExistsSync = (path: string) => false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserMkdirSync = (path: string, options?: any) => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserReaddirSync = (path: string) => [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserStatSync = (path: string) => ({ isDirectory: () => false, isFile: () => false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserCreateReadStream = (path: string) => {
  throw new Error('File system operations not available in browser environment');
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserCreateWriteStream = (path: string) => {
  throw new Error('File system operations not available in browser environment');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserExec = async (command: string) => {
  throw new Error('Child process operations not available in browser environment');
};

const browserPromisify = (fn: any) => fn;

const browserLzma = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createDecompressor: () => {
    throw new Error('LZMA operations not available in browser environment');
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserCreateGunzip = () => {
  throw new Error('Zlib operations not available in browser environment');
};

// Use browser stubs by default, will be overridden in Node.js
let join = browserJoin;
let dirname = browserDirname;
let extname = browserExtname;
let existsSync = browserExistsSync;
let mkdirSync = browserMkdirSync;
let readdirSync = browserReaddirSync;
let statSync = browserStatSync;
let createReadStream = browserCreateReadStream;
let createWriteStream = browserCreateWriteStream;
let exec = browserExec;
let promisify = browserPromisify;
let lzma = browserLzma;
let createGunzip = browserCreateGunzip;

// Initialize Node.js functions if available
if (isNode) {
  try {
    const path = require('path');
    const fs = require('fs');
    const childProcess = require('child_process');
    const util = require('util');
    const lzmaNative = require('lzma-native');
    const zlib = require('zlib');
    
    join = path.join;
    dirname = path.dirname;
    extname = path.extname;
    existsSync = fs.existsSync;
    mkdirSync = fs.mkdirSync;
    readdirSync = fs.readdirSync;
    statSync = fs.statSync;
    createReadStream = fs.createReadStream;
    createWriteStream = fs.createWriteStream;
    exec = childProcess.exec;
    promisify = util.promisify;
    lzma = lzmaNative;
    createGunzip = zlib.createGunzip;
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

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

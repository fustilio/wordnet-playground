// This file is a stub for browser environments.
// The Node.js implementation is in 'wn-ts-node/src/utils/archive.ts'.

/**
 * Extract a tar archive (tar.xz or tar.gz)
 * This is a Node.js-only function.
 */
export async function extractTarArchive(_archivePath: string): Promise<string> {
  throw new Error('extractTarArchive is not available in the browser environment.');
}

/**
 * Decompress an xz file.
 * This is a Node.js-only function.
 */
export async function decompressXz(_sourcePath: string, _destPath: string): Promise<void> {
  throw new Error('decompressXz is not available in the browser environment.');
}

/**
 * Decompress a gz file.
 * This is a Node.js-only function.
 */
export async function decompressGz(_sourcePath: string, _destPath: string): Promise<void> {
  throw new Error('decompressGz is not available in the browser environment.');
}

/**
 * Find LMF files in a directory (recursively)
 * This is a Node.js-only function.
 */
export async function findLMFiles(_directory: string): Promise<string[]> {
  throw new Error('findLMFiles is not available in the browser environment.');
}

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Browser-compatible stubs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const browserReadFile = async (path: string, encoding?: string) => {
  throw new Error('File system operations not available in browser environment');
};

// Use browser stubs by default, will be overridden in Node.js
let readFile = browserReadFile;

// Initialize Node.js functions if available
if (isNode) {
  try {
    const fsPromises = require('fs/promises');
    readFile = fsPromises.readFile;
  } catch (e) {
    // Fall back to browser stubs if Node.js modules fail to load
    console.warn('Failed to load Node.js modules, using browser stubs');
  }
}

import type { ILI } from './types.js';

export interface IliRecord {
  ili: string;
  status: string;
  definition?: string;
  [key: string]: string | undefined;
}

export async function isILI(filePath: string): Promise<boolean> {
  // A simple check based on file extension for now.
  return filePath.endsWith('.tsv');
}

export async function loadILI(filePath: string): Promise<IliRecord[]> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines.shift();
  if (!headerLine) return [];
  const header = headerLine.trim().toLowerCase().split('\t');
  
  const records: IliRecord[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const values = line.split('\t');
    const record: IliRecord = { ili: '', status: '' };
    header.forEach((field, index) => {
        if (values[index] !== undefined) {
            record[field] = values[index];
        }
    });
    records.push(record);
  }
  return records;
}

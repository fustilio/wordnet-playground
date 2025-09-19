import fs from 'fs/promises';
import type { IliRecord } from 'wn-ts-core';

const { readFile } = fs;

export async function isILI(filePath: string): Promise<boolean> {
  // A simple check based on file extension for now.
  return filePath.endsWith('.tsv');
}

export async function loadILI(filePath: string): Promise<IliRecord[]> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  let header: string[];
  let dataLines: string[];

  // CILI data file does not have a header.
  if (filePath.includes('cili')) {
    header = ['id', 'status', 'definition'];
    dataLines = lines;
  } else {
    if (lines.length < 2) return [];
    const headerLine = lines.shift();
    if (!headerLine) return [];
    header = headerLine.trim().toLowerCase().split('\t');
    dataLines = lines;
  }
  
  const records: IliRecord[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = line.split('\t');
    const record: any = {};
    header.forEach((field: string, index: number) => {
        if (values[index] !== undefined) {
            record[field] = values[index];
        }
    });
    records.push(record);
  }
  return records;
}

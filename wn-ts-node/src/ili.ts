import fs from 'fs/promises';
import type { IliRecord } from 'wn-ts-core';

const { readFile } = fs;

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

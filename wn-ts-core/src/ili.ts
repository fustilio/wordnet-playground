import { readFile } from 'fs/promises';

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

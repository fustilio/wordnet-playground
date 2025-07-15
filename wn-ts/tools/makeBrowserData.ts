// tools/makeBrowserData.ts
// Script to convert wn-ts WordNet data/index files into browser-usable modules for wn-ts-web
// Inspired by wordpos/tools/makeJsonDict.js

import fs from 'fs';
import path from 'path';

export interface MakeBrowserDataOptions {
  sourceDir: string;
  outDir: string;
  filesToConvert?: string[];
  dryRun?: boolean;
}

function isIndexFile(filename: string) {
  return filename.startsWith('index.');
}

function isDataFile(filename: string) {
  return filename.startsWith('data.');
}

function parseIndexFile(text: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(' ')) continue;
    const firstSpace = line.indexOf(' ');
    if (firstSpace === -1) continue;
    const lemma = line.substring(0, firstSpace);
    obj[lemma] = line.substring(firstSpace + 1);
  }
  return obj;
}

function parseDataFile(text: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(' ')) continue;
    const firstSpace = line.indexOf(' ');
    if (firstSpace === -1) continue;
    const offset = line.substring(0, firstSpace);
    obj[offset] = line.substring(firstSpace + 1);
  }
  return obj;
}

export function makeBrowserData({
  sourceDir,
  outDir,
  filesToConvert = ['index.noun', 'index.verb', 'data.noun', 'data.verb'],
  dryRun = false,
}: MakeBrowserDataOptions) {
  if (!fs.existsSync(outDir)) {
    if (!dryRun) fs.mkdirSync(outDir, { recursive: true });
  }
  for (const file of filesToConvert) {
    const src = path.join(sourceDir, file);
    const dest = path.join(outDir, file + '.json');
    if (fs.existsSync(src)) {
      const text = fs.readFileSync(src, 'utf8');
      let obj: Record<string, string> = {};
      if (isIndexFile(file)) {
        obj = parseIndexFile(text);
      } else if (isDataFile(file)) {
        obj = parseDataFile(text);
      } else {
        console.warn(`[makeBrowserData] Unknown file type: ${file}`);
        continue;
      }
      if (!dryRun) {
        fs.writeFileSync(dest, JSON.stringify(obj, null, 2), 'utf8');
      }
      console.log(`[makeBrowserData] ${dryRun ? 'Would write' : 'Wrote'} ${dest}`);
    } else {
      console.warn(`[makeBrowserData] Source file not found: ${src}`);
    }
  }
  console.log('[makeBrowserData] Browser data build complete.');
}

// CLI usage (ESM-compatible)
if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  const sourceDir = args[0] || path.resolve(__dirname, '../data');
  const outDir = args[1] || path.resolve(__dirname, '../../wn-ts-web/data');
  makeBrowserData({ sourceDir, outDir });
} else {
  console.log("not running")
}
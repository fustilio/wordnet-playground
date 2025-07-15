import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { makeBrowserData } from '../makeBrowserData';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wn-ts-makeBrowserData-test-'));
}

describe('makeBrowserData', () => {
  let sourceDir: string;
  let outDir: string;

  beforeEach(() => {
    sourceDir = createTempDir();
    outDir = createTempDir();
    // Create mock index and data files
    fs.writeFileSync(path.join(sourceDir, 'index.noun'), 'dog 1 2 3\ncat 4 5 6\n  comment\n');
    fs.writeFileSync(path.join(sourceDir, 'data.noun'), '00001740 info about synset\n00002137 more info\n  comment\n');
    // Leave index.verb and data.verb missing to test missing file handling
  });

  afterEach(() => {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('copies existing files and warns on missing files', () => {
    makeBrowserData({ sourceDir, outDir });
    expect(fs.existsSync(path.join(outDir, 'index.noun.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'data.noun.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'index.verb.json'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'data.verb.json'))).toBe(false);
  });

  it('parses index files into lemma-keyed objects', () => {
    makeBrowserData({ sourceDir, outDir, filesToConvert: ['index.noun'] });
    const out = JSON.parse(fs.readFileSync(path.join(outDir, 'index.noun.json'), 'utf8'));
    expect(out).toHaveProperty('dog');
    expect(out).toHaveProperty('cat');
    expect(out['dog']).toBe('1 2 3');
    expect(out['cat']).toBe('4 5 6');
    expect(Object.keys(out)).not.toContain('comment');
  });

  it('parses data files into offset-keyed objects', () => {
    makeBrowserData({ sourceDir, outDir, filesToConvert: ['data.noun'] });
    const out = JSON.parse(fs.readFileSync(path.join(outDir, 'data.noun.json'), 'utf8'));
    expect(out).toHaveProperty('00001740');
    expect(out).toHaveProperty('00002137');
    expect(out['00001740']).toBe('info about synset');
    expect(out['00002137']).toBe('more info');
    expect(Object.keys(out)).not.toContain('comment');
  });

  it('does not write files in dryRun mode', () => {
    makeBrowserData({ sourceDir, outDir, dryRun: true });
    expect(fs.existsSync(path.join(outDir, 'index.noun.json'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'data.noun.json'))).toBe(false);
  });

  it('accepts a custom list of files to convert', () => {
    makeBrowserData({ sourceDir, outDir, filesToConvert: ['index.noun'] });
    expect(fs.existsSync(path.join(outDir, 'index.noun.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'data.noun.json'))).toBe(false);
  });
}); 
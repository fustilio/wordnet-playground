import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { loadLMF } from '../src/lmf.js';

const sampleFile = join(__dirname, '../../wn-test-data/data', 'E101-0.xml');

describe('LMF Streaming Parser', () => {
  it('should parse the sample XML and build the correct structure', async () => {
    const result = await loadLMF(sampleFile);
    expect(result.lmfVersion).toBe('1.0');
    expect(result.lexicons.length).toBe(1);
    const lexicon = result.lexicons[0] as any;
    expect(lexicon.entries.length).toBe(2);
    expect(lexicon.synsets.length).toBe(1);
    expect(result.words.length).toBe(2);
    expect(result.synsets.length).toBe(1);
    expect(result.senses.length).toBe(2);
    // Check details
    expect(lexicon.entries[0].lemma).toBe('foo');
    expect(lexicon.entries[1].lemma).toBe('foo2');
    expect(lexicon.synsets[0].id).toBe('test-e101-01-n');
  });
}); 
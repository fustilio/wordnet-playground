import { describe, it, expect } from 'vitest';
import { LmfParser } from '../../../src/parsers/lmf/lmf-parser';

describe('LMF Parser - Debug Tests', () => {
  it('should correctly parse nested sense structure', async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="test-lexicon" language="en">
    <LexicalEntry id="test-en-information-n">
      <Lemma partOfSpeech="n" writtenForm="information" />
      <Sense id="test-en-information-n-0001-01" synset="test-en-0001-n" />
    </LexicalEntry>
    <Synset id="test-en-0001-n" partOfSpeech="n">
      <Definition>something that informs</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

    const parser = new LmfParser(xmlContent, { debug: true });
    const result = await parser.parse(xmlContent);

    console.log('Parsed result:', JSON.stringify(result, null, 2));

    expect(result.lexicons).toHaveLength(1);
    expect(result.words).toHaveLength(1);
    expect(result.synsets).toHaveLength(1);
    expect(result.senses).toHaveLength(1);

    // Check the sense relationship
    const sense = result.senses[0];
    const word = result.words[0];
    
    console.log('Sense:', sense);
    console.log('Word:', word);
    
    // The sense should reference the word ID, not the sense ID
    expect(sense.wordId).toBe(word.id);
    expect(sense.synsetId).toBe('test-en-0001-n');
  });
});

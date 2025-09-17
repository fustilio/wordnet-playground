import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { LmfParser } from '../../src/parsers/lmf/lmf-parser.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

const isNode = typeof process !== 'undefined';

describe.skipIf(isNode)('LMF Parser Language Filter Fix', () => {
  let sqlModule: Sqlite3Static;

  beforeAll(async () => {
    try {
      const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
      sqlModule = await sqlite3();
    } catch (e) {
      console.warn('Could not load sqlite-wasm, skipping tests');
    }
  });

  describe('Multi-language LMF Parsing', () => {
    it.skipIf(!sqlModule)('should parse French words and synsets', async () => {
      const frenchLMF = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://www.w3.org/2005/11/its" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:wn="http://wordnet.princeton.edu/ontology#" xmlns:lexinfo="http://www.lexinfo.net/ontology/2.0/lexinfo#" xmlns:lime="http://lime.tools/lexicon" xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#" xmlns:decomp="http://www.w3.org/ns/lemon/decomp#" xmlns:synsem="http://www.w3.org/ns/lemon/synsem#" xmlns:vartrans="http://www.w3.org/ns/lemon/vartrans#" xmlns:trans="http://www.w3.org/ns/lemon/translation#" xmlns:lime="http://lime.tools/lexicon" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" version="1.0">
  <Lexicon id="omw-fr" label="WOLF (Wordnet Libre du Français)" language="fr" version="1.4">
    <LexicalEntry id="le-heureux">
      <Lemma writtenForm="heureux" partOfSpeech="a"/>
      <Sense id="se-heureux" synset="s-heureux"/>
    </LexicalEntry>
    <Synset id="s-heureux" partOfSpeech="a" ili="i12345">
      <Definition language="fr">
        <gloss>sentiment de bonheur</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new LmfParser('test-source');
      const result = await parser.parse(frenchLMF);

      // Should parse French words
      expect(result.words).toHaveLength(1);
      expect(result.words[0].lemma).toBe('heureux');
      expect(result.words[0].language).toBe('fr');
      expect(result.words[0].lexicon).toBe('omw-fr');

      // Should parse French synsets
      expect(result.synsets).toHaveLength(1);
      expect(result.synsets[0].id).toBe('s-heureux');
      expect(result.synsets[0].language).toBe('fr');
      expect(result.synsets[0].lexicon).toBe('omw-fr');
      expect(result.synsets[0].ili).toBe('i12345');

      // Should parse French definitions
      expect(result.synsets[0].definitions).toHaveLength(1);
      expect(result.synsets[0].definitions[0].text).toBe('sentiment de bonheur');
      expect(result.synsets[0].definitions[0].language).toBe('fr');
    });

    it.skipIf(!sqlModule)('should parse mixed English and French content', async () => {
      const mixedLMF = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://www.w3.org/2005/11/its" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:wn="http://wordnet.princeton.edu/ontology#" xmlns:lexinfo="http://www.lexinfo.net/ontology/2.0/lexinfo#" xmlns:lime="http://lime.tools/lexicon" xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#" xmlns:decomp="http://www.w3.org/ns/lemon/decomp#" xmlns:synsem="http://www.w3.org/ns/lemon/synsem#" xmlns:vartrans="http://www.w3.org/ns/lemon/vartrans#" xmlns:trans="http://www.w3.org/ns/lemon/translation#" xmlns:lime="http://lime.tools/lexicon" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" version="1.0">
  <Lexicon id="oewn" label="Open English WordNet" language="en" version="2024">
    <LexicalEntry id="le-happy">
      <Lemma writtenForm="happy" partOfSpeech="a"/>
      <Sense id="se-happy" synset="s-happy"/>
    </LexicalEntry>
    <Synset id="s-happy" partOfSpeech="a" ili="i12345">
      <Definition language="en">
        <gloss>feeling of happiness</gloss>
      </Definition>
    </Synset>
  </Lexicon>
  <Lexicon id="omw-fr" label="WOLF (Wordnet Libre du Français)" language="fr" version="1.4">
    <LexicalEntry id="le-heureux">
      <Lemma writtenForm="heureux" partOfSpeech="a"/>
      <Sense id="se-heureux" synset="s-heureux"/>
    </LexicalEntry>
    <Synset id="s-heureux" partOfSpeech="a" ili="i12345">
      <Definition language="fr">
        <gloss>sentiment de bonheur</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new LmfParser('test-source');
      const result = await parser.parse(mixedLMF);

      // Should parse both English and French words
      expect(result.words).toHaveLength(2);
      
      const englishWord = result.words.find(w => w.language === 'en');
      const frenchWord = result.words.find(w => w.language === 'fr');
      
      expect(englishWord).toBeDefined();
      expect(englishWord?.lemma).toBe('happy');
      expect(englishWord?.language).toBe('en');
      
      expect(frenchWord).toBeDefined();
      expect(frenchWord?.lemma).toBe('heureux');
      expect(frenchWord?.language).toBe('fr');

      // Should parse both English and French synsets
      expect(result.synsets).toHaveLength(2);
      
      const englishSynset = result.synsets.find(s => s.language === 'en');
      const frenchSynset = result.synsets.find(s => s.language === 'fr');
      
      expect(englishSynset).toBeDefined();
      expect(englishSynset?.id).toBe('s-happy');
      expect(englishSynset?.language).toBe('en');
      expect(englishSynset?.ili).toBe('i12345');
      
      expect(frenchSynset).toBeDefined();
      expect(frenchSynset?.id).toBe('s-heureux');
      expect(frenchSynset?.language).toBe('fr');
      expect(frenchSynset?.ili).toBe('i12345');
    });

    it.skipIf(!sqlModule)('should preserve ILI mappings for all languages', async () => {
      const lmfWithILIs = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://www.w3.org/2005/11/its" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:wn="http://wordnet.princeton.edu/ontology#" xmlns:lexinfo="http://www.lexinfo.net/ontology/2.0/lexinfo#" xmlns:lime="http://lime.tools/lexicon" xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#" xmlns:decomp="http://www.w3.org/ns/lemon/decomp#" xmlns:synsem="http://www.w3.org/ns/lemon/synsem#" xmlns:vartrans="http://www.w3.org/ns/lemon/vartrans#" xmlns:trans="http://www.w3.org/ns/lemon/translation#" xmlns:lime="http://lime.tools/lexicon" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" version="1.0">
  <Lexicon id="oewn" label="Open English WordNet" language="en" version="2024">
    <Synset id="s-computer" partOfSpeech="n" ili="i52237">
      <Definition language="en">
        <gloss>a machine for performing calculations automatically</gloss>
      </Definition>
    </Synset>
  </Lexicon>
  <Lexicon id="omw-fr" label="WOLF (Wordnet Libre du Français)" language="fr" version="1.4">
    <Synset id="s-ordinateur" partOfSpeech="n" ili="i52237">
      <Definition language="fr">
        <gloss>machine pour effectuer des calculs automatiquement</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new LmfParser('test-source');
      const result = await parser.parse(lmfWithILIs);

      // Both synsets should have the same ILI
      const englishSynset = result.synsets.find(s => s.language === 'en');
      const frenchSynset = result.synsets.find(s => s.language === 'fr');
      
      expect(englishSynset).toBeDefined();
      expect(englishSynset?.ili).toBe('i52237');
      
      expect(frenchSynset).toBeDefined();
      expect(frenchSynset?.ili).toBe('i52237');
      
      // This enables cross-lingual translation
      expect(englishSynset?.ili).toBe(frenchSynset?.ili);
    });
  });

  describe('Regression Tests', () => {
    it.skipIf(!sqlModule)('should not break English-only parsing', async () => {
      const englishLMF = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://www.w3.org/2005/11/its" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:wn="http://wordnet.princeton.edu/ontology#" xmlns:lexinfo="http://www.lexinfo.net/ontology/2.0/lexinfo#" xmlns:lime="http://lime.tools/lexicon" xmlns:ontolex="http://www.w3.org/ns/lemon/ontolex#" xmlns:decomp="http://www.w3.org/ns/lemon/decomp#" xmlns:synsem="http://www.w3.org/ns/lemon/synsem#" xmlns:vartrans="http://www.w3.org/ns/lemon/vartrans#" xmlns:trans="http://www.w3.org/ns/lemon/translation#" xmlns:lime="http://lime.tools/lexicon" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" version="1.0">
  <Lexicon id="oewn" label="Open English WordNet" language="en" version="2024">
    <LexicalEntry id="le-happy">
      <Lemma writtenForm="happy" partOfSpeech="a"/>
      <Sense id="se-happy" synset="s-happy"/>
    </LexicalEntry>
    <Synset id="s-happy" partOfSpeech="a" ili="i12345">
      <Definition language="en">
        <gloss>feeling of happiness</gloss>
      </Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

      const parser = new LmfParser('test-source');
      const result = await parser.parse(englishLMF);

      // Should still parse English content correctly
      expect(result.words).toHaveLength(1);
      expect(result.words[0].lemma).toBe('happy');
      expect(result.words[0].language).toBe('en');
      
      expect(result.synsets).toHaveLength(1);
      expect(result.synsets[0].id).toBe('s-happy');
      expect(result.synsets[0].language).toBe('en');
      expect(result.synsets[0].ili).toBe('i12345');
    });
  });
});

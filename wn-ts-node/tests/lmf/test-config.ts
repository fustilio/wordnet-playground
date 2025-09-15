/**
 * LMF Test Configuration
 * Centralized configuration for LMF test suite
 */

export interface LMFTestConfig {
  tempDirPrefix: string;
  performanceThresholds: {
    smallFile: number; // ms for small files (< 100 entries)
    mediumFile: number; // ms for medium files (100-1000 entries)
    largeFile: number; // ms for large files (1000+ entries)
    veryLargeFile: number; // ms for very large files (5000+ entries)
  };
  testDataSizes: {
    small: number;
    medium: number;
    large: number;
    veryLarge: number;
  };
  supportedVersions: string[];
  unsupportedVersions: string[];
}

export const LMF_TEST_CONFIG: LMFTestConfig = {
  tempDirPrefix: 'wn-ts-lmf-test',
  performanceThresholds: {
    smallFile: 1000, // 1 second
    mediumFile: 5000, // 5 seconds
    largeFile: 10000, // 10 seconds
    veryLargeFile: 30000 // 30 seconds
  },
  testDataSizes: {
    small: 50,
    medium: 200,
    large: 1000,
    veryLarge: 5000
  },
  supportedVersions: ['1.0', '1.1', '1.2', '1.3', '1.4'],
  unsupportedVersions: ['0.9', '2.0', '2.1']
};

/**
 * Generate test LMF XML with specified number of entries
 */
export function generateTestLMF(entries: number, version: string = '1.0'): string {
  const entryXML = Array.from({ length: entries }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Sense id="sense-${i}" synset="synset-${i}"/>
    </LexicalEntry>
    <Synset id="synset-${i}" pos="n" ili="i${i}">
      <Definition>Definition for word ${i}</Definition>
    </Synset>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
${entryXML}
  </Lexicon>
</LexicalResource>`;
}

/**
 * Generate complex test LMF XML with nested structures
 */
export function generateComplexTestLMF(entries: number, version: string = '1.0'): string {
  const entryXML = Array.from({ length: entries }, (_, i) => `
    <LexicalEntry id="word-${i}">
      <Lemma writtenForm="word${i}" partOfSpeech="n"/>
      <Form id="form-${i}-1" writtenForm="word${i}s"/>
      <Form id="form-${i}-2" writtenForm="word${i}ing"/>
      <Tag category="domain">test</Tag>
      <Tag category="frequency">high</Tag>
      <Sense id="sense-${i}-1" synset="synset-${i}-1"/>
      <Sense id="sense-${i}-2" synset="synset-${i}-2"/>
    </LexicalEntry>
    <Synset id="synset-${i}-1" pos="n" ili="i${i}1">
      <Definition>Primary definition for word ${i}</Definition>
      <Definition language="es">Definición primaria para palabra ${i}</Definition>
      <Example>Example 1 for word ${i}</Example>
      <Example>Example 2 for word ${i}</Example>
      <SynsetRelation relType="hypernym" target="parent-${i}"/>
      <SynsetRelation relType="hyponym" target="child-${i}"/>
    </Synset>
    <Synset id="synset-${i}-2" pos="n" ili="i${i}2">
      <Definition>Secondary definition for word ${i}</Definition>
      <SynsetRelation relType="similar" target="similar-${i}"/>
    </Synset>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
${entryXML}
  </Lexicon>
</LexicalResource>`;
}

/**
 * Generate minimal test LMF XML
 */
export function generateMinimalTestLMF(version: string = '1.0'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
  <Lexicon id="test-en" language="en" version="${version}" label="Test Lexicon" email="test@example.com" license="MIT">
    <LexicalEntry id="test-word">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="test-sense" synset="test-synset"/>
    </LexicalEntry>
    <Synset id="test-synset" pos="n" ili="i123">
      <Definition>Test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;
}

/**
 * Generate multi-lexicon test LMF XML
 */
export function generateMultiLexiconTestLMF(lexiconCount: number, entriesPerLexicon: number, version: string = '1.0'): string {
  const lexicons = Array.from({ length: lexiconCount }, (_, lexIndex) => {
    const language = lexIndex === 0 ? 'en' : `lang${lexIndex}`;
    const entries = Array.from({ length: entriesPerLexicon }, (_, i) => `
      <LexicalEntry id="word-${lexIndex}-${i}">
        <Lemma writtenForm="word${lexIndex}-${i}" partOfSpeech="n"/>
        <Sense id="sense-${lexIndex}-${i}" synset="synset-${lexIndex}-${i}"/>
      </LexicalEntry>
      <Synset id="synset-${lexIndex}-${i}" pos="n" ili="i${lexIndex}${i}">
        <Definition>Definition for word ${lexIndex}-${i}</Definition>
      </Synset>`).join('');

    return `
  <Lexicon id="test-${language}" language="${language}" version="${version}" label="Test ${language} Lexicon" email="test@example.com" license="MIT">
${entries}
  </Lexicon>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-${version}.dtd">
<LexicalResource>
${lexicons}
</LexicalResource>`;
}

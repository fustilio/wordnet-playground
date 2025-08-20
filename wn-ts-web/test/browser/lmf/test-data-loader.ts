/**
 * Test Data Loader for Browser Tests
 * 
 * This utility loads test data from the wn-test-data directory
 * in a browser-compatible way, avoiding Node.js fs operations.
 */

export interface TestDataFile {
  name: string;
  content: string;
  description: string;
}

/**
 * Load test data files for LMF parser testing
 * These are embedded as strings to avoid Node.js fs operations in browser tests
 */
export function loadTestData(): TestDataFile[] {
  return [
    {
      name: 'mini-lmf-1.4.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.4.dtd">

<!--
WN-LMF 1.4 has the following changes:
- optional 'index' attribute on LexicalEntry
- optional 'n' attribute on Sense
- Pronunciation elements under Definition and Example
-->

<LexicalResource xmlns:dc="http://globalwordnet.github.io/schemas/dc/">

  <Lexicon id="test-1.4"
           label="Testing WN-LMF 1.4"
           language="en"
           email="maintainer@example.com"
           license="https://creativecommons.org/licenses/by/4.0/"
           version="1">

    <LexicalEntry id="test-1.4-Foo_Bar-n" index="foo_bar">
      <Lemma partOfSpeech="n" writtenForm="Foo Bar" />
      <Sense id="test-1.4-Foo_Bar-n-1" synset="test-1.4-1" n="3">
        <SenseRelation relType="metaphor" target="test-1.4-baz-n-1" />
      </Sense>
    </LexicalEntry>

    <LexicalEntry id="test-1.4-foo_bar-n" index="foo_bar">
      <Lemma partOfSpeech="n" writtenForm="foo bar" />
      <Sense id="test-1.4-foo_bar-n-1" synset="test-1.4-1" n="2" />
      <Sense id="test-1.4-foo_bar-n-2" synset="test-1.4-2" n="1" />
    </LexicalEntry>

    <!-- ommitted index defaults to writtenForm (baz) when added to db -->
    <LexicalEntry id="test-1.4-baz-n">
      <Lemma partOfSpeech="n" writtenForm="baz" />
      <Sense id="test-1.4-baz-n-1" synset="test-1.4-1">
        <SenseRelation relType="has_metaphor" target="test-1.4-Foo_Bar-n-1" />
      </Sense>
    </LexicalEntry>

    <!-- this should share the index with the one above -->
    <LexicalEntry id="test-1.4-BAZ-n" index="baz">
      <Lemma partOfSpeech="n" writtenForm="BAZ" />
      <Sense id="test-1.4-BAZ-n-1" synset="test-1.4-1" n="2" />
    </LexicalEntry>

    <!-- this one does not share the index -->
    <LexicalEntry id="test-1.4-Baz-n">
      <Lemma partOfSpeech="n" writtenForm="Baz" />
      <Sense id="test-1.4-Baz-n-1" synset="test-1.4-1" n="2" />
      <!-- omitted 'n' defaults to position (2) when added to db -->
      <Sense id="test-1.4-Baz-n-2" synset="test-1.4-2" />
    </LexicalEntry>

    <!-- indexes are shared only in the same part of speech -->
    <LexicalEntry id="test-1.4-baz-v" index="baz">
      <Lemma partOfSpeech="v" writtenForm="baz" />
      <Sense id="test-1.4-baz-v-1" synset="test-1.4-3" n="1" />
    </LexicalEntry>

    <Synset id="test-1.4-1" ili="" partOfSpeech="n" members="test-1.4-Foo_Bar-n-1 test-1.4-foo_bar-n-1 test-1.4-baz-n-1 test-1.4-BAZ-n-1 test-1.4-Baz-n-1" />

    <Synset id="test-1.4-2" ili="" partOfSpeech="n" members="test-1.4-foo_bar-n-2 test-1.4-Baz-n-2" />

    <Synset id="test-1.4-3" ili="" partOfSpeech="v" members="test-1.4-baz-v-1" />

  </Lexicon>

</LexicalResource>`,
      description: 'Mini LMF 1.4 test - complex nested structure with attributes and relationships'
    },
    {
      name: 'mini-lmf-1.0.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<!--
This sample document provides small lexicons in English and Spanish
with the following words and hypernym/derivation relations:

English:
- information ⊃ (example, illustration) ⊃ sample ⊃ random sample
- information ⊃ datum
- random sample (second synset)
- example ⊳ exemplify
- illustration ⊳ illustrate
- resignate

Spanish:
- información, ejemplo, ilustración, muestra aleatoria
- ejemplo ⊳ ejemplificar
- ilustración ⊳ ilustrar

-->
<LexicalResource xmlns:dc="http://purl.org/dc/elements/1.1/">

  <Lexicon id="test-en"
           label="Testing English WordNet"
           language="en"
           email="maintainer@example.com"
           license="https://creativecommons.org/licenses/by/4.0/"
           version="1"
           url="https://example.com/test-en"
           dc:description="An example lexicon for testing.">

    <LexicalEntry id="test-en-information-n">
      <Lemma partOfSpeech="n" writtenForm="information" script="Latn">
        <Tag category="tag-category">tag-text</Tag>
      </Lemma>
      <Sense id="test-en-information-n-0001-01" synset="test-en-0001-n">
        <Count dc:source="some corpus">3</Count>
      </Sense>
    </LexicalEntry>

    <LexicalEntry id="test-en-example-n" confidenceScore="1.0">
      <Lemma partOfSpeech="n" writtenForm="example" />
      <Sense id="test-en-example-n-0002-01" synset="test-en-0002-n" >
        <SenseRelation relType="derivation" target="test-en-exemplify-v-0003-01" />
      </Sense>
    </LexicalEntry>

    <LexicalEntry id="test-en-sample-n">
      <Lemma partOfSpeech="n" writtenForm="sample" />
      <Sense id="test-en-sample-n-0004-01" synset="test-en-0004-n" />
    </LexicalEntry>

    <LexicalEntry id="test-en-random_sample-n">
      <Lemma partOfSpeech="n" writtenForm="random sample" />
      <Sense id="test-en-random_sample-n-0005-01" synset="test-en-0005-n" />
      <Sense id="test-en-random_sample-n-0005-02" synset="test-en-0008-n" lexicalized="false" />
    </LexicalEntry>

    <Synset id="test-en-0001-n" ili="i67447" partOfSpeech="n" dc:subject="noun.cognition">
      <Definition language="en">knowledge about facts and events</Definition>
      <Example language="en">He had knowledge of the crime.</Example>
    </Synset>

    <Synset id="test-en-0002-n" ili="i67448" partOfSpeech="n" dc:subject="noun.cognition">
      <Definition language="en">a representative form or pattern</Definition>
      <Example language="en">I profited from his example.</Example>
    </Synset>

    <Synset id="test-en-0004-n" ili="i67450" partOfSpeech="n" dc:subject="noun.cognition">
      <Definition language="en">a small part of something intended as representative of the whole</Definition>
      <Example language="en">He took a sample of the population.</Example>
    </Synset>

    <Synset id="test-en-0005-n" ili="i67451" partOfSpeech="n" dc:subject="noun.cognition">
      <Definition language="en">a sample that is representative of a population</Definition>
      <Example language="en">The random sample showed a normal distribution.</Example>
    </Synset>

    <Synset id="test-en-0008-n" ili="i67454" partOfSpeech="n" dc:subject="noun.cognition">
      <Definition language="en">an alternative example of the same concept</Definition>
      <Example language="en">This is another random sample.</Example>
    </Synset>

  </Lexicon>

</LexicalResource>`,
      description: 'Mini LMF 1.0 test - English lexicon with hypernym and derivation relations'
    },
    {
      name: 'E101-0.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE LexicalResource SYSTEM "http://globalwordnet.github.io/schemas/WN-LMF-1.0.dtd">
<LexicalResource xmlns:dc="http://purl.org/dc/elements/1.1/">

<!-- duplicate ID in lexical entries -->

  <Lexicon id="test-e101"
           label="Testing E101"
           language="en"
           email="maintainer@example.com"
           license="https://creativecommons.org/licenses/by/4.0/"
           version="1">

    <LexicalEntry id="test-e101-foo-n">
      <Lemma partOfSpeech="n" writtenForm="foo" />
      <Sense id="test-e101-foo" synset="test-e101-01-n" />
    </LexicalEntry>

    <LexicalEntry id="test-e101-foo-n">
      <Lemma partOfSpeech="n" writtenForm="foo2" />
      <Sense id="test-e101-foo2" synset="test-e101-01-n" />
    </LexicalEntry>

    <Synset id="test-e101-01-n" ili="i12345" partOfSpeech="n" />

  </Lexicon>

</LexicalResource>`,
      description: 'E101-0: Duplicate ID in lexical entries - tests duplicate handling'
    },
    {
      name: 'simple-nested.xml',
      content: `<LexicalResource>
  <Lexicon id="test" language="en">
    <LexicalEntry id="word1">
      <Lemma partOfSpeech="n" writtenForm="test" />
      <Sense id="sense1" synset="synset1" />
    </LexicalEntry>
    <Synset id="synset1" partOfSpeech="n" />
  </Lexicon>
</LexicalResource>`,
      description: 'Simple nested structure - basic LMF hierarchy test'
    },
    {
      name: 'complex-attributes.xml',
      content: `<LexicalResource lmfVersion="1.4">
  <Lexicon id="test" language="en" version="1.0">
    <LexicalEntry id="word1" index="1">
      <Lemma partOfSpeech="n" writtenForm="test" />
      <Sense id="sense1" synset="synset1" lexicalized="true" />
    </LexicalEntry>
    <Synset id="synset1" partOfSpeech="n" ili="i1">
      <Definition language="en">A test definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`,
      description: 'Complex nested structure with attributes - tests attribute parsing'
    }
  ];
}

/**
 * Get a specific test data file by name
 */
export function getTestData(name: string): TestDataFile | undefined {
  return loadTestData().find(file => file.name === name);
}

/**
 * Get all test data files
 */
export function getAllTestData(): TestDataFile[] {
  return loadTestData();
}

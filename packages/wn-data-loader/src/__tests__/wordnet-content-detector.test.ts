import { describe, it, expect, beforeEach } from "vitest";
import { WordNetContentDetector } from "../wordnet-content-detector.js";

/**
 * WordNet Content Detector Tests
 * 
 * Note: These tests use inline test data for unit testing.
 * For integration tests with real WordNet data, see:
 * - wn-test-data/data/ - Contains real WordNet LMF files
 * - wn-ts-web/test/ - Contains comprehensive integration tests
 */

describe("WordNetContentDetector", () => {
  let detector: WordNetContentDetector;

  beforeEach(() => {
    detector = new WordNetContentDetector();
  });

  it("should detect LMF content", () => {
    const lmfContent = `<?xml version="1.0"?>
<LexicalResource>
  <lexicon id="test-lexicon" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;

    const result = detector.detectWordNetContentType(lmfContent, "test:1.0");

    expect(result.type).toBe("lmf");
    expect(result.confidence).toBe("high");
    expect(result.indicators.hasLMFStructure).toBe(true);
    expect(result.indicators.hasLexicalResource).toBe(true);
    expect(result.indicators.hasSynsets).toBe(true);
    expect(result.indicators.hasLemmas).toBe(true);
  });

  it("should detect OMW package content", () => {
    const omwContent = `<?xml version="1.0"?>
<LexicalResource xmlns:lmf="http://globalwordnet.org/ns/2016/lmf/1.0">
  <lexicon id="omw-en" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;

    const result = detector.detectWordNetContentType(omwContent, "omw-en:1.4");

    expect(result.type).toBe("omw-package");
    expect(result.confidence).toBe("high");
    expect(result.indicators.hasOMWIndicators).toBe(true);
    expect(result.indicators.hasLMFStructure).toBe(true);
  });

  it("should detect CILI data content", () => {
    const ciliContent = `ili	status	definition
i12345	1	cat
i12346	1	dog`;

    const result = detector.detectWordNetContentType(ciliContent, "cili:1.0");

    expect(result.type).toBe("cili-data");
    expect(result.confidence).toBe("high");
    expect(result.indicators.hasCILIIndicators).toBe(true);
  });

  it("should detect OWN package content", () => {
    const ownContent = `<?xml version="1.0"?>
<LexicalResource>
  <lexicon id="oewn-2024" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;

    const result = detector.detectWordNetContentType(ownContent, "oewn:2024");

    expect(result.type).toBe("own-package");
    expect(result.confidence).toBe("high");
    expect(result.indicators.hasLMFStructure).toBe(true);
  });

  it("should return unknown for non-WordNet content", () => {
    const nonWordNetContent = `<?xml version="1.0"?>
<SomeOtherFormat>
  <data>This is not WordNet data</data>
</SomeOtherFormat>`;

    const result = detector.detectWordNetContentType(nonWordNetContent, "test:1.0");

    expect(result.type).toBe("unknown");
    expect(result.confidence).toBe("low");
    expect(result.indicators.hasLMFStructure).toBe(false);
    expect(result.indicators.hasWordNetElements).toBe(false);
  });

  it("should handle empty content", () => {
    const result = detector.detectWordNetContentType("", "test:1.0");

    expect(result.type).toBe("unknown");
    expect(result.confidence).toBe("low");
  });

  it("should extract WordNet metadata", () => {
    const lmfContent = `<?xml version="1.0"?>
<LexicalResource>
  <lexicon id="test-lexicon" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
    <lexicalEntry id="entry2" partOfSpeech="v">
      <lemma id="lemma2" writtenForm="run" partOfSpeech="v">
        <sense id="sense2" synset="synset2" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;

    const metadata = detector.extractWordNetMetadata(lmfContent, "omw-en:1.4");

    expect(metadata.lemmaCount).toBe(2);
    expect(metadata.synsetCount).toBe(2);
    expect(metadata.language).toBe("en");
    expect(metadata.version).toBe("1.4");
    expect(metadata.source).toBe("Open Multilingual WordNet");
  });

  it("should validate LMF structure", () => {
    const validLmfContent = `<?xml version="1.0"?>
<LexicalResource>
  <lexicon id="test-lexicon" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;

    const validation = detector.validateLMFStructure(validLmfContent);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should detect invalid LMF structure", () => {
    const invalidLmfContent = `<?xml version="1.0"?>
<InvalidRoot>
  <lexicon id="test-lexicon" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</InvalidRoot>`;

    const validation = detector.validateLMFStructure(invalidLmfContent);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Missing LexicalResource root element");
  });

  it("should detect missing lexicon elements", () => {
    const lmfContentWithoutLexicon = `<?xml version="1.0"?>
<LexicalResource>
  <!-- No lexicon elements -->
</LexicalResource>`;

    const validation = detector.validateLMFStructure(lmfContentWithoutLexicon);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Missing lexicon elements");
  });
});

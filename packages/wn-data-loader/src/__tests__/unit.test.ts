import { describe, it, expect, beforeEach } from "vitest";
import { WordNetProcessor } from "../wordnet-processor.js";
import { WordNetContentDetector } from "../wordnet-content-detector.js";
import { 
  getWordNetDataSource, 
  getAllWordNetDataSources, 
  getWordNetDataSourcesByLanguage,
  getWordNetDataSourcesByFormat,
  isValidWordNetProject,
  WORDNET_DATA_SOURCES 
} from "../data-sources.js";

/**
 * Unit Tests for wn-data-loader
 * 
 * This file contains unit tests for individual components:
 * - WordNetProcessor
 * - WordNetContentDetector
 * - Data Sources
 * - Type validation
 */

describe("WordNetProcessor", () => {
  let processor: WordNetProcessor;

  beforeEach(() => {
    processor = new WordNetProcessor();
  });

  it("should be created with all handlers", () => {
    const stats = processor.getProcessingStats();
    expect(stats.formatProcessor).toBeDefined();
    expect(stats.wordnetDetector).toBe(true);
  });

  it("should validate WordNet project IDs", async () => {
    const invalidXmlData = `<?xml version="1.0"?><LexicalResource><lexicon id="test"/></LexicalResource>`;
    const buffer = new TextEncoder().encode(invalidXmlData).buffer as ArrayBuffer;
    
    const result = await processor.processWordNetData(buffer, { 
      projectId: "invalid-project:1.0" 
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid WordNet project ID");
  });

  it("should process valid WordNet LMF data", async () => {
    const lmfXmlData = `<?xml version="1.0"?>
<LexicalResource>
  <lexicon id="test-lexicon" language="en">
    <lexicalEntry id="entry1" partOfSpeech="n">
      <lemma id="lemma1" writtenForm="cat" partOfSpeech="n">
        <sense id="sense1" synset="synset1" senseNumber="1"/>
      </lemma>
    </lexicalEntry>
  </lexicon>
</LexicalResource>`;
    
    const buffer = new TextEncoder().encode(lmfXmlData).buffer as ArrayBuffer;
    
    const result = await processor.processWordNetData(buffer, { 
      projectId: "omw-en:1.4",
      extractMetadata: true,
      validateLMF: true
    });
    
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("omw-package");
    expect(result.language).toBe("en");
    expect(result.wordnetMetadata).toBeDefined();
  });

  it("should extract WordNet metadata", async () => {
    const lmfXmlData = `<?xml version="1.0"?>
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
    
    const buffer = new TextEncoder().encode(lmfXmlData).buffer as ArrayBuffer;
    
    const result = await processor.processWordNetData(buffer, { 
      projectId: "omw-en:1.4",
      extractMetadata: true
    });
    
    expect(result.success).toBe(true);
    expect(result.wordnetMetadata?.lemmaCount).toBe(2);
    expect(result.wordnetMetadata?.synsetCount).toBe(2);
    expect(result.wordnetMetadata?.language).toBe("en");
  });

  it("should handle processing errors gracefully", async () => {
    const invalidData = new ArrayBuffer(0);
    
    const result = await processor.processWordNetData(invalidData, { 
      projectId: "omw-en:1.4"
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.processingSteps).toContain("WordNet processing failed");
  });
});

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

describe("Data Sources", () => {
  it("should have valid data sources", () => {
    expect(Object.keys(WORDNET_DATA_SOURCES).length).toBeGreaterThan(0);
  });

  it("should get OEWN data source", () => {
    const oewnSource = getWordNetDataSource("oewn:2024");
    
    expect(oewnSource).toBeDefined();
    expect(oewnSource?.id).toBe("oewn:2024");
    expect(oewnSource?.language).toBe("en");
    expect(oewnSource?.name).toContain("English WordNet");
    expect(oewnSource?.url).toContain("en-word.net");
  });

  it("should get OMW French data source", () => {
    const omwFrSource = getWordNetDataSource("omw-fr:1.4");
    
    expect(omwFrSource).toBeDefined();
    expect(omwFrSource?.id).toBe("omw-fr:1.4");
    expect(omwFrSource?.language).toBe("fr");
    expect(omwFrSource?.name).toContain("WOLF");
    expect(omwFrSource?.url).toContain("omw-fr");
  });

  it("should get CILI data source", () => {
    const ciliSource = getWordNetDataSource("cili:1.0");
    
    expect(ciliSource).toBeDefined();
    expect(ciliSource?.id).toBe("cili:1.0");
    expect(ciliSource?.language).toBe("unknown");
    expect(ciliSource?.name).toContain("Interlingual Index");
    expect(ciliSource?.url).toContain("cili");
  });

  it("should return undefined for invalid project IDs", () => {
    const invalidSource = getWordNetDataSource("invalid:project");
    expect(invalidSource).toBeUndefined();
  });

  it("should get all data sources", () => {
    const allSources = getAllWordNetDataSources();
    
    expect(allSources).toBeInstanceOf(Array);
    expect(allSources.length).toBeGreaterThan(0);
    expect(allSources.every(source => source.id && source.name && source.url)).toBe(true);
  });

  it("should get data sources by language", () => {
    const englishSources = getWordNetDataSourcesByLanguage("en");
    const frenchSources = getWordNetDataSourcesByLanguage("fr");
    const germanSources = getWordNetDataSourcesByLanguage("de");
    
    expect(englishSources.length).toBeGreaterThan(0);
    expect(frenchSources.length).toBeGreaterThan(0);
    expect(germanSources.length).toBeGreaterThan(0);
    
    expect(englishSources.every(source => source.language === "en")).toBe(true);
    expect(frenchSources.every(source => source.language === "fr")).toBe(true);
    expect(germanSources.every(source => source.language === "de")).toBe(true);
  });

  it("should get data sources by format", () => {
    const tarGzSources = getWordNetDataSourcesByFormat("tar.gz");
    const tarXzSources = getWordNetDataSourcesByFormat("tar.xz");
    
    expect(tarGzSources.length).toBeGreaterThan(0);
    expect(tarXzSources.length).toBeGreaterThan(0);
    
    expect(tarGzSources.every(source => source.format === "tar.gz")).toBe(true);
    expect(tarXzSources.every(source => source.format === "tar.xz")).toBe(true);
  });

  it("should validate WordNet project IDs", () => {
    expect(isValidWordNetProject("oewn:2024")).toBe(true);
    expect(isValidWordNetProject("omw-fr:1.4")).toBe(true);
    expect(isValidWordNetProject("odenet:1.4")).toBe(true); // German WordNet
    expect(isValidWordNetProject("cili:1.0")).toBe(true);
    
    expect(isValidWordNetProject("invalid:project")).toBe(false);
    expect(isValidWordNetProject("")).toBe(false);
  });

  it("should have consistent data source structure", () => {
    const allSources = getAllWordNetDataSources();
    
    for (const source of allSources) {
      // Check required fields
      expect(source.id).toBeDefined();
      expect(source.name).toBeDefined();
      expect(source.language).toBeDefined();
      expect(source.version).toBeDefined();
      expect(source.url).toBeDefined();
      expect(source.format).toBeDefined();
      
      // Check URL format
      expect(source.url).toMatch(/^https?:\/\//);
      
      // Check format values
      expect(["xml", "tar", "tar.gz", "tar.xz"]).toContain(source.format);
      
      // Check language codes (allow various valid language codes including 3-letter codes)
      expect(source.language).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]+)?$|^unknown$|^mul$/);
    }
  });

  it("should have unique project IDs", () => {
    const allSources = getAllWordNetDataSources();
    const ids = allSources.map(source => source.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});

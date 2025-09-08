import { describe, it, expect, beforeEach } from "vitest";
import { WordNetProcessor } from "../wordnet-processor.js";
import { getWordNetDataSource } from "../data-sources.js";

/**
 * WordNet Processor Tests
 * 
 * Note: These tests use inline test data for unit testing.
 * For integration tests with real WordNet data, see:
 * - wn-test-data/data/ - Contains real WordNet LMF files
 * - wn-ts-web/test/ - Contains comprehensive integration tests
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

describe("WordNet Data Sources", () => {
  it("should have valid data sources", () => {
    const oewnSource = getWordNetDataSource("oewn:2024");
    expect(oewnSource).toBeDefined();
    expect(oewnSource?.language).toBe("en");
    expect(oewnSource?.name).toContain("English WordNet");
  });

  it("should return undefined for invalid project IDs", () => {
    const invalidSource = getWordNetDataSource("invalid:project");
    expect(invalidSource).toBeUndefined();
  });
});

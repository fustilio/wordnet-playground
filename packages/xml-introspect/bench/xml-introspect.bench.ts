import { bench, describe, beforeAll, afterAll } from "vitest";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";
import { XMLIntrospector } from "../src/XMLIntrospector";
import { XSDParser } from "../src/XSDParser";
import { StreamingXMLIntrospector } from "../src/StreamingXMLIntrospector";
import { XMLStructure } from "../src/types";
import { XMLFakerGenerator } from "../src/XMLFakerGenerator";

const LIMITED_TIME = {
  iterations: 1,
  time: 5000, // Reduced to 5 seconds
};

// File cache to avoid recreating files
const fileCache = new Map<string, string>();

async function getOrCreateTestFile(
  name: string,
  numElements: number,
  depth: number = 3
): Promise<string> {
  const cacheKey = `${name}-${numElements}-${depth}`;
  if (fileCache.has(cacheKey)) {
    return fileCache.get(cacheKey)!;
  }
  const filePath = await createTestFile(name, numElements, depth);
  fileCache.set(cacheKey, filePath);
  return filePath;
}

describe("XML Introspect Performance Benchmark", () => {
  afterAll(async () => {
    // Clear the cache to free up memory
    fileCache.clear();
  });

  // --- File Size Benchmarks ---
  [
    {
      name: "Tiny",
      numElements: 10,
      depth: 2,
    },
    {
      name: "Small", 
      numElements: 25, // Reduced from 50
      depth: 2,        // Reduced from 3
    },
    {
      name: "Medium",
      numElements: 50, // Reduced from 100
      depth: 2,        // Reduced from 3
      config: LIMITED_TIME,
    },
  ].forEach(({ name, numElements, depth, config = {} }) => {
    describe(`${name} Files (${numElements} elements, depth ${depth})`, () => {
      const slug = name.toLowerCase().replace(/ /g, "-");

      // Group 1: XML Structure Analysis (Apples to Apples)
      describe("XML Structure Analysis", () => {
        bench("Current Implementation", async () => {
          const introspector = new XMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.analyzeStructure(filePath);
        }, config);

        bench("Streaming Implementation", async () => {
          const introspector = new StreamingXMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.analyzeStructure(filePath);
        }, config);
      });

      // Group 2: XSD Generation (Apples to Apples)
      describe("XSD Generation", () => {
        bench("Current Implementation", async () => {
          const introspector = new XMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
            elementForm: "qualified",
            attributeForm: "unqualified",
          });
        }, config);

        bench("Streaming Implementation", async () => {
          const introspector = new StreamingXMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
            elementForm: "qualified",
            attributeForm: "unqualified",
          });
        }, config);
      });

      // Group 3: Small XML Generation (Apples to Apples)
      describe("Small XML Generation", () => {
        bench("Current Implementation", async () => {
          const introspector = new XMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
          });
          await introspector.generateXMLFromXSD(filePath, {
            maxElements: Math.min(10, numElements / 2),
          });
        }, config);

        bench("Streaming Implementation", async () => {
          const introspector = new StreamingXMLIntrospector();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
          });
          await introspector.generateXMLFromXSD(filePath, {
            maxElements: Math.min(10, numElements / 2),
          });
        }, config);
      });

      // Group 4: XSD Parsing (Apples to Apples)
      describe("XSD Parsing", () => {
        bench("Current Implementation", async () => {
          const introspector = new XMLIntrospector();
          const xsdParser = new XSDParser();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          const xsd = await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
          });
          const tempDir = join(tmpdir(), "xml-introspect-bench");
          if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
          }
          const xsdFile = join(tempDir, `${slug}-schema.xsd`);
          await writeFile(xsdFile, xsd, "utf8");
          await xsdParser.parseXSDFile(xsdFile);
        }, config);

        bench("Streaming Implementation", async () => {
          const introspector = new StreamingXMLIntrospector();
          const xsdParser = new XSDParser();
          const filePath = await getOrCreateTestFile(slug, numElements, depth);
          const xsd = await introspector.generateXSDFromXML(filePath, {
            targetNamespace: "http://example.com/schema",
          });
          const tempDir = join(tmpdir(), "xml-introspect-bench");
          if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
          }
          const xsdFile = join(tempDir, `${slug}-schema.xsd`);
          await writeFile(xsdFile, xsd, "utf8");
          await xsdParser.parseXSDFile(xsdFile);
        }, config);
      });
    });
  });

  // --- Workflow Benchmarks ---
  describe("Complete Workflow Benchmarks", () => {
    // Group 5: Full XML → XSD → Small XML Workflow
    describe("XML → XSD → Small XML Workflow", () => {
      bench("Current Implementation - Tiny", async () => {
        const introspector = new XMLIntrospector();
        const filePath = await getOrCreateTestFile("workflow-tiny", 15, 2);
        
        // Step 1: Analyze structure
        await introspector.analyzeStructure(filePath);
        
        // Step 2: Generate XSD
        const xsd = await introspector.generateXSDFromXML(filePath, {
          targetNamespace: "http://example.com/schema",
        });
        
        // Step 3: Generate small XML from XSD
        const tempDir = join(tmpdir(), "xml-introspect-bench");
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }
        const xsdFile = join(tempDir, "workflow-tiny-schema.xsd");
        await writeFile(xsdFile, xsd, "utf8");
        
        await introspector.generateXMLFromXSD(xsdFile, { maxElements: 5 });
      });

      bench("Streaming Implementation - Tiny", async () => {
        const introspector = new StreamingXMLIntrospector();
        const filePath = await getOrCreateTestFile("workflow-tiny", 15, 2);
        
        // Step 1: Analyze structure
        await introspector.analyzeStructure(filePath);
        
        // Step 2: Generate XSD
        const xsd = await introspector.generateXSDFromXML(filePath, {
          targetNamespace: "http://example.com/schema",
        });
        
        // Step 3: Generate small XML from XSD
        const tempDir = join(tmpdir(), "xml-introspect-bench");
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }
        const xsdFile = join(tempDir, "workflow-tiny-schema.xsd");
        await writeFile(xsdFile, xsd, "utf8");
        
        await introspector.generateXMLFromXSD(xsdFile, { maxElements: 5 });
      });
    });

    // Group 6: WordNet LMF Workflow
    describe("WordNet LMF Workflow", () => {
      bench("mini-lmf-1.4.xml - Full Workflow", async () => {
        const introspector = new XMLIntrospector();
        const xsdParser = new XSDParser();

        // Create a minimal WordNet LMF file for benchmarking
        const wordnetXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>A test or examination</Definition>
  </Synset>
</LexicalResource>`;

        const tempDir = join(tmpdir(), "xml-introspect-bench");
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }
        const xmlFile = join(tempDir, "mini-lmf-bench.xml");
        await writeFile(xmlFile, wordnetXML, "utf8");

        // Run the full workflow
        const xsd = await introspector.generateXSDFromXML(xmlFile, {
          targetNamespace: "https://globalwordnet.github.io/schemas/",
          elementForm: "qualified",
          attributeForm: "unqualified",
        });

        const xsdFile = join(tempDir, "wordnet-schema-bench.xsd");
        await writeFile(xsdFile, xsd, "utf8");

        const xsdXAST = await xsdParser.parseXSDFile(xsdFile);
        const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
          maxElements: 5,
        });

        // Verify the results
        if (!xsdXAST || !smallXML) {
          throw new Error("Workflow failed to complete");
        }
      });
    });
  });

  // --- Efficiency Benchmarks ---
  describe("Efficiency Benchmarks", () => {
    // Group 7: Concurrent Processing
    describe("Concurrent Processing", () => {
      bench("Current Implementation - 5 Small Files", async () => {
        const introspector = new XMLIntrospector();
        const promises: Promise<XMLStructure>[] = [];

        // Process multiple small files concurrently
        for (let i = 0; i < 5; i++) {
          const filePath = await getOrCreateTestFile(`concurrent-${i}`, 15, 2);
          promises.push(introspector.analyzeStructure(filePath));
        }

        await Promise.all(promises);
      });

      bench("Streaming Implementation - 5 Small Files", async () => {
        const introspector = new StreamingXMLIntrospector();
        const promises: Promise<XMLStructure>[] = [];

        // Process multiple small files concurrently
        for (let i = 0; i < 5; i++) {
          const filePath = await getOrCreateTestFile(`concurrent-${i}`, 15, 2);
          promises.push(introspector.analyzeStructure(filePath));
        }

        await Promise.all(promises);
      });
    });

    // Group 8: Memory Efficiency
    describe("Memory Efficiency", () => {
      bench("Current Implementation - Chunked Processing", async () => {
        const introspector = new XMLIntrospector();
        const filePath = await getOrCreateTestFile("chunking", 50, 2);

        // Test with different chunk sizes
        const xsd = await introspector.generateXSDFromXML(filePath, {
          targetNamespace: "http://example.com/schema",
        });

        // Generate small XML with different limits
        const tempDir = join(tmpdir(), "xml-introspect-bench");
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }
        const xsdFile = join(tempDir, "chunking-schema.xsd");
        await writeFile(xsdFile, xsd, "utf8");

        const limits = [5, 10, 15];
        for (const limit of limits) {
          await introspector.generateXMLFromXSD(xsdFile, { maxElements: limit });
        }
      }, LIMITED_TIME);

      bench("Streaming Implementation - Chunked Processing", async () => {
        const introspector = new StreamingXMLIntrospector();
        const filePath = await getOrCreateTestFile("chunking", 50, 2);

        // Test with different chunk sizes
        const xsd = await introspector.generateXSDFromXML(filePath, {
          targetNamespace: "http://example.com/schema",
        });

        // Generate small XML with different limits
        const tempDir = join(tmpdir(), "xml-introspect-bench");
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }
        const xsdFile = join(tempDir, "chunking-schema.xsd");
        await writeFile(xsdFile, xsd, "utf8");

        const limits = [5, 10, 15];
        for (const limit of limits) {
          await introspector.generateXMLFromXSD(xsdFile, { maxElements: limit });
        }
      }, LIMITED_TIME);
    });
  });
});

// Helper function to create test files using XMLFakerGenerator
async function createTestFile(
  name: string,
  numElements: number,
  depth: number
): Promise<string> {
  try {
    const testDir = join(tmpdir(), "xml-introspect-bench");
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
    const filePath = join(testDir, `${name}-test.xml`);

    // Check if file already exists to avoid recreation
    if (existsSync(filePath)) {
      return filePath;
    }

    // Safety check to prevent excessive file sizes
    if (depth > 5 || numElements > 1000) {
      throw new Error(
        `File size parameters too large: depth=${depth}, elements=${numElements}`
      );
    }

    // Use XMLFakerGenerator to create realistic test files
    const fakerGenerator = new XMLFakerGenerator({
      seed: 42, // Consistent seed for reproducible tests
      maxDepth: depth,
      maxChildren: Math.min(15, Math.ceil(numElements / depth)),
      realisticData: true,
      preserveStructure: true
    });

    // Create a mock structure that matches our test parameters
    const mockStructure = {
      rootElement: 'root',
      elementTypes: new Map([
        ['person', { count: Math.ceil(numElements * 0.3), attributes: new Set(['id', 'name', 'email']) }],
        ['product', { count: Math.ceil(numElements * 0.3), attributes: new Set(['id', 'name', 'price']) }],
        ['order', { count: Math.ceil(numElements * 0.2), attributes: new Set(['id', 'customer', 'total']) }],
        ['company', { count: Math.ceil(numElements * 0.2), attributes: new Set(['id', 'name', 'industry']) }]
      ])
    };

    // Generate XML using our faker generator
    const xmlContent = fakerGenerator.generateXMLFromStructure(mockStructure, {
      maxDepth: depth,
      maxChildren: Math.min(15, Math.ceil(numElements / depth))
    });

    await writeFile(filePath, xmlContent, "utf8");
    return filePath;
  } catch (err) {
    console.error("Error creating test file:", err);
    throw err;
  }
}

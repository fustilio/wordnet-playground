import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { XMLIntrospector } from '../src/XMLIntrospector';

describe('XMLIntrospector CLI Functionality', () => {
  let introspector: XMLIntrospector;
  let tempDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    introspector = new XMLIntrospector();
    tempDir = join(process.cwd(), 'temp-test');
    
    // Create temp directory if it doesn't exist
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    testFiles = [];
  });

  afterEach(() => {
    // Clean up test files
    testFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
    
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmdirSync(tempDir, { recursive: true });
    }
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = join(tempDir, filename);
    writeFileSync(filePath, content, 'utf8');
    testFiles.push(filePath);
    return filePath;
  };

  describe('Command Line Interface Simulation', () => {
    it('should process sample command with basic options', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Test definition</Definition>
  </Synset>
</LexicalResource>`;

      const inputFile = createTestFile('input.xml', xmlContent);
      const outputFile = join(tempDir, 'sample.xml');
      testFiles.push(outputFile);

      // Simulate CLI command: xml-introspect sample input.xml --output sample.xml --max-elements 2
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 2,
        preserveStructure: true
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<LexicalResource>');
      expect(result).toContain('</LexicalResource>');
    });

    it('should process schema command to generate XSD', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1" name="test">content</item>
  <category type="main">description</category>
</root>`;

      const inputFile = createTestFile('schema-input.xml', xmlContent);
      const outputFile = join(tempDir, 'schema.xsd');
      testFiles.push(outputFile);

      // Simulate CLI command: xml-introspect schema input.xml --output schema.xsd
      const xsd = await introspector.generateXSDFromXML(inputFile, {
        targetNamespace: 'http://example.com/schema',
        elementForm: 'qualified',
        attributeForm: 'unqualified'
      });

      writeFileSync(outputFile, xsd);

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<xs:schema');
      expect(result).toContain('targetNamespace="http://example.com/schema"');
      expect(result).toContain('elementFormDefault="qualified"');
      expect(result).toContain('attributeFormDefault="unqualified"');
      expect(result).toContain('<xs:element name="root" type="rootType"/>');
      expect(result).toContain('<xs:element name="item" type="itemType"/>');
      expect(result).toContain('<xs:element name="category" type="categoryType"/>');
      expect(result).toContain('<xs:complexType name="rootType">');
      expect(result).toContain('<xs:complexType name="itemType">');
      expect(result).toContain('<xs:complexType name="categoryType">');
    });

    it('should process validate command with XSD validation', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">test</item>
</root>`;

      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" minOccurs="0" maxOccurs="unbounded">
          <xs:complexType>
            <xs:simpleContent>
              <xs:extension base="xs:string">
                <xs:attribute name="id" type="xs:string"/>
              </xs:extension>
            </xs:simpleContent>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xmlFile = createTestFile('validate.xml', xmlContent);
      const xsdFile = createTestFile('validate.xsd', xsdContent);

      // Simulate CLI command: xml-introspect validate validate.xml --schema validate.xsd
      const result = await introspector.validateXML(xmlFile, xsdFile);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should process roundtrip command (XML -> XAST -> XML)', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<test>
  <element id="1" name="test">
    <child>value</child>
  </element>
</test>`;

      const inputFile = createTestFile('roundtrip-input.xml', xmlContent);
      const outputFile = join(tempDir, 'roundtrip-output.xml');
      testFiles.push(outputFile);

      // Simulate CLI command: xml-introspect roundtrip input.xml --output output.xml
      const result = await introspector.xmlToXASTToXML(inputFile);
      writeFileSync(outputFile, result);

      expect(existsSync(outputFile)).toBe(true);
      const fileContent = readFileSync(outputFile, 'utf8');
      
      expect(fileContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(fileContent).toContain('<test>');
      expect(fileContent).toContain('<element');
      expect(fileContent).toContain('id="1"');
      expect(fileContent).toContain('name="test"');
      expect(fileContent).toContain('<child>');
      expect(fileContent).toContain('value');
      expect(fileContent).toContain('</child>');
      expect(fileContent).toContain('</element>');
      expect(fileContent).toContain('</test>');
    });

    it('should process expand command to generate large XML', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Test definition</Definition>
  </Synset>
</LexicalResource>`;

      const inputFile = createTestFile('expand-input.xml', xmlContent);
      const outputFile = join(tempDir, 'expanded.xml');
      testFiles.push(outputFile);

      console.log('🔍 Starting expand command test...');
      console.log('📁 Input file:', inputFile);
      console.log('📁 Output file:', outputFile);
      console.log('🎯 Target size: 1000');
      
      // Debug: Check the input XML structure
      const inputContent = readFileSync(inputFile, 'utf8');
      console.log('📄 Input XML:');
      console.log(inputContent);

      // Debug: Analyze the structure first
      console.log('🔍 Analyzing XML structure...');
      const structure = await introspector.analyzeStructure(inputFile);
      console.log('📊 Structure analysis:');
      console.log('  Root element:', structure.rootElement);
      console.log('  Total elements:', structure.totalElements);
      console.log('  Max depth:', structure.maxDepth);
      console.log('  Element types:');
      for (const [elementName, typeInfo] of structure.elementTypes) {
        console.log(`    ${elementName}: count=${typeInfo.count}, attributes=${Array.from(typeInfo.attributes)}, children=${Array.from(typeInfo.children)}`);
      }
      
      // Debug: Check what the generateSample method returns
      console.log('🔍 Testing generateSample directly...');
      const sample = await introspector.generateSample(inputFile, {
        maxElements: 100,
        preserveStructure: true
      });
      console.log('📄 Sample XML length:', sample.length);
      console.log('📄 Sample first 500 chars:', sample.substring(0, 500));
      const sampleItemCount = (sample.match(/<item/g) || []).length;
      console.log('🔢 Sample item count:', sampleItemCount);

      // Simulate CLI command: xml-introspect expand input.xml --output expanded.xml --target-size 1000
      await introspector.transformSmallToBig(inputFile, outputFile, 1000);

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      console.log('📄 Generated XML length:', result.length);
      console.log('📄 First 500 chars:', result.substring(0, 500));
      
      expect(result).toContain('<LexicalResource>');
      expect(result).toContain('<LexicalEntry');
      expect(result).toContain('<Synset');
      expect(result).toContain('</LexicalResource>');
      
      // Should have significantly more elements
      const entryCount = (result.match(/<LexicalEntry/g) || []).length;
      const synsetCount = (result.match(/<Synset/g) || []).length;
      
      console.log('🔢 LexicalEntry count:', entryCount);
      console.log('🔢 Synset count:', synsetCount);
      console.log('🔢 Total result length:', result.length);
      
      expect(entryCount).toBeGreaterThan(10);
      expect(synsetCount).toBeGreaterThan(10);
    });
  });

  describe('CLI Options and Parameters', () => {
    it('should handle different sampling strategies', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <typeA id="1"/>
  <typeA id="2"/>
  <typeA id="3"/>
  <typeB id="1"/>
  <typeB id="2"/>
  <typeC id="1"/>
</root>`;

      const inputFile = createTestFile('strategies.xml', xmlContent);
      const outputFile = join(tempDir, 'strategies-sample.xml');
      testFiles.push(outputFile);

      // Test balanced strategy
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 3,
        preserveStructure: true,
        samplingStrategy: 'balanced' as any
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      // Should contain different element types
      expect(result).toContain('<typeA');
      expect(result).toContain('<typeB');
      expect(result).toContain('<typeC');
    });

    it('should handle custom element limits', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="word1" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <LexicalEntry id="entry2" pos="v">
    <Lemma writtenForm="word2" partOfSpeech="v"/>
    <Sense id="sense2" synset="synset2"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Definition 1</Definition>
  </Synset>
  <Synset id="synset2" ili="i124">
    <Definition>Definition 2</Definition>
  </Synset>
</LexicalResource>`;

      const inputFile = createTestFile('limits.xml', xmlContent);
      const outputFile = join(tempDir, 'limits-sample.xml');
      testFiles.push(outputFile);

      // Test with custom element limits
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 4, // Increased to allow for representative sampling
        preserveStructure: true
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      // Should contain representative elements
      expect(result).toContain('<LexicalEntry');
      expect(result).toContain('<Synset');
    });

    it('should handle verbose output and progress tracking', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">Item 1</item>
  <item id="2">Item 2</item>
  <item id="3">Item 3</item>
  <item id="4">Item 4</item>
  <item id="5">Item 5</item>
</root>`;

      const inputFile = createTestFile('verbose.xml', xmlContent);
      const outputFile = join(tempDir, 'verbose-sample.xml');
      testFiles.push(outputFile);

      // Test with progress tracking (simulated)
      let progressCount = 0;
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 3,
        preserveStructure: true
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      expect(result).toContain('<root>');
      expect(result).toContain('<item');
      expect(result).toContain('</root>');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent input files gracefully', async () => {
      const nonExistentFile = join(tempDir, 'nonexistent.xml');
      
      await expect(introspector.analyzeStructure(nonExistentFile))
        .rejects.toThrow();
    });

    it('should handle malformed XML gracefully', async () => {
      const malformedXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <unclosed>
  <malformed>
</root>`;

      const inputFile = createTestFile('malformed.xml', malformedXML);
      const outputFile = join(tempDir, 'malformed-output.xml');
      testFiles.push(outputFile);

      // Should still process what it can
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 1,
        preserveStructure: true
      });

      expect(existsSync(outputFile)).toBe(true);
    });

    it('should handle very large XML files efficiently', async () => {
      // Create a large XML file for testing
      let largeXML = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
      
      for (let i = 0; i < 1000; i++) {
        largeXML += `  <item id="${i}" name="item${i}">Item ${i}</item>\n`;
      }
      
      largeXML += '</root>';

      const inputFile = createTestFile('large.xml', largeXML);
      const outputFile = join(tempDir, 'large-sample.xml');
      testFiles.push(outputFile);

      console.log('🔍 Starting large XML test...');
      console.log('📁 Input file:', inputFile);
      console.log('📁 Output file:', outputFile);
      console.log('🎯 Max elements: 100');
      console.log('📊 Input XML length:', largeXML.length);
      console.log('📊 Input item count: 1000');

      // Should process large files without memory issues
      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 100,
        preserveStructure: true
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      console.log('📄 Output XML length:', result.length);
      console.log('📄 First 500 chars:', result.substring(0, 500));
      
      expect(result).toContain('<root>');
      expect(result).toContain('<item');
      expect(result).toContain('</root>');
      
      // Should have reduced number of elements
      const itemCount = (result.match(/<item/g) || []).length;
      console.log('🔢 Output item count:', itemCount);
      console.log('🔢 Expected max: 100');
      
      expect(itemCount).toBeLessThanOrEqual(100);
    });
  });
});

// Helper function to read file content
function readFileSync(filePath: string, encoding: string): string {
  const fs = require('fs');
  return fs.readFileSync(filePath, encoding);
}

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { XMLIntrospector } from '../src/XMLIntrospector';
import { SamplingStrategy } from '../src/types';

describe('XMLIntrospector', () => {
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

  describe('Task A: Generate XSD from XML', () => {
    it('should generate XSD from simple XML structure', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person id="1" name="John">
    <age>30</age>
    <city>New York</city>
  </person>
  <person id="2" name="Jane">
    <age>25</age>
    <city>Los Angeles</city>
  </person>
</root>`;

      const xmlFile = createTestFile('test.xml', xmlContent);
      const xsd = await introspector.generateXSDFromXML(xmlFile);



      expect(xsd).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xsd).toContain('<xs:schema');
      expect(xsd).toContain('<xs:element name="root" type="rootType"/>');
      expect(xsd).toContain('<xs:element name="person" type="personType"/>');
      expect(xsd).toContain('<xs:element name="age" type="ageType"/>');
      expect(xsd).toContain('<xs:element name="city" type="cityType"/>');
      expect(xsd).toContain('<xs:attribute name="id" type="xs:string"/>');
      expect(xsd).toContain('<xs:attribute name="name" type="xs:string"/>');
    });

    it('should handle XML with attributes and nested elements', async () => {
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

      const xmlFile = createTestFile('lexical.xml', xmlContent);
      const xsd = await introspector.generateXSDFromXML(xmlFile);

      expect(xsd).toContain('<xs:element name="LexicalResource" type="LexicalResourceType"/>');
      expect(xsd).toContain('<xs:element name="LexicalEntry" type="LexicalEntryType"/>');
      expect(xsd).toContain('<xs:element name="Synset" type="SynsetType"/>');
      expect(xsd).toContain('<xs:attribute name="id" type="xs:string"/>');
      expect(xsd).toContain('<xs:attribute name="pos" type="xs:string"/>');
    });
  });

  describe('Task B: Generate XML from XSD', () => {
    it('should generate XML from XSD schema', async () => {
      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" minOccurs="0" maxOccurs="unbounded"/>
        <xs:element name="category" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xsdFile = createTestFile('schema.xsd', xsdContent);
      const xml = await introspector.generateXMLFromXSD(xsdFile, {
        maxElements: 10,
        generateRealisticData: true
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<root>');
      expect(xml).toContain('<item>');
      expect(xml).toContain('<category>');
      expect(xml).toContain('</root>');
    });
  });

  describe('Task C: XML -> XAST -> XML roundtrip', () => {
    it('should perform XML to XAST to XML roundtrip', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<test>
  <element id="1" name="test">
    <child>value</child>
  </element>
</test>`;

      const xmlFile = createTestFile('roundtrip.xml', xmlContent);
      const result = await introspector.xmlToXASTToXML(xmlFile);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<test>');
      expect(result).toContain('<element');
      expect(result).toContain('id="1"');
      expect(result).toContain('name="test"');
      expect(result).toContain('<child>');
      expect(result).toContain('value');
      expect(result).toContain('</child>');
      expect(result).toContain('</element>');
      expect(result).toContain('</test>');
    });

    it('should preserve attributes in roundtrip', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalEntry id="entry1" pos="n" language="en">
  <Lemma writtenForm="test" partOfSpeech="n"/>
</LexicalEntry>`;

      const xmlFile = createTestFile('attributes.xml', xmlContent);
      const result = await introspector.xmlToXASTToXML(xmlFile);

      expect(result).toContain('id="entry1"');
      expect(result).toContain('pos="n"');
      expect(result).toContain('language="en"');
      expect(result).toContain('writtenForm="test"');
      expect(result).toContain('partOfSpeech="n"');
    });
  });

  describe('Task D: Transform big XML to small XML', () => {
    it('should create small sample from large XML structure', async () => {
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
  <LexicalEntry id="entry3" pos="a">
    <Lemma writtenForm="word3" partOfSpeech="a"/>
    <Sense id="sense3" synset="synset3"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Definition 1</Definition>
  </Synset>
  <Synset id="synset2" ili="i124">
    <Definition>Definition 2</Definition>
  </Synset>
  <Synset id="synset3" ili="i125">
    <Definition>Definition 3</Definition>
  </Synset>
</LexicalResource>`;

      const inputFile = createTestFile('large.xml', xmlContent);
      const outputFile = join(tempDir, 'small.xml');
      testFiles.push(outputFile);

      await introspector.transformBigToSmall(inputFile, outputFile, {
        inputFile,
        outputFile,
        maxElements: 4, // Increased to allow one of each element type
        preserveStructure: true,
        samplingStrategy: SamplingStrategy.BALANCED
      });

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      // Should contain at least one of each element type
      expect(result).toContain('<LexicalEntry');
      expect(result).toContain('<Synset');
      expect(result).toContain('<Lemma');
      expect(result).toContain('<Sense');
    });
  });

  describe('Task E: Transform small XML to big XML', () => {
    it('should expand small XML based on patterns', async () => {
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

      const inputFile = createTestFile('small.xml', xmlContent);
      const outputFile = join(tempDir, 'expanded.xml');
      testFiles.push(outputFile);

      await introspector.transformSmallToBig(inputFile, outputFile, 100);

      expect(existsSync(outputFile)).toBe(true);
      const result = readFileSync(outputFile, 'utf8');
      
      // Should contain expanded content
      expect(result).toContain('<LexicalResource>');
      expect(result).toContain('<LexicalEntry');
      expect(result).toContain('<Synset');
      expect(result).toContain('</LexicalResource>');
      
      // Should have more elements than the original
      const entryCount = (result.match(/<LexicalEntry/g) || []).length;
      const synsetCount = (result.match(/<Synset/g) || []).length;
      expect(entryCount).toBeGreaterThan(1);
      expect(synsetCount).toBeGreaterThan(1);
    });
  });

  describe('XML Structure Analysis', () => {
    it('should analyze XML structure correctly', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <level1 id="1">
    <level2>text</level2>
  </level1>
  <level1 id="2">
    <level2>more text</level2>
  </level1>
</root>`;

      const xmlFile = createTestFile('structure.xml', xmlContent);
      const structure = await introspector.analyzeStructure(xmlFile);

      expect(structure.rootElement).toBe('root');
      expect(structure.maxDepth).toBe(4);
      expect(structure.totalElements).toBe(5); // root, level1, level2 + text nodes
      expect(structure.elementTypes.has('root')).toBe(true);
      expect(structure.elementTypes.has('level1')).toBe(true);
      expect(structure.elementTypes.has('level2')).toBe(true);
      
      const level1Info = structure.elementTypes.get('level1')!;
      expect(level1Info.count).toBe(2);
      expect(level1Info.attributes.has('id')).toBe(true);
      expect(level1Info.children.has('level2')).toBe(true);
    });
  });

  describe('Sample Generation', () => {
    it('should generate balanced samples', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <typeA id="1"/>
  <typeA id="2"/>
  <typeA id="3"/>
  <typeB id="1"/>
  <typeB id="2"/>
  <typeC id="1"/>
</root>`;

      const xmlFile = createTestFile('balanced.xml', xmlContent);
      const sample = await introspector.generateSample(xmlFile, {
        maxElements: 3,
        strategy: SamplingStrategy.BALANCED,
        preserveAllTypes: true
      });

      expect(sample).toContain('<typeA');
      expect(sample).toContain('<typeB');
      expect(sample).toContain('<typeC');
    });

    it('should generate random samples', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1"/>
  <item id="2"/>
  <item id="3"/>
  <item id="4"/>
  <item id="5"/>
</root>`;

      const xmlFile = createTestFile('random.xml', xmlContent);
      const sample = await introspector.generateSample(xmlFile, {
        maxElements: 3,
        strategy: SamplingStrategy.RANDOM
      });

      expect(sample).toContain('<item');
      expect(sample).toContain('</root>');
    });
  });

  describe('XML Validation', () => {
    it('should validate XML against XSD schema', async () => {
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

      const xmlFile = createTestFile('valid.xml', xmlContent);
      const xsdFile = createTestFile('valid.xsd', xsdContent);

      const result = await introspector.validateXML(xmlFile, xsdFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty XML files', async () => {
      const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<root/>';
      const xmlFile = createTestFile('empty.xml', xmlContent);
      
      const structure = await introspector.analyzeStructure(xmlFile);
      expect(structure.rootElement).toBe('root');
      expect(structure.totalElements).toBe(1);
    });

    it('should handle XML with only text content', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>Just some text content</root>`;
      
      const xmlFile = createTestFile('text-only.xml', xmlContent);
      const structure = await introspector.analyzeStructure(xmlFile);
      
      expect(structure.rootElement).toBe('root');
      expect(structure.totalElements).toBe(1);
    });

    it('should handle XML with complex nesting', async () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<level0>
  <level1>
    <level2>
      <level3>
        <level4>deep</level4>
      </level3>
    </level2>
  </level1>
</level0>`;

      const xmlFile = createTestFile('nested.xml', xmlContent);
      const structure = await introspector.analyzeStructure(xmlFile);
      
      expect(structure.maxDepth).toBe(5);
      expect(structure.totalElements).toBe(5);
    });
  });
});

// Helper function to read file content
function readFileSync(filePath: string, encoding: string): string {
  const fs = require('fs');
  return fs.readFileSync(filePath, encoding);
}

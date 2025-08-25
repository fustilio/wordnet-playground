import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { XSDParser } from '../src/XSDParser';

describe('XSD Parser and Unified XAST', () => {
  let parser: XSDParser;
  let tempDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    parser = new XSDParser();
    tempDir = join(process.cwd(), 'temp-xsd-test');
    
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    testFiles = [];
  });

  afterEach(() => {
    testFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
    
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

  it('should parse a simple XSD into unified XAST structure', async () => {
    const simpleXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="http://example.com/schema"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">
  
  <xs:element name="Person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Age" type="xs:integer"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Company">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element ref="Person" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const xsdFile = createTestFile('simple-schema.xsd', simpleXSD);
    
    console.log('📁 Created simple XSD file');
    console.log('📄 XSD Content:');
    console.log(simpleXSD);

    // Parse the XSD into unified XAST
    console.log('\n🔄 Parsing XSD into unified XAST structure...');
    const xsdXAST = await parser.parseXSDFile(xsdFile);
    
    console.log('✅ Parsed XSD into unified XAST structure');
    
    // Verify the XAST structure
    expect(xsdXAST.root.type).toBe('xsd:schema');
    expect(xsdXAST.root.attributes.targetNamespace).toBe('http://example.com/schema');
    expect(xsdXAST.root.attributes.elementFormDefault).toBe('qualified');
    expect(xsdXAST.root.attributes.attributeFormDefault).toBe('unqualified');
    
    // Check elements
    const elementNames = parser.getElementNames();
    console.log('\n🔍 Elements found in XSD:', elementNames);
    expect(elementNames).toContain('Person');
    expect(elementNames).toContain('Company');
    
    // Get Person element details
    const personElement = parser.getElement('Person');
    expect(personElement).toBeDefined();
    if (personElement) {
      console.log('\n👤 Person element structure:');
      console.log('  - Name:', personElement.name);
      console.log('  - Type:', personElement.type);
      console.log('  - Children count:', personElement.children.size);
      
      // Check for complex type
      const complexType = personElement.xsdNode.children.find(child => child.type === 'xsd:complexType');
      expect(complexType).toBeDefined();
    }
    
    // Get Company element details
    const companyElement = parser.getElement('Company');
    expect(companyElement).toBeDefined();
    if (companyElement) {
      console.log('\n🏢 Company element structure:');
      console.log('  - Name:', companyElement.name);
      console.log('  - Type:', companyElement.type);
      console.log('  - Ref:', personElement?.xsdNode.attributes.ref);
      console.log('  - MaxOccurs:', personElement?.xsdNode.attributes.maxOccurs);
    }
    
    // Validate XML structure
    const validElements = ['Person', 'Company'];
    const isValid = parser.validateXMLStructure(validElements);
    expect(isValid).toBe(true);
    
    // Get structure summary
    const summary = parser.getStructureSummary();
    console.log('\n📊 XSD Structure Summary:');
    console.log(summary);
    
    console.log('\n✅ XSD parsing and XAST structure creation completed successfully!');
  });

  it('should parse WordNet-style XSD into unified XAST', async () => {
    const wordnetXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="https://globalwordnet.github.io/schemas/"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">
  
  <xs:element name="LexicalResource">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Lexicon" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Lexicon">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="LexicalEntry" maxOccurs="unbounded"/>
        <xs:element ref="Synset" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="language" type="xs:string" use="required"/>
      <xs:attribute name="version" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="LexicalEntry">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Lemma"/>
        <xs:element ref="Sense" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="pos" type="xs:string" use="optional"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Lemma">
    <xs:complexType>
      <xs:attribute name="writtenForm" type="xs:string" use="required"/>
      <xs:attribute name="partOfSpeech" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Sense">
    <xs:complexType>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="synset" type="xs:IDREF" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Synset">
    <xs:complexType>
      <xs:sequence>
        <xs:element ref="Definition" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:ID" use="required"/>
      <xs:attribute name="ili" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
  
  <xs:element name="Definition">
    <xs:complexType mixed="true">
      <xs:attribute name="language" type="xs:string" use="optional"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const xsdFile = createTestFile('wordnet-schema.xsd', wordnetXSD);
    
    console.log('📁 Created WordNet-style XSD file');
    console.log('📄 XSD Content (first 300 chars):');
    console.log(wordnetXSD.substring(0, 300) + '...');

    // Parse the XSD into unified XAST
    console.log('\n🔄 Parsing WordNet XSD into unified XAST structure...');
    const xsdXAST = await parser.parseXSDFile(xsdFile);
    
    console.log('✅ Parsed WordNet XSD into unified XAST structure');
    
    // Verify the XAST structure
    expect(xsdXAST.root.type).toBe('xsd:schema');
    expect(xsdXAST.root.attributes.targetNamespace).toBe('https://globalwordnet.github.io/schemas/');
    expect(xsdXAST.root.attributes.elementFormDefault).toBe('qualified');
    expect(xsdXAST.root.attributes.attributeFormDefault).toBe('unqualified');
    
    // Check WordNet-specific elements
    const elementNames = parser.getElementNames();
    console.log('\n🔍 WordNet elements found in XSD:', elementNames);
    
    const expectedElements = ['LexicalResource', 'Lexicon', 'LexicalEntry', 'Lemma', 'Sense', 'Synset', 'Definition'];
    expectedElements.forEach(element => {
      expect(elementNames).toContain(element);
    });
    
    // Check specific element structures
    const lexicalEntry = parser.getElement('LexicalEntry');
    expect(lexicalEntry).toBeDefined();
    if (lexicalEntry) {
      console.log('\n📚 LexicalEntry element structure:');
      console.log('  - Name:', lexicalEntry.name);
      console.log('  - Type:', lexicalEntry.type);
      console.log('  - Children count:', lexicalEntry.children.size);
      
      // Check for complex type
      const complexType = lexicalEntry.xsdNode.children.find(child => child.type === 'xsd:complexType');
      expect(complexType).toBeDefined();
    }
    
    // Validate WordNet XML structure
    const wordnetElements = ['LexicalResource', 'Lexicon', 'LexicalEntry', 'Lemma', 'Sense', 'Synset', 'Definition'];
    const isValid = parser.validateXMLStructure(wordnetElements);
    expect(isValid).toBe(true);
    
    // Get structure summary
    const summary = parser.getStructureSummary();
    console.log('\n📊 WordNet XSD Structure Summary:');
    console.log(summary);
    
    console.log('\n✅ WordNet XSD parsing and XAST structure creation completed successfully!');
  });

  it('should demonstrate the recursive nature of XSD XAST', async () => {
    const recursiveXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="http://recursive.example.com/schema">
  
  <xs:element name="Tree">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Node">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Value" type="xs:string"/>
              <xs:element name="Children" minOccurs="0" maxOccurs="unbounded">
                <xs:complexType>
                  <xs:sequence>
                    <xs:element ref="Node"/>
                  </xs:sequence>
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const xsdFile = createTestFile('recursive-schema.xsd', recursiveXSD);
    
    console.log('📁 Created recursive XSD file');
    console.log('📄 XSD Content:');
    console.log(recursiveXSD);

    // Parse the XSD into unified XAST
    console.log('\n🔄 Parsing recursive XSD into unified XAST structure...');
    const xsdXAST = await parser.parseXSDFile(xsdFile);
    
    console.log('✅ Parsed recursive XSD into unified XAST structure');
    
    // Check the recursive structure
    const elementNames = parser.getElementNames();
    console.log('\n🔍 Elements found in recursive XSD:', elementNames);
    
    expect(elementNames).toContain('Tree');
    expect(elementNames).toContain('Node');
    
    // Get Tree element and explore its recursive structure
    const treeElement = parser.getElement('Tree');
    expect(treeElement).toBeDefined();
    
    if (treeElement) {
      console.log('\n🌳 Tree element recursive structure:');
      console.log('  - Name:', treeElement.name);
      console.log('  - Type:', treeElement.type);
      console.log('  - Children count:', treeElement.children.length);
      
      // Navigate through the recursive structure
      let depth = 0;
      const exploreStructure = (element: any, currentDepth: number) => {
        const indent = '  '.repeat(currentDepth);
        console.log(`${indent}- ${element.name} (${element.type})`);
        
        if (element.children && element.children.size > 0) {
          element.children.forEach((child: any) => {
            if (child.type === 'xsd:complexType') {
              exploreStructure(child, currentDepth + 1);
            }
          });
        }
      };
      
      exploreStructure(treeElement, 0);
    }
    
    // Get structure summary
    const summary = parser.getStructureSummary();
    console.log('\n📊 Recursive XSD Structure Summary:');
    console.log(summary);
    
    console.log('\n✅ Recursive XSD parsing and XAST structure exploration completed successfully!');
  });

  it('should validate XSD schemas using xmllint-wasm', async () => {
    // Import xmllint-wasm for validation
    const { validateXML } = await import('xmllint-wasm');
    
    // Create a simple valid XSD for testing
    const simpleXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="TestElement">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Value" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    // Create a valid XML that matches the XSD
    const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<TestElement>
  <Name>Test Name</Name>
  <Value>42</Value>
</TestElement>`;

    try {
      const result = await validateXML({
        xml: [{
          fileName: 'test.xml',
          contents: validXML,
        }],
        schema: [simpleXSD],
        initialMemoryPages: 256,
        maxMemoryPages: 1024,
      });
      
      console.log('✅ XSD validation completed successfully');
      console.log('📊 Validation result:', result.valid ? 'Valid' : 'Invalid');
      
      if (!result.valid && result.errors.length > 0) {
        console.log('❌ Validation errors:', result.errors);
      }
      
      expect(result.valid).toBe(true);
    } catch (error) {
      console.error('❌ XSD validation failed:', error);
      throw error;
    }
  });
});

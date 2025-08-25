import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { XMLIntrospector } from '../src/XMLIntrospector';

describe('Big XML → XSD → Small XML Workflow', () => {
  let introspector: XMLIntrospector;
  let tempDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    introspector = new XMLIntrospector();
    tempDir = join(process.cwd(), 'temp-workflow-test');
    
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

  it('should successfully transform large XML through XSD to small XML', async () => {
    // Step 1: Create a "large" XML file
    const largeXMLContent = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <LexicalEntry id="entry2" pos="v">
    <Lemma writtenForm="run" partOfSpeech="v"/>
    <Sense id="sense2" synset="synset2"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>A test or examination</Definition>
  </Synset>
  <Synset id="synset2" ili="i124">
    <Definition>To move swiftly on foot</Definition>
  </Synset>
</LexicalResource>`;

    const largeXMLFile = createTestFile('large-wordnet.xml', largeXMLContent);
    console.log('��� Created large XML file');

    // Step 2: Generate XSD from the large XML
    console.log('��� Step 1: Generating XSD from large XML...');
    const xsd = await introspector.generateXSDFromXML(largeXMLFile, {
      targetNamespace: 'http://wordnet.princeton.edu/schema',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });

    const xsdFile = createTestFile('wordnet-schema.xsd', xsd);
    console.log('✅ Generated XSD schema:', xsd.length, 'characters');

    // Verify the XSD contains expected elements (new format with types)
    expect(xsd).toContain('<xs:element name="LexicalResource" type="LexicalResourceType"/>');
    expect(xsd).toContain('<xs:element name="LexicalEntry" type="LexicalEntryType"/>');

    // Step 3: Generate small XML from the XSD
    console.log('��� Step 2: Generating small XML from XSD...');
    const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
      maxElements: 3
    });

    const smallXMLFile = createTestFile('small-wordnet.xml', smallXML);
    console.log('✅ Generated small XML:', smallXML.length, 'characters');

    // Verify the small XML follows the schema structure
    expect(smallXML).toContain('<LexicalResource>');
    expect(smallXML).toContain('</LexicalResource>');

    // Count elements to ensure it's small
    const elementCount = (smallXML.match(/<[^/][^>]*>/g) || []).length;
    console.log('��� Small XML contains', elementCount, 'opening tags');
    expect(elementCount).toBeLessThanOrEqual(8); // Should be small

    console.log('✅ Workflow completed successfully!');
    console.log('��� Summary:');
    console.log('   Large XML:', largeXMLContent.length, 'characters');
    console.log('   XSD Schema:', xsd.length, 'characters');
    console.log('   Small XML:', smallXML.length, 'characters');
    console.log('   Element reduction:', Math.round((1 - smallXML.length / largeXMLContent.length) * 100) + '%');
  });

  it('should demonstrate the workflow with detailed output', async () => {
    // Create a more complex XML structure
    const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
<Library>
  <Book id="book1" genre="fiction" author="John Doe">
    <Title>The Great Adventure</Title>
    <Chapter number="1">
      <Paragraph>It was a dark and stormy night...</Paragraph>
      <Paragraph>The wind howled through the trees...</Paragraph>
    </Chapter>
    <Chapter number="2">
      <Paragraph>Morning came with a golden light...</Paragraph>
    </Chapter>
  </Book>
  <Book id="book2" genre="non-fiction" author="Jane Smith">
    <Title>Science Today</Title>
    <Chapter number="1">
      <Paragraph>Quantum physics is fascinating...</Paragraph>
    </Chapter>
  </Book>
  <Author id="author1" name="John Doe" country="USA"/>
  <Author id="author2" name="Jane Smith" country="Canada"/>
</Library>`;

    const complexXMLFile = createTestFile('complex-library.xml', complexXML);
    console.log('📁 Created complex XML file with', complexXML.split('<').length - 1, 'elements');

    // Step 1: Generate XSD
    console.log('\n🔄 Step 1: Generating XSD from complex XML...');
    const xsd = await introspector.generateXSDFromXML(complexXMLFile, {
      targetNamespace: 'http://library.example.com/schema'
    });

    const xsdFile = createTestFile('library-schema.xsd', xsd);
    console.log('✅ Generated XSD schema:', xsd.length, 'characters');
    
    // Show a snippet of the XSD
    console.log('\n📄 XSD Preview (first 300 chars):');
    console.log(xsd.substring(0, 300) + '...');

    // Step 2: Generate small XML with different limits
    const limits = [2, 4, 6];
    
    for (const limit of limits) {
      console.log(`\n🔄 Step 2: Generating small XML with maxElements = ${limit}...`);
      
      const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
        maxElements: limit
      });

      const smallXMLFile = createTestFile(`library-${limit}.xml`, smallXML);
      
      // Count elements
      const elementCount = (smallXML.match(/<[^/][^>]*>/g) || []).length;
      console.log(`✅ Generated XML with ${elementCount} opening tags (limit: ${limit})`);
      
      // Show the generated XML
      console.log(`\n📄 Small XML (${limit} elements):`);
      console.log(smallXML);
      
      // Verify structure is maintained
      expect(smallXML).toContain('<Library>');
      expect(smallXML).toContain('</Library>');
      expect(elementCount).toBeLessThanOrEqual(limit + 2); // +2 for root and wrapper elements
    }

    console.log('\n✅ Workflow demonstration completed successfully!');
    console.log('📊 Summary:');
    console.log('   Complex XML:', complexXML.length, 'characters');
    console.log('   XSD Schema:', xsd.length, 'characters');
    console.log('   Element reduction examples:');
    limits.forEach(limit => {
      const smallFile = join(tempDir, `library-${limit}.xml`);
      if (existsSync(smallFile)) {
        const content = readFileSync(smallFile, 'utf8');
        const reduction = Math.round((1 - content.length / complexXML.length) * 100);
        console.log(`     ${limit} elements: ${content.length} chars (${reduction}% reduction)`);
      }
    });
  });

  it('should demonstrate XSD → Small XML workflow using actual WordNet schema', async () => {
    // Create a WordNet-style XML (simulating a large XML file)
    const wordnetXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <Lexicon id="oewn" label="Open English WordNet" language="en" email="contact@globalwordnet.org" license="CC-BY-4.0" version="2023">
    <LexicalEntry id="entry1" pos="n">
      <Lemma writtenForm="test" partOfSpeech="n"/>
      <Sense id="sense1" synset="synset1"/>
    </LexicalEntry>
    <LexicalEntry id="entry2" pos="v">
      <Lemma writtenForm="run" partOfSpeech="v"/>
      <Sense id="sense2" synset="synset2"/>
    </LexicalEntry>
    <LexicalEntry id="entry3" pos="adj">
      <Lemma writtenForm="fast" partOfSpeech="adj"/>
      <Sense id="sense3" synset="synset3"/>
    </LexicalEntry>
    <Synset id="synset1" ili="i123">
      <Definition>A test or examination</Definition>
      <SynsetRelation relType="hypernym" target="synset4"/>
    </Synset>
    <Synset id="synset2" ili="i124">
      <Definition>To move swiftly on foot</Definition>
      <SynsetRelation relType="hypernym" target="synset5"/>
    </Synset>
    <Synset id="synset3" ili="i125">
      <Definition>Moving or capable of moving at high speed</Definition>
      <SynsetRelation relType="antonym" target="synset6"/>
    </Synset>
    <Synset id="synset4" ili="i126">
      <Definition>An evaluation</Definition>
    </Synset>
    <Synset id="synset5" ili="i127">
      <Definition>Movement</Definition>
    </Synset>
    <Synset id="synset6" ili="i128">
      <Definition>Moving slowly</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

    const wordnetXMLFile = createTestFile('wordnet-sample.xml', wordnetXML);
    console.log('📁 Created WordNet-style XML with', wordnetXML.split('<').length - 1, 'elements');

    // Step 1: Generate XSD from the WordNet XML
    console.log('\n🔄 Step 1: Generating XSD from WordNet XML...');
    const xsd = await introspector.generateXSDFromXML(wordnetXMLFile, {
      targetNamespace: 'https://globalwordnet.github.io/schemas/',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });

    const xsdFile = createTestFile('wordnet-generated-schema.xsd', xsd);
    console.log('✅ Generated XSD schema:', xsd.length, 'characters');
    
    // Verify the XSD contains expected WordNet elements (new format with types)
    expect(xsd).toContain('<xs:element name="LexicalResource" type="LexicalResourceType"/>');
    expect(xsd).toContain('<xs:element name="Lexicon" type="LexiconType"/>');
    expect(xsd).toContain('<xs:element name="LexicalEntry" type="LexicalEntryType"/>');
    expect(xsd).toContain('<xs:element name="Lemma" type="LemmaType"/>');
    expect(xsd).toContain('<xs:element name="Sense" type="SenseType"/>');
    expect(xsd).toContain('<xs:element name="Synset" type="SynsetType"/>');
    expect(xsd).toContain('<xs:element name="Definition" type="DefinitionType"/>');
    expect(xsd).toContain('<xs:element name="SynsetRelation" type="SynsetRelationType"/>');
    
    // Show a snippet of the generated XSD
    console.log('\n📄 Generated XSD Preview (first 500 chars):');
    console.log(xsd.substring(0, 500) + '...');

    // Step 2: Generate small XML from the generated XSD
    console.log('\n🔄 Step 2: Generating small XML from generated XSD...');
    const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
      maxElements: 5  // Generate a small sample
    });

    const smallXMLFile = createTestFile('wordnet-small.xml', smallXML);
    console.log('✅ Generated small XML:', smallXML.length, 'characters');
    
    // Show the generated small XML
    console.log('\n📄 Small XML generated from XSD:');
    console.log(smallXML);

    // Verify the small XML follows the WordNet structure
    expect(smallXML).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(smallXML).toContain('<LexicalResource>');
    expect(smallXML).toContain('</LexicalResource>');

    // Count elements to ensure it's small
    const elementCount = (smallXML.match(/<[^/][^>]*>/g) || []).length;
    console.log('\n🔢 Small XML contains', elementCount, 'opening tags');
    expect(elementCount).toBeLessThanOrEqual(10); // Should be small

    console.log('\n✅ WordNet XSD → Small XML workflow completed successfully!');
    console.log('📊 Summary:');
    console.log('   WordNet XML:', wordnetXML.length, 'characters');
    console.log('   Generated XSD:', xsd.length, 'characters');
    console.log('   Small XML:', smallXML.length, 'characters');
    console.log('   Element reduction:', Math.round((1 - smallXML.length / wordnetXML.length) * 100) + '%');
  });
});

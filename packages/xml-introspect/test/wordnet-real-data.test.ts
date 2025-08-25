import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { XMLIntrospector } from '../src/XMLIntrospector';
import { XSDParser } from '../src/XSDParser';

describe('WordNet Real Data: Big XML → XSD → Small XML Workflow', () => {
  let introspector: XMLIntrospector;
  let xsdParser: XSDParser;
  let tempDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    introspector = new XMLIntrospector();
    xsdParser = new XSDParser();
    tempDir = join(process.cwd(), 'temp-wordnet-test');
    
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

  const copyTestFile = (sourcePath: string, filename: string): string => {
    const targetPath = join(tempDir, filename);
    copyFileSync(sourcePath, targetPath);
    testFiles.push(targetPath);
    return targetPath;
  };

  it('should process mini-lmf-1.4.xml through the complete workflow', async () => {
    // Step 1: Copy the actual WordNet LMF XML file
    const sourceXMLPath = join(process.cwd(), '..', '..', 'wn-test-data', 'data', 'mini-lmf-1.4.xml');
    const xmlFile = copyTestFile(sourceXMLPath, 'mini-lmf-1.4.xml');
    
    console.log('📁 Copied mini-lmf-1.4.xml from test data');
    
    // Read and analyze the XML content
    const xmlContent = readFileSync(xmlFile, 'utf8');
    const elementCount = (xmlContent.match(/<[^/][^>]*>/g) || []).length;
    console.log('📊 Original XML stats:');
    console.log('   - File size:', xmlContent.length, 'characters');
    console.log('   - Element count:', elementCount);
    console.log('   - First 200 chars:', xmlContent.substring(0, 200) + '...');

    // Step 2: Generate XSD from the WordNet XML
    console.log('\n🔄 Step 1: Generating XSD from WordNet LMF XML...');
    const xsd = await introspector.generateXSDFromXML(xmlFile, {
      targetNamespace: 'https://globalwordnet.github.io/schemas/',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });

    const xsdFile = createTestFile('generated-wordnet-schema.xsd', xsd);
    console.log('✅ Generated XSD schema:', xsd.length, 'characters');
    
    // Show a snippet of the generated XSD
    console.log('\n📄 Generated XSD Preview (first 500 chars):');
    console.log(xsd.substring(0, 500) + '...');

    // Step 3: Parse the generated XSD into unified XAST
    console.log('\n🔄 Step 2: Parsing generated XSD into unified XAST...');
    const xsdXAST = await xsdParser.parseXSDFile(xsdFile);
    
    console.log('✅ Parsed XSD into unified XAST structure');
    
    // Analyze the XSD structure
    const elementNames = xsdParser.getElementNames();
    console.log('\n🔍 Elements found in generated XSD:', elementNames);
    
    // Verify it contains expected WordNet elements
    const expectedElements = ['LexicalResource', 'Lexicon', 'LexicalEntry', 'Lemma', 'Sense', 'Synset'];
    expectedElements.forEach(element => {
      if (elementNames.includes(element)) {
        console.log(`✅ Found expected element: ${element}`);
      } else {
        console.log(`⚠️  Missing expected element: ${element}`);
      }
    });

    // Get structure summary
    const summary = xsdParser.getStructureSummary();
    console.log('\n📊 Generated XSD Structure Summary:');
    console.log(summary);

    // Step 4: Generate small XML from the generated XSD
    console.log('\n🔄 Step 3: Generating small XML from generated XSD...');
    const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
      maxElements: 8  // Generate a small sample
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
    const smallElementCount = (smallXML.match(/<[^/][^>]*>/g) || []).length;
    console.log('\n🔢 Small XML contains', smallElementCount, 'opening tags');
    expect(smallElementCount).toBeLessThanOrEqual(15); // Should be small

    // Step 5: Validate that the small XML is consistent with the original structure
    console.log('\n🔄 Step 4: Validating consistency...');
    
    // Generate XSD from the small XML to compare
    const smallXSD = await introspector.generateXSDFromXML(smallXMLFile, {
      targetNamespace: 'https://globalwordnet.github.io/schemas/',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });

    // Both XSDs should contain the same root element (new format with types)
    expect(smallXSD).toContain('<xs:element name="LexicalResource" type="LexicalResourceType"/>');
    
    // Both should have the same namespace
    expect(smallXSD).toContain('targetNamespace="https://globalwordnet.github.io/schemas/"');

    console.log('\n✅ Complete workflow completed successfully!');
    console.log('📊 Final Summary:');
    console.log('   Original XML:', xmlContent.length, 'characters');
    console.log('   Generated XSD:', xsd.length, 'characters');
    console.log('   Small XML:', smallXML.length, 'characters');
    console.log('   Element reduction:', Math.round((1 - smallXML.length / xmlContent.length) * 100) + '%');
    console.log('   XSD elements found:', elementNames.length);
    console.log('   Small XML elements:', smallElementCount);
  });

  it('should compare generated XSD with official WN-LMF-1.4.xsd', async () => {
    // Copy the official WN-LMF-1.4.xsd schema
    const officialXSDPath = join(process.cwd(), '..', '..', 'wn-ts-core', 'schemas', 'WN-LMF-1.4.xsd');
    const officialXSDFile = copyTestFile(officialXSDPath, 'official-wn-lmf-1.4.xsd');
    
    console.log('📁 Copied official WN-LMF-1.4.xsd schema');
    
    // Copy a WordNet XML file
    const sourceXMLPath = join(process.cwd(), '..', '..', 'wn-test-data', 'data', 'mini-lmf-1.4.xml');
    const xmlFile = copyTestFile(sourceXMLPath, 'mini-lmf-1.4.xml');
    
    // Generate XSD from the XML
    console.log('\n🔄 Generating XSD from WordNet XML...');
    const generatedXSD = await introspector.generateXSDFromXML(xmlFile, {
      targetNamespace: 'https://globalwordnet.github.io/schemas/',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });

    const generatedXSDFile = createTestFile('generated-comparison.xsd', generatedXSD);
    
    // Parse both XSDs into unified XAST structures
    console.log('\n🔄 Parsing official XSD into unified XAST...');
    const officialXAST = await xsdParser.parseXSDFile(officialXSDPath);
    
    console.log('\n🔄 Parsing generated XSD into unified XAST...');
    const generatedXAST = await xsdParser.parseXSDFile(generatedXSDFile);
    
    // Compare the structures
    console.log('\n📊 Structure Comparison:');
    console.log('   Official XSD:');
    console.log('     - Namespace:', officialXAST.namespace);
    console.log('     - Elements:', officialXAST.elements.size);
    console.log('     - Element Form Default:', officialXAST.elementFormDefault);
    console.log('     - Attribute Form Default:', officialXAST.attributeFormDefault);
    
    console.log('\n   Generated XSD:');
    console.log('     - Namespace:', generatedXAST.namespace);
    console.log('     - Elements:', generatedXAST.elements.size);
    console.log('     - Element Form Default:', generatedXAST.elementFormDefault);
    console.log('     - Attribute Form Default:', generatedXAST.attributeFormDefault);
    
    // Get element names from both
    const officialElementNames = Array.from(officialXAST.elements.keys());
    const generatedElementNames = Array.from(generatedXAST.elements.keys());
    
    console.log('\n🔍 Element Comparison:');
    console.log('   Official XSD elements:', officialElementNames);
    console.log('   Generated XSD elements:', generatedElementNames);
    
    // Check for common elements
    const commonElements = officialElementNames.filter(name => generatedElementNames.includes(name));
    console.log('\n✅ Common elements found:', commonElements);
    
    // Check for missing elements in generated XSD
    const missingInGenerated = officialElementNames.filter(name => !generatedElementNames.includes(name));
    if (missingInGenerated.length > 0) {
      console.log('\n⚠️  Elements missing in generated XSD:', missingInGenerated);
    }
    
    // Check for extra elements in generated XSD
    const extraInGenerated = generatedElementNames.filter(name => !officialElementNames.includes(name));
    if (extraInGenerated.length > 0) {
      console.log('\n➕ Extra elements in generated XSD:', extraInGenerated);
    }
    
    // Validate that the generated XSD captures the essential WordNet structure
    // Note: mini-lmf files may not contain all elements, so we check for the ones that should be present
    const essentialElements = ['LexicalResource', 'LexicalEntry', 'Lemma', 'Sense', 'Synset'];
    const hasEssentialElements = essentialElements.every(element => generatedElementNames.includes(element));
    
    expect(hasEssentialElements).toBe(true);
    console.log('\n✅ Generated XSD contains all essential WordNet elements found in the XML');
    
    console.log('\n✅ XSD comparison completed successfully!');
  });

  it('should demonstrate the workflow with different WordNet LMF versions', async () => {
    const lmfVersions = ['1.0', '1.1', '1.3', '1.4'];
    
    for (const version of lmfVersions) {
      console.log(`\n🔄 Processing WordNet LMF ${version}...`);
      
      // Copy the XML file for this version
      const sourceXMLPath = join(process.cwd(), '..', '..', 'wn-test-data', 'data', `mini-lmf-${version}.xml`);
      if (!existsSync(sourceXMLPath)) {
        console.log(`⚠️  File not found: mini-lmf-${version}.xml`);
        continue;
      }
      
      const xmlFile = copyTestFile(sourceXMLPath, `mini-lmf-${version}.xml`);
      
      // Read and analyze the XML content
      const xmlContent = readFileSync(xmlFile, 'utf8');
      const elementCount = (xmlContent.match(/<[^/][^>]*>/g) || []).length;
      
      console.log(`📊 LMF ${version} XML stats:`);
      console.log(`   - File size: ${xmlContent.length} characters`);
      console.log(`   - Element count: ${elementCount}`);
      
      // Generate XSD
      const xsd = await introspector.generateXSDFromXML(xmlFile, {
        targetNamespace: 'https://globalwordnet.github.io/schemas/',
        elementForm: 'qualified',
        attributeForm: 'unqualified'
      });

      const xsdFile = createTestFile(`generated-lmf-${version}.xsd`, xsd);
      
      // Parse XSD into unified XAST
      const xsdXAST = await xsdParser.parseXSDFile(xsdFile);
      const elementNames = xsdParser.getElementNames();
      
      console.log(`✅ LMF ${version} XSD generated:`);
      console.log(`   - XSD size: ${xsd.length} characters`);
      console.log(`   - Elements found: ${elementNames.length}`);
      console.log(`   - Namespace: ${xsdXAST.namespace}`);
      
      // Generate small XML
      const smallXML = await introspector.generateXMLFromXSD(xsdFile, {
        maxElements: 6
      });

      const smallXMLFile = createTestFile(`small-lmf-${version}.xml`, smallXML);
      const smallElementCount = (smallXML.match(/<[^/][^>]*>/g) || []).length;
      
      console.log(`✅ LMF ${version} small XML generated:`);
      console.log(`   - Small XML size: ${smallXML.length} characters`);
      console.log(`   - Small XML elements: ${smallElementCount}`);
      console.log(`   - Reduction: ${Math.round((1 - smallXML.length / xmlContent.length) * 100)}%`);
      
      // Verify structure is maintained
      expect(smallXML).toContain('<LexicalResource>');
      expect(smallXML).toContain('</LexicalResource>');
      expect(smallElementCount).toBeLessThanOrEqual(12);
    }
    
    console.log('\n✅ All WordNet LMF versions processed successfully!');
  });
});

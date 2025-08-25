#!/usr/bin/env node

/**
 * XML Introspector Demo Script
 * 
 * This script demonstrates the core functionality of the XML Introspector:
 * - Task A: Generate XSD from XML
 * - Task B: Generate XML from XSD  
 * - Task C: XML → XAST → XML roundtrip
 * - Task D: Transform big XML to small XML
 * - Task E: Transform small XML to big XML
 */

import { XMLIntrospector } from '../src/XMLIntrospector.js';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

async function runDemo() {
  console.log('🚀 XML Introspector Demo\n');
  
  const introspector = new XMLIntrospector();
  const tempDir = join(process.cwd(), 'temp-demo');
  
  try {
    // Create sample WordNet LMF XML
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <GlobalInformation>
    <label>Demo WordNet</label>
    <dc:title>Demo Lexical Resource</dc:title>
  </GlobalInformation>
  <Lexicon id="demo" label="Demo Lexicon" language="en">
    <LexicalEntry id="entry1" pos="n">
      <Lemma writtenForm="example" partOfSpeech="n"/>
      <Sense id="sense1" synset="synset1"/>
    </LexicalEntry>
    <LexicalEntry id="entry2" pos="v">
      <Lemma writtenForm="demonstrate" partOfSpeech="v"/>
      <Sense id="sense2" synset="synset2"/>
    </LexicalEntry>
    <Synset id="synset1" ili="i123" partOfSpeech="n">
      <Definition>Something that serves as a pattern</Definition>
    </Synset>
    <Synset id="synset2" ili="i124" partOfSpeech="v">
      <Definition>To show or prove something clearly</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

    const inputFile = join(tempDir, 'demo-input.xml');
    writeFileSync(inputFile, sampleXML, 'utf8');
    console.log('✅ Created sample XML file');

    // Task A: Generate XSD from XML
    console.log('\n📋 Task A: Generating XSD from XML...');
    const xsd = await introspector.generateXSDFromXML(inputFile, {
      targetNamespace: 'http://demo.com/schema',
      elementForm: 'qualified',
      attributeForm: 'unqualified'
    });
    
    const xsdFile = join(tempDir, 'demo-schema.xsd');
    writeFileSync(xsdFile, xsd, 'utf8');
    console.log('✅ Generated XSD schema');

    // Task B: Generate XML from XSD
    console.log('\n📋 Task B: Generating XML from XSD...');
    const generatedXML = await introspector.generateXMLFromXSD(xsdFile, {
      maxElements: 20,
      generateRealisticData: true
    });
    
    const generatedFile = join(tempDir, 'generated.xml');
    writeFileSync(generatedFile, generatedXML, 'utf8');
    console.log('✅ Generated XML from XSD');

    // Task C: XML → XAST → XML roundtrip
    console.log('\n📋 Task C: XML → XAST → XML roundtrip...');
    const roundtripResult = await introspector.xmlToXASTToXML(inputFile);
    
    const roundtripFile = join(tempDir, 'roundtrip.xml');
    writeFileSync(roundtripFile, roundtripResult, 'utf8');
    console.log('✅ Completed XAST roundtrip');

    // Task D: Transform big XML to small XML
    console.log('\n📋 Task D: Transforming big XML to small XML...');
    const smallOutputFile = join(tempDir, 'small-sample.xml');
    
    await introspector.transformBigToSmall(inputFile, smallOutputFile, {
      inputFile,
      outputFile: smallOutputFile,
      maxElements: 3,
      preserveStructure: true
    });
    console.log('✅ Created small sample XML');

    // Task E: Transform small XML to big XML
    console.log('\n📋 Task E: Transforming small XML to big XML...');
    const expandedOutputFile = join(tempDir, 'expanded.xml');
    
    await introspector.transformSmallToBig(inputFile, expandedOutputFile, 100);
    console.log('✅ Created expanded XML');

    // Display results summary
    console.log('\n📊 Demo Results Summary:');
    console.log('========================');
    
    const files = [
      { name: 'Input XML', path: inputFile },
      { name: 'Generated XSD', path: xsdFile },
      { name: 'Generated XML', path: generatedFile },
      { name: 'XAST Roundtrip', path: roundtripFile },
      { name: 'Small Sample', path: smallOutputFile },
      { name: 'Expanded XML', path: expandedOutputFile }
    ];

    files.forEach(file => {
      try {
        const content = readFileSync(file.path, 'utf8');
        const lineCount = content.split('\n').length;
        const sizeKB = (content.length / 1024).toFixed(2);
        console.log(`  ${file.name}: ${lineCount} lines, ${sizeKB} KB`);
      } catch (error) {
        console.log(`  ${file.name}: Error reading file`);
      }
    });

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📁 Generated files are in the temp-demo directory');
    console.log('🧹 Run cleanup to remove temporary files');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempDir = join(process.cwd(), 'temp-demo');
  const files = [
    'demo-input.xml',
    'demo-schema.xsd', 
    'generated.xml',
    'roundtrip.xml',
    'small-sample.xml',
    'expanded.xml'
  ];

  files.forEach(file => {
    try {
      const filePath = join(tempDir, file);
      if (require('fs').existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`  ✅ Removed ${file}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not remove ${file}: ${error.message}`);
    }
  });

  console.log('✅ Cleanup completed');
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'cleanup' || command === 'clean') {
  cleanup();
} else if (command === 'demo' || !command) {
  runDemo();
} else {
  console.log('Usage: node test-demo.js [demo|cleanup]');
  console.log('  demo     - Run the demo (default)');
  console.log('  cleanup  - Remove temporary files');
  process.exit(1);
}

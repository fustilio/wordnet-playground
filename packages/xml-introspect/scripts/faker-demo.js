#!/usr/bin/env node

/**
 * XML Faker Generator Demo Script
 * 
 * This script demonstrates the enhanced XML generation capabilities using Faker.js:
 * - Realistic data generation based on element names
 * - XAST roundtrip using xast-util libraries
 * - Custom data generators
 * - Seeded generation for consistency
 */

import { XMLFakerGenerator } from '../src/XMLFakerGenerator.js';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

async function runFakerDemo() {
  console.log('🚀 XML Faker Generator Demo\n');
  
  const tempDir = join(process.cwd(), 'temp-faker-demo');
  
  try {
    // Demo 1: Basic realistic XML generation
    console.log('📋 Demo 1: Basic Realistic XML Generation');
    console.log('==========================================');
    
    const basicGenerator = new XMLFakerGenerator({
      seed: 42,
      maxDepth: 3,
      maxChildren: 5,
      realisticData: true
    });
    
    const basicXML = basicGenerator.generateSampleXML(10);
    const basicFile = join(tempDir, 'basic-realistic.xml');
    writeFileSync(basicFile, basicXML, 'utf8');
    console.log('✅ Generated basic realistic XML');
    
    // Demo 2: WordNet LMF specific generation
    console.log('\n📋 Demo 2: WordNet LMF Specific Generation');
    console.log('============================================');
    
    const lmfGenerator = new XMLFakerGenerator({
      seed: 123,
      maxDepth: 4,
      realisticData: true,
      customGenerators: {
        'lemma': () => `word_${Math.floor(Math.random() * 1000)}`,
        'synset': () => `synset_${Math.floor(Math.random() * 1000)}`,
        'partofspeech': () => ['n', 'v', 'a', 'r'][Math.floor(Math.random() * 4)]
      }
    });
    
    const lmfXML = lmfGenerator.generateSampleXML(15);
    const lmfFile = join(tempDir, 'lmf-realistic.xml');
    writeFileSync(lmfFile, lmfXML, 'utf8');
    console.log('✅ Generated WordNet LMF realistic XML');
    
    // Demo 3: XAST roundtrip with xast-util
    console.log('\n📋 Demo 3: XAST Roundtrip with xast-util');
    console.log('==========================================');
    
    const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <LexicalEntry id="entry1" pos="n">
    <Lemma writtenForm="test" partOfSpeech="n"/>
    <Sense id="sense1" synset="synset1"/>
  </LexicalEntry>
  <Synset id="synset1" ili="i123">
    <Definition>Test definition</Definition>
  </Synset>
</LexicalResource>`;
    
    const roundtripResult = await lmfGenerator.xmlToXASTToXML(testXML);
    const roundtripFile = join(tempDir, 'xast-roundtrip.xml');
    writeFileSync(roundtripFile, roundtripResult, 'utf8');
    console.log('✅ Completed XAST roundtrip');
    
    // Demo 4: XSD-based generation
    console.log('\n📋 Demo 4: XSD-based XML Generation');
    console.log('=====================================');
    
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
      <xs:attribute name="name" type="xs:string"/>
      <xs:attribute name="email" type="xs:string"/>
    </xs:complexType>
  </xs:element>
  <xs:element name="company">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
      <xs:attribute name="name" type="xs:string"/>
      <xs:attribute name="industry" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;
    
    const xsdFile = join(tempDir, 'demo-schema.xsd');
    writeFileSync(xsdFile, xsdContent, 'utf8');
    
    const generatedXML = lmfGenerator.generateXMLFromXSD(xsdContent, {
      seed: 456,
      realisticData: true
    });
    
    const generatedFile = join(tempDir, 'xsd-generated.xml');
    writeFileSync(generatedFile, generatedXML, 'utf8');
    console.log('✅ Generated XML from XSD schema');
    
    // Demo 5: Structure-based generation
    console.log('\n📋 Demo 5: Structure-based XML Generation');
    console.log('==========================================');
    
    const structure = {
      rootElement: 'LexicalResource',
      elementTypes: new Map([
        ['LexicalEntry', { 
          count: 5, 
          attributes: new Set(['id', 'pos', 'language']), 
          children: new Set(['Lemma', 'Sense']), 
          examples: [] 
        }],
        ['Synset', { 
          count: 3, 
          attributes: new Set(['id', 'ili', 'partOfSpeech']), 
          children: new Set(['Definition', 'Examples']), 
          examples: [] 
        }],
        ['Lemma', { 
          count: 5, 
          attributes: new Set(['writtenForm', 'partOfSpeech']), 
          children: new Set(), 
          examples: [] 
        }]
      ])
    };
    
    const structureXML = lmfGenerator.generateXMLFromStructure(structure, {
      seed: 789,
      realisticData: true
    });
    
    const structureFile = join(tempDir, 'structure-generated.xml');
    writeFileSync(structureFile, structureXML, 'utf8');
    console.log('✅ Generated XML from structure definition');
    
    // Demo 6: Seeded generation consistency
    console.log('\n📋 Demo 6: Seeded Generation Consistency');
    console.log('=========================================');
    
    const seed1 = 999;
    const generator1 = new XMLFakerGenerator({ seed: seed1 });
    const generator2 = new XMLFakerGenerator({ seed: seed1 });
    
    const value1 = generator1.generateRealisticData('name');
    const value2 = generator2.generateRealisticData('name');
    
    console.log(`Seed ${seed1} - Name 1: ${value1}`);
    console.log(`Seed ${seed1} - Name 2: ${value2}`);
    console.log(`Consistent: ${value1 === value2 ? '✅ Yes' : '❌ No'}`);
    
    // Demo 7: Custom generators
    console.log('\n📋 Demo 7: Custom Data Generators');
    console.log('==================================');
    
    const customGenerator = new XMLFakerGenerator({
      seed: 111,
      customGenerators: {
        'product_id': () => `PROD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        'sku': () => `SKU-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        'category': () => ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
        'status': () => ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)]
      }
    });
    
    const customXML = customGenerator.generateSampleXML(8);
    const customFile = join(tempDir, 'custom-generators.xml');
    writeFileSync(customFile, customXML, 'utf8');
    console.log('✅ Generated XML with custom data generators');
    
    // Display results summary
    console.log('\n📊 Faker Demo Results Summary:');
    console.log('===============================');
    
    const files = [
      { name: 'Basic Realistic', path: basicFile },
      { name: 'LMF Realistic', path: lmfFile },
      { name: 'XAST Roundtrip', path: roundtripFile },
      { name: 'XSD Generated', path: generatedFile },
      { name: 'Structure Generated', path: structureFile },
      { name: 'Custom Generators', path: customFile }
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

    console.log('\n🎉 Faker demo completed successfully!');
    console.log('\n📁 Generated files are in the temp-faker-demo directory');
    console.log('🧹 Run cleanup to remove temporary files');
    
    // Show some example content
    console.log('\n📝 Example Generated Content:');
    console.log('=============================');
    
    try {
      const basicContent = readFileSync(basicFile, 'utf8');
      const lines = basicContent.split('\n').slice(0, 10);
      console.log(lines.join('\n'));
      console.log('...');
    } catch (error) {
      console.log('Could not read example content');
    }

  } catch (error) {
    console.error('❌ Faker demo failed:', error.message);
    process.exit(1);
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempDir = join(process.cwd(), 'temp-faker-demo');
  const files = [
    'basic-realistic.xml',
    'lmf-realistic.xml',
    'xast-roundtrip.xml',
    'demo-schema.xsd',
    'xsd-generated.xml',
    'structure-generated.xml',
    'custom-generators.xml'
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
  runFakerDemo();
} else {
  console.log('Usage: node faker-demo.js [demo|cleanup]');
  console.log('  demo     - Run the Faker demo (default)');
  console.log('  cleanup  - Remove temporary files');
  process.exit(1);
}

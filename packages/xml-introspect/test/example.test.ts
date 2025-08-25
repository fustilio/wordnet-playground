import { describe, it, expect } from 'vitest';
import { XMLIntrospector } from '../src/XMLIntrospector';

describe('XML Introspector Example Usage', () => {
  it('should demonstrate basic functionality', async () => {
    console.log('🚀 Starting basic functionality test...');
    const introspector = new XMLIntrospector();
    console.log('✅ XMLIntrospector instance created');
    
    // Create a simple XML string for testing
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

    // Write to temporary file
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join(process.cwd(), 'temp-example.xml');
    
    try {
      console.log('📝 Writing temp file...');
      fs.writeFileSync(tempFile, xmlContent, 'utf8');
      console.log('✅ Temp file written');
      
      // Test Task A: Generate XSD from XML
      console.log('🔄 Generating XSD from XML...');
      const xsd = await introspector.generateXSDFromXML(tempFile);
      console.log('✅ XSD generated, length:', xsd.length);
      expect(xsd).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xsd).toContain('<xs:schema');
      expect(xsd).toContain('<xs:element name="LexicalResource" type="LexicalResourceType"/>');
      expect(xsd).toContain('<xs:element name="LexicalEntry" type="LexicalEntryType"/>');
      expect(xsd).toContain('<xs:element name="Synset" type="SynsetType"/>');
      
      // Test Task C: XML -> XAST -> XML roundtrip
      console.log('🔄 Testing XML -> XAST -> XML roundtrip...');
      const roundtripResult = await introspector.xmlToXASTToXML(tempFile);
      console.log('✅ Roundtrip completed, length:', roundtripResult.length);
      expect(roundtripResult).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(roundtripResult).toContain('<LexicalResource>');
      expect(roundtripResult).toContain('<LexicalEntry');
      expect(roundtripResult).toContain('id="entry1"');
      expect(roundtripResult).toContain('pos="n"');
      expect(roundtripResult).toContain('<Lemma');
      expect(roundtripResult).toContain('writtenForm="test"');
      expect(roundtripResult).toContain('</LexicalResource>');
      
      // Test Task D: Transform to small sample
      console.log('🔄 Testing big to small transformation...');
      const outputFile = path.join(process.cwd(), 'temp-sample.xml');
      await introspector.transformBigToSmall(tempFile, outputFile, {
        inputFile: tempFile,
        outputFile,
        maxElements: 2,
        preserveStructure: true
      });
      console.log('✅ Transformation completed');
      
      expect(fs.existsSync(outputFile)).toBe(true);
      const sampleContent = fs.readFileSync(outputFile, 'utf8');
      expect(sampleContent).toContain('<LexicalResource>');
      expect(sampleContent).toContain('</LexicalResource>');
      
      // Clean up
      fs.unlinkSync(outputFile);
      console.log('✅ Test completed successfully');
      
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log('🧹 Cleaned up temp file');
      }
    }
  });

  it('should handle WordNet LMF structure correctly', async () => {
    console.log('🚀 Starting WordNet LMF structure test...');
    const introspector = new XMLIntrospector();
    console.log('✅ XMLIntrospector instance created');
    
    // Create WordNet LMF-like XML
    const lmfXML = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource>
  <GlobalInformation>
    <label>Test WordNet</label>
    <dc:title>Test Lexical Resource</dc:title>
  </GlobalInformation>
  <Lexicon id="test" label="Test Lexicon" language="en">
    <LexicalEntry id="entry1" pos="n">
      <Lemma writtenForm="word" partOfSpeech="n"/>
      <Sense id="sense1" synset="synset1"/>
    </LexicalEntry>
    <Synset id="synset1" ili="i123" partOfSpeech="n">
      <Definition>Test word definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>`;

    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join(process.cwd(), 'temp-lmf.xml');
    
    try {
      console.log('📝 Writing LMF temp file...');
      fs.writeFileSync(tempFile, lmfXML, 'utf8');
      console.log('✅ LMF temp file written');
      
      // Analyze structure
      console.log('🔄 Analyzing XML structure...');
      const structure = await introspector.analyzeStructure(tempFile);
      console.log('✅ Structure analysis completed');
      
      expect(structure.rootElement).toBe('LexicalResource');
      expect(structure.elementTypes.has('GlobalInformation')).toBe(true);
      expect(structure.elementTypes.has('Lexicon')).toBe(true);
      expect(structure.elementTypes.has('LexicalEntry')).toBe(true);
      expect(structure.elementTypes.has('Synset')).toBe(true);
      expect(structure.elementTypes.has('Lemma')).toBe(true);
      expect(structure.elementTypes.has('Sense')).toBe(true);
      
      // Check attributes
      const entryInfo = structure.elementTypes.get('LexicalEntry')!;
      expect(entryInfo.attributes.has('id')).toBe(true);
      expect(entryInfo.attributes.has('pos')).toBe(true);
      
      // Check children relationships
      expect(entryInfo.children.has('Lemma')).toBe(true);
      expect(entryInfo.children.has('Sense')).toBe(true);
      
      console.log('✅ WordNet LMF test completed successfully');
      
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        console.log('🧹 Cleaned up LMF temp file');
      }
    }
  });
});

import pako from "pako";
import type { FormatProcessor } from "@fustilio/data-loader";

/**
 * Shared test utilities for wn-data-loader tests
 * This reduces duplication across test files
 */

/**
 * Compress data using pako for faster compression (matches our decompression method)
 * This ensures consistency between compression and decompression
 */
export function compressGzip(data: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const compressed = pako.gzip(dataBytes);
  return compressed.buffer;
}

/**
 * Generate WordNet-style XML data that compresses well and matches real-world usage
 * This creates a more realistic but compressible LexicalResource XML structure
 */
export function generateWordNetXmlData(sizeInBytes: number): string {
  const baseXml = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://globalwordnet.org/ns/2016/lexicalresource" version="1.0">
  <Lexicon id="oewn" label="Open English WordNet" language="en">
    <feat att="version" val="2024"/>
    <feat att="license" val="CC-BY-4.0"/>`;

  // Use a more compressible pattern with repeated content
  const entryTemplate = `
    <LexicalEntry id="oewn-{id}">
      <Lemma writtenForm="word{id}" partOfSpeech="n"/>
      <Sense id="oewn-{id}-sense-1" synset="oewn-{id}-synset-1">
        <Definition>This is a sample definition for word {id} in the Open English WordNet lexical resource. This definition contains repetitive text that compresses well and helps with testing large file scenarios.</Definition>
        <Example>This is an example sentence using word {id} in context. The sentence demonstrates typical usage patterns found in lexical resources.</Example>
        <Count>1</Count>
        <Frequency>0.001</Frequency>
        <Source>oewn</Source>
        <Status>active</Status>
        <Relation target="oewn-{id}-synset-1" relType="hyponym"/>
        <Relation target="oewn-{id}-synset-2" relType="hypernym"/>
        <Relation target="oewn-{id}-synset-3" relType="meronym"/>
        <Relation target="oewn-{id}-synset-4" relType="holonym"/>
      </Sense>
    </LexicalEntry>`;

  const closingXml = `
  </Lexicon>
</LexicalResource>`;

  // Calculate how many entries we need to reach the target size
  const baseSize = baseXml.length + closingXml.length;
  const entrySize = entryTemplate.length;
  const targetEntries = Math.max(1, Math.floor((sizeInBytes - baseSize) / entrySize));

  // Limit the number of entries to prevent excessive processing time
  const maxEntries = Math.min(targetEntries, 50000); // Cap at 50k entries

  let xml = baseXml;
  for (let i = 1; i <= maxEntries; i++) {
    xml += entryTemplate.replace(/\{id\}/g, i.toString());
  }
  xml += closingXml;

  return xml;
}

/**
 * Generate OEWN-like XML data for specific testing scenarios
 */
export function generateOewnLikeXmlData(sizeInBytes: number): string {
  const baseXml = `<?xml version="1.0" encoding="UTF-8"?>
<LexicalResource xmlns="http://globalwordnet.org/ns/2016/lemon/ontolex#" 
                 xmlns:dc="http://purl.org/dc/elements/1.1/" 
                 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
                 xmlns:wn="http://wordnet-rdf.princeton.edu/ontology#"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema#">
  <lexicon id="oewn-2024" language="en" label="English WordNet 2024">
    <dc:title>English WordNet 2024</dc:title>
    <dc:description>English WordNet 2024 with comprehensive lexical data</dc:description>`;
  
  const entryXml = `
    <lexicalEntry id="entry-{id}">
      <lemma id="lemma-{id}" writtenForm="word{id}" partOfSpeech="{pos}">
        <sense id="sense-{id}" synset="synset-{id}" senseNumber="1">
          <definition>Definition for word{id}</definition>
          <example>Example sentence for word{id}</example>
        </sense>
      </lemma>
    </lexicalEntry>`;
  
  const closingXml = `
  </lexicon>
</LexicalResource>`;
  
  const posOptions = ['n', 'v', 'a', 'r', 's'];
  
  let xml = baseXml;
  let currentSize = baseXml.length + closingXml.length;
  let entryId = 1;
  
  // Add entries until we reach the desired size
  while (currentSize < sizeInBytes) {
    const pos = posOptions[entryId % posOptions.length];
    const entry = entryXml.replace(/\{id\}/g, entryId.toString()).replace(/\{pos\}/g, pos);
    xml += entry;
    currentSize += entry.length;
    entryId++;
    
    // Prevent infinite loop
    if (entryId > 1000000) break;
  }
  
  xml += closingXml;
  
  return xml;
}

/**
 * Generate simple XML data for basic testing
 */
export function generateSimpleXmlData(sizeInBytes: number): string {
  const baseXml = `<?xml version="1.0"?><LexicalResource><lexicon id="test">`;
  const entryXml = `<lexicalEntry id="entry-{id}"><lemma id="lemma-{id}" writtenForm="word{id}"/></lexicalEntry>`;
  const closingXml = `</lexicon></LexicalResource>`;
  
  let xml = baseXml;
  let currentSize = baseXml.length + closingXml.length;
  let entryId = 1;
  
  while (currentSize < sizeInBytes) {
    const entry = entryXml.replace(/\{id\}/g, entryId.toString());
    xml += entry;
    currentSize += entry.length;
    entryId++;
    
    if (entryId > 100000) break; // Prevent infinite loop
  }
  
  xml += closingXml;
  return xml;
}

/**
 * Test WordNet processing with timing and validation
 */
export async function testWordNetProcessing(
  processor: FormatProcessor,
  data: ArrayBuffer, 
  projectId: string, 
  expectedMaxTime: number
) {
  const startTime = Date.now();
  
  try {
    const result = await processor.processData(data, {
      projectId: projectId,
      enableTarExtraction: true
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ WordNet processing completed in ${duration}ms`);
    
    return {
      result,
      duration,
      success: true
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ WordNet processing failed after ${duration}ms:`, error);
    
    return {
      result: null,
      duration,
      success: false,
      error
    };
  }
}

/**
 * Test file size categories for consistent testing
 */
export const FILE_SIZE_CATEGORIES = {
  SMALL: 80,                    // 80 bytes
  MEDIUM: 512 * 1024,          // 512KB
  LARGE: 2 * 1024 * 1024,      // 2MB
  VERY_LARGE: 5 * 1024 * 1024, // 5MB
  OEWN_LIKE: 8 * 1024 * 1024   // 8MB (simulating OEWN 2024)
} as const;

/**
 * Expected timeouts for different file sizes
 */
export const EXPECTED_TIMEOUTS = {
  SMALL: 1000,      // 1 second
  MEDIUM: 10000,    // 10 seconds
  LARGE: 30000,     // 30 seconds
  VERY_LARGE: 60000, // 1 minute
  OEWN_LIKE: 120000  // 2 minutes
} as const;

/**
 * Test timeout values for vitest
 */
export const TEST_TIMEOUTS = {
  SMALL: 5000,      // 5 seconds
  MEDIUM: 15000,    // 15 seconds
  LARGE: 45000,     // 45 seconds
  VERY_LARGE: 90000, // 1.5 minutes
  OEWN_LIKE: 150000  // 2.5 minutes
} as const;

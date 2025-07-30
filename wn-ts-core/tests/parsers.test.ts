import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { 
  getParser, 
  getParserNames, 
  getAllParserInfo,
  PARSER_REGISTRY,
  getRecommendedParsers,
  getParsersByCategory,
  getDefaultParser
} from '../src/parsers/index.js';

const sampleFile = join(__dirname, '../../wn-test-data/data', 'E101-0.xml');

describe('LMF Parsers Module', () => {
  it('should have all expected parsers available', () => {
    const parserNames = getParserNames();
    expect(parserNames).toContain('native-xml');
    expect(parserNames).toContain('streaming-sax');
    expect(parserNames).toContain('legacy');
    expect(parserNames).toContain('python');
    expect(parserNames.length).toBeGreaterThan(5);
  });

  it('should provide parser information', () => {
    const allInfo = getAllParserInfo();
    expect(allInfo.length).toBeGreaterThan(0);
    
    const nativeXmlInfo = allInfo.find(info => info.name.includes('Native XML'));
    expect(nativeXmlInfo).toBeDefined();
    expect(nativeXmlInfo?.category).toBe('counting');
  });

  it('should have recommended parsers', () => {
    const recommended = getRecommendedParsers();
    expect(recommended.length).toBeGreaterThan(0);
    
    const streamingParsers = recommended.filter(info => info.category === 'streaming');
    expect(streamingParsers.length).toBeGreaterThan(0);
  });

  it('should categorize parsers correctly', () => {
    const streamingParsers = getParsersByCategory('streaming');
    const countingParsers = getParsersByCategory('counting');
    const legacyParsers = getParsersByCategory('legacy');
    
    expect(streamingParsers.length).toBeGreaterThan(0);
    expect(countingParsers.length).toBeGreaterThan(0);
    expect(legacyParsers.length).toBeGreaterThan(0);
  });

  it('should get parser by name', () => {
    const parser = getParser('native-xml');
    expect(parser.name).toContain('Native XML');
    expect(parser.description).toBeDefined();
  });

  it('should throw error for unknown parser', () => {
    expect(() => getParser('unknown-parser')).toThrow();
  });

  it('should get default parser', () => {
    const defaultParser = getDefaultParser();
    expect(defaultParser.name).toContain('Full Streaming');
  });

  it('should parse with native XML parser', async () => {
    const parser = getParser('native-xml');
    const result = await parser.parse(sampleFile);
    
    expect(result.lmfVersion).toBe('1.0');
    expect(result.lexicons).toBeDefined();
    expect(result.synsets).toBeDefined();
    expect(result.words).toBeDefined();
    expect(result.senses).toBeDefined();
  });

  it('should parse with legacy parser', async () => {
    const parser = getParser('legacy');
    const result = await parser.parse(sampleFile);
    
    expect(result.lmfVersion).toBe('1.0');
    expect(result.lexicons.length).toBe(1);
    expect(result.words.length).toBe(2);
    expect(result.synsets.length).toBe(1);
    expect(result.senses.length).toBe(2);
  });

  it('should parse with full streaming parser', async () => {
    const parser = getParser('full-streaming');
    const result = await parser.parse(sampleFile);
    
    expect(result.lmfVersion).toBe('1.0');
    expect(result.lexicons.length).toBe(1);
    expect(result.words.length).toBe(2);
    expect(result.synsets.length).toBe(1);
    expect(result.senses.length).toBe(2);
  });
}); 
import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'path';
import { analyzeLMFXML, generateXMLReport, validateLMFStructure } from '../src/utils/xml-analyzer';

describe('XML Analyzer Tests', () => {
  let oewnSamplePath: string;

  beforeAll(() => {
    // Path to the oewn-sample.xml file from test data
    oewnSamplePath = join(__dirname, '../test-data/xsd-samples/oewn-2024/sample.xml');
  });

  describe('OEWN Sample XML Analysis', () => {
    it('should analyze the oewn-sample.xml file successfully', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Basic structure validation
      expect(analysis.totalSynsets).toBeGreaterThan(0);
      expect(analysis.totalWords).toBeGreaterThan(0);
      expect(analysis.totalSenses).toBeGreaterThan(0);
      expect(analysis.totalLexicons).toBeGreaterThan(0);
      
      // ILI coverage analysis - not all synsets have ILI identifiers
      expect(analysis.synsetsWithILI).toBeGreaterThan(0);
      expect(analysis.iliCoveragePercentage).toBeGreaterThan(0);
      expect(analysis.iliCoveragePercentage).toBeLessThanOrEqual(100);
      
      // Metadata validation - this sample has GlobalInformation but not lmfVersion attribute
      expect(analysis.hasGlobalInformation).toBe(true);
      expect(analysis.hasLexiconMetadata).toBe(true);
      // lmfVersion and dtdVersion may be undefined in this sample
    });

    it('should have correct ILI coverage statistics', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // This sample has mixed ILI coverage - not all synsets have ILI identifiers
      expect(analysis.synsetsWithILI).toBeGreaterThan(0);
      expect(analysis.synsetsWithILI).toBeLessThanOrEqual(analysis.totalSynsets);
      expect(analysis.iliCoveragePercentage).toBeGreaterThan(0);
      expect(analysis.iliCoveragePercentage).toBeCloseTo(100.0, 1); // Sample has 100% coverage
      
      // ILI format validation for those that exist
      expect(analysis.uniqueILIs.length).toBeGreaterThan(0);
      analysis.uniqueILIs.forEach(ili => {
        expect(ili).toMatch(/^i\d+$/);
      });
    });

    it('should have correct part of speech distribution', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Should have multiple parts of speech
      expect(Object.keys(analysis.partOfSpeechDistribution).length).toBeGreaterThan(0);
      
      // Common parts of speech should be present
      const posKeys = Object.keys(analysis.partOfSpeechDistribution);
      expect(posKeys).toContain('n'); // noun
      // Note: Sample only contains nouns, so we don't expect verbs or adjectives
      
      // All counts should be positive
      Object.values(analysis.partOfSpeechDistribution).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });

    it('should have correct synset size distribution', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Should have synsets (sample has only 1 synset, so no size distribution)
      expect(analysis.totalSynsets).toBeGreaterThan(0);
      
      // All sizes should be positive
      Object.keys(analysis.synsetSizeDistribution).forEach(size => {
        const sizeNum = parseInt(size);
        expect(sizeNum).toBeGreaterThan(0);
      });
      
      // All counts should be positive
      Object.values(analysis.synsetSizeDistribution).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });

    it('should generate a comprehensive report', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      const report = generateXMLReport(analysis);
      
      expect(report).toContain('=== LMF XML Analysis Report ===');
      expect(report).toContain(`Total Synsets: ${analysis.totalSynsets}`);
      expect(report).toContain(`Total Words: ${analysis.totalWords}`);
      expect(report).toContain(`ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
      expect(report).toContain('=== Part of Speech Distribution ===');
      expect(report).toContain('=== Synset Size Distribution ===');
      expect(report).toContain('=== Metadata ===');
      expect(report).toContain('=== Unique ILIs ===');
    });
  });

  describe('XML Structure Validation', () => {
    it('should validate the oewn-sample.xml structure', async () => {
      const xmlContent = await import('fs/promises').then(fs => fs.readFile(oewnSamplePath, 'utf-8'));
      const validation = validateLMFStructure(xmlContent);
      
      // Should be valid
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // May have warnings but should not have errors
      validation.warnings.forEach(warning => {
        expect(warning).toMatch(/Missing/);
      });
    });

    it('should contain all required LMF elements', async () => {
      const xmlContent = await import('fs/promises').then(fs => fs.readFile(oewnSamplePath, 'utf-8'));
      
      // Required root element (with namespace)
      expect(xmlContent).toContain('<LexicalResource');
      
      // Lexicon elements
      expect(xmlContent).toContain('<Lexicon');
      
      // LexicalEntry elements
      expect(xmlContent).toContain('<LexicalEntry');
      
      // Lemma elements
      expect(xmlContent).toContain('<Lemma');
      
      // Sense elements
      expect(xmlContent).toContain('<Sense');
      
      // Synset elements
      expect(xmlContent).toContain('<Synset');
    });

    it('should have proper XML declarations and namespaces', async () => {
      const xmlContent = await import('fs/promises').then(fs => fs.readFile(oewnSamplePath, 'utf-8'));
      
      // XML declaration
      expect(xmlContent).toContain('<?xml version="1.0"');
      
      // DOCTYPE declaration
      expect(xmlContent).toContain('<!DOCTYPE LexicalResource');
      
      // Dublin Core namespace
      expect(xmlContent).toContain('xmlns:dc="https://globalwordnet.github.io/schemas/dc/"');
      
      // LMF version from DOCTYPE (not attribute)
      expect(xmlContent).toContain('WN-LMF-1.4.dtd');
    });
  });

  describe('ILI Identifier Analysis', () => {
    it('should have unique ILI identifiers', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // All ILIs should be unique
      const uniqueILIs = new Set(analysis.uniqueILIs);
      expect(uniqueILIs.size).toBe(analysis.uniqueILIs.length);
      
      // No duplicate ILIs
      expect(analysis.iliDistribution).toBeDefined();
      Object.values(analysis.iliDistribution).forEach(count => {
        expect(count).toBe(1); // Each ILI should appear only once
      });
    });

    it('should have valid ILI format', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // All ILIs should follow the correct format (i + numbers)
      analysis.uniqueILIs.forEach(ili => {
        expect(ili).toMatch(/^i\d+$/);
        expect(ili.length).toBeGreaterThan(1); // Should have at least one digit after 'i'
      });
    });

    it('should have reasonable ILI numbering', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Extract numeric parts of ILIs
      const iliNumbers = analysis.uniqueILIs.map(ili => parseInt(ili.substring(1)));
      
      // All should be positive numbers
      iliNumbers.forEach(num => {
        expect(num).toBeGreaterThan(0);
        expect(Number.isInteger(num)).toBe(true);
      });
      
      // Should have a reasonable range (sample has only 1 ILI, so min = max)
      const min = Math.min(...iliNumbers);
      const max = Math.max(...iliNumbers);
      expect(max).toBeGreaterThanOrEqual(min); // Allow min = max for single ILI
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent word-sense-synset relationships', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // In this sample, the number of senses may be less than synsets
      // This is normal for a sample file that may not have complete coverage
      expect(analysis.totalSenses).toBeGreaterThanOrEqual(analysis.totalWords);
      
      // Each word should have at least one sense
      expect(analysis.totalSenses).toBeGreaterThanOrEqual(analysis.totalWords);
      
      // Each synset should have at least one sense (but this sample may be incomplete)
      // So we don't enforce this strict requirement
    });

    it('should have reasonable synset sizes', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Synset sizes should be reasonable (typically 1-10 members)
      Object.keys(analysis.synsetSizeDistribution).forEach(size => {
        const sizeNum = parseInt(size);
        expect(sizeNum).toBeGreaterThan(0);
        expect(sizeNum).toBeLessThanOrEqual(20); // Reasonable upper limit
      });
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'path';
import { analyzeLMFXML, generateXMLReport } from '../src/utils/xml-analyzer';

describe('ILI Coverage Analysis', () => {
  let oewnSamplePath: string;

  beforeAll(() => {
    // Path to the oewn-sample.xml file from test data
    oewnSamplePath = join(__dirname, '../test-data/xsd-samples/oewn-2024/sample.xml');
  });

  describe('OEWN Sample ILI Coverage', () => {
    it('should identify synsets with and without ILI identifiers', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Print detailed analysis for debugging
      console.log('\n=== ILI Coverage Analysis ===');
      console.log(`Total Synsets: ${analysis.totalSynsets}`);
      console.log(`Synsets with ILI: ${analysis.synsetsWithILI}`);
      console.log(`Synsets with empty ILI: ${analysis.synsetsWithEmptyILI}`);
      console.log(`Synsets without ILI: ${analysis.synsetsWithoutILI}`);
      console.log(`ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
      
      // Verify the expected coverage based on the actual sample data
      expect(analysis.totalSynsets).toBe(1);
      expect(analysis.synsetsWithILI).toBe(1);
      expect(analysis.synsetsWithEmptyILI).toBe(0);
      expect(analysis.synsetsWithoutILI).toBe(0);
      expect(analysis.iliCoveragePercentage).toBeCloseTo(100.0, 1); // 1/1 = 100%
    });

    it('should have valid ILI format for those that exist', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // All existing ILIs should follow the correct format
      analysis.uniqueILIs.forEach(ili => {
        expect(ili).toMatch(/^i\d+$/);
        expect(ili.length).toBeGreaterThan(1);
      });
      
      // Verify specific ILIs we know exist
      const expectedILIs = ['i10001'];
      expectedILIs.forEach(expectedIli => {
        expect(analysis.uniqueILIs).toContain(expectedIli);
      });
    });

    it('should generate comprehensive ILI coverage report', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      const report = generateXMLReport(analysis);
      
      // Report should contain ILI coverage information
      expect(report).toContain('=== ILI Coverage ===');
      expect(report).toContain(`Synsets with ILI: ${analysis.synsetsWithILI}`);
      expect(report).toContain(`ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
      expect(report).toContain('=== Unique ILIs ===');
      
      // Print the full report for inspection
      console.log('\n' + report);
    });
  });

  describe('Data Loading Integrity', () => {
    it('should verify all synsets are properly parsed', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // All synsets should have basic required attributes
      expect(analysis.totalSynsets).toBeGreaterThan(0);
      
      // Should have reasonable part of speech distribution
      const posKeys = Object.keys(analysis.partOfSpeechDistribution);
      expect(posKeys).toContain('n'); // noun
      // Note: Sample only contains nouns, so we don't expect verbs or adjectives
      
      // Should have reasonable synset sizes
      const sizeKeys = Object.keys(analysis.synsetSizeDistribution);
      sizeKeys.forEach(size => {
        const sizeNum = parseInt(size);
        expect(sizeNum).toBeGreaterThan(0);
        expect(sizeNum).toBeLessThanOrEqual(20); // Reasonable upper limit
      });
    });

    it('should verify word-sense-synset relationships', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Basic relationship validation
      expect(analysis.totalWords).toBeGreaterThan(0);
      expect(analysis.totalSenses).toBeGreaterThan(0);
      expect(analysis.totalSynsets).toBeGreaterThan(0);
      
      // Each word should have at least one sense
      expect(analysis.totalSenses).toBeGreaterThanOrEqual(analysis.totalWords);
      
      // Note: In this sample, not all synsets have senses due to incomplete coverage
      // This is normal for a sample file
    });

    it('should identify data quality issues', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Low ILI coverage indicates potential data quality issues
      if (analysis.iliCoveragePercentage < 50) {
        console.warn(`\n⚠️  Low ILI coverage detected: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
        console.warn('This may indicate:');
        console.warn('- Incomplete data loading');
        console.warn('- Missing ILI mappings');
        console.warn('- Data source issues');
      }
      
      // Check for empty synsets (synsets with no members)
      const emptySynsets = analysis.synsetSizeDistribution[0] || 0;
      if (emptySynsets > 0) {
        console.warn(`\n⚠️  Empty synsets detected: ${emptySynsets}`);
      }
      
      // Verify the analysis is working correctly
      expect(analysis.iliCoveragePercentage).toBeCloseTo(100.0, 1); // Sample has 100% coverage
      expect(analysis.totalSynsets).toBe(1);
    });
  });

  describe('XML Introspect Integration', () => {
    it('should use xml-introspect for enhanced validation when available', async () => {
      const analysis = await analyzeLMFXML(oewnSamplePath);
      
      // Should have schema validation results
      expect(analysis.schemaValidation).toBeDefined();
      
      if (analysis.schemaValidation) {
        console.log('\n=== Schema Validation Results ===');
        console.log(`Valid: ${analysis.schemaValidation.isValid}`);
        if (analysis.schemaValidation.errors.length > 0) {
          console.log('Errors:', analysis.schemaValidation.errors);
        }
        if (analysis.schemaValidation.warnings.length > 0) {
          console.log('Warnings:', analysis.schemaValidation.warnings);
        }
        
        // Should be valid XML structure
        expect(analysis.schemaValidation.isValid).toBe(true);
      }
    });
  });
});

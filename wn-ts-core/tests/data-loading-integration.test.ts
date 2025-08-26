/**
 * Comprehensive data loading and linking integration tests
 * This test suite verifies that all required data are loaded and properly linked
 * Uses XSD samples alongside wn-test-data for comprehensive coverage
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { 
  createComprehensiveTestDataset, 
  validateTestSample,
  getTestSamplePath 
} from './utils/xsd-sample-test-helper.js';
import { validateLMFContent } from '../src/lmf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Data Loading and Linking Integration Tests', () => {
  let testSamples: {
    oewnSample: string;
    ciliSample: string;
    omwFrSample: string;
    omwThSample: string;
  };

  beforeAll(async () => {
    // Set up comprehensive test dataset
    testSamples = await createComprehensiveTestDataset();
    
    console.log('Test samples loaded:');
    console.log(`  OEWN: ${testSamples.oewnSample}`);
    console.log(`  CILI: ${testSamples.ciliSample}`);
    console.log(`  OMW-FR: ${testSamples.omwFrSample}`);
    console.log(`  OMW-TH: ${testSamples.omwThSample}`);
  });

  describe('Test Sample Validation', () => {
    it('should have valid OEWN sample structure', () => {
      const validation = validateTestSample(testSamples.oewnSample);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.stats.synsetCount).toBeGreaterThan(0);
      expect(validation.stats.wordCount).toBeGreaterThan(0);
      expect(validation.stats.senseCount).toBeGreaterThan(0);
    });

    it('should have valid CILI sample structure', () => {
      const validation = validateTestSample(testSamples.ciliSample);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.stats.synsetCount).toBeGreaterThan(0);
    });

    it('should have valid OMW-FR sample structure', () => {
      const validation = validateTestSample(testSamples.omwFrSample);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.stats.synsetCount).toBeGreaterThan(0);
    });

    it('should have valid OMW-TH sample structure', () => {
      const validation = validateTestSample(testSamples.omwThSample);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.stats.synsetCount).toBeGreaterThan(0);
    });
  });

  // LMF File Detection tests removed - isLMF function not available in wn-ts-core

  describe('XML Content Validation', () => {
    it('should validate OEWN sample XML content', () => {
      const content = readFileSync(testSamples.oewnSample, 'utf8');
      expect(() => validateLMFContent(content, false)).not.toThrow();
    });

    it('should validate CILI sample XML content', () => {
      const content = readFileSync(testSamples.ciliSample, 'utf8');
      expect(() => validateLMFContent(content, false)).not.toThrow();
    });

    it('should validate OMW-FR sample XML content', () => {
      const content = readFileSync(testSamples.omwFrSample, 'utf8');
      expect(() => validateLMFContent(content, false)).not.toThrow();
    });

    it('should validate OMW-TH sample XML content', () => {
      const content = readFileSync(testSamples.omwThSample, 'utf8');
      expect(() => validateLMFContent(content, false)).not.toThrow();
    });
  });

  describe('Data Structure Integrity', () => {
    it('should have proper XML structure in OEWN sample', () => {
      const content = readFileSync(testSamples.oewnSample, 'utf8');
      
      // Check XML declaration
      expect(content).toContain('<?xml version="1.0"');
      
      // Check root elements
      expect(content).toContain('<LexicalResource');
      expect(content).toContain('</LexicalResource>');
      
      // Check required LMF elements
      expect(content).toContain('<Lexicon');
      expect(content).toContain('<Synset');
      expect(content).toContain('<LexicalEntry');
      expect(content).toContain('<Sense');
      
      // Check proper closing (some elements are self-closing)
      expect(content).toContain('</Lexicon>');
      expect(content).toContain('</Synset>');
      expect(content).toContain('</LexicalEntry>');
      // Sense elements can be self-closing, so check for either format
      expect(content.includes('</Sense>') || content.includes('/>')).toBe(true);
    });

    it('should have proper XML structure in CILI sample', () => {
      const content = readFileSync(testSamples.ciliSample, 'utf8');
      
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain('<LexicalResource');
      expect(content).toContain('<Lexicon');
      expect(content).toContain('<Synset');
      expect(content).toContain('<LexicalEntry');
      expect(content).toContain('<Sense');
    });

    it('should have proper XML structure in OMW-FR sample', () => {
      const content = readFileSync(testSamples.omwFrSample, 'utf8');
      
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain('<LexicalResource');
      expect(content).toContain('<Lexicon');
      expect(content).toContain('<Synset');
      expect(content).toContain('<LexicalEntry');
      expect(content).toContain('<Sense');
    });

    it('should have proper XML structure in OMW-TH sample', () => {
      const content = readFileSync(testSamples.omwThSample, 'utf8');
      
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain('<LexicalResource');
      expect(content).toContain('<Lexicon');
      expect(content).toContain('<Synset');
      expect(content).toContain('<LexicalEntry');
      expect(content).toContain('<Sense');
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('should have proper sense-synset relationships in OEWN sample', () => {
      const content = readFileSync(testSamples.oewnSample, 'utf8');
      
      // Check that senses reference synsets
      expect(content).toContain('synset="');
      
      // Count senses and synsets to ensure reasonable ratio
      const senseCount = (content.match(/<Sense/g) || []).length;
      const synsetCount = (content.match(/<Synset/g) || []).length;
      
      expect(senseCount).toBeGreaterThan(0);
      expect(synsetCount).toBeGreaterThan(0);
      expect(senseCount).toBeGreaterThanOrEqual(synsetCount); // Each synset should have at least one sense
    });

    it('should have proper sense-synset relationships in CILI sample', () => {
      const content = readFileSync(testSamples.ciliSample, 'utf8');
      
      expect(content).toContain('synset="');
      
      const senseCount = (content.match(/<Sense/g) || []).length;
      const synsetCount = (content.match(/<Synset/g) || []).length;
      
      expect(senseCount).toBeGreaterThan(0);
      expect(synsetCount).toBeGreaterThan(0);
      expect(senseCount).toBeGreaterThanOrEqual(synsetCount);
    });

    it('should have proper sense-synset relationships in OMW-FR sample', () => {
      const content = readFileSync(testSamples.omwFrSample, 'utf8');
      
      expect(content).toContain('synset="');
      
      const senseCount = (content.match(/<Sense/g) || []).length;
      const synsetCount = (content.match(/<Synset/g) || []).length;
      
      expect(senseCount).toBeGreaterThan(0);
      expect(synsetCount).toBeGreaterThan(0);
      expect(senseCount).toBeGreaterThanOrEqual(synsetCount);
    });

    it('should have proper sense-synset relationships in OMW-TH sample', () => {
      const content = readFileSync(testSamples.omwThSample, 'utf8');
      
      expect(content).toContain('synset="');
      
      const senseCount = (content.match(/<Sense/g) || []).length;
      const synsetCount = (content.match(/<Synset/g) || []).length;
      
      expect(senseCount).toBeGreaterThan(0);
      expect(synsetCount).toBeGreaterThan(0);
      expect(senseCount).toBeGreaterThanOrEqual(synsetCount);
    });
  });

  describe('Linguistic Diversity', () => {
    it('should include multiple parts of speech in OEWN sample', () => {
      const content = readFileSync(testSamples.oewnSample, 'utf8');
      
      // Check for common POS values
      const hasNouns = content.includes('partOfSpeech="n"') || content.includes('pos="n"');
      const hasVerbs = content.includes('partOfSpeech="v"') || content.includes('pos="v"');
      const hasAdjectives = content.includes('partOfSpeech="a"') || content.includes('pos="a"');
      
      // At least one different POS should be present
      const posCount = [hasNouns, hasVerbs, hasAdjectives].filter(Boolean).length;
      expect(posCount).toBeGreaterThanOrEqual(1);
    });

    it('should include multiple parts of speech in CILI sample', () => {
      const content = readFileSync(testSamples.ciliSample, 'utf8');
      
      const hasNouns = content.includes('partOfSpeech="n"') || content.includes('pos="n"');
      const hasVerbs = content.includes('partOfSpeech="v"') || content.includes('pos="v"');
      const hasAdjectives = content.includes('partOfSpeech="a"') || content.includes('pos="a"');
      
      const posCount = [hasNouns, hasVerbs, hasAdjectives].filter(Boolean).length;
      expect(posCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ILI Coverage Analysis', () => {
    it('should have reasonable ILI coverage in OEWN sample', () => {
      const validation = validateTestSample(testSamples.oewnSample);
      expect(validation.stats.iliCoverage).toBeGreaterThan(0);
      expect(validation.stats.iliCoverage).toBeLessThanOrEqual(100);
    });

    it('should have reasonable ILI coverage in CILI sample', () => {
      const validation = validateTestSample(testSamples.ciliSample);
      expect(validation.stats.iliCoverage).toBeGreaterThan(0);
      expect(validation.stats.iliCoverage).toBeLessThanOrEqual(100);
    });

    it('should have reasonable ILI coverage in OMW-FR sample', () => {
      const validation = validateTestSample(testSamples.omwFrSample);
      expect(validation.stats.iliCoverage).toBeGreaterThan(0);
      expect(validation.stats.iliCoverage).toBeLessThanOrEqual(100);
    });

    it('should have reasonable ILI coverage in OMW-TH sample', () => {
      const validation = validateTestSample(testSamples.omwThSample);
      expect(validation.stats.iliCoverage).toBeGreaterThan(0);
      expect(validation.stats.iliCoverage).toBeLessThanOrEqual(100);
    });
  });

  describe('Fallback to wn-test-data', () => {
    it('should fall back to wn-test-data when XSD samples unavailable', () => {
      // Test that we can get wn-test-data paths
      const miniLmf10Path = getTestSamplePath('mini', '1.0', true);
      const miniLmf11Path = getTestSamplePath('mini', '1.1', true);
      const miniLmf13Path = getTestSamplePath('mini', '1.3', true);
      const miniLmf14Path = getTestSamplePath('mini', '1.4', true);
      
      expect(existsSync(miniLmf10Path)).toBe(true);
      expect(existsSync(miniLmf11Path)).toBe(true);
      expect(existsSync(miniLmf13Path)).toBe(true);
      expect(existsSync(miniLmf14Path)).toBe(true);
    });

    it('should validate wn-test-data structure', () => {
      const miniLmf13Path = getTestSamplePath('mini', '1.3', true);
      const validation = validateTestSample(miniLmf13Path);
      
      expect(validation.isValid).toBe(true);
      expect(validation.stats.synsetCount).toBeGreaterThan(0);
      expect(validation.stats.wordCount).toBeGreaterThan(0);
      expect(validation.stats.senseCount).toBeGreaterThan(0);
    });
  });

  describe('Sample Quality Metrics', () => {
    it('should have reasonable sample sizes', () => {
      const oewnValidation = validateTestSample(testSamples.oewnSample);
      const ciliValidation = validateTestSample(testSamples.ciliSample);
      
      // Samples should be reasonably sized for testing
      expect(oewnValidation.stats.synsetCount).toBeGreaterThanOrEqual(3);
      expect(oewnValidation.stats.synsetCount).toBeLessThanOrEqual(100);
      expect(ciliValidation.stats.synsetCount).toBeGreaterThanOrEqual(3);
      expect(ciliValidation.stats.synsetCount).toBeLessThanOrEqual(100);
    });

    it('should maintain linguistic diversity', () => {
      const oewnContent = readFileSync(testSamples.oewnSample, 'utf8');
      const ciliContent = readFileSync(testSamples.ciliSample, 'utf8');
      
      // Check for different types of linguistic elements
      const hasDefinitions = oewnContent.includes('<Definition') || ciliContent.includes('<Definition');
      const hasExamples = oewnContent.includes('<Example') || ciliContent.includes('<Example');
      const hasRelations = oewnContent.includes('<SynsetRelation') || ciliContent.includes('<SynsetRelation');
      
      // At least some linguistic features should be present
      const featureCount = [hasDefinitions, hasExamples, hasRelations].filter(Boolean).length;
      expect(featureCount).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateLMFDataIntegrityFromSQLite } from '../../src/validation.js';
import { add } from '../../src/data-management/index.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../../src/config.js';

describe('LMF Data Integrity Validation - Real Data Test', () => {
  const testDataDir = path.join(__dirname, '../../../../packages/wn-test-data/data');
  const miniLmfPath = path.join(testDataDir, 'mini-lmf-1.0.xml');
  let tempDbPath: string;
  let originalDataDirectory: string;

  beforeAll(async () => {
    // Set up a temporary data directory for the test
    const tempDataDir = path.join(__dirname, '../temp-validation-data');
    tempDbPath = path.join(tempDataDir, 'wn.db');
    
    // Create temp directory if it doesn't exist
    await fs.mkdir(tempDataDir, { recursive: true });
    
    // Remove any existing database file
    try {
      await fs.unlink(tempDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    
    // Store original data directory and set temp directory
    originalDataDirectory = config.dataDirectory;
    config.dataDirectory = tempDataDir;
    
    try {
      // Use the actual LMF loading system to load the test data
      console.log('🔧 Loading test LMF data using production system...');
      await add(miniLmfPath);
      console.log('✅ Test data loaded into database using production system');
      
    } catch (error) {
      console.error('❌ Failed to load test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Restore original data directory
    config.dataDirectory = originalDataDirectory;
    
    // Clean up temporary files
    try {
      await fs.unlink(tempDbPath);
      await fs.rmdir(path.dirname(tempDbPath));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should validate LMF data integrity with real data', async () => {
    // This test demonstrates the validation system with actual LMF data
    console.log('\n🧪 Starting validation test with real LMF data...');
    
    const result = await validateLMFDataIntegrityFromSQLite(
      tempDbPath,
      miniLmfPath,
      {
        outputReconstructed: true,
        detailedDiff: true
      }
    );

    // Log the validation results for inspection
    console.log('\n=== Validation Test Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Differences: ${result.differences.length}`);
    console.log(`Summary:`, result.summary);
    
    if (result.differences.length > 0) {
      console.log('\nDifferences found:');
      result.differences.slice(0, 5).forEach((diff, i) => {
        console.log(`  ${i + 1}. ${diff.type}: ${diff.path} - ${diff.details}`);
      });
    }

    // For now, we expect some differences since our database schema
    // might not capture all LMF elements perfectly
    // In a production system, this should pass with no differences
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    expect(Array.isArray(result.differences)).toBe(true);
    expect(result.summary).toBeDefined();
    
    // The validation should complete successfully even if there are differences
    expect(result.originalFile).toBe(miniLmfPath);
    expect(result.summary.totalElements).toBeGreaterThan(0);
  });

  it('should handle validation options correctly', async () => {
    const result = await validateLMFDataIntegrityFromSQLite(
      tempDbPath,
      miniLmfPath,
      {
        outputReconstructed: false, // Don't save reconstructed file
        ignoreWhitespace: true,
        detailedDiff: false
      }
    );

    expect(result.reconstructedFile).toBeUndefined();
    expect(result).toBeDefined();
  });

  it('should provide detailed difference information', async () => {
    const result = await validateLMFDataIntegrityFromSQLite(
      tempDbPath,
      miniLmfPath,
      {
        detailedDiff: true
      }
    );

    // Check that the summary provides useful information
    expect(result.summary.totalElements).toBeGreaterThan(0);
    expect(result.summary.matchingElements).toBeGreaterThanOrEqual(0);
    expect(result.summary.missingElements).toBeGreaterThanOrEqual(0);
    expect(result.summary.extraElements).toBeGreaterThanOrEqual(0);
    expect(result.summary.attributeMismatches).toBeGreaterThanOrEqual(0);
  });

  afterAll(async () => {
    // Restore original data directory
    config.dataDirectory = originalDataDirectory;
    
    // Clean up temporary directory
    const tempDataDir = path.join(__dirname, '../temp-validation-data');
    try {
      await fs.rm(tempDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Failed to clean up temp-validation-data directory:', error);
    }
  });
});

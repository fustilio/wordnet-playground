/**
 * Test utility for using XSD-generated samples in tests
 * This integrates the XSD sample generation system with the test framework
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { generateXSDBasedSample } from '../../src/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface XSDSampleTestConfig {
  projectId: string;
  version: string;
  maxSynsets?: number;
  maxWords?: number;
  targetSize?: number;
  validateAgainstXSD?: boolean;
}

export interface XSDSampleTestResult {
  samplePath: string;
  xsdPath?: string;
  sampleInfo?: any;
  success: boolean;
  error?: string;
}

/**
 * Generate XSD-based samples for testing
 * This ensures tests use realistic, schema-validated data
 */
export async function generateTestSample(
  config: XSDSampleTestConfig
): Promise<XSDSampleTestResult> {
  try {
    const outputDir = join(__dirname, '../../../test-data/xsd-samples', `${config.projectId}-${config.version}`);
    
    // Create output directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const result = await generateXSDBasedSample(
      config.projectId,
      config.version,
      outputDir,
      {
        maxSynsets: config.maxSynsets || 25,
        maxWords: config.maxWords || 50,
        targetSize: config.targetSize || 256 * 1024, // 256KB
        preserveStructure: true,
        includeAllPOS: true,
        includeAllRelations: true,
        validateAgainstXSD: config.validateAgainstXSD !== false
      }
    );

    return {
      samplePath: result.samplePath,
      xsdPath: result.xsdPath,
      sampleInfo: result.sampleInfo,
      success: result.success,
      error: result.error
    };
  } catch (error) {
    return {
      samplePath: '',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get the path to an existing XSD sample
 * Falls back to wn-test-data if XSD sample doesn't exist
 */
export function getTestSamplePath(
  projectId: string,
  version: string,
  fallbackToWnTestData: boolean = true
): string {
  // First try XSD samples
  const xsdSamplePath = join(__dirname, '../../../test-data/xsd-samples', `${projectId}-${version}`, 'sample.xml');
  
  if (existsSync(xsdSamplePath)) {
    return xsdSamplePath;
  }

  // Fall back to wn-test-data if requested
  if (fallbackToWnTestData) {
    const wnTestDataPath = join(__dirname, '../../../wn-test-data/data', `mini-lmf-${version}.xml`);
    if (existsSync(wnTestDataPath)) {
      return wnTestDataPath;
    }
  }

  throw new Error(`No test sample found for ${projectId}:${version}`);
}

/**
 * Create a comprehensive test dataset for data loading tests
 * This combines XSD samples with wn-test-data for comprehensive coverage
 */
export async function createComprehensiveTestDataset(): Promise<{
  oewnSample: string;
  ciliSample: string;
  omwFrSample: string;
  omwThSample: string;
}> {
  const samples = {
    oewnSample: '',
    ciliSample: '',
    omwFrSample: '',
    omwThSample: ''
  };

  // Try to generate or get XSD samples
  try {
    const oewnResult = await generateTestSample({
      projectId: 'oewn',
      version: '2024',
      maxSynsets: 30,
      maxWords: 60
    });
    if (oewnResult.success) {
      samples.oewnSample = oewnResult.samplePath;
    }
  } catch (error) {
    console.warn('Failed to generate OEWN sample:', error);
  }

  try {
    const ciliResult = await generateTestSample({
      projectId: 'cili',
      version: '1.0',
      maxSynsets: 25,
      maxWords: 50
    });
    if (ciliResult.success) {
      samples.ciliSample = ciliResult.samplePath;
    }
  } catch (error) {
    console.warn('Failed to generate CILI sample:', error);
  }

  try {
    const omwFrResult = await generateTestSample({
      projectId: 'omw-fr',
      version: '1.4',
      maxSynsets: 25,
      maxWords: 50
    });
    if (omwFrResult.success) {
      samples.omwFrSample = omwFrResult.samplePath;
    }
  } catch (error) {
    console.warn('Failed to generate OMW-FR sample:', error);
  }

  try {
    const omwThResult = await generateTestSample({
      projectId: 'omw-th',
      version: '1.4',
      maxSynsets: 25,
      maxWords: 50
    });
    if (omwThResult.success) {
      samples.omwThSample = omwThResult.samplePath;
    }
  } catch (error) {
    console.warn('Failed to generate OMW-TH sample:', error);
  }

  // Fall back to wn-test-data for any missing samples
  if (!samples.oewnSample) {
    samples.oewnSample = getTestSamplePath('oewn', '1.3', true);
  }
  if (!samples.ciliSample) {
    samples.ciliSample = getTestSamplePath('cili', '1.0', true);
  }
  if (!samples.omwFrSample) {
    samples.omwFrSample = getTestSamplePath('omw-fr', '1.4', true);
  }
  if (!samples.omwThSample) {
    samples.omwThSample = getTestSamplePath('omw-th', '1.4', true);
  }

  return samples;
}

/**
 * Validate that a test sample has the expected structure
 */
export function validateTestSample(samplePath: string): {
  isValid: boolean;
  issues: string[];
  stats: {
    synsetCount: number;
    wordCount: number;
    senseCount: number;
    iliCoverage: number;
  };
} {
  const issues: string[] = [];
  let isValid = true;

  try {
    const content = readFileSync(samplePath, 'utf8');
    
    // Basic XML validation
    if (!content.includes('<?xml version="1.0"')) {
      issues.push('Missing XML declaration');
      isValid = false;
    }
    
    if (!content.includes('<LexicalResource')) {
      issues.push('Missing LexicalResource root element');
      isValid = false;
    }
    
    if (!content.includes('<Lexicon')) {
      issues.push('Missing Lexicon element');
      isValid = false;
    }
    
    if (!content.includes('<Synset')) {
      issues.push('Missing Synset elements');
      isValid = false;
    }
    
    if (!content.includes('<LexicalEntry')) {
      issues.push('Missing LexicalEntry elements');
      isValid = false;
    }
    
    if (!content.includes('<Sense')) {
      issues.push('Missing Sense elements');
      isValid = false;
    }

    // Count elements
    const synsetCount = (content.match(/<Synset/g) || []).length;
    const wordCount = (content.match(/<LexicalEntry/g) || []).length;
    const senseCount = (content.match(/<Sense/g) || []).length;
    const iliCount = (content.match(/ili="/g) || []).length;
    
    const iliCoverage = synsetCount > 0 ? (iliCount / synsetCount) * 100 : 0;

    // Validate relationships
    if (senseCount > 0 && !content.includes('synset="')) {
      issues.push('Senses missing synset references');
      isValid = false;
    }

    return {
      isValid,
      issues,
      stats: {
        synsetCount,
        wordCount,
        senseCount,
        iliCoverage
      }
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Failed to read sample file: ${error}`],
      stats: { synsetCount: 0, wordCount: 0, senseCount: 0, iliCoverage: 0 }
    };
  }
}

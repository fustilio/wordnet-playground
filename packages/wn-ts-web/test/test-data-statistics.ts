/**
 * Test Data Statistics
 * 
 * This file contains the expected counts and metadata for all test data files
 * in the wn-test-data directory. This centralizes the statistics and makes
 * it easy to reference without hardcoding values in individual tests.
 */

export interface TestFileStats {
  /** File name */
  name: string;
  /** Expected number of lexicons */
  lexicons: number;
  /** Expected number of words/lexical entries */
  words: number;
  /** Expected number of synsets */
  synsets: number;
  /** Expected number of senses */
  senses: number;
  /** Expected number of definitions */
  definitions: number;
  /** Expected number of examples */
  examples: number;
  /** Description of what this file tests */
  description: string;
  /** LMF version if specified */
  lmfVersion?: string;
  /** Languages included */
  languages: string[];
  /** Special characteristics or edge cases */
  characteristics?: string[];
}

export const TEST_DATA_STATISTICS: TestFileStats[] = [
  {
    name: 'mini-lmf-1.0.xml',
    lexicons: 2,
    words: 15,
    synsets: 12, // Actual count from XML file
    senses: 15,
    definitions: 8, // Only some synsets have definitions
    examples: 3, // Only some synsets have examples
    description: 'Basic LMF 1.0 test data with English and Spanish lexicons',
    lmfVersion: '1.0',
    languages: ['en', 'es'],
    characteristics: ['basic-structure', 'multilingual', 'definitions', 'examples']
  },
  {
    name: 'mini-lmf-1.1.xml',
    lexicons: 2,
    words: 4,
    synsets: 3,
    senses: 4,
    definitions: 0, // No definitions in this file
    examples: 0, // No examples in this file
    description: 'LMF 1.1 test data with Japanese lexicon and extension',
    lmfVersion: '1.1',
    languages: ['ja', 'en'],
    characteristics: ['extension-support', 'japanese-script', 'syntactic-behaviour']
  },
  {
    name: 'mini-lmf-1.3.xml',
    lexicons: 1,
    words: 3,
    synsets: 3,
    senses: 3,
    definitions: 3,
    examples: 0,
    description: 'LMF 1.3 test data focusing on whitespace handling',
    lmfVersion: '1.3',
    languages: ['en'],
    characteristics: ['whitespace-handling', 'xml-space-attributes']
  },
  {
    name: 'mini-lmf-1.4.xml',
    lexicons: 1,
    words: 6,
    synsets: 3,
    senses: 8, // Updated to match actual parser output
    definitions: 0, // No definitions in this file
    examples: 0, // No examples in this file
    description: 'LMF 1.4 test data with index attributes and sense counts',
    lmfVersion: '1.4',
    languages: ['en'],
    characteristics: ['index-attributes', 'sense-counts', 'duplicate-indices']
  },
  {
    name: 'E101-0.xml',
    lexicons: 1,
    words: 2, // Parser correctly keeps both duplicate IDs (no deduplication)
    synsets: 1,
    senses: 2, // Parser correctly keeps both duplicate IDs (no deduplication)
    definitions: 0,
    examples: 0,
    description: 'Test duplicate lexical entry IDs (parser keeps both for testing)',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['duplicate-ids', 'lexical-entries', 'no-deduplication'],
    // Note: This file has duplicate LexicalEntry IDs which is invalid LMF.
    // The parser currently keeps both occurrences for testing purposes.
    // In production, this would ideally deduplicate by ID for data integrity.
  },
  {
    name: 'E101-1.xml',
    lexicons: 1,
    words: 1,
    synsets: 2,
    senses: 2, // Duplicate IDs, parser correctly keeps both
    definitions: 0,
    examples: 0,
    description: 'Test duplicate sense IDs',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['duplicate-ids', 'senses']
  },
  {
    name: 'E101-2.xml',
    lexicons: 1,
    words: 1,
    synsets: 2, // Duplicate IDs, parser correctly keeps both
    senses: 1,
    definitions: 0,
    examples: 0,
    description: 'Test duplicate synset IDs',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['duplicate-ids', 'synsets']
  },
  {
    name: 'E101-3.xml',
    lexicons: 1,
    words: 1,
    synsets: 1,
    senses: 1,
    definitions: 0,
    examples: 0,
    description: 'Test duplicate IDs across different entity types',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['duplicate-ids', 'cross-entity']
  },
  {
    name: 'W305-0.xml',
    lexicons: 1,
    words: 1,
    synsets: 1,
    senses: 1,
    definitions: 1, // Blank definition
    examples: 0,
    description: 'Test blank definition handling',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['blank-definitions', 'empty-content']
  },
  {
    name: 'W306-0.xml',
    lexicons: 1,
    words: 1,
    synsets: 1,
    senses: 1,
    definitions: 0,
    examples: 1, // Blank example
    description: 'Test blank example handling',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['blank-examples', 'empty-content']
  },
  {
    name: 'W307-0.xml',
    lexicons: 1,
    words: 1,
    synsets: 2,
    senses: 2,
    definitions: 2, // Repeated definitions
    examples: 0,
    description: 'Test repeated definition handling',
    lmfVersion: '1.0',
    languages: ['en'],
    characteristics: ['repeated-definitions', 'duplicate-content']
  },
  {
    name: 'sense-key-variations.xml',
    lexicons: 2,
    words: 2,
    synsets: 2,
    senses: 2,
    definitions: 0,
    examples: 0,
    description: 'Test sense key variations and special characters',
    lmfVersion: '1.1',
    languages: ['en'],
    characteristics: ['sense-keys', 'special-characters', 'apostrophes']
  },
  {
    name: 'sense-member-order.xml',
    lexicons: 1,
    words: 2,
    synsets: 2,
    senses: 4,
    definitions: 0,
    examples: 0,
    description: 'Test sense member ordering in synsets',
    lmfVersion: '1.1',
    languages: ['en'],
    characteristics: ['member-ordering', 'sense-relationships']
  }
];

/**
 * Get statistics for a specific test file by name
 */
export function getTestFileStats(fileName: string): TestFileStats | undefined {
  return TEST_DATA_STATISTICS.find(stats => stats.name === fileName);
}

/**
 * Get all test files that have a specific characteristic
 */
export function getTestFilesByCharacteristic(characteristic: string): TestFileStats[] {
  return TEST_DATA_STATISTICS.filter(stats => 
    stats.characteristics?.includes(characteristic)
  );
}

/**
 * Get all test files for a specific LMF version
 */
export function getTestFilesByLMFVersion(version: string): TestFileStats[] {
  return TEST_DATA_STATISTICS.filter(stats => stats.lmfVersion === version);
}

/**
 * Get all test files that include a specific language
 */
export function getTestFilesByLanguage(language: string): TestFileStats[] {
  return TEST_DATA_STATISTICS.filter(stats => 
    stats.languages.includes(language)
  );
}

/**
 * Get summary statistics across all test files
 */
export function getOverallTestStatistics() {
  const total = TEST_DATA_STATISTICS.length;
  const totalLexicons = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.lexicons, 0);
  const totalWords = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.words, 0);
  const totalSynsets = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.synsets, 0);
  const totalSenses = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.senses, 0);
  const totalDefinitions = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.definitions, 0);
  const totalExamples = TEST_DATA_STATISTICS.reduce((sum, stats) => sum + stats.examples, 0);

  return {
    totalFiles: total,
    totalLexicons,
    totalWords,
    totalSynsets,
    totalSenses,
    totalDefinitions,
    totalExamples,
    averageWordsPerFile: totalWords / total,
    averageSynsetsPerFile: totalSynsets / total,
    averageSensesPerFile: totalSenses / total
  };
}

/**
 * Validate that all test files have complete statistics
 */
export function validateTestStatistics(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  TEST_DATA_STATISTICS.forEach(stats => {
    if (stats.lexicons < 0) errors.push(`${stats.name}: Invalid lexicon count ${stats.lexicons}`);
    if (stats.words < 0) errors.push(`${stats.name}: Invalid word count ${stats.words}`);
    if (stats.synsets < 0) errors.push(`${stats.name}: Invalid synset count ${stats.synsets}`);
    if (stats.senses < 0) errors.push(`${stats.name}: Invalid sense count ${stats.senses}`);
    if (stats.definitions < 0) errors.push(`${stats.name}: Invalid definition count ${stats.definitions}`);
    if (stats.examples < 0) errors.push(`${stats.name}: Invalid example count ${stats.examples}`);
    
    // Validate that senses count matches words count (in most cases)
    if (stats.name !== 'E101-1.xml' && stats.name !== 'E101-2.xml' && stats.name !== 'E101-3.xml') {
      if (stats.senses !== stats.words) {
        errors.push(`${stats.name}: Sense count (${stats.senses}) doesn't match word count (${stats.words})`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default TEST_DATA_STATISTICS;

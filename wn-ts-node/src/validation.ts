import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import { 
  validateLMFDataIntegrity, 
  fileOperations 
} from 'wn-ts-core';
import type { 
  DatabaseAdapter, 
  ValidationOptions,
  ValidationResult
} from 'wn-ts-core';

/**
 * Node.js implementation of the DatabaseAdapter interface
 * This provides access to SQLite databases using better-sqlite3
 */
export class NodeDatabaseAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(databasePath: string) {
    this.db = new Database(databasePath);
  }

  async getLexicons(): Promise<any[]> {
    return this.db.prepare('SELECT * FROM lexicons').all() as any[];
  }

  async getWords(lexiconId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM words WHERE lexicon = ?').all(lexiconId) as any[];
  }

  async getSynsets(lexiconId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM synsets WHERE lexicon = ?').all(lexiconId) as any[];
  }

  async getSenses(wordId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM senses WHERE word_id = ?').all(wordId) as any[];
  }

  async getForms(wordId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM forms WHERE word_id = ?').all(wordId) as any[];
  }

  async getWordTags(wordId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM tags WHERE word_id = ?').all(wordId) as any[];
  }

  async getFormTags(formId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM tags WHERE form_id = ?').all(formId) as any[];
  }

  async getSenseRelations(senseId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM sense_relations WHERE sense_id = ?').all(senseId) as any[];
  }

  async getSenseExamples(senseId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM examples WHERE sense_id = ?').all(senseId) as any[];
  }

  async getSenseCounts(senseId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM counts WHERE sense_id = ?').all(senseId) as any[];
  }

  async getSyntacticBehaviours(wordId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM syntactic_behaviours WHERE word_id = ?').all(wordId) as any[];
  }

  async getDefinitions(synsetId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM definitions WHERE synset_id = ?').all(synsetId) as any[];
  }

  async getILIDefinitions(synsetId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM ili_definitions WHERE synset_id = ?').all(synsetId) as any[];
  }

  async getSynsetRelations(synsetId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM synset_relations WHERE synset_id = ?').all(synsetId) as any[];
  }

  async getSynsetExamples(synsetId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM examples WHERE synset_id = ?').all(synsetId) as any[];
  }

  close(): void {
    this.db.close();
  }
}

/**
 * Node.js-specific file operations
 */
const nodeFileOperations = {
  async loadFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  },

  async saveFile(filePath: string, content: string): Promise<void> {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  },

  generateOutputPath(originalPath: string): string {
    const basename = path.basename(originalPath, '.xml');
    const tempDir = path.join(process.cwd(), 'temp', 'validation');
    return path.join(tempDir, `${basename}-reconstructed.xml`);
  }
};

/**
 * Override the file operations in the core validation system
 */
Object.assign(fileOperations, nodeFileOperations);

/**
 * Convenience function to validate LMF data integrity using a SQLite database
 */
export async function validateLMFDataIntegrityFromSQLite(
  databasePath: string,
  originalXmlPath: string,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  // Ensure file operations are overridden before calling validation
  Object.assign(fileOperations, nodeFileOperations);
  
  const adapter = new NodeDatabaseAdapter(databasePath);
  
  try {
    return await validateLMFDataIntegrity(adapter, originalXmlPath, options);
  } finally {
    adapter.close();
  }
}

/**
 * CLI function to run validation
 */
export async function runValidationCLI(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.log('Usage: validate <database-path> <original-xml-path> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --output <path>     Save reconstructed XML to specified path');
    console.log('  --no-reconstruct    Don\'t save reconstructed XML');
    console.log('  --detailed-diff     Show detailed differences');
    console.log('  --ignore-order      Ignore element order differences');
    console.log('  --ignore-whitespace Ignore whitespace differences');
    return;
  }

  const databasePath = args[0];
  const originalXmlPath = args[1];
  const options: ValidationOptions = {};

  if (!databasePath || !originalXmlPath) {
    console.error('❌ Missing required arguments: database-path and original-xml-path');
    process.exit(1);
  }

  // Parse options
  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
        const outputPath = args[++i];
        if (outputPath) {
          options.outputPath = outputPath;
        }
        break;
      case '--no-reconstruct':
        options.outputReconstructed = false;
        break;
      case '--detailed-diff':
        options.detailedDiff = true;
        break;
      case '--ignore-order':
        options.ignoreOrder = true;
        break;
      case '--ignore-whitespace':
        options.ignoreWhitespace = true;
        break;
    }
  }

  try {
    const result = await validateLMFDataIntegrityFromSQLite(databasePath, originalXmlPath, options);
    
    console.log('\n=== LMF Data Integrity Validation Results ===');
    console.log(`Original File: ${result.originalFile}`);
    if (result.reconstructedFile) {
      console.log(`Reconstructed File: ${result.reconstructedFile}`);
    }
    console.log(`Success: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('');
    console.log('Summary:');
    console.log(`  Total Elements: ${result.summary.totalElements}`);
    console.log(`  Matching Elements: ${result.summary.matchingElements}`);
    console.log(`  Missing Elements: ${result.summary.missingElements}`);
    console.log(`  Extra Elements: ${result.summary.extraElements}`);
    console.log(`  Attribute Mismatches: ${result.summary.attributeMismatches}`);
    
    if (result.differences.length > 0) {
      console.log('');
      console.log('Differences:');
      result.differences.slice(0, 20).forEach((diff, i) => {
        console.log(`  ${i + 1}. ${diff.type}: ${diff.path}`);
        console.log(`     Details: ${diff.details}`);
        if (diff.original && diff.reconstructed) {
          console.log(`     Original: ${diff.original}`);
          console.log(`     Reconstructed: ${diff.reconstructed}`);
        }
        console.log('');
      });
      
      if (result.differences.length > 20) {
        console.log(`  ... and ${result.differences.length - 20} more differences`);
      }
    }
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error}`);
    process.exit(1);
  }
}

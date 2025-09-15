#!/usr/bin/env node

import { createTestDataManager, DEFAULT_WORDNET_SOURCES } from '../src/utils/test-data-manager.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

/**
 * CLI script to generate test data using xml-introspect
 * 
 * Usage:
 *   pnpm run generate-test-data [options]
 *   
 * Options:
 *   --output-dir <path>    Output directory for test data (default: ./.test-data-cache)
 *   --validate-only        Only validate URLs, don't generate test data
 *   --project <id>         Generate test data for specific project only
 *   --max-elements <num>   Maximum elements in sample XML (default: 50)
 *   --max-depth <num>      Maximum depth in sample XML (default: 5)
 *   --help                 Show this help message
 */

interface CLIArgs {
  outputDir: string;
  validateOnly: boolean;
  project?: string;
  maxElements: number;
  maxDepth: number;
  help: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  
  const result: CLIArgs = {
    outputDir: './.test-data-cache',
    validateOnly: false,
    maxElements: 50,
    maxDepth: 5,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output-dir':
        result.outputDir = args[++i] || './test-data';
        break;
      case '--validate-only':
        result.validateOnly = true;
        break;
      case '--project':
        result.project = args[++i];
        break;
      case '--max-elements':
        result.maxElements = parseInt(args[++i] || '50');
        break;
      case '--max-depth':
        result.maxDepth = parseInt(args[++i] || '5');
        break;
      case '--help':
        result.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
WordNet Test Data Generator

Usage:
  pnpm run generate-test-data [options]

Options:
  --output-dir <path>    Output directory for test data (default: ./.test-data-cache)
  --validate-only        Only validate URLs, don't generate test data
  --project <id>         Generate test data for specific project only
  --max-elements <num>   Maximum elements in sample XML (default: 50)
  --max-depth <num>      Maximum depth in sample XML (default: 5)
  --help                 Show this help message

Examples:
  # Generate test data for all projects
  pnpm run generate-test-data

  # Validate URLs only
  pnpm run generate-test-data --validate-only

  # Generate test data for specific project
  pnpm run generate-test-data --project oewn:2024

  # Custom output directory and sample size
  pnpm run generate-test-data --output-dir ./my-test-data --max-elements 100
`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  console.log('🚀 WordNet Test Data Generator');
  console.log('===============================\n');

  // Ensure output directory exists
  try {
    await mkdir(args.outputDir, { recursive: true });
    console.log(`📁 Output directory: ${args.outputDir}\n`);
  } catch (error) {
    console.error(`❌ Failed to create output directory: ${error}`);
    process.exit(1);
  }

  // Create test data manager
  const manager = createTestDataManager(args.outputDir);

  // Filter sources if specific project requested
  if (args.project) {
    const source = DEFAULT_WORDNET_SOURCES.find(s => s.id === args.project);
    if (!source) {
      console.error(`❌ Project not found: ${args.project}`);
      console.log('Available projects:', DEFAULT_WORDNET_SOURCES.map(s => s.id).join(', '));
      process.exit(1);
    }
    manager.addDataSources([source]);
  }

  try {
    // Step 1: Validate URLs
    console.log('🔍 Step 1: Validating data source URLs');
    console.log('=====================================\n');
    
    const validationResults = await manager.validateAllSources();
    
    const validSources = validationResults.filter(r => r.accessible && r.isValidXML);
    const invalidSources = validationResults.filter(r => !r.accessible || !r.isValidXML);
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`✅ Valid sources: ${validSources.length}`);
    console.log(`❌ Invalid sources: ${invalidSources.length}\n`);
    
    if (invalidSources.length > 0) {
      console.log('❌ Invalid sources:');
      invalidSources.forEach(result => {
        console.log(`  - ${result.url}: ${result.error}`);
      });
      console.log('');
    }

    if (args.validateOnly) {
      console.log('✅ URL validation completed. Use without --validate-only to generate test data.');
      return;
    }

    if (validSources.length === 0) {
      console.error('❌ No valid sources found. Cannot generate test data.');
      process.exit(1);
    }

    // Step 2: Generate test data
    console.log('📊 Step 2: Generating test data');
    console.log('===============================\n');
    
    const testDataResults = await manager.generateAllTestData();
    
    const successful = testDataResults.filter(r => r.success);
    const failed = testDataResults.filter(r => !r.success);
    
    console.log(`\n📊 Test Data Generation Summary:`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}\n`);
    
    if (failed.length > 0) {
      console.log('❌ Failed projects:');
      failed.forEach(result => {
        console.log(`  - ${result.projectId}: ${result.error}`);
      });
      console.log('');
    }

    // Step 3: Show generated files
    console.log('📁 Generated Files:');
    console.log('===================\n');
    
    for (const result of successful) {
      console.log(`📂 ${result.projectId}/`);
      if (result.analysis) console.log(`  📄 analysis.json`);
      if (result.xsdSchema) console.log(`  📄 ${result.projectId}.xsd`);
      if (result.sampleXml) console.log(`  📄 sample.xml`);
      if (result.realisticXml) console.log(`  📄 realistic.xml`);
      if (result.validation) console.log(`  📄 validation.json`);
      console.log('');
    }

    console.log('✅ Test data generation completed!');
    console.log(`📁 Files saved to: ${args.outputDir}`);

  } catch (error) {
    console.error('❌ Test data generation failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

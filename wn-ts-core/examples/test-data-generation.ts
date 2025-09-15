#!/usr/bin/env tsx

/**
 * Example: Test Data Generation with xml-introspect
 * 
 * This example demonstrates how to use the enhanced xml-introspect capabilities
 * to validate WordNet data sources and generate representative test data.
 * 
 * Run with: pnpm tsx examples/test-data-generation.ts
 */

import { createTestDataManager, DEFAULT_WORDNET_SOURCES } from '../src/utils/test-data-manager.js';
import { join } from 'path';

async function main() {
  console.log('🚀 WordNet Test Data Generation Example');
  console.log('======================================\n');

  // Create test data manager
  const outputDir = join(process.cwd(), 'examples', 'generated-test-data');
  const manager = createTestDataManager(outputDir);

  console.log(`📁 Output directory: ${outputDir}\n`);

  // Step 1: Validate all data sources
  console.log('🔍 Step 1: Validating data sources');
  console.log('==================================\n');

  const validationResults = await manager.validateAllSources();
  
  const validSources = validationResults.filter(r => r.accessible && r.isValidXML);
  const invalidSources = validationResults.filter(r => !r.accessible || !r.isValidXML);

  console.log(`📊 Validation Results:`);
  console.log(`✅ Valid sources: ${validSources.length}`);
  console.log(`❌ Invalid sources: ${invalidSources.length}\n`);

  if (invalidSources.length > 0) {
    console.log('❌ Invalid sources:');
    invalidSources.forEach(result => {
      console.log(`  - ${result.url}: ${result.error}`);
    });
    console.log('');
  }

  if (validSources.length === 0) {
    console.log('❌ No valid sources found. Cannot generate test data.');
    return;
  }

  // Step 2: Generate test data for the first valid source
  const firstValidSource = validSources[0];
  const source = DEFAULT_WORDNET_SOURCES.find(s => s.url === firstValidSource.url);
  
  if (!source) {
    console.log('❌ Could not find source configuration for valid URL');
    return;
  }

  console.log(`📊 Step 2: Generating test data for ${source.id}`);
  console.log('===============================================\n');

  try {
    // Download the XML content
    console.log(`📥 Downloading ${source.url}...`);
    const response = await fetch(source.url);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const xmlContent = await response.text();
    console.log(`✅ Downloaded ${xmlContent.length} characters\n`);

    // Generate test data
    const result = await manager.generateTestData(source.id, xmlContent);

    if (result.success) {
      console.log('✅ Test data generation completed successfully!\n');
      
      // Display results
      console.log('📊 Generated Data:');
      console.log('==================\n');
      
      if (result.analysis) {
        const analysis = result.analysis.analysis;
        console.log('📈 Analysis Results:');
        console.log(`  - Total Synsets: ${analysis.totalSynsets}`);
        console.log(`  - Total Words: ${analysis.totalWords}`);
        console.log(`  - Total Senses: ${analysis.totalSenses}`);
        console.log(`  - Total Lexicons: ${analysis.totalLexicons}`);
        console.log(`  - ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
        console.log('');
      }

      if (result.sampleXml) {
        console.log('📄 Sample XML:');
        console.log(`  - Size: ${result.sampleXml.length} characters`);
        console.log(`  - Preview: ${result.sampleXml.substring(0, 200)}...`);
        console.log('');
      }

      if (result.realisticXml) {
        console.log('🎭 Realistic XML:');
        console.log(`  - Size: ${result.realisticXml.length} characters`);
        console.log(`  - Preview: ${result.realisticXml.substring(0, 200)}...`);
        console.log('');
      }

      if (result.xsdSchema) {
        console.log('📋 XSD Schema:');
        console.log(`  - Size: ${result.xsdSchema.length} characters`);
        console.log(`  - Preview: ${result.xsdSchema.substring(0, 200)}...`);
        console.log('');
      }

      if (result.validation) {
        console.log('✅ Schema Validation:');
        console.log(`  - Valid: ${result.validation.isValid}`);
        if (result.validation.errors.length > 0) {
          console.log(`  - Errors: ${result.validation.errors.length}`);
        }
        if (result.validation.warnings.length > 0) {
          console.log(`  - Warnings: ${result.validation.warnings.length}`);
        }
        console.log('');
      }

      console.log('📁 Files saved to:');
      console.log(`  - ${join(outputDir, source.id, 'analysis.json')}`);
      if (result.sampleXml) {
        console.log(`  - ${join(outputDir, source.id, 'sample.xml')}`);
      }
      if (result.realisticXml) {
        console.log(`  - ${join(outputDir, source.id, 'realistic.xml')}`);
      }
      if (result.xsdSchema) {
        console.log(`  - ${join(outputDir, source.id, `${source.id}.xsd`)}`);
      }
      if (result.validation) {
        console.log(`  - ${join(outputDir, source.id, 'validation.json')}`);
      }

    } else {
      console.log('❌ Test data generation failed:');
      console.log(`  Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error during test data generation:', error);
  }

  console.log('\n🎉 Example completed!');
  console.log('\nNext steps:');
  console.log('1. Use the generated sample.xml files in your tests');
  console.log('2. Use the realistic.xml files for integration testing');
  console.log('3. Use the XSD schemas for validation');
  console.log('4. Run: pnpm run generate-test-data --help for more options');
}

// Run the example
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

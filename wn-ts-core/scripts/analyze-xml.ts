#!/usr/bin/env tsx

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { analyzeLMFXML, generateXMLReport } from '../src/utils/xml-analyzer';

/**
 * CLI script to analyze LMF XML files for ILI coverage and data integrity
 * 
 * Usage: tsx scripts/analyze-xml.ts [file-path]
 * 
 * If no file path is provided, analyzes the default oewn-sample.xml
 */

async function main() {
  const args = process.argv.slice(2);
  let filePath: string;
  
  if (args.length > 0) {
    filePath = args[0];
  } else {
    // Default to the oewn-sample.xml file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    filePath = join(__dirname, '../../packages/xml-introspect/data/output/oewn-sample.xml');
  }
  
  try {
    console.log(`🔍 Analyzing XML file: ${filePath}`);
    console.log('=' .repeat(60));
    
    const analysis = await analyzeLMFXML(filePath);
    
    // Generate and display the comprehensive report
    const report = generateXMLReport(analysis);
    console.log(report);
    
    // Additional insights
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Additional Insights:');
    
    if (analysis.iliCoveragePercentage < 50) {
      console.log('⚠️  Low ILI coverage detected - this may indicate:');
      console.log('   - Incomplete data loading');
      console.log('   - Missing ILI mappings');
      console.log('   - Data source issues');
      console.log('   - Sample file limitations');
    } else {
      console.log('✅ Good ILI coverage - data appears complete');
    }
    
    if (analysis.schemaValidation?.warnings && analysis.schemaValidation.warnings.length > 0) {
      console.log('\n⚠️  Schema warnings:');
      analysis.schemaValidation.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }
    
    if (analysis.schemaValidation?.errors && analysis.schemaValidation.errors.length > 0) {
      console.log('\n❌ Schema errors:');
      analysis.schemaValidation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing XML file:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);

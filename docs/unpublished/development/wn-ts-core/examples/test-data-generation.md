# Test Data Generation with xml-introspect

This example demonstrates how to use the enhanced xml-introspect capabilities to validate WordNet data sources and generate representative test data.

## Overview

The test data generation system helps create realistic test data for WordNet applications by analyzing real WordNet XML sources and generating representative samples.

## Usage

```bash
# Run the example (if you have the original TypeScript file)
# Note: This is now documentation - see the code example below

# Or use the CLI
pnpm run generate-test-data --help
```

## Code Example

```typescript
import { createTestDataManager, DEFAULT_WORDNET_SOURCES } from '../src/test/test-data-manager.js';
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

      // Display file information
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
```

## Features

### Data Source Validation
- **Accessibility Check**: Verifies that data sources are reachable
- **XML Validation**: Ensures the downloaded content is valid XML
- **Format Detection**: Identifies WordNet XML format and structure

### Test Data Generation
- **Sample XML**: Small representative samples for unit testing
- **Realistic XML**: Larger samples that maintain data characteristics
- **XSD Schema**: Generated schemas for validation
- **Analysis Reports**: Detailed analysis of data characteristics

### Generated Files
- `analysis.json`: Detailed analysis of the source data
- `sample.xml`: Small sample for unit testing
- `realistic.xml`: Larger sample for integration testing
- `{source}.xsd`: XSD schema for validation
- `validation.json`: Schema validation results

## Configuration

The system uses `DEFAULT_WORDNET_SOURCES` which includes:
- Open English WordNet (OEWN)
- Multilingual WordNet sources
- Various WordNet formats and versions

## Benefits

1. **Realistic Testing**: Uses actual WordNet data characteristics
2. **Consistent Test Data**: Reproducible test data across environments
3. **Schema Validation**: Ensures generated data follows proper schemas
4. **Performance Testing**: Large datasets for performance validation
5. **Format Validation**: Ensures compatibility with different WordNet formats

## Use Cases

- **Unit Testing**: Use sample.xml for fast unit tests
- **Integration Testing**: Use realistic.xml for comprehensive testing
- **Performance Testing**: Use large datasets for performance validation
- **Schema Validation**: Use XSD schemas for data validation
- **Documentation**: Use analysis reports for understanding data characteristics

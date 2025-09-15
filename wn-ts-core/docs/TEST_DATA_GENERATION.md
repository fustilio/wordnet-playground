# Test Data Generation with xml-introspect

This document describes the comprehensive test data generation system that uses xml-introspect to validate WordNet data sources and generate representative test data for both `wn-ts-core` and `wn-ts-node`.

## Overview

The test data generation system provides:

1. **URL Validation**: Ensures WordNet data sources are accessible and contain valid XML
2. **Sample Generation**: Creates representative XML samples using xml-introspect
3. **Realistic Data**: Generates realistic test data with proper linguistic patterns
4. **Schema Validation**: Generates and validates against XSD schemas
5. **Comprehensive Analysis**: Deep analysis of XML structure and content

## Features

### ✅ Implemented Features

- **URL Validation**: Check if data sources are accessible and contain valid XML
- **XML Analysis**: Comprehensive analysis using xml-introspect capabilities
- **Sample Generation**: Create representative samples for testing
- **File Management**: Save and load generated test data
- **CLI Interface**: Easy-to-use command-line tools
- **TypeScript Support**: Full type safety and IntelliSense support

### 🔄 Optional Features (Require xml-introspect)

- **XSD Schema Generation**: Generate XSD schemas from XML files
- **Sample XML Generation**: Create representative samples with configurable sizes
- **Realistic XML Generation**: Generate realistic test data with proper patterns
- **Schema Validation**: Validate XML against generated schemas

## Quick Start

### 1. Validate Data Sources

```bash
# Validate all configured URLs
pnpm run validate-urls

# Validate specific project
pnpm run validate-urls --project oewn:2024
```

### 2. Generate Test Data

```bash
# Generate test data for all projects (saved to ./.test-data-cache/)
pnpm run generate-test-data

# Generate test data for specific project
pnpm run generate-test-data --project oewn:2024

# Custom output directory and sample size
pnpm run generate-test-data --output-dir ./my-test-data --max-elements 100
```

**Note:** Test data is cached in `./.test-data-cache/` by default to avoid committing large files to git.

### 3. Programmatic Usage

```typescript
import { createTestDataManager, DEFAULT_WORDNET_SOURCES } from 'wn-ts-core/utils';

// Create manager
const manager = createTestDataManager('./test-data');

// Add custom data sources
manager.addDataSource({
  id: 'custom:1.0',
  name: 'Custom WordNet',
  language: 'en',
  version: '1.0',
  url: 'https://example.com/wordnet.xml',
  format: 'xml',
  description: 'Custom WordNet data'
});

// Validate URLs
const results = await manager.validateAllSources();
console.log('Valid sources:', results.filter(r => r.accessible && r.isValidXML));

// Generate test data
const testData = await manager.generateTestData('custom:1.0', xmlContent);
console.log('Generated files:', testData);
```

## Configuration

### Test Data Manager Options

```typescript
interface TestDataConfig {
  outputDir: string;                    // Output directory for test data
  maxElements?: number;                 // Max elements in sample XML (default: 50)
  maxDepth?: number;                    // Max depth in sample XML (default: 5)
  includeAttributes?: boolean;          // Include attributes in samples (default: true)
  includeText?: boolean;                // Include text content in samples (default: true)
  validateAgainstXSD?: boolean;         // Generate and validate XSD schemas (default: true)
  generateRealistic?: boolean;          // Generate realistic test data (default: true)
  generateSamples?: boolean;            // Generate representative samples (default: true)
}
```

### Data Source Configuration

```typescript
interface WordNetDataSource {
  id: string;           // Unique identifier (e.g., 'oewn:2024')
  name: string;         // Human-readable name
  language: string;     // Language code (e.g., 'en', 'fr')
  version: string;      // Version string
  url: string;          // Download URL
  format: 'xml' | 'tar' | 'tar.gz' | 'tar.xz';  // File format
  description: string;  // Description
  size?: string;        // Approximate size
  lastUpdated?: string; // Last update date
}
```

## Generated Files

For each project, the system generates:

```
test-data/
├── project-id/
│   ├── analysis.json          # Comprehensive XML analysis
│   ├── sample.xml            # Representative sample (if xml-introspect available)
│   ├── realistic.xml         # Realistic test data (if xml-introspect available)
│   ├── project-id.xsd        # XSD schema (if xml-introspect available)
│   └── validation.json       # Schema validation results
```

### Analysis JSON Structure

```json
{
  "analysis": {
    "totalSynsets": 1500,
    "totalWords": 3000,
    "totalSenses": 3000,
    "totalLexicons": 1,
    "synsetsWithILI": 1200,
    "iliCoveragePercentage": 80.0,
    "partOfSpeechDistribution": {
      "n": 800,
      "v": 400,
      "a": 200,
      "r": 100
    },
    "schemaValidation": {
      "isValid": true,
      "errors": [],
      "warnings": ["Missing DOCTYPE declaration"]
    }
  }
}
```

## Integration with Tests

### wn-ts-core Tests

```typescript
import { createTestDataManager } from 'wn-ts-core/utils';

describe('WordNet Tests', () => {
  let testData: any;

  beforeAll(async () => {
    const manager = createTestDataManager('./test-data');
    testData = await manager.loadTestData('oewn:2024');
  });

  it('should load sample data', () => {
    expect(testData?.sampleXml).toBeDefined();
    expect(testData?.analysis).toBeDefined();
  });
});
```

### wn-ts-node Tests

```typescript
import { createTestDataManager } from 'wn-ts-core/utils';

describe('WordNet Node Tests', () => {
  let testData: any;

  beforeAll(async () => {
    const manager = createTestDataManager('./test-data');
    testData = await manager.loadTestData('oewn:2024');
  });

  it('should process realistic data', () => {
    expect(testData?.realisticXml).toBeDefined();
  });
});
```

## CLI Commands

### wn-ts-core

```bash
# Validate URLs only
pnpm run validate-urls

# Generate test data
pnpm run generate-test-data

# Generate for specific project
pnpm run generate-test-data --project oewn:2024

# Custom configuration
pnpm run generate-test-data --output-dir ./my-data --max-elements 100
```

### wn-ts-node

```bash
# Same commands as wn-ts-core
pnpm run validate-urls
pnpm run generate-test-data
```

## Error Handling

The system handles various error conditions gracefully:

- **Network Failures**: Tries multiple URLs with fallback handling
- **Invalid XML**: Provides detailed error messages for malformed XML
- **Compressed Files**: Handles gzip, tar.gz, and tar.xz files appropriately
- **Missing Dependencies**: Gracefully degrades when xml-introspect is not available

## Performance Considerations

- **Sample Sizes**: Configure `maxElements` and `maxDepth` for appropriate test data sizes
- **Network Requests**: URL validation uses HEAD requests to minimize bandwidth
- **File Caching**: Generated test data is cached and can be reused
- **Parallel Processing**: Multiple data sources are processed in parallel

## Troubleshooting

### Common Issues

1. **xml-introspect not available**
   - The system works without xml-introspect but with limited functionality
   - Install xml-introspect for full features: `npm install xml-introspect`

2. **URL validation failures**
   - Check internet connectivity
   - Verify URLs are accessible
   - Some URLs may require authentication or have rate limits

3. **File generation errors**
   - Ensure output directory is writable
   - Check available disk space
   - Verify XML content is valid

### Debug Information

Enable debug logging:

```bash
# Set debug level
export WN_TS_LOG_LEVEL=5

# Run with debug logs
pnpm run generate-test-data
```

## Future Enhancements

- **Compression Support**: Automatic decompression of gzip/tar files
- **Batch Processing**: Parallel processing of multiple data sources
- **Custom Schemas**: Support for user-defined XSD schemas
- **Data Validation**: Enhanced validation against WordNet-specific rules
- **Performance Metrics**: Detailed timing and performance analysis

## Examples

See the `examples/` directory for complete working examples:

- `examples/test-data-generation.ts` - Comprehensive example
- `tests/test-data-manager.test.ts` - Test suite examples

## Related Documentation

- [XML Analyzer](./XML_ANALYZER.md) - Core XML analysis capabilities
- [Testing Strategy](./TESTING_STRATEGY.md) - Overall testing approach
- [Development Conventions](./DEVELOPMENT_CONVENTIONS.md) - Code standards

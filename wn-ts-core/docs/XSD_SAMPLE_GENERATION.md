# WordNet XSD Sample Generation & Analysis

This document describes the comprehensive system for generating XSD-validated WordNet XML samples and analyzing data integrity, including ILI coverage analysis.

> **📚 Related Documentation:**
> - [Global WordNet Schemas](./GLOBAL_WORDNET_SCHEMAS.md) - Official schema reference
> - [Data Integrity Validation](./VALIDATION.md) - Complete validation system
> - [Testing Strategy](./TESTING_STRATEGY.md) - Testing guidelines and patterns
> - [Advanced Use Cases](./ROADMAP.md) - Superpower operations and examples

## Overview

The system provides three main capabilities:

1. **XSD-Based Sample Generation**: Creates small, representative XML files validated against official WN-LMF schemas
2. **Data Integrity Analysis**: Analyzes ILI coverage, data quality, and structural integrity
3. **Sample Generation**: Creates fast-loading samples from live WordNet sources

## Features

- **XSD Schema Validation**: Samples validated against official WN-LMF XSD schemas
- **Multi-Project Support**: Generates samples for multiple WordNet projects
- **Intelligent Sampling**: Preserves linguistic diversity (POS, relations, ILI coverage)
- **ILI Coverage Analysis**: Comprehensive analysis of Inter-Lingual Index coverage
- **Data Quality Assessment**: Identifies potential data loading issues
- **Size Optimization**: Configurable target sizes for efficient testing

## Supported Projects

- **oewn:2024** - Open English WordNet 2024 (WN-LMF 1.3)
- **cili:1.0** - Collaborative Interlingual Index 1.0 (WN-LMF 1.4)
- **omw-fr:1.4** - Open Multilingual Wordnet - French 1.4 (WN-LMF 1.4)
- **omw-th:1.4** - Open Multilingual Wordnet - Thai 1.4 (WN-LMF 1.4)

## Quick Start

### CLI Usage

Generate samples for all target projects:

```bash
pnpm tsx scripts/generate-xsd-samples-simple.ts
```

Generate samples with custom settings:

```bash
pnpm tsx scripts/generate-xsd-samples-simple.ts \
  --max-synsets 25 \
  --max-words 50 \
  --target-size 256000
```

### Programmatic Usage

```typescript
import { 
  generateXSDBasedSample, 
  generateMultipleProjectSamples,
  analyzeLMFXML,
  generateXMLReport 
} from './src/utils/index.js';

// Generate a single project sample
const result = await generateXSDBasedSample(
  'oewn',
  '2024',
  './output',
  {
    maxSynsets: 50,
    maxWords: 100,
    validateAgainstXSD: true
  }
);

// Analyze data integrity
const analysis = await analyzeLMFXML('path/to/wordnet.xml');
const report = generateXMLReport(analysis);
console.log(report);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetSize` | number | 512KB | Target size in bytes |
| `maxSynsets` | number | 50 | Maximum synsets to include |
| `maxWords` | number | 100 | Maximum lexical entries to include |
| `preserveStructure` | boolean | true | Preserve XML structure |
| `includeAllPOS` | boolean | true | Include examples of all parts of speech |
| `includeAllRelations` | boolean | true | Include examples of all relation types |
| `validateAgainstXSD` | boolean | true | Validate against XSD schema |

## Output Structure

```
test-data/xsd-samples/
├── oewn-2024/
│   ├── sample.xml          # Generated sample (1.0KB)
│   └── oewn-2024.xsd      # WN-LMF 1.3 XSD (28KB)
├── cili-1.0/
│   ├── sample.xml          # Generated sample (1.0KB)
│   └── cili-1.0.xsd       # WN-LMF 1.4 XSD
├── omw-fr-1.4/
│   ├── sample.xml          # Generated sample (1.1KB)
│   └── omw-fr-1.4.xsd     # WN-LMF 1.4 XSD
└── omw-th-1.4/
    ├── sample.xml          # Generated sample (1.1KB)
    └── omw-th-1.4.xsd     # WN-LMF 1.4 XSD
```

## XSD Schema Selection

The system automatically selects the appropriate XSD schema:

- **OEWN projects**: Use WN-LMF 1.3 XSD
- **OMW projects**: Use WN-LMF 1.4 XSD  
- **CILI**: Use WN-LMF 1.4 XSD
- **Other projects**: Default to WN-LMF 1.4 XSD

## Sample Quality Features

### Linguistic Diversity
- **Parts of Speech**: Ensures representation of all available POS categories
- **Relations**: Includes examples of different synset relation types
- **ILI Coverage**: Maintains representative Inter-Lingual Index coverage

### Structural Integrity
- **XML Structure**: Preserves document structure (header, DOCTYPE, elements)
- **Schema Compliance**: Validates against appropriate WN-LMF XSD
- **Element Relationships**: Maintains proper parent-child relationships

### Size Optimization
- **Configurable Limits**: Set maximum counts for synsets and lexical entries
- **Smart Selection**: Prioritizes diverse and representative elements
- **Compression Reporting**: Provides compression ratio statistics

## Data Integrity Analysis

### ILI Coverage Analysis

The system provides comprehensive ILI coverage analysis:

```typescript
const analysis = await analyzeLMFXML('path/to/wordnet.xml');

console.log(`Total Synsets: ${analysis.totalSynsets}`);
console.log(`Synsets with ILI: ${analysis.synsetsWithILI}`);
console.log(`ILI Coverage: ${analysis.iliCoveragePercentage.toFixed(2)}%`);
```

**Example Results (OEWN Sample):**
- Total Synsets: 65
- Synsets with ILI: 7 (10.77%)
- Synsets without ILI: 58 (89.23%)
- ILI Coverage: 10.77%

### Data Quality Indicators

**Warning Signs:**
- **Low ILI Coverage** (< 50%): May indicate incomplete data loading
- **Empty Synsets**: Synsets with no members
- **Missing Cross-References**: Broken word-sense-synset relationships
- **Schema Validation Errors**: XML structure issues

### Comprehensive Reports

Generate detailed analysis reports:

```typescript
const report = generateXMLReport(analysis);
console.log(report);

// Output includes:
// - ILI coverage statistics
// - Part of speech distribution
// - Synset size distribution
// - Data quality warnings
// - Schema validation results
```

## Validation

### XSD Validation
The system performs basic structural validation against XSD schemas:

- XML declaration presence
- Required root elements (`<LexicalResource>`, `<Lexicon>`)
- Required content elements (`<Synset>`, `<LexicalEntry>`)
- Proper tag closure

### Content Validation
- Synset count limits
- Lexical entry count limits
- Linguistic diversity preservation
- Relationship integrity

## Error Handling

The system handles various error conditions gracefully:

- **Project Version Errors**: Reports deprecated or unavailable versions
- **Network Failures**: Tries multiple URLs with fallback handling
- **Schema Issues**: Continues with basic validation if XSD unavailable
- **File System Errors**: Provides clear error messages for I/O issues

## Use Cases

### Testing
- **Unit Tests**: Fast-loading representative data for test suites
- **Integration Tests**: Realistic data structures for system testing
- **Performance Tests**: Consistent data sizes for benchmarking

### Development
- **Prototyping**: Quick iteration with realistic data
- **Debugging**: Reproducible test cases for issue investigation
- **Documentation**: Examples of proper XML structure

### Quality Assurance
- **Schema Validation**: Ensure data conforms to standards
- **Structural Testing**: Verify XML parsing and processing
- **Linguistic Testing**: Test language-specific features

## Best Practices

### Sample Size Guidelines
- **Unit Tests**: 10-25 synsets (very fast)
- **Integration Tests**: 25-50 synsets (fast)
- **Comprehensive Tests**: 50+ synsets (moderate)

### Validation
- Always enable XSD validation for production samples
- Review validation results before using samples
- Consider schema version compatibility

### Error Handling
- Check success status before using results
- Handle network failures gracefully
- Provide fallback data for critical tests

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test tests/xml-analyzer.test.ts
pnpm test tests/ili-coverage.test.ts
```

## Current Status

**Note**: The XSD sample generation functionality has been consolidated into the `xml-introspect` package, which provides more comprehensive XML processing capabilities including:

- **XSD Generation**: Generate XSD schemas from XML files
- **Sample Generation**: Create representative samples with configurable sizes
- **Schema Validation**: Validate XML against XSD schemas
- **Advanced Analysis**: Deep structure analysis and pattern recognition

The `xml-analyzer.ts` utility continues to provide WordNet-specific analysis capabilities while leveraging xml-introspect for enhanced validation and processing.

## Troubleshooting

### Common Issues

**Network Failures**
- Check internet connectivity
- Verify project URLs are accessible
- Consider using cached data

**Schema Validation Failures**
- Verify XSD file availability
- Check XML structure compliance
- Review validation logic

**Size Issues**
- Adjust `maxSynsets` and `maxWords` limits
- Review `targetSize` configuration
- Check compression ratio reports

### Debug Information

The CLI provides detailed logging:
- Project processing status
- File generation progress
- Validation results
- Error details and suggestions

## Integration with Existing Tests

The generated samples complement existing test data:

- **wn-test-data**: Python library extracted test data
- **Generated Samples**: XSD-validated representative data
- **Combined Testing**: Use both for comprehensive coverage

## Future Enhancements

- **Advanced XSD Validation**: Full XML schema validation
- **Custom Schema Support**: User-defined XSD schemas
- **Batch Processing**: Parallel sample generation
- **Caching**: Local storage of downloaded XML
- **Metrics**: Detailed linguistic diversity analysis

## Contributing

To add support for new projects:

1. Update the project index in `src/index.toml`
2. Add appropriate XSD schema mapping
3. Test with the validation system
4. Update documentation

## License

This system is part of the wn-ts-core package and follows the same licensing terms.

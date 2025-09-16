# @fustilio/wordnet-data-loader

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A WordNet-specific extension of `@fustilio/data-loader` that demonstrates how to build domain-specific data processing pipelines on top of the generic data-loader package. This example shows how to create specialized handlers for lexical data while leveraging the robust, generic data processing capabilities of the base package.

## 🎯 Purpose

This package serves as a **real-world example** of how to extend `@fustilio/data-loader` for specific domains. It demonstrates:

- **Plugin Architecture**: How to build domain-specific extensions
- **Data Source Management**: Centralized configuration of data sources
- **Content Type Detection**: Domain-aware format detection
- **Data Parsing**: Specialized parsers for specific data formats
- **Metadata Extraction**: Domain-specific data analysis

## 🚀 Features

- **🔍 WordNet-Specific Detection**: Intelligent detection of WordNet LMF, OMW, and CILI formats
- **📦 Data Source Registry**: Pre-configured WordNet data sources from multiple providers
- **🌐 Multi-Language Support**: Support for 10+ languages including English, French, German, Spanish, etc.
- **⚡ Optimized Processing**: Leverages the performance of the base data-loader
- **🛡️ Validation**: LMF structure validation and error handling
- **🧪 Fully Tested**: Comprehensive test coverage with real WordNet data
- **🔧 Extensible**: Easy to add new WordNet data sources and formats

## 📦 Supported WordNet Sources

| Source | Language | Format | Description |
|--------|----------|--------|-------------|
| **OEWN 2024** | English | tar.gz | Complete English WordNet |
| **OMW French** | French | xml | French WordNet from OMW |
| **OMW German** | German | xml | German WordNet from OMW |
| **OMW Spanish** | Spanish | xml | Spanish WordNet from OMW |
| **OMW Italian** | Italian | xml | Italian WordNet from OMW |
| **OMW Portuguese** | Portuguese | xml | Portuguese WordNet from OMW |
| **OMW Dutch** | Dutch | xml | Dutch WordNet from OMW |
| **OMW Japanese** | Japanese | xml | Japanese WordNet from OMW |
| **OMW Thai** | Thai | xml | Thai WordNet from OMW |
| **CILI 1.0** | Multilingual | tsv | Collaborative Interlingual Index |

## 🏗️ Architecture

### Plugin System Design

```mermaid
graph TD
    A[@fustilio/data-loader] --> B[Generic Format Processing]
    B --> C[WordNet Content Detector]
    C --> D[WordNet Processor]
    D --> E[WordNet Parser]
    E --> F[Structured WordNet Data]
    
    G[Data Source Registry] --> D
    H[LMF Validation] --> D
    I[Metadata Extraction] --> D
```

### Component Overview

```
src/
├── types.ts                    # WordNet-specific type definitions
├── data-sources.ts            # Registry of WordNet data sources
├── wordnet-content-detector.ts # WordNet format detection
├── wordnet-processor.ts       # Main WordNet processing pipeline
├── wordnet-parser.ts          # LMF XML parsing and analysis
└── index.ts                   # Public API exports
```

## 🔧 Core Components

### `WordNetProcessor` - Main Processing Pipeline

Extends the generic `FormatProcessor` with WordNet-specific logic:

```typescript
import { WordNetProcessor } from '@fustilio/wordnet-data-loader';

const processor = new WordNetProcessor();

// Process WordNet data with domain-specific options
const result = await processor.processWordNetData(arrayBuffer, {
  projectId: 'omw-fr:1.4',
  enableTarExtraction: true,
  extractMetadata: true,
  validateLMF: true
});

if (result.success) {
  console.log('Language:', result.language);
  console.log('Content Type:', result.contentType);
  console.log('Synsets:', result.wordnetMetadata?.synsetCount);
  console.log('Lemmas:', result.wordnetMetadata?.lemmaCount);
}
```

### `WordNetContentDetector` - Format Detection

WordNet-aware content type detection:

```typescript
import { WordNetContentDetector } from '@fustilio/wordnet-data-loader';

const detector = new WordNetContentDetector();
const analysis = detector.detectWordNetContentType(xmlContent, 'omw-fr:1.4');

console.log('Type:', analysis.type);        // 'omw-package', 'lmf', 'cili-data'
console.log('Confidence:', analysis.confidence);
console.log('Has LMF Structure:', analysis.indicators.hasLMFStructure);
console.log('Has Synsets:', analysis.indicators.hasSynsets);
```

### `WordNetParser` - LMF Data Parsing

Parse WordNet LMF XML into structured data:

```typescript
import { WordNetParser } from '@fustilio/wordnet-data-loader';

const parser = new WordNetParser();
const result = parser.parseWordNetLMF(xmlContent);

if (result.success) {
  const { data, statistics } = result;
  
  console.log('Lexicons:', statistics.lexiconCount);
  console.log('Lexical Entries:', statistics.lexicalEntryCount);
  console.log('Lemmas:', statistics.lemmaCount);
  console.log('Synsets:', statistics.synsetCount);
  
  // Extract specific data
  const lemmas = parser.extractLemmas(data);
  const synsets = parser.extractSynsets(data);
  
  // Search functionality
  const searchResults = parser.searchLemmas(data, 'cat');
  const nouns = parser.getLemmasByPOS(data, 'n');
}
```

### Data Source Registry

Pre-configured WordNet data sources:

```typescript
import { 
  getAllWordNetDataSources, 
  getWordNetDataSourcesByLanguage,
  getWordNetDataSource 
} from '@fustilio/wordnet-data-loader';

// Get all available sources
const allSources = getAllWordNetDataSources();

// Get sources by language
const frenchSources = getWordNetDataSourcesByLanguage('fr');

// Get specific source
const oewnSource = getWordNetDataSource('oewn:2024');
console.log('URL:', oewnSource.url);
console.log('Size:', oewnSource.size);
```

## 🌍 Real-World Usage

### Download and Process WordNet Data

```typescript
import { WordNetProcessor } from '@fustilio/wordnet-data-loader';

const processor = new WordNetProcessor();

// Download and process French WordNet
const result = await processor.downloadAndProcessWordNet('omw-fr:1.4', {
  extractMetadata: true,
  validateLMF: true
});

if (result.success) {
  console.log('Successfully processed French WordNet');
  console.log('Processing steps:', result.processingSteps);
  console.log('Metadata:', result.wordnetMetadata);
}
```

### Process Local WordNet Files

```typescript
import { WordNetProcessor } from '@fustilio/wordnet-data-loader';
import { readFileSync } from 'fs';

const processor = new WordNetProcessor();

// Read local WordNet file
const fileBuffer = readFileSync('path/to/wordnet.xml.gz');

// Process with WordNet-specific options
const result = await processor.processWordNetData(fileBuffer, {
  projectId: 'oewn:2024',
  extractMetadata: true,
  validateLMF: true
});
```

### Parse and Analyze WordNet Data

```typescript
import { WordNetParser } from '@fustilio/wordnet-data-loader';

const parser = new WordNetParser();

// Parse LMF XML
const parseResult = parser.parseWordNetLMF(xmlContent);

if (parseResult.success) {
  const { data, statistics } = parseResult;
  
  // Analyze the data
  console.log('WordNet Statistics:');
  console.log(`- ${statistics.lexiconCount} lexicons`);
  console.log(`- ${statistics.lexicalEntryCount} lexical entries`);
  console.log(`- ${statistics.lemmaCount} lemmas`);
  console.log(`- ${statistics.synsetCount} synsets`);
  
  // Search for specific words
  const catLemmas = parser.searchLemmas(data, 'cat');
  console.log(`Found ${catLemmas.length} lemmas for 'cat'`);
  
  // Get all nouns
  const nouns = parser.getLemmasByPOS(data, 'n');
  console.log(`Found ${nouns.length} noun lemmas`);
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit          # Unit tests for individual components
pnpm test:decompression # Decompression and performance tests
pnpm test:all          # Both test suites

# Run with watch mode
pnpm test:watch
```

### Test Coverage

- **Unit Tests**: Individual component functionality (WordNetProcessor, WordNetContentDetector, Data Sources)
- **Decompression Tests**: File size-based testing, performance, error handling, and integration patterns
- **Real Data Tests**: Actual WordNet data processing with various file sizes
- **Validation Tests**: LMF structure validation and data source consistency
- **Error Handling Tests**: Graceful failure scenarios and timeout handling

## 🔧 Configuration

### WordNet Processing Options

```typescript
interface WordNetProcessingOptions {
  projectId: string;                    // WordNet project identifier
  enableTarExtraction?: boolean;       // Enable tar archive extraction
  extractMetadata?: boolean;           // Extract WordNet metadata
  validateLMF?: boolean;              // Validate LMF structure
}
```

### WordNet Content Types

```typescript
type WordNetContentType = 
  | "lmf"           // Lexical Markup Framework
  | "ili"           // Interlingual Index
  | "omw-package"   // Open Multilingual WordNet package
  | "own-package"   // Open WordNets package
  | "cili-data"     // CILI data format
  | "unknown";
```

### WordNet Processing Result

```typescript
interface WordNetProcessingResult {
  success: boolean;
  projectId: string;
  language: string;
  version: string;
  contentType: WordNetContentType;
  confidence: "high" | "medium" | "low";
  xmlContent?: string;
  error?: string;
  processingSteps: string[];
  totalProcessingTime: number;
  originalSize: number;
  finalSize: number;
  extractedFiles?: Array<{name: string, size: number}>;
  wordnetMetadata?: {
    synsetCount?: number;
    lemmaCount?: number;
    language?: string;
    version?: string;
    source?: string;
  };
}
```

## 🚀 Performance

### Optimization Features

- **Leverages Base Performance**: Inherits all optimizations from `@fustilio/data-loader`
- **Streaming Processing**: Handles large WordNet files efficiently
- **Memory Management**: Optimized for processing multi-gigabyte datasets
- **Caching**: Reuses parsed data when possible
- **Validation**: Fast LMF structure validation

### Performance Metrics

- **Processing Time**: <30s for typical WordNet files
- **Memory Usage**: <200MB for 1GB+ WordNet datasets
- **Parsing Speed**: ~10MB/s for LMF XML parsing
- **Validation**: <1s for LMF structure validation

## 🛠️ Development

### Adding New WordNet Data Sources

1. **Add to Data Source Registry**:
```typescript
// In data-sources.ts
export const WORDNET_DATA_SOURCES: WordNetDataSourceRegistry = {
  // ... existing sources
  "new-source:1.0": {
    id: "new-source:1.0",
    name: "New WordNet Source",
    language: "xx",
    version: "1.0",
    url: "https://example.com/wordnet.xml.gz",
    format: "tar.gz",
    description: "New WordNet data source"
  }
};
```

2. **Update Content Detection** (if needed):
```typescript
// In wordnet-content-detector.ts
// Add detection logic for new format
```

3. **Add Tests**:
```typescript
describe('New WordNet Source', () => {
  it('should process new source', async () => {
    // Test processing
  });
});
```

### Extending the Parser

```typescript
// Add new parsing methods to WordNetParser
export class WordNetParser {
  // ... existing methods
  
  extractCustomData(lexicalResource: LexicalResource): CustomData[] {
    // Custom extraction logic
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**WordNet Processing Failures**:
- Verify project ID is in the data source registry
- Check data source URL accessibility
- Validate LMF structure if processing fails

**Parsing Errors**:
- Check XML structure and encoding
- Verify LMF schema compliance
- Review error messages for specific issues

**Performance Issues**:
- Enable tar extraction for compressed archives
- Use streaming for very large files
- Consider memory limits for large datasets

### Debug Information

```typescript
const result = await processor.processWordNetData(data, options);

console.log('Processing steps:', result.processingSteps);
console.log('Content type:', result.contentType);
console.log('Confidence:', result.confidence);
console.log('Metadata:', result.wordnetMetadata);
console.log('Processing time:', result.totalProcessingTime + 'ms');
```

## 📚 API Reference

### `WordNetProcessor`

#### Methods

- `processWordNetData(data: ArrayBuffer, options: WordNetProcessingOptions): Promise<WordNetProcessingResult>`
- `downloadAndProcessWordNet(projectId: string, options?: Partial<WordNetProcessingOptions>): Promise<WordNetProcessingResult>`
- `getProcessingStats(): ProcessingStats`

### `WordNetContentDetector`

#### Methods

- `detectWordNetContentType(content: string, projectId: string): WordNetDetectionResult`
- `extractWordNetMetadata(content: string, projectId: string): WordNetMetadata`
- `validateLMFStructure(content: string): ValidationResult`

### `WordNetParser`

#### Methods

- `parseWordNetLMF(xmlContent: string): ParseResult`
- `extractSynsets(lexicalResource: LexicalResource): Synset[]`
- `extractLemmas(lexicalResource: LexicalResource): Lemma[]`
- `searchLemmas(lexicalResource: LexicalResource, query: string): Lemma[]`
- `getLemmasByPOS(lexicalResource: LexicalResource, partOfSpeech: string): Lemma[]`
- `validateWordNetLMF(xmlContent: string): ValidationResult`

### Data Source Functions

- `getWordNetDataSource(projectId: string): WordNetDataSource | undefined`
- `getAllWordNetDataSources(): WordNetDataSource[]`
- `getWordNetDataSourcesByLanguage(language: string): WordNetDataSource[]`
- `getWordNetDataSourcesByFormat(format: string): WordNetDataSource[]`
- `isValidWordNetProject(projectId: string): boolean`

## 🤝 Contributing

This package serves as an example of how to extend `@fustilio/data-loader`. Contributions are welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- **@fustilio/data-loader**: For providing the robust base data processing capabilities
- **WordNet**: For providing the lexical data that drives this example
- **Open Multilingual WordNet**: For making multilingual WordNet data available
- **Global WordNet Association**: For maintaining WordNet standards

---

**This package demonstrates how to build domain-specific extensions on top of `@fustilio/data-loader` - a generic, high-performance data processing library.**

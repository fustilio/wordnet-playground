# wn-data-loader

Data loading and processing utilities for the WordNet TypeScript ecosystem.

## Features

- **Multi-format Support** - LMF XML, OMW packages, CILI data, and more
- **Multi-language** - Support for 10+ languages including English, French, German, Spanish
- **High Performance** - Optimized processing for large WordNet datasets
- **Smart Detection** - Automatic format detection and content type analysis
- **Validation** - LMF structure validation and error handling
- **Metadata Extraction** - Comprehensive statistics and metadata analysis
- **Fully Tested** - Comprehensive test coverage with real WordNet data

## Installation

```bash
npm install wn-data-loader
```

## Usage

### Basic Data Loading
```typescript
import { WordNetProcessor } from 'wn-data-loader';

const processor = new WordNetProcessor();
const result = await processor.processWordNetData(arrayBuffer, {
  projectId: 'oewn:2024',
  extractMetadata: true,
  validateLMF: true
});
```

### Data Management
```typescript
import { DataLoader } from 'wn-data-loader';

const loader = new DataLoader({
  enableCaching: true,
  cacheDirectory: '/tmp/wordnet-cache'
});

const data = await loader.loadProject('oewn:2024');
```

### Validation
```typescript
const result = await processor.processWordNetData(arrayBuffer, {
  projectId: 'oewn:2024',
  validateLMF: true
});

if (result.validationErrors.length > 0) {
  console.warn('Validation errors:', result.validationErrors);
}
```

## Configuration

```typescript
const options = {
  projectId: 'oewn:2024',
  extractMetadata: true,
  validateLMF: true,
  enableCaching: true,
  cacheDirectory: '/tmp/wordnet-cache',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  timeout: 30000 // 30 seconds
};
```

## Error Handling

```typescript
import { ValidationError, ProcessingError } from 'wn-data-loader';

try {
  const result = await processor.processWordNetData(arrayBuffer, options);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof ProcessingError) {
    console.error('Processing failed:', error.message);
  }
}
```

## Further Reading

- [API Reference](../../docs/api/UNIFIED_API.md)
- [Examples](../../docs/examples/README.md)
- [Getting Started](../../docs/getting-started/README.md)
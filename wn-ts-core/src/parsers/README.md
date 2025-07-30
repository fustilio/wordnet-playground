# LMF Parsers Module

This module provides various parser implementations for LMF (Lexical Markup Framework) XML files, each optimized for different use cases and performance requirements.

## Overview

The parsers module is organized into several categories:

- **Counting parsers**: Ultra-fast parsers that only count elements (for benchmarking)
- **Streaming parsers**: Memory-efficient parsers for large files
- **Memory parsers**: In-memory parsers for smaller files
- **Legacy parsers**: Original implementations for compatibility
- **External parsers**: Parsers that use external tools (e.g., Python)

## Quick Start

```typescript
import { getDefaultParser, getParser } from './parsers/index.js';

// Use the recommended parser (Full Streaming Parser)
const parser = getDefaultParser();
const result = await parser.parse('path/to/file.xml');

// Or use a specific parser
const nativeParser = getParser('native-xml');
const result = await nativeParser.parse('path/to/file.xml');
```

## Available Parsers

### Counting Parsers (Benchmarking Only)

- **`native-xml`**: Native XML Parser (regex) - Ultra-fast regex-based XML element counting
- **`string-counting`**: String Counting Parser - Ultra-fast string-based element counting

### Streaming Parsers (Recommended for Production)

- **`streaming-sax`**: Optimized Streaming Parser (sax, stream) - Streaming SAX parser for memory-efficient parsing of large files
- **`full-streaming`**: Full Streaming Parser - Complete LMF streaming parser with full data extraction

### Memory Parsers

- **`optimized-sax`**: Optimized SAX Parser - SAX parser with minimal processing for maximum speed
- **`in-memory-sax`**: In-memory Parser (sax, string) - SAX parser that loads entire file into memory before parsing

### Legacy Parsers

- **`legacy`**: Legacy Parser - Original parser using fast-xml-parser library

### External Parsers

- **`python`**: Python Parser - Parser using Python via pythonia library

## Parser Registry

The module provides a registry system for easy access to all parsers:

```typescript
import { 
  getParserNames, 
  getAllParserInfo, 
  getRecommendedParsers,
  getParsersByCategory 
} from './parsers/index.js';

// Get all available parser names
const names = getParserNames();

// Get detailed information about all parsers
const allInfo = getAllParserInfo();

// Get only recommended parsers
const recommended = getRecommendedParsers();

// Get parsers by category
const streamingParsers = getParsersByCategory('streaming');
const countingParsers = getParsersByCategory('counting');
```

## Performance Characteristics

Based on benchmark results:

### Tiny Files (1 word, 1 synset)
1. **String Counting Parser** - Fastest (1.52x faster than Native XML)
2. **Native XML Parser** - Very fast
3. **In-memory Parser** - Fast
4. **Optimized SAX Parser** - Good
5. **Legacy Parser** - Moderate
6. **Streaming Parser** - Slower but memory efficient
7. **Full Streaming Parser** - Slowest but most complete

### Small Files (10 words, 10 synsets)
1. **Native XML Parser** - Fastest (1.18x faster than String Counting)
2. **String Counting Parser** - Very fast
3. **Legacy Parser** - Good
4. **In-memory Parser** - Good
5. **Streaming Parser** - Moderate
6. **Optimized SAX Parser** - Slower
7. **Full Streaming Parser** - Slowest but most complete

## Recommendations

- **For benchmarking**: Use `native-xml` or `string-counting`
- **For production with large files**: Use `full-streaming`
- **For production with small files**: Use `legacy` or `in-memory-sax`
- **For memory-constrained environments**: Use `streaming-sax`

## File Structure

```
src/parsers/
├── index.ts          # Main exports and re-exports
├── base.ts           # Base interfaces and types
├── registry.ts       # Parser registry and utilities
├── native-xml.ts     # Ultra-fast counting parsers
├── optimized-sax.ts  # Optimized SAX parser
├── streaming-sax.ts  # Streaming parsers
├── in-memory-sax.ts  # In-memory parsers
├── legacy.ts         # Legacy parser
├── python.ts         # Python parser
└── README.md         # This file
```

## Adding New Parsers

To add a new parser:

1. Create a new file in the `parsers/` directory
2. Implement the `LMFParser` interface
3. Export a factory function
4. Add the parser to the registry in `registry.ts`
5. Update this README

Example:

```typescript
// my-parser.ts
import type { LMFParser } from './base.js';
import type { LMFDocument, LMFLoadOptions } from '../lmf.js';

export class MyParser implements LMFParser {
  readonly name = 'My Parser';
  readonly description = 'Description of my parser';

  async parse(filePath: string, options: LMFLoadOptions = {}): Promise<LMFDocument> {
    // Implementation here
    return { /* ... */ };
  }
}

export const createMyParser = (): LMFParser => new MyParser();
```

Then add to registry:

```typescript
// registry.ts
import { createMyParser } from './my-parser.js';

export const PARSER_REGISTRY: Record<string, ParserInfo> = {
  // ... existing parsers
  'my-parser': {
    name: 'My Parser',
    description: 'Description of my parser',
    factory: createMyParser,
    category: 'memory', // or appropriate category
    recommended: false,
  },
};
``` 
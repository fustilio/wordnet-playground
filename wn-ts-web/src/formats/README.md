# Format Handlers

This directory contains modular handlers for different file formats that can be tested independently. The original issue was that the `data-loader.ts` was trying to handle too many file formats in one massive method, making it hard to debug and maintain.

## Problem Solved

The original issue was that French WordNet packages (`omw-fr:1.4`) were being downloaded and XZ decompressed successfully, but then the process would stop. This happened because:

1. **XZ decompression worked**: The package was downloaded and XZ decompressed to 22,861,579 bytes
2. **Tar detection failed**: The system didn't properly detect that the decompressed content was a tar archive
3. **Tar extraction was missing**: The logic to extract tar archives and find LMF files was incomplete

## Solution

We've broken down the monolithic `loadData` method into separate, testable modules:

### 1. **ContentTypeDetector** (`content-type-detector.ts`)
- Detects file types from decompressed content
- Handles tar archive detection with confidence levels
- Provides detailed analysis of content indicators

### 2. **GzipHandler** (`gzip-handler.ts`)
- Handles gzip decompression with detailed logging
- Includes timeout protection to prevent hanging
- Yields to UI thread to prevent freezing

### 3. **XzHandler** (`xz-handler.ts`)
- Handles XZ decompression using `xz-decompress`
- Detects tar archives after decompression
- Provides detailed logging and error handling

### 4. **TarHandler** (`tar-handler.ts`)
- Extracts tar archives to find LMF XML files
- Handles both binary and text-based tar extraction
- Provides fallback extraction methods

### 5. **FormatProcessor** (`format-processor.ts`)
- Orchestrates all handlers in a processing pipeline
- Handles the complete flow from download to XML extraction
- Provides detailed processing steps and timing information

## Usage

### Basic Usage
```typescript
import { FormatProcessor } from "./formats/index.js";

const processor = new FormatProcessor();
const result = await processor.processData(data, {
  projectId: "omw-fr:1.4",
  enableTarExtraction: true
});

if (result.success) {
  console.log("XML content:", result.xmlContent);
  console.log("Processing steps:", result.processingSteps);
} else {
  console.error("Failed:", result.error);
}
```

### Individual Handler Usage
```typescript
import { XzHandler, TarHandler } from "./formats/index.js";

const xzHandler = new XzHandler();
const tarHandler = new TarHandler();

// Check if data is XZ compressed
if (xzHandler.isXzCompressed(data)) {
  const decompressed = await xzHandler.decompress(data);
  
  // Check if decompressed content is a tar archive
  if (tarHandler.isTarArchive(decompressed.data)) {
    const extracted = await tarHandler.extractTarArchive(data);
    console.log("Extracted XML:", extracted.xmlContent);
  }
}
```

## Testing

Each handler can be tested independently:

```bash
# Test all format handlers
pnpm test src/formats/

# Test specific handler
pnpm test src/formats/__tests__/format-processor.test.ts
```

## Benefits

1. **Modular**: Each handler has a single responsibility
2. **Testable**: Can test compression, detection, and extraction separately
3. **Maintainable**: Easy to fix issues in specific handlers
4. **Debuggable**: Clear logging and error handling for each step
5. **Reusable**: Handlers can be used in other parts of the codebase

## Fix for the Original Issue

The French WordNet package issue is now fixed because:

1. **XZ decompression** is handled by `XzHandler` with proper error handling
2. **Tar detection** is improved in `ContentTypeDetector` with better indicators
3. **Tar extraction** is handled by `TarHandler` with fallback methods
4. **Processing pipeline** is orchestrated by `FormatProcessor` with detailed logging

The system now properly:
- Decompresses XZ files
- Detects tar archives after decompression
- Extracts tar archives to find LMF XML files
- Continues with LMF processing

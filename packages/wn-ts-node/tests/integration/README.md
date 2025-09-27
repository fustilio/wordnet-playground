# Integration Tests

This directory contains integration tests for the `wn-ts-node` package. Integration tests verify that different components work together correctly.

## Test Files

- `data-loading-integration.test.ts` - Data loading integration tests
- `lmf/` - LMF (Lexical Markup Framework) integration tests
  - `lmf-core.test.ts` - Core LMF functionality tests
  - `lmf-enhanced.test.ts` - Enhanced LMF features tests
  - `lmf-performance.test.ts` - LMF performance tests
  - `lmf-python-comparison.test.ts` - Python comparison tests
  - `lmf-streaming.test.ts` - Streaming LMF parser tests
  - `lmf-versions.test.ts` - LMF version compatibility tests
  - `lmf.test.ts` - Main LMF tests
  - `streaming-sax-parser.test.ts` - SAX parser tests
  - `test-config.ts` - LMF test configuration
  - `README.md` - LMF documentation
- `platform-integration/` - Platform integration tests
  - `node-platform.test.ts` - Node.js platform specific tests

## Running Integration Tests

```bash
# Run all integration tests
pnpm test tests/integration

# Run LMF integration tests
pnpm test tests/integration/lmf

# Run platform integration tests
pnpm test tests/integration/platform-integration
```

## Test Characteristics

- **Component Interaction**: Tests how different parts of the system work together
- **Data Processing**: Tests data loading and parsing workflows
- **LMF Integration**: Validates LMF format support and processing
- **Platform Specific**: Tests Node.js specific functionality

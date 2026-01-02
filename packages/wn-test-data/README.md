# wn-test-data

Test data fixtures for WordNet packages. Provides sample WordNet data for testing across the ecosystem.

## Purpose

This package contains minimal WordNet data samples used for testing without requiring large downloads. Test data is sourced from https://github.com/goodmami/wn/tree/main/tests/data

## Features

- ✅ Fast test execution (no large downloads)
- ✅ Offline testing capability
- ✅ Consistent test data across packages
- ✅ Small repository size

## Structure

```
wn-test-data/
├── data/              # Test data files
└── package.json
```

## Usage

### In Tests

```typescript
// Reference test data in your tests
const testDataPath = require.resolve('wn-test-data/data/sample.xml');
```

### Example

```typescript
import { readFileSync } from 'fs';
import { resolve } from 'path';

const testDataDir = resolve(__dirname, '../node_modules/wn-test-data/data');
const sampleXML = readFileSync(`${testDataDir}/sample.xml`, 'utf-8');
```

## Test Data Characteristics

- ✅ Valid LMF XML format
- ✅ Minimal but complete samples
- ✅ Small file sizes (<100KB)
- ✅ Representative test cases

## Used By

- `wn-ts-core` - Core library tests
- `wn-ts-web` - Web package tests
- `wn-ts-node` - Node.js package tests
- `wn-data-loader` - Data loader tests
- All workspace test suites

## License

MIT - Test data only, sourced from https://github.com/goodmami/wn

## Related Packages

- [wn-ts-core](../wn-ts-core) - Core WordNet library
- [wn-data-loader](../wn-data-loader) - Data loading utilities
- [utils](../utils) - Shared utilities
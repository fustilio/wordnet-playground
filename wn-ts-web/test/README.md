# Testing `wn-ts-web`

This package is tested across multiple layers to ensure robust functionality in different environments.

## Test Layers

Our testing strategy is divided into three main layers, each building on the last:

1.  **Non-Browser Functional Tests (`test/`)**:
    -   **Environment**: Node.js with `jsdom` to simulate browser APIs.
    -   **Scope**: Core logic, unit tests, and integration tests that don't require a real browser. This includes data processing, factory functions, and query service logic.
    -   **Goal**: To verify the correctness of the core library in a fast, controlled environment.

2.  **Browser Functional Tests (`test/browser/`)**:
    -   **Environment**: A real browser (Chromium) using Vitest's browser mode.
    -   **Scope**: Tests for browser-specific APIs like OPFS, SQLite WASM integration, and Web Workers. These tests mock network requests but use real browser features.
    -   **Goal**: To ensure that components interacting directly with browser APIs work as expected.

3.  **Browser End-to-End (E2E) Tests (`test/browser/e2e/`)**:
    -   **Environment**: A real browser (Chromium) with a live ephemeral database.
    -   **Scope**: Full application workflow tests. These tests download and process a complete WordNet dataset from a remote source, simulating real-world usage.
    -   **Goal**: To validate the entire system, from data download to querying, in a production-like environment.

## Comprehensive Data Validation Testing

Our test suite includes comprehensive data validation tests that mirror the test data patterns from the [goodmami/wn repository](https://uithub.com/goodmami/wn/tree/main/tests) to ensure we handle the same edge cases and data integrity scenarios.

### New Test Suites

#### 1. `data-validation.test.ts` - Core Data Validation
Tests fundamental data storage correctness and retrieval accuracy:
- **Data Storage Correctness**: Verifies that lexicon metadata, words, synsets, and senses are stored with correct properties
- **Data Retrieval Accuracy**: Tests consistent results, case-insensitive searches, and part-of-speech filtering
- **Data Relationships and Integrity**: Validates word-synset relationships through senses and referential integrity
- **Data Statistics and Consistency**: Ensures logical relationships between statistics and consistent lexicon-specific data
- **Edge Cases and Error Handling**: Tests empty results, special characters, long terms, and mixed content
- **Data Quality Metrics**: Validates ILI coverage, part-of-speech distribution, and synset size analysis
- **Cross-Entity Query Consistency**: Tests consistency across different query methods and handles circular references

#### 2. `edge-case-validation.test.ts` - Edge Case Handling
Tests specific edge cases that mirror the E101 test data patterns:
- **Duplicate ID Handling (E101 Pattern Tests)**: Tests scenarios from E101-0.xml, E101-1.xml, E101-2.xml, E101-3.xml
  - Duplicate lexical entry IDs
  - Duplicate sense IDs  
  - Duplicate synset IDs
  - Cross-entity duplicate IDs
- **Reference Integrity Validation**: Tests referential integrity between entities and handles orphaned references
- **Data Consistency Edge Cases**: Tests entities with missing optional properties and minimal required data
- **Boundary Value Testing**: Tests very long IDs, long text content, and empty/whitespace terms
- **Concurrent Access and Race Conditions**: Tests concurrent queries without data corruption
- **Error Recovery and Resilience**: Tests graceful handling of database errors and data consistency maintenance

#### 3. `xml-parsing-validation.test.ts` - XML Parsing Validation
Tests XML parsing and data loading scenarios:
- **LMF Version Compatibility**: Tests LMF 1.0, 1.1, 1.3, and 1.4 format handling
- **Sense Key Variations**: Tests various sense key formats and member ordering
- **XML Structure Validation**: Tests parsing of LexicalResource, Lexicon, LexicalEntry, Lemma, Sense, Synset, and Definition elements
- **XML Attribute Handling**: Tests required/optional attributes and value escaping
- **XML Content Validation**: Tests mixed content, CDATA sections, comments, and whitespace handling
- **Data Loading Validation**: Tests complete lexicon loading, relationship maintenance, and large dataset efficiency

### Test Data Patterns Covered

Our tests cover the same scenarios as the goodmami/wn repository test files:

- **E101-0.xml**: Duplicate lexical entry IDs
- **E101-1.xml**: Duplicate sense IDs  
- **E101-2.xml**: Duplicate synset IDs
- **E101-3.xml**: Cross-entity duplicate IDs
- **mini-lmf-1.0.xml, mini-lmf-1.1.xml, mini-lmf-1.3.xml, mini-lmf-1.4.xml**: LMF version compatibility
- **sense-key-variations.xml**: Sense key format variations
- **sense-member-order.xml**: Sense member ordering
- **test-package/test-wn.xml**: General test package validation

### Data Integrity Validation

These tests ensure that:

1. **Data is stored correctly** with all required properties and correct data types
2. **Data can be retrieved accurately** with consistent results across multiple queries
3. **Referential integrity is maintained** between words, senses, and synsets
4. **Edge cases are handled gracefully** without data corruption or crashes
5. **XML parsing is robust** and handles various LMF formats correctly
6. **Large datasets are processed efficiently** with proper memory management
7. **Error conditions are handled gracefully** with proper recovery mechanisms

## Running Tests

The following commands are available to run the test suites.

### Run All Tests
This command executes both Node.js and browser test suites.

```bash
pnpm test
```

### Run Node.js Tests Only
This command runs the unit and integration tests in the `jsdom` environment.

```bash
pnpm test:node
```

### Run Browser Tests Only
This command runs the browser-specific tests in a headless Chromium instance.

```bash
pnpm test:browser
```

### Run E2E Tests Only
This command runs the end-to-end tests in a headless Chromium instance.

```bash
pnpm test:e2e
```

### Run Data Validation Tests Only
This command runs the comprehensive data validation test suites.

```bash
pnpm vitest run test/data-validation.test.ts test/edge-case-validation.test.ts test/xml-parsing-validation.test.ts
```

### Run Tests in Watch Mode
For interactive development, you can run tests in watch mode.

```bash
# Watch Node.js tests
pnpm vitest

# Watch browser tests
pnpm vitest --config=vitest.browser.config.ts
```

## Test Coverage

Our comprehensive test suite covers:

- **Core Functionality**: Factory functions, data loading, query services
- **Data Validation**: Storage correctness, retrieval accuracy, relationship integrity
- **Edge Cases**: Duplicate IDs, invalid references, missing properties
- **XML Parsing**: LMF format compatibility, attribute handling, content validation
- **Browser Integration**: OPFS, SQLite WASM, Web Workers
- **Performance**: Large dataset handling, concurrent access, error recovery
- **Error Handling**: Graceful failure handling, recovery mechanisms, data consistency

## Quality Assurance

These tests ensure that wn-ts-web:

1. **Correctly stores WordNet data** in the browser database
2. **Accurately retrieves data** with proper relationships maintained
3. **Handles edge cases gracefully** without data corruption
4. **Processes XML data correctly** across different LMF versions
5. **Maintains data integrity** under various error conditions
6. **Provides consistent results** across multiple query operations
7. **Handles large datasets efficiently** in browser environments

By mirroring the test data patterns from the goodmami/wn repository, we ensure that our implementation handles the same edge cases and maintains the same level of data integrity as the reference implementation.

# End-to-End Tests

This directory contains comprehensive end-to-end tests for the WordNet TypeScript library, organized by functionality and use case.

## Test Organization

### `/query/` - Query Functionality Tests

These tests demonstrate various ways to use the WordNet client for querying data:

- **`basic-queries.e2e.test.ts`** - Basic word, synset, and sense queries
  - Word search by form, part of speech, fuzzy matching
  - Synset discovery and filtering
  - Sense lookup and relationships
  - Lexicon filtering and management
  - Error handling for invalid queries

- **`definitions.e2e.test.ts`** - Definition retrieval and management
  - Basic definition retrieval by synset ID
  - Definition content quality validation
  - Multiple definitions per synset handling
  - Definition access through different methods
  - Performance testing for definition queries

- **`translations.e2e.test.ts`** - Cross-language translation functionality
  - Word and synset discovery across languages
  - ILI-based translation workflows
  - Language-specific Wordnet instances
  - Cross-language concept mapping
  - Translation and cognate discovery
  - Cultural context retrieval

- **`thesaurus.e2e.test.ts`** - Thesaurus and semantic relationship functionality
  - Synonym discovery with formality and frequency assessment
  - Antonym discovery through relations
  - Hierarchical relationships (hypernyms, hyponyms, coordinates)
  - Meronym/holonym relationships
  - Semantic similarity discovery
  - Word sense disambiguation
  - Batch thesaurus operations

- **`comprehensive-queries.e2e.test.ts`** - Core query service functionality
  - All basic query methods
  - Advanced filtering options
  - Direct query service access
  - Data retrieval by ID
  - Statistics and metadata
  - Performance and scalability testing

### `/initialization/` - Setup and Data Management Tests

These tests focus on the setup, configuration, and data management aspects:

- **`lexicon-management.e2e.test.ts`** - Lexicon download and management
  - Lexicon download and installation
  - Duplicate installation handling
  - Lexicon removal and reinstallation
  - Project configuration and validation
  - Data directory management
  - Error handling for invalid operations

### `/shared/` - Shared Test Utilities

- **`test-setup.ts`** - Common test setup utilities
  - Shared test environment setup
  - Lexicon download and installation
  - Database initialization
  - Cleanup utilities

## Test Structure

Each test file follows a consistent pattern:

1. **Setup** - Uses `setupTestEnvironment()` to create a shared WordNet client
2. **Focused Testing** - Each test demonstrates specific functionality
3. **Cleanup** - Automatic cleanup of test data and resources

## Running Tests

### Run all e2e tests:
```bash
pnpm test:e2e
```

### Run specific test categories:
```bash
# Query tests only
pnpm test:e2e query

# Initialization tests only  
pnpm test:e2e initialization

# Specific test file
pnpm test:e2e basic-queries
```

### Run with verbose output:
```bash
pnpm test:e2e --reporter=verbose
```

## Test Data

Tests automatically download and set up required lexicons:
- **OEWN:2024** - Open English WordNet (English)
- **OMW-FR:1.4** - French WordNet (for multilingual tests)
- **CILI:1.0** - Interlingual Index (for translation tests)

## Performance Considerations

- Tests use temporary directories that are cleaned up automatically
- Large lexicons are downloaded only once per test suite
- Concurrent operations are tested for performance validation
- Timeout values are set appropriately for download and processing operations

## Error Handling

Tests include comprehensive error handling validation:
- Invalid input handling
- Network error simulation
- Malformed query handling
- Non-existent data handling
- Edge case validation

## Contributing

When adding new tests:

1. **Choose the right category** - Query vs Initialization
2. **Use shared setup** - Leverage `setupTestEnvironment()`
3. **Focus on functionality** - Each test should demonstrate specific usage
4. **Include error cases** - Test both success and failure scenarios
5. **Document purpose** - Clear test descriptions and logging
6. **Clean up resources** - Ensure proper cleanup in afterAll hooks

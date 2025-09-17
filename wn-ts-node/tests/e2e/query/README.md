# Query Performance Benchmarks

This directory contains comprehensive performance benchmarks for all WordNet query operations, covering every query type tested in the e2e test suite. The benchmarks are organized to compare similar operations, making it easy to identify performance bottlenecks and anomalies.

## Benchmark Files

### `basic-queries.bench.ts`
- **Purpose**: Core query operations and strategy comparisons
- **Coverage**: Words, synsets, senses, lexicons, and query strategy performance
- **Focus**: Individual query operations and performance optimization validation

### `comprehensive-queries.bench.ts`
- **Purpose**: Complete coverage of all query operations with comparative analysis
- **Coverage**: All query types from the e2e test suite, grouped by similarity
- **Focus**: Performance comparison between similar operations to identify bottlenecks
- **Organization**: 
  - **Word Query Performance Comparison**: Different word search methods, POS filters, and lookup approaches
  - **Synset Query Performance Comparison**: Synset searches, filters, and definition access methods
  - **Thesaurus Query Performance Comparison**: Synonym discovery and semantic relationship queries
  - **Cross-Lingual Query Performance Comparison**: Language-specific searches and translation methods
  - **Query Service Performance Comparison**: Direct service access vs. high-level API methods
  - **Concurrent Query Performance Comparison**: Sequential vs. concurrent query execution

## Key Performance Insights

The comprehensive benchmarks reveal several important performance characteristics:

### Word Query Performance
- **`wordsByForm()` is 299x faster** than general `words()` search for form-based queries
- **Direct ID lookup is 2.5x faster** than search-then-get patterns
- **Fuzzy search is 1.7x faster** than exact search (likely due to different query paths)
- **Adverb searches are fastest** among POS types, followed by verbs, adjectives, and nouns

### Synset Query Performance
- **Synset searches are extremely fast** (400k-600k operations/second)
- **Lexicon filtering improves performance** by 24% compared to no filters
- **Direct synset ID lookup is 9x faster** than search-then-get patterns
- **Definition access via synset object is 51x faster** than `getDefinitions()` method

### Thesaurus Operations
- **Adjective synonyms are fastest** (5k ops/sec), followed by nouns (2.9k ops/sec) and verbs (216 ops/sec)
- **Antonym discovery is fastest** among semantic relationships
- **Verb synonym discovery is significantly slower** than other POS types

### Cross-Lingual Performance
- **French word searches are 2.5x faster** than English searches
- **French synset searches are 1.4x faster** than English synset searches
- **ILI-based translation without language filter is 3.8x faster** than with language filter

### Concurrent vs Sequential
- **Concurrent queries are 2x faster** than sequential execution
- **Concurrent definition queries show 20% improvement** over sequential

## Running Benchmarks

### Individual Benchmark Files

```bash
# Run basic query benchmarks
pnpm test:bench:basic

# Run comprehensive query benchmarks
pnpm test:bench:comprehensive

# Run all benchmarks
pnpm test:bench
```

### Specific Benchmark Categories

```bash
# Run with verbose output
pnpm test:bench:comprehensive --reporter=verbose

# Run specific test patterns
pnpm test:bench:comprehensive --grep "Basic Query Operations"
pnpm test:bench:comprehensive --grep "Thesaurus Operations"
pnpm test:bench:comprehensive --grep "Translation"
```

## Benchmark Categories

### 1. Basic Query Operations
Tests core WordNet query functionality:
- **Word Queries**: Form search, POS filtering, fuzzy search, lexicon/language filtering
- **Synset Queries**: Form search, POS filtering, definition access
- **Sense Queries**: Word form and ID-based searches
- **Lexicon/ILI Queries**: Available lexicons, ILI listings, cross-lingual lookups

### 2. Definition Query Operations
Tests definition retrieval and access:
- **Direct Definition Queries**: `getDefinitions()` method
- **Definition Access Methods**: Through synset objects and query service
- **Part-of-Speech Coverage**: Definitions for nouns, verbs, adjectives, adverbs

### 3. Thesaurus Operations
Tests semantic relationship discovery:
- **Synonym Discovery**: Finding synonyms across different parts of speech
- **Hierarchical Relationships**: Hypernyms, hyponyms, coordinate terms
- **Antonym Discovery**: Finding opposite meanings
- **Meronym/Holonym Relationships**: Part-whole relationships
- **Semantic Similarity**: Finding semantically related words

### 4. Translation and Cross-Lingual Operations
Tests multilingual functionality:
- **Cross-Language Word Discovery**: Finding words in different languages
- **ILI-Based Translation**: Using Interlingual Index for translations
- **Cross-Language Concept Mapping**: Finding synsets that share ILIs
- **Complete Translation Workflows**: End-to-end translation processes

### 5. Comprehensive Query Service Methods
Tests direct query service access:
- **Direct Service Access**: Using query service methods directly
- **Individual Entity Retrieval**: Getting entities by ID
- **Database Statistics**: Retrieving database metadata
- **Batch Operations**: Handling multiple queries efficiently

### 6. Performance and Scalability
Tests system performance under load:
- **Concurrent Query Performance**: Parallel query execution
- **Large Result Set Handling**: Processing large datasets
- **Batch Operations**: Efficient bulk operations
- **Memory Usage**: Resource consumption patterns

### 7. Error Handling and Edge Cases
Tests system robustness:
- **Non-existent Data Handling**: Graceful handling of missing data
- **Malformed Query Handling**: Invalid parameter handling
- **Data Consistency**: Verification of consistent results
- **Data Structure Validation**: Ensuring proper data formats

## Performance Expectations

Based on typical results:

### Basic Queries
- **Word Search**: 1,000-10,000+ operations/second
- **Synset Search**: 500-5,000+ operations/second
- **Sense Search**: 1,000-8,000+ operations/second

### Definition Queries
- **Definition Retrieval**: 500-5,000+ operations/second
- **Definition Access**: 1,000-10,000+ operations/second

### Thesaurus Operations
- **Synonym Discovery**: 100-1,000+ operations/second
- **Hierarchical Relationships**: 50-500+ operations/second
- **Semantic Similarity**: 50-200+ operations/second

### Translation Operations
- **Cross-Language Lookups**: 50-500+ operations/second
- **ILI-Based Translation**: 100-1,000+ operations/second
- **Complete Translation Workflows**: 10-100+ operations/second

### Concurrent Operations
- **Parallel Queries**: Should scale linearly with parallelization
- **Batch Operations**: 2-5x faster than individual queries
- **Memory Usage**: Should remain stable under load

## Data Requirements

The comprehensive benchmarks require multiple datasets:

- **OEWN:2024**: English WordNet data
- **OMW-FR:1.4**: French WordNet data  
- **CILI:1.0**: Interlingual Index for cross-lingual mapping

The setup function automatically downloads and prepares all required data.

## Performance Analysis

### Key Metrics

1. **Operations per Second**: Primary performance indicator
2. **Average Response Time**: Latency measurement
3. **Memory Usage**: Resource consumption
4. **Error Rates**: System reliability
5. **Scalability**: Performance under load

### Performance Thresholds

- **Warning**: Query time > 100ms
- **Critical**: Query time > 500ms
- **Memory**: Heap usage > 100MB during queries
- **Errors**: Error rate > 5% for any query type

## Troubleshooting

### Common Issues

1. **Test data not found**: Ensure all required datasets are available
2. **Database errors**: Check that test database is properly initialized
3. **Memory issues**: Increase Node.js heap size if needed
4. **Timeout errors**: Increase Vitest timeout for slow benchmarks

### Debug Mode

Run with debug logging to see detailed query execution:

```bash
WN_TS_LOG_LEVEL=5 pnpm test:bench:comprehensive
```

## Continuous Integration

These benchmarks are designed to run in CI/CD pipelines:

- **Fast execution**: < 5 minutes total for comprehensive suite
- **Deterministic results**: Consistent performance measurements
- **Clear pass/fail criteria**: Performance thresholds
- **Detailed reporting**: Comprehensive performance analysis

## Contributing

When adding new benchmarks:

1. Follow the existing naming conventions
2. Include both individual and workflow tests
3. Add performance analysis where relevant
4. Update this README with new benchmark descriptions
5. Ensure benchmarks are deterministic and fast
6. Test with realistic data patterns

## Related Files

- `../shared/test-setup.ts` - Test environment setup
- `../../src/wordnet.ts` - Main WordNet implementation
- `../../src/query-service.ts` - Query service implementation
- `../../../wn-ts-core/src/` - Core WordNet functionality

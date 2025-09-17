# Bilingual Demo Query Benchmarks

This directory contains comprehensive performance benchmarks for the bilingual demo queries used in wn-ts-web-demo.

## Overview

The bilingual demo requires several specific query operations to work effectively:

1. **Word Search**: Finding words in specific lexicons (`searchWordsInLexicon`)
2. **Sense Lookup**: Getting senses for words (`getSensesByWordIdOrForm`)
3. **Synset Lookup**: Getting synset information (`getSynsetById`)
4. **Definition Lookup**: Getting definitions for synsets (`getDefinitionsBySynsetId`)
5. **ILI Mapping**: Extracting ILI identifiers for cross-lingual mapping (`getIliForSynset`)
6. **Cross-lingual Lookup**: Finding words in target languages with same ILI (`getWordsByIliAndLanguage`)

## Benchmark Files

### `bilingual-demo.bench.ts`
- **Purpose**: Basic benchmarks using simulated data
- **Focus**: Individual query operations and basic workflows
- **Use Case**: Quick performance testing during development

### `realistic-bilingual.bench.ts`
- **Purpose**: Realistic benchmarks using actual multilingual test data
- **Focus**: Complete bilingual workflows with real data
- **Use Case**: Production readiness testing and performance analysis

## Running Benchmarks

### Individual Benchmark Files

```bash
# Run basic bilingual benchmarks
pnpm test:bench:bilingual

# Run realistic multilingual benchmarks
pnpm test:bench:realistic-bilingual

# Run all benchmarks
pnpm test:bench
```

### Comprehensive Benchmark Suite

```bash
# Run all bilingual benchmarks with detailed reporting
pnpm bench:bilingual
```

This will:
- Run both benchmark files
- Generate a detailed performance report
- Save results to `bench-results/` directory
- Provide performance analysis and recommendations

## Benchmark Categories

### 1. Individual Query Operations
Tests the performance of each query operation in isolation:
- Word search in different lexicons
- Sense lookup by word ID
- Synset lookup by ID
- Definition lookup by synset ID
- ILI extraction and cross-lingual mapping

### 2. Bilingual Query Workflows
Tests complete bilingual translation workflows:
- English to French queries
- English to Thai queries
- Multi-language queries with error handling
- Complete bilingual demo workflows

### 3. Performance Analysis
Analyzes performance characteristics:
- Query performance by word complexity
- Memory usage during multilingual queries
- Concurrent query performance
- Error handling performance

## Expected Performance

### Individual Queries
- **Word search**: < 10ms for simple lookups
- **Sense lookup**: < 5ms per word
- **Synset lookup**: < 5ms per synset
- **Definition lookup**: < 5ms per synset
- **ILI mapping**: < 2ms per synset

### Bilingual Workflows
- **Simple queries**: < 50ms for single word translation
- **Complex queries**: < 100ms for multi-sense words
- **Error handling**: < 10ms overhead for error cases

### Memory Usage
- **Stable memory**: No significant memory leaks during multiple queries
- **Efficient caching**: Reasonable memory usage for cached data
- **Cleanup**: Proper cleanup after query completion

## Performance Optimization

### Identified Bottlenecks
1. **Database queries**: Multiple round trips for related data
2. **ILI mapping**: Cross-lingual lookups can be slow
3. **Definition lookup**: Multiple definition queries per synset
4. **Error handling**: Exception handling overhead

### Optimization Strategies
1. **Batch queries**: Combine multiple queries into single operations
2. **Caching**: Cache frequently accessed synsets and definitions
3. **Connection pooling**: Reuse database connections
4. **Indexing**: Ensure proper database indexes for ILI lookups

## Monitoring and Alerting

### Key Metrics to Monitor
- Query response times
- Memory usage during heavy queries
- Error rates in cross-lingual lookups
- Cache hit rates

### Performance Thresholds
- **Warning**: Query time > 100ms
- **Critical**: Query time > 500ms
- **Memory**: Heap usage > 100MB during queries
- **Errors**: Error rate > 5% for cross-lingual queries

## Test Data

The benchmarks use realistic multilingual test data from `wn-ts-core/test-data/xsd-samples/`:
- **English**: OEWN 2024 sample data
- **French**: OMW-FR 1.4 sample data
- **Thai**: OMW-TH 1.4 sample data
- **CILI**: CILI 1.0 index data

## Continuous Integration

These benchmarks are designed to run in CI/CD pipelines:
- Fast execution (< 2 minutes total)
- Deterministic results
- Clear pass/fail criteria
- Detailed performance reporting

## Troubleshooting

### Common Issues
1. **Test data not found**: Ensure `wn-ts-core` is built and test data is available
2. **Database errors**: Check that test database is properly initialized
3. **Memory issues**: Increase Node.js heap size if needed
4. **Timeout errors**: Increase Vitest timeout for slow benchmarks

### Debug Mode
Run with debug logging to see detailed query execution:
```bash
WN_TS_LOG_LEVEL=5 pnpm bench:bilingual
```

## Contributing

When adding new benchmarks:
1. Follow the existing naming conventions
2. Include both individual and workflow tests
3. Add performance analysis where relevant
4. Update this README with new benchmark descriptions
5. Ensure benchmarks are deterministic and fast

## Related Files

- `../src/wordnet.ts` - Main WordNet implementation
- `../src/data-management.ts` - Database operations
- `../../wn-ts-web/src/react/hooks/useWordNet.ts` - React hooks using these queries
- `../../wn-ts-web-demo/src/components/demos/BilingualDictionary.tsx` - Bilingual demo implementation

# Wn-TS Benchmarking

This directory contains code and data for running benchmarks for the TypeScript `wn-ts` library. The benchmarks are implemented using [Vitest's benchmark API](https://vitest.dev/guide/features.html#benchmarking-experimental) with Tinybench, providing comprehensive performance testing.

## Running Benchmarks

From the project root directory:

```bash
# Run all benchmarks
pnpm test:bench

# Run specific benchmark file
pnpm vitest bench bench/benchmark.bench.ts

# Run benchmarks with specific options
pnpm vitest bench --run --reporter=verbose
```

## Benchmark Categories

### LMF Loading
- **load minimal LMF** - Creating minimal LMF document structures
- **load LMF from XML string** - Parsing LMF XML content

### Lexical Resource Addition
- **add large mock data** - Adding large-scale mock data (33k synsets)
- **add large mock data with progress** - Same with progress tracking

### Primary Queries
- **synsets query** - Basic synsets retrieval
- **words query** - Basic words retrieval
- **synsets with filter** - Filtered synsets by part of speech
- **words with filter** - Filtered words by part of speech

### Secondary Queries
- **word senses without wordnet** - Word sense retrieval
- **word senses with wordnet** - Word sense retrieval with context
- **synset hypernyms** - Hypernym relation queries
- **synset hyponyms** - Hyponym relation queries

### Core Functions
- **taxonomyShortestPath** - Shortest path between synsets
- **path similarity** - Path-based similarity calculation
- **Morphy.analyze** - Morphological analysis
- **Morphy.analyze with POS** - Morphological analysis with part of speech

### Large Scale Operations
- **process all synsets** - Processing large synset collections
- **process all words** - Processing large word collections
- **process all senses** - Processing large sense collections

## Mock Data

The benchmarks use large-scale mock data similar to the Python `wn` library:
- **20,000 noun synsets**
- **10,000 verb synsets**
- **2,000 adjective synsets**
- **1,000 adverb synsets**
- **Generated words and senses** with realistic relationships

## Comparison with Python wn

This TypeScript implementation provides feature parity with the Python `wn` library benchmarks:

| Feature | Python wn | TypeScript wn-ts | Status |
|---------|-----------|------------------|---------|
| LMF Loading | ✅ | ✅ | Complete |
| Lexical Resource Addition | ✅ | ✅ | Complete |
| Primary Queries | ✅ | ✅ | Complete |
| Secondary Queries | ✅ | ✅ | Complete |
| Large-scale Mock Data | ✅ | ✅ | Complete |
| Progress Handlers | ✅ | ✅ | Complete |
| Core Function Benchmarks | ✅ | ✅ | Complete |

## Performance Notes

- **Morphy analysis** is typically the fastest operation (~300k ops/sec)
- **Taxonomy operations** (path finding, similarity) are moderately fast (~70-85k ops/sec)
- **Large-scale operations** demonstrate scalability with realistic data sizes
- **Progress tracking** adds minimal overhead for long-running operations

## Best Practices

1. **Environment Consistency**: Ensure a steady system load when running benchmarks
2. **Multiple Runs**: Run benchmarks multiple times to account for variance
3. **Machine-specific Results**: Benchmark results are machine-dependent
4. **Version Pinning**: Pin Vitest version when using benchmarks in production

## Future Enhancements

- Database integration for realistic storage/retrieval benchmarks
- XML parser optimization for LMF loading
- Memory usage profiling
- Network I/O simulation for remote data loading 
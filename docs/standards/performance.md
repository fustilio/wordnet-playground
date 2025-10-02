# Performance Standards

This document outlines performance standards and guidelines for the WordNet TypeScript ecosystem.

## Performance Standards

### Query Performance (Based on Actual Benchmarks)

- **V5 Strategy**: 700,000+ Hz (0.001ms average) - Production recommended
- **V6 Strategy**: 2,000+ Hz (0.5ms average) - Memory-conscious apps
- **V1-V4 Strategies**: ~0.4-4 Hz (250-2000ms average) - Deprecated

### Memory Usage

- **Full OEWN Dataset**: 100-150MB total memory usage
- **Query Processing**: < 10MB per individual query
- **Database Load**: 1.5-2x input size for storage

### Bundle Size

- **Web Core**: < 50KB gzipped
- **Web Full**: < 200KB gzipped (with plugins)
- **Node.js**: Minimal dependencies

## Optimization Guidelines

### Query Strategy Selection

1. **Use V5 strategy** for production applications with repeated queries (700,000+ Hz)
2. **Use V6 strategy** for memory-conscious applications (2,000+ Hz)
3. **Avoid V1-V4 strategies** - they are deprecated and perform poorly

### Performance Best Practices

1. **Use specific queries**: `wordnet.words({ form: 'computer', pos: 'n' })` instead of broad searches
2. **Leverage automatic caching**: V5 strategy handles caching automatically
3. **Batch operations**: Process multiple queries together when possible
4. **Monitor memory usage**: 100-150MB for full OEWN dataset is normal

## Benchmarking

### Running Benchmarks

```bash
# Run all benchmarks
pnpm test:bench

# Run web-specific benchmarks
cd packages/wn-ts-web && pnpm bench

# Run core benchmarks
cd packages/wn-ts-core && pnpm test:bench
```

### Actual Benchmark Results

See [Performance Benchmarks](../development/performance-benchmarks.md) for detailed results showing:
- V5 strategy: 700,000+ Hz performance
- V6 strategy: 2,000+ Hz performance  
- V1-V4 strategies: ~0.4-4 Hz (deprecated)

## Platform-Specific Performance

### Web Platform
- **Performance**: V5 strategy achieves 700,000+ Hz in browser
- **Memory**: ~150MB for full OEWN dataset
- **Load Time**: < 3 seconds for full datasets

### Node.js Platform
- **Performance**: V5 strategy achieves 700,000+ Hz on server
- **Memory**: ~100MB for full OEWN dataset
- **Load Time**: < 2 seconds for full datasets

## Related Documentation

- [Development Conventions](./development-conventions.md)
- [Testing Strategy](./testing-strategy.md)
- [Database Schema Standards](./database-schema-standards.md)
- [Performance Benchmarks](../development/performance-benchmarks.md)

---

**Remember**: Performance optimization should be data-driven. Always measure before and after optimization to ensure improvements.


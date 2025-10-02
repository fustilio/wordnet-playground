---
title: Performance Benchmarks
description: Comprehensive performance benchmarks and optimization results
---

# Performance Benchmarks

## Query Performance

Based on actual benchmark results from `packages/wn-ts-web/test/e2e/query-performance.bench.ts`:

| Strategy | Use Case | Performance | Notes |
|----------|----------|-------------|-------|
| **V5 (Recommended)** | Production | **700,000+ Hz** | Ultra-fast with intelligent caching |
| **V6 (Recommended)** | Memory-conscious | **2,000+ Hz** | Memory-optimized batch loading |
| **V1-V4 (Deprecated)** | Backward compatibility | ~0.4-4 Hz | Deprecated, use V5 or V6 |

### Performance Comparison

- **V5 vs V1**: **100,000+ times faster** (700,000 Hz vs 0.4 Hz)
- **V6 vs V1**: **1,000+ times faster** (2,000 Hz vs 0.4 Hz)
- **V5 vs V6**: V5 is 350x faster but uses more memory for caching

## Memory Usage

- **Database Load**: 1.5-2x input size
- **Query Processing**: < 10MB per query
- **Plugin Operations**: < 5MB overhead

## Load Times

- **1MB LMF**: < 100ms
- **10MB LMF**: < 500ms  
- **100MB LMF**: < 2s

## Platform Performance

### Node.js
- **Query Speed**: 700,000+ Hz (V5 strategy)
- **Memory**: ~100MB for full OEWN dataset
- **Load Time**: < 2 seconds
- **Test Duration**: 90.65s for 386+ tests

### Browser
- **Query Speed**: 700,000+ Hz (V5 strategy)
- **Memory**: ~150MB for full OEWN dataset
- **Load Time**: < 3 seconds
- **Test Duration**: 60.55s for 187 tests

## Benchmark Results

From `packages/wn-ts-web/test/e2e/query-performance.bench.ts`:

```
V5 Strategy Performance (RECOMMENDED):
- Synset Search: 700,000+ Hz (0.001ms average)
- Sense Search: 600,000+ Hz (0.002ms average)
- 100,000+ times faster than V1 strategies

V6 Strategy Performance (RECOMMENDED):
- Synset Search: 2,000+ Hz (0.5ms average)  
- Sense Search: 8,000+ Hz (0.1ms average)
- 1,000+ times faster than V1 strategies

Deprecated Strategies (V1-V4):
- Performance: ~0.4-4 Hz (250-2000ms average)
- Kept for backward compatibility only
```

## Optimization

### Query Strategies
- Use V5 for production with repeated queries
- Use V6 for consistent performance without caching
- V1-V4 are deprecated but kept for compatibility

### Memory Management
- Close connections when done
- Use streaming for large datasets
- Monitor memory usage regularly

## Running Benchmarks

```bash
# Run all benchmarks
pnpm test:bench

# Run specific package benchmarks
pnpm --filter wn-ts-core test:bench         # Core benchmarks
pnpm --filter wn-ts-web bench                # Web benchmarks (includes performance.bench.ts)
pnpm --filter wn-ts-node bench               # Node benchmarks

# Run with verbose output
pnpm --filter wn-ts-web bench --reporter=verbose
```

## Test Results Summary

### **Overall Test Status**
- ✅ **wn-ts-core**: 174/174 tests passing (100%)
- ⚠️ **wn-ts-web**: 186/187 tests passing (99.5%)
- ⚠️ **wn-ts-node**: 383/386 tests passing (99.2%)
- **Overall**: 743/747 tests passing (99.5%)

### **Pre-Existing Issues**
All 4 failing tests are pre-existing issues unrelated to performance or documentation:
1. ILI data loading query compilation issue (wn-ts-web)
2. Data manager Kysely mock issue (wn-ts-node)

See [Test Coverage](./test-coverage.md) for detailed test information.
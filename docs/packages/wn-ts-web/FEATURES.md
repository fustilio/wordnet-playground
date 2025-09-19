# wn-ts-web Features

## Recent Major Updates

### Microkernel Architecture ✅ COMPLETED
- **Plugin System**: Modern plugin-based architecture with relations, similarity, and translation plugins
- **Type Safety**: Full TypeScript support with compile-time checking for all plugin methods
- **React Integration**: New React hooks and context providers for easy integration
- **Cross-Package Compatibility**: Works seamlessly with wn-ts-core plugin system
- **Zero Runtime Overhead**: Type-safe plugin system with no performance impact

### Enhanced Lexicon Introspection System ✅ COMPLETED
- **Real Data Integration**: Replaced all placeholder values with actual database statistics
- **Sense Count**: Now shows real counts (e.g., 212,478 for OEWN 2024) instead of hardcoded 0
- **Part of Speech Distribution**: New `getPartOfSpeechDistribution()` method with real POS counts
- **Worker API Enhancement**: Extended worker interface with missing analytics methods
- **Error Handling**: Graceful fallbacks when detailed data isn't available

### Lexicon ID Format Mismatch Resolution ✅ COMPLETED
- **Problem**: Demo was using package IDs (e.g., `oewn:2024`) but worker stored base IDs (e.g., `oewn`)
- **Solution**: Implemented fallback logic in `introspectLexicon()` to handle both formats
- **Impact**: Lexicon introspection now works seamlessly with both ID formats

## Core Features

- **Microkernel Architecture**: Modern plugin-based design with relations, similarity, and translation plugins
- **SQLite WASM Integration**: Fully working with local WASM files
- **Kysely Query Engine**: Type-safe SQL query building for enhanced reliability and developer experience
- **OPFS Support**: Persistent storage using the Origin Private File System
- **In-Memory Fallback**: Automatic fallback when OPFS is unavailable
- **Cross-Browser Compatibility**: Works in all modern browsers
- **TypeScript Support**: Full type safety and IntelliSense
- **Performance Optimized**: Fast queries and efficient memory usage
- **Framework Agnostic**: Core library works with any JavaScript framework
- **Worker-First Architecture**: Designed to run in Web Workers for optimal performance
- **React Integration**: Custom hooks and context providers for React applications
- **Multi-Lexicon Orchestration**: Advanced management of multiple lexicons with state tracking
- **Cross-Lexicon Queries**: Efficient queries across multiple lexicons in a single database
- **Lexicon Lifecycle Management**: Automatic update detection and redownload management
- **Resource Type Introspection**: Automatic detection and analysis of lexicons vs. ILIs
- **Cross-Lingual Analysis**: Comprehensive analysis of multilingual capabilities and mapping coverage
- **Enhanced Lexicon Introspection**: Real-time statistics, sense counts, and data quality metrics

## API Reference

The primary entry point is `createWordNetInstance`, which sets up the WordNet instance, database, and data loader.

### Core Exports

- **`createWordNetInstance(lexiconId?)`**: Creates WordNet instance and data loader
- **`WebWordnet`**: Main WordNet class for queries
- **`DataLoader`**: Handles data downloading and loading
- **`createWordNetWorker(workerUrl)`**: Creates a worker with Comlink integration

### React Exports (separate)

- **`useWordNet(options)`**: Main React hook for WordNet operations
- **`usePackageStatus(packageId, worker)`**: Hook for checking package status
- **`useCacheInfo(worker)`**: Hook for cache information

## Performance

- **Fast Initialization**: The WASM module loads and initializes quickly.
- **Efficient Queries**: Kysely provides an optimized query engine.
- **Persistent Storage**: Leverages the Origin Private File System (OPFS) for fast, persistent data storage in the browser, with a fallback to an in-memory database.
- **Worker-First**: Designed to run in Web Workers for optimal UI responsiveness.
- **Real-Time Statistics**: Enhanced lexicon introspection provides actual database statistics instead of estimates.

## Build Configuration

This package provides multiple build configurations for different use cases:

### Production Build (Default)
```bash
pnpm build
```
- **Minified**: Code is compressed and optimized for production
- **No source maps**: Smaller bundle size
- **Optimized**: Best performance for end users

### Development Build
```bash
pnpm build:dev
```
- **Unminified**: Readable code for debugging
- **Source maps**: Full debugging support
- **Larger bundle**: Better for development and troubleshooting

### Build Configuration Files
- `vite.base.config.ts` - Base configuration shared by all builds
- `vite.config.ts` - Production build configuration (extends base)
- `vite.dev.config.ts` - Development build configuration (extends base)

The configuration uses Vite's `mergeConfig` to extend the base configuration, eliminating duplication and making maintenance easier.

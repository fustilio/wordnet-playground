# WordNet Orchestration Architecture

This document describes the new orchestration architecture in wn-ts-web that provides better management of multiple lexicons and their states.

## Architecture Overview

The new architecture operates at three distinct abstraction levels:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                WordNetOrchestrator                         │
│              (High-level orchestration)                    │
├─────────────────────────────────────────────────────────────┤
│              WordNetWorkerClient                           │
│            (Mid-level worker communication)                │
├─────────────────────────────────────────────────────────────┤
│                 WebWordnet                                 │
│              (Low-level lexicon operations)                │
└─────────────────────────────────────────────────────────────┘
```

### 1. WordNetOrchestrator (High-level)

**Purpose**: Manages a single WordNet instance with multiple lexicons, provides cross-lexicon operations, and handles lexicon lifecycle management.

**Key Features**:
- Single WebWordnet instance management
- Cross-lexicon query optimization
- Lexicon state tracking and lifecycle management
- Update checking and redownload detection
- Concurrent lexicon loading with queuing

**Use Cases**:
- Applications that need to work with multiple lexicons
- Cross-lexicon search and analysis
- Lexicon version management
- Resource optimization for large-scale operations

### 2. WordNetWorkerClient (Mid-level)

**Purpose**: Handles worker communication, lexicon state tracking, and provides a clean API for WordNet operations via Comlink workers.

**Key Features**:
- Worker communication via Comlink
- Lexicon state tracking and synchronization
- Event-driven architecture for state changes
- Progress tracking and error handling
- Memory-efficient operations

**Use Cases**:
- Browser applications that need background processing
- Memory-intensive operations
- Real-time lexicon state updates
- Worker-based architecture requirements

### 3. WebWordnet (Low-level)

**Purpose**: Individual lexicon instance operations and database management.

**Key Features**:
- Direct database operations
- Lexicon-specific queries
- SQLite WASM integration
- Event emission for state changes

## Key Benefits of the New Architecture

### 1. Single Database Instance
- **Before**: Multiple WebWordnet instances, each with their own database connection
- **After**: Single WebWordnet instance managing multiple lexicons in one database
- **Benefit**: Better resource utilization, no database conflicts, efficient cross-lexicon queries

### 2. Cross-Lexicon Query Optimization
- **Before**: Manual iteration across multiple instances
- **After**: Single query that can span multiple lexicons
- **Benefit**: Better performance, optimized SQL queries, reduced memory usage

### 3. Lexicon State Management
- **Before**: No centralized state tracking
- **After**: Comprehensive state management with update detection
- **Benefit**: Know when lexicons need updates, track loading states, monitor health

### 4. Resource Management
- **Before**: Potential resource conflicts between instances
- **After**: Coordinated resource usage with queuing and concurrency control
- **Benefit**: Better memory management, controlled concurrent operations

## Usage Examples

### Basic Orchestrator Usage

```typescript
import { WordNetOrchestrator } from 'wn-ts-web';

// Create orchestrator
const orchestrator = new WordNetOrchestrator({
  defaultLexicon: 'oewn:2024',
  autoCheckUpdates: true,
  maxConcurrentLoads: 2
});

// Initialize with SQLite module
await orchestrator.initialize(sqlModule);

// Load multiple lexicons
await orchestrator.loadLexicon('oewn:2024');
await orchestrator.loadLexicon('wn31:3.1');

// Query across all lexicons
const words = await orchestrator.queryWords('run');
const synsets = await orchestrator.querySynsets('happy');

// Get overall statistics
const stats = await orchestrator.getOverallStatistics();
```

### Worker Client Usage

```typescript
import { WordNetWorkerClient } from 'wn-ts-web';

// Create worker client
const client = new WordNetWorkerClient();

// Initialize with worker URL
await client.initialize('/workers/wordnet.worker.js');

// Load packages
await client.loadPackage('oewn:2024', (progress, stage) => {
  console.log(`Loading: ${stage} - ${progress * 100}%`);
});

// Query data
const words = await client.queryWords('example');
const synsets = await client.querySynsets('test');

// Listen for events
client.addEventListener('lexiconsChanged', ({ lexicons, added, removed }) => {
  console.log('Lexicons changed:', { lexicons, added, removed });
});
```

### Combined Usage

```typescript
import { WordNetOrchestrator, WordNetWorkerClient } from 'wn-ts-web';

// Use orchestrator for main thread operations
const orchestrator = new WordNetOrchestrator();
await orchestrator.initialize(sqlModule);

// Use worker client for heavy operations
const workerClient = new WordNetWorkerClient();
await workerClient.initialize('/workers/wordnet.worker.js');

// Coordinate between them
await workerClient.loadPackage('oewn:2024');
await orchestrator.ensureLexiconLoaded('oewn:2024');

// Use orchestrator for cross-lexicon queries
const results = await orchestrator.queryWords('example');
```

## Migration Guide

### From Multiple WebWordnet Instances

**Before**:
```typescript
const instance1 = new WebWordnet('oewn:2024');
const instance2 = new WebWordnet('wn31:3.1');
await instance1.initialize(sqlModule);
await instance2.initialize(sqlModule);

// Manual cross-lexicon queries
const results = [];
for (const instance of [instance1, instance2]) {
  const words = await instance.words('example');
  results.push(...words);
}
```

**After**:
```typescript
const orchestrator = new WordNetOrchestrator();
await orchestrator.initialize(sqlModule);
await orchestrator.loadLexicon('oewn:2024');
await orchestrator.loadLexicon('wn31:3.1');

// Automatic cross-lexicon queries
const results = await orchestrator.queryWords('example');
```

### From Manual State Tracking

**Before**:
```typescript
// Manual state tracking
const lexiconStates = new Map();
const updateChecker = setInterval(() => {
  // Manual update checking logic
}, 24 * 60 * 60 * 1000);
```

**After**:
```typescript
const orchestrator = new WordNetOrchestrator({
  autoCheckUpdates: true,
  checkInterval: 24 * 60 * 60 * 1000
});

// Automatic update checking
orchestrator.on('lexiconStateChanged', ({ lexiconId, state }) => {
  console.log(`Lexicon ${lexiconId} state:`, state);
});
```

## Performance Considerations

### Memory Usage
- **Single Database**: Reduces memory overhead from multiple database connections
- **State Tracking**: Efficient state management with minimal memory footprint
- **Lazy Loading**: Lexicons are loaded only when needed

### Query Performance
- **Cross-Lexicon Optimization**: Single SQL queries instead of multiple instance queries
- **Connection Pooling**: Single database connection with optimized query planning
- **Caching**: Built-in caching mechanisms for frequently accessed data

### Concurrency
- **Load Queuing**: Controlled concurrent lexicon loading to prevent resource exhaustion
- **Worker Communication**: Background processing for heavy operations
- **Event-Driven**: Non-blocking operations with event-based state updates

## Best Practices

### 1. Choose the Right Abstraction Level
- **Use Orchestrator**: When you need multiple lexicons and cross-lexicon operations
- **Use Worker Client**: When you need background processing and memory efficiency
- **Use WebWordnet directly**: When you only need a single lexicon

### 2. Resource Management
- Always call `close()` when done with orchestrator or worker client
- Use progress callbacks for long-running operations
- Monitor memory usage with large datasets

### 3. Error Handling
- Implement proper error handling for all async operations
- Use event listeners for state change notifications
- Handle worker communication failures gracefully

### 4. Performance Optimization
- Load lexicons in parallel when possible
- Use the orchestrator's query optimization for cross-lexicon searches
- Implement appropriate caching strategies

## Future Enhancements

### Planned Features
- **Checksum Validation**: Enhanced update detection with actual file checksums
- **Incremental Updates**: Delta-based lexicon updates instead of full redownloads
- **Advanced Caching**: Multi-level caching with LRU eviction policies
- **Query Optimization**: Query plan optimization for complex cross-lexicon operations

### Extension Points
- **Custom State Providers**: Plug-in state management for different storage backends
- **Query Middleware**: Custom query processing and transformation
- **Event Handlers**: Custom event processing and routing
- **Metrics Collection**: Performance monitoring and analytics

## Conclusion

The new orchestration architecture provides a robust, efficient, and scalable foundation for managing multiple WordNet lexicons. By separating concerns into distinct abstraction levels, it offers flexibility while maintaining performance and resource efficiency.

The architecture is designed to be:
- **Efficient**: Single database instance with optimized queries
- **Scalable**: Support for multiple lexicons with controlled resource usage
- **Maintainable**: Clear separation of concerns and well-defined interfaces
- **Extensible**: Easy to add new features and customizations

This architecture represents a significant improvement over the previous approach and provides a solid foundation for future WordNet applications.

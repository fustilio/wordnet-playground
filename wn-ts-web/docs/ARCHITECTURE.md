# wn-ts-web Architecture Documentation

## 🏗️ System Overview

`wn-ts-web` is designed as a layered, worker-first architecture that provides high-performance WordNet operations while maintaining reliability through graceful fallbacks.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                        │
├─────────────────────────────────────────────────────────────────┤
│  useWordNet Hook                                               │
│  ├─ State Management                                           │
│  ├─ Worker Coordination                                        │
│  └─ Fallback Logic                                            │
├─────────────────────────────────────────────────────────────────┤
│  WordNetWorkerClient (Main Thread)                             │
│  ├─ Comlink Communication                                      │
│  ├─ Event Management                                           │
│  └─ State Tracking                                             │
├─────────────────────────────────────────────────────────────────┤
│  wordnet-worker (Web Worker)                                   │
│  ├─ WordNetOrchestrator                                        │
│  ├─ SQLite WASM Management                                     │
│  └─ Heavy Computation                                          │
├─────────────────────────────────────────────────────────────────┤
│  WebWordnet (Database Layer)                                   │
│  ├─ Kysely Query Service                                       │
│  ├─ SQLite WASM Operations                                     │
│  └─ Data Persistence                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### 1. **User Request**
```typescript
// User calls a method on useWordNet
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');
```

### 2. **Hook Processing**
```typescript
// useWordNet processes the request
const loadPackageData = useCallback(async (packageId) => {
  if (workerClientRef.current?.initialized) {
    // Route to worker
    return await workerClientRef.current.loadPackage(packageId);
  } else if (dataLoaderRef.current) {
    // Fallback to main thread
    return await dataLoaderRef.current.downloadAndLoad(packageId);
  }
  throw new Error("DataLoader not initialized");
}, []);
```

### 3. **Worker Communication**
```typescript
// WordNetWorkerClient forwards to worker via Comlink
async loadPackage(packageId: string) {
  const result = await this.remote!.loadPackage(packageId);
  return result;
}
```

### 4. **Worker Processing**
```typescript
// wordnet-worker processes the request
export async function loadPackage(packageId: string) {
  if (!orchestrator) {
    return { success: false, error: "WordNet not initialized" };
  }
  
  await orchestrator.loadLexicon(packageId);
  const statistics = await orchestrator.getOverallStatistics();
  return { success: true, data: { statistics } };
}
```

### 5. **Orchestrator Management**
```typescript
// WordNetOrchestrator manages the operation
async loadLexicon(lexiconId: string) {
  if (!this.isInitialized) {
    throw new Error("Orchestrator not initialized");
  }
  
  await this.dataLoader!.downloadAndLoad(lexiconId);
  this.updateLexiconState(lexiconId, { status: 'loaded' });
}
```

### 6. **Database Operations**
```typescript
// WebWordnet performs database operations
async downloadAndLoad(packageId: string) {
  const data = await this.downloadPackage(packageId);
  await this.loadIntoDatabase(data);
}
```

## 🏛️ Layer Responsibilities

### **React Layer (useWordNet)**
- **State Management**: Manages React state for UI updates
- **Worker Coordination**: Coordinates between worker and main thread
- **Fallback Logic**: Handles worker failures gracefully
- **API Surface**: Provides clean interface for components

### **Communication Layer (WordNetWorkerClient)**
- **Comlink Integration**: Manages Comlink communication with worker
- **Event Management**: Handles worker events and state updates
- **Lifecycle Management**: Manages worker initialization and cleanup
- **State Tracking**: Tracks loaded lexicons and statistics

### **Worker Layer (wordnet-worker)**
- **Heavy Computation**: Handles CPU-intensive operations
- **SQLite Management**: Manages SQLite WASM instances
- **Orchestrator Coordination**: Coordinates WordNet operations
- **Memory Management**: Manages memory for large datasets

### **Orchestration Layer (WordNetOrchestrator)**
- **High-Level Logic**: Manages cross-lexicon operations
- **Lifecycle Management**: Handles lexicon loading/unloading
- **State Coordination**: Coordinates between multiple lexicons
- **Event Emission**: Emits events for state changes

### **Database Layer (WebWordnet)**
- **Low-Level Operations**: Performs actual database operations
- **Query Optimization**: Optimizes SQL queries for performance
- **Data Persistence**: Manages data storage and retrieval
- **Type Safety**: Provides type-safe database operations via Kysely

## 🔧 Key Design Patterns

### **Worker-First Architecture**
- All heavy operations default to worker threads
- Main thread remains responsive during operations
- Automatic fallback to main thread on worker failure

### **Layered Abstraction**
- Each layer has a single, clear responsibility
- Clean interfaces between layers
- Easy to test and maintain individual components

### **State Synchronization**
- Uses React refs for immediate instance access
- Avoids state update timing issues
- Maintains consistency between worker and main thread

### **Event-Driven Communication**
- Worker events propagate to main thread
- State updates trigger UI re-renders
- Clean separation of concerns

## 🚀 Performance Optimizations

### **Worker Isolation**
- Heavy operations don't block main thread
- UI remains responsive during data loading
- Parallel processing capabilities

### **Efficient State Updates**
- Minimal re-renders through ref usage
- Batch operations where possible
- Smart caching and memoization

### **Memory Management**
- Automatic cleanup of unused resources
- Efficient SQLite operations
- Smart data loading and unloading

## 🔒 Error Handling

### **Graceful Degradation**
- Worker failures don't crash the application
- Automatic fallback to main thread
- Clear error messages for debugging

### **Error Recovery**
- Automatic retry mechanisms
- State restoration after errors
- Comprehensive error logging

### **User Experience**
- Loading states during operations
- Progress indicators for long operations
- Clear feedback for user actions

## 🧪 Testing Strategy

### **Unit Testing**
- Test each layer independently
- Mock dependencies for isolation
- Comprehensive coverage of edge cases

### **Integration Testing**
- Test communication between layers
- Verify worker communication
- Test fallback mechanisms

### **Performance Testing**
- Measure worker initialization time
- Test memory usage patterns
- Benchmark query performance

## 🔮 Future Enhancements

### **Multiple Worker Support**
- Load balancing across multiple workers
- Specialized workers for different operations
- Dynamic worker scaling

### **Advanced Caching**
- Intelligent cache invalidation
- Predictive data loading
- Cross-session persistence

### **Plugin Architecture**
- Extensible query system
- Custom data processors
- Third-party integrations

## 📚 Related Documentation

- [SPEC.md](../SPEC.md) - Project specification
- [React README](../src/react/README.md) - React integration guide
- [API Documentation](../docs/API.md) - Complete API reference
- [Performance Guide](../docs/PERFORMANCE.md) - Performance optimization tips

---

**This architecture document is maintained alongside the codebase and should be updated as the system evolves.**

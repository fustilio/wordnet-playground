# wn-ts-web Architecture Documentation

## 🏗️ System Overview

`wn-ts-web` is designed as a layered, worker-first architecture that provides high-performance WordNet operations while maintaining reliability through graceful fallbacks. The system operates at three distinct abstraction levels for optimal resource management and cross-lingual capabilities.

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
│  WordNetOrchestrator (High-level orchestration)                │
│  ├─ Multi-lexicon management                                  │
│  ├─ Cross-lexicon operations                                  │
│  └─ Resource lifecycle management                             │
├─────────────────────────────────────────────────────────────────┤
│  WordNetWorkerClient (Mid-level worker communication)          │
│  ├─ Comlink Communication                                      │
│  ├─ Event Management                                           │
│  └─ State Tracking                                             │
├─────────────────────────────────────────────────────────────────┤
│  wordnet-worker (Web Worker)                                   │
│  ├─ Heavy Computation                                          │
│  ├─ SQLite WASM Management                                     │
│  └─ Background Processing                                      │
├─────────────────────────────────────────────────────────────────┤
│  WebWordnet (Database Layer)                                   │
│  ├─ Kysely Query Service                                       │
│  ├─ SQLite WASM Operations                                     │
│  └─ Data Persistence                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🏛️ Layer Responsibilities

### **1. WordNetOrchestrator (High-level)**

**Purpose**: Manages a single WordNet instance with multiple lexicons, provides cross-lexicon operations, and handles lexicon lifecycle management.

**Key Features**:
- Single WebWordnet instance management
- Cross-lexicon query optimization
- Lexicon state tracking and lifecycle management
- Update checking and redownload detection
- Concurrent lexicon loading with queuing
- Resource type introspection and categorization
- Cross-lingual analysis capabilities

**Use Cases**:
- Applications that need to work with multiple lexicons
- Cross-lexicon search and analysis
- Lexicon version management
- Resource optimization for large-scale operations
- Multilingual applications requiring cross-lingual mapping

### **2. WordNetWorkerClient (Mid-level)**

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

### **3. WebWordnet (Low-level)**

**Purpose**: Individual lexicon instance operations and database management.

**Key Features**:
- Direct database operations
- Lexicon-specific queries
- SQLite WASM integration
- Event emission for state changes

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

## 🚀 Key Benefits of the Architecture

### **1. Single Database Instance**
- **Before**: Multiple WebWordnet instances, each with their own database connection
- **After**: Single WebWordnet instance managing multiple lexicons in one database
- **Benefit**: Better resource utilization, no database conflicts, efficient cross-lexicon queries

### **2. Cross-Lexicon Query Optimization**
- **Before**: Manual iteration across multiple instances
- **After**: Single query that can span multiple lexicons
- **Benefit**: Better performance, optimized SQL queries, reduced memory usage

### **3. Lexicon State Management**
- **Before**: No centralized state tracking
- **After**: Comprehensive state management with update detection
- **Benefit**: Know when lexicons need updates, track loading states, monitor health

### **4. Resource Management**
- **Before**: Potential resource conflicts between instances
- **After**: Coordinated resource usage with queuing and concurrency control
- **Benefit**: Better memory management, controlled concurrent operations

### **5. Resource Type Introspection**
- **Before**: No distinction between lexicons and ILIs
- **After**: Automatic detection and categorization of resource types
- **Benefit**: Better understanding of resource capabilities, optimized query strategies, improved user experience

### **6. Cross-Lingual Analysis**
- **Before**: Manual analysis of multilingual capabilities
- **After**: Automated analysis of cross-lingual mapping coverage and quality
- **Benefit**: Data-driven decisions about resource usage, quality assessment, coverage analysis

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
- [React Integration](./REACT_INTEGRATION.md) - React integration guide
- [API Documentation](./API.md) - Complete API reference
- [Worker Architecture](./WORKER_ARCHITECTURE.md) - Detailed worker implementation

---

**This architecture document is maintained alongside the codebase and should be updated as the system evolves.**

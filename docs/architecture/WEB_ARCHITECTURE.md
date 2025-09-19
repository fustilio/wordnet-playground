# Web Implementation Architecture

## 🏗️ **System Overview**

The `wn-ts-web` implementation uses a **worker-first architecture** with React integration, providing high-performance WordNet operations while maintaining UI responsiveness through Web Workers and persistent storage via SQLite WASM with OPFS.

## 📊 **Architecture Diagram**

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

## 🏛️ **Layer Responsibilities**

### **1. React Integration Layer**

**Purpose**: Provides React hooks and components for seamless integration with React applications.

**Key Features**:
- `useWordNet` hook for state management
- Context providers for global state
- Automatic worker coordination
- Graceful fallback mechanisms

**Components**:
- `useWordNet()` - Main React hook
- `WordNetProvider` - Context provider
- `useWordNetContext()` - Context consumer

### **2. Worker Communication Layer**

**Purpose**: Handles communication between React components and Web Workers using Comlink.

**Key Features**:
- Comlink-based worker communication
- Event-driven state synchronization
- Automatic error handling and recovery
- Queue management for early requests

**Components**:
- `WordNetWorkerClient` - Main thread client
- `WordNetWorkerAPI` - Worker interface
- Event system for real-time updates

### **3. Orchestration Layer**

**Purpose**: Manages WordNet operations, lexicon lifecycle, and cross-lingual capabilities.

**Key Features**:
- Single database instance for multiple lexicons
- Cross-lexicon query optimization
- Resource type introspection
- Update detection and management

**Components**:
- `WordNetOrchestrator` - Main orchestrator
- `LexiconState` - State tracking
- `ResourceIntrospection` - Analysis capabilities

### **4. Core Implementation Layer**

**Purpose**: Provides core WordNet functionality and database operations.

**Key Features**:
- SQLite WASM integration
- OPFS persistent storage
- Kysely query building
- LMF XML parsing

**Components**:
- `WebWordnet` - Core WordNet implementation
- `WebKyselyDatabase` - Database wrapper
- `LmfParser` - XML processing

## 🔄 **Request Flow**

### **1. User Request**
```typescript
// User calls a method on useWordNet
const { loadPackageData } = useWordNet();
await loadPackageData('oewn:2024');
```

### **2. Hook Processing**
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

### **3. Worker Communication**
```typescript
// WordNetWorkerClient forwards to worker via Comlink
async loadPackage(packageId: string) {
  const result = await this.remote!.loadPackage(packageId);
  return result;
}
```

### **4. Worker Processing**
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

### **5. Orchestrator Management**
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

### **6. Database Operations**
```typescript
// WebWordnet performs database operations
async downloadAndLoad(packageId: string) {
  const data = await this.downloadPackage(packageId);
  await this.loadIntoDatabase(data);
}
```

## 🚀 **Key Design Patterns**

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

## 🔧 **Worker Architecture**

### **Worker-First Principles**

1. **No Direct DataLoader Access**
   ```tsx
   // ❌ Wrong: Direct access
   const dataLoader = useDataLoader();
   await dataLoader.downloadAndLoad('oewn:2024');
   
   // ✅ Correct: Through worker
   const { loadPackageData } = useWordNet();
   await loadPackageData('oewn:2024');
   ```

2. **Worker Readiness Checks**
   ```tsx
   const { workerReady, loadPackageData } = useWordNet();
   
   if (workerReady) {
     await loadPackageData('oewn:2024');
   } else {
     console.log('Worker not ready yet');
   }
   ```

3. **Automatic Queue Management**
   ```tsx
   // Requests are automatically queued if worker isn't ready
   await loadPackageData('oewn:2024'); // Queued if needed
   ```

### **Event System**

The architecture uses events for real-time updates:

- `packageLoaded` - When a package finishes loading
- `lexiconsChanged` - When lexicon state changes
- `statusUpdated` - When statistics are updated
- `error` - When operations fail

## 🗄️ **Storage Architecture**

### **SQLite with OPFS**

Persistent storage using the Origin Private File System:

```typescript
// OPFS provides high-performance persistent storage
const wordnet = new WebWordnet({
  databasePath: '/wordnet.db',
  enablePersistence: true
});
```

### **Fallback Strategy**

- **Primary**: OPFS for persistent storage
- **Fallback**: In-memory database when OPFS unavailable
- **Automatic**: Seamless fallback without code changes

### **Schema Management**

Automatic database schema creation and management:

```typescript
interface Database {
  lexicons: LexiconTable;      // Lexicon metadata
  words: WordTable;            // Lexical entries
  synsets: SynsetTable;        // Concept groupings
  senses: SenseTable;          // Word-synset relationships
  definitions: DefinitionTable; // Synset definitions
  relations: RelationTable;    // Cross-synset relationships
  ilis: IliTable;              // Interlingual Index
}
```

## 🌐 **Cross-Lingual Architecture**

### **ILI-Based Linking**

Interlingual Index enables powerful cross-language operations:

```typescript
// Load multiple language lexicons
await wordnet.loadLexicon('en', '1.0.0');
await wordnet.loadLexicon('fr', '1.0.0');

// Find equivalent concepts across languages
const englishSynset = await wordnet.getSynset('en', 'synset-1');
const iliId = englishSynset.iliId;

const frenchSynsets = await wordnet.findSynsetsByIli('fr', iliId);
```

### **Resource Introspection**

Comprehensive analysis of resource capabilities:

```typescript
// Analyze resource types and capabilities
const info = await orchestrator.introspectLexicon('oewn:2024');
console.log('Type:', info.type); // 'lexicon' or 'ili'
console.log('Languages:', info.supportedLanguages);
console.log('ILI Coverage:', info.iliCoverage);
```

## 🚀 **Performance Optimizations**

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

## 🔒 **Error Handling**

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

## 🧪 **Testing Strategy**

### **Multi-Layered Testing**
- **Node.js Tests**: Unit and integration tests with jsdom
- **Browser Tests**: Real browser testing with Playwright
- **E2E Tests**: Full workflow testing with real data

### **Test Environment Separation**
- Clean separation between test environments
- Mocking strategies for different contexts
- Performance testing and validation

## 🔮 **Future Enhancements**

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

---

**This architecture document provides the foundation for understanding the web implementation's design patterns, data flow, and performance characteristics.**

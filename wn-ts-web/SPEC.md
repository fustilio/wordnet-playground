# wn-ts-web Project Specification

## 🎯 Project Overview

`wn-ts-web` is the **production library** containing all core WordNet logic and functionality. It provides a clean, type-safe API for web applications to interact with WordNet data through web workers and SQLite WASM.

## 🏗️ Architecture Principles

### 1. **Single Source of Truth**
- All WordNet logic lives in `wn-ts-web`
- Demo projects are thin wrappers that import from the library
- No duplicate implementations across projects

### 2. **SOLID Principles**
- **Single Responsibility**: Each module has one clear purpose
- **Open/Closed**: Extensible without modification
- **Liskov Substitution**: Interfaces are properly implemented
- **Interface Segregation**: Clients only depend on methods they use
- **Dependency Inversion**: High-level modules don't depend on low-level modules

### 3. **Type Safety First**
- **NO `any` types** - everything must be properly typed
- Comprehensive TypeScript interfaces for all APIs
- Runtime type validation where appropriate

### 4. **Web Worker Architecture**
- Heavy computation runs in background threads
- Main thread stays responsive
- Comlink for clean RPC between threads

## 📁 Project Structure

```
wn-ts-web/
├── src/
│   ├── workers/
│   │   └── wordnet-worker.ts      # Production worker implementation
│   ├── worker-factory.ts           # Worker creation and management
│   ├── wordnet-orchestrator.ts     # High-level WordNet management
│   ├── web-wordnet.ts             # Browser-compatible WordNet core
│   ├── web-database.ts            # SQLite WASM database wrapper
│   ├── wordnet-worker-client.ts   # Main thread worker communication client
│   ├── react/                     # React-specific hooks and contexts
│   │   ├── hooks/
│   │   │   └── useWordNet.ts      # Main React hook for WordNet operations
│   │   └── contexts/
│   │       ├── WordNetContext.tsx # WordNet service context provider
│   │       └── WordNetConfigContext.tsx # Configuration context
│   └── index.ts                   # Main exports
├── docs/                          # Comprehensive documentation
└── SPEC.md                        # This file
```

## 🔧 Technical Requirements

### 1. **Dependencies**
- **Comlink**: For worker communication
- **SQLite WASM**: For database operations
- **TypeScript**: For type safety
- **Kysely**: For type-safe SQL queries

### 2. **Browser Support**
- Modern browsers with Web Worker support
- ES2020+ features
- Module workers (`type: "module"`)

### 3. **Performance Requirements**
- Worker initialization < 2 seconds
- Query response time < 100ms for simple queries
- Memory usage optimized for mobile devices

## 📋 API Design Standards

### 1. **Consistent Response Format**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 2. **Error Handling**
- All async operations return structured responses
- Errors include descriptive messages
- Graceful degradation for memory issues

### 3. **Progress Reporting**
```typescript
interface ProgressOptions {
  onProgress?: (progress: number) => void;
}
```

## 🚀 Worker Implementation

### 1. **Request Flow Architecture**
```
useWordNet → WordNetWorkerClient → wordnet-worker → WordNetOrchestrator → WebWordnet
```

**Layer Responsibilities:**
- **useWordNet**: React hook that manages state and provides API
- **WordNetWorkerClient**: Main thread communication client with Comlink
- **wordnet-worker**: Web worker that handles heavy operations
- **WordNetOrchestrator**: High-level WordNet management and cross-lexicon operations
- **WebWordnet**: Low-level database operations using SQLite WASM and Kysely

### 2. **Worker Lifecycle**
- Initialize once, reuse for multiple operations
- Proper cleanup and disposal
- Memory management for SQLite operations

### 2. **API Methods**
- `initializeWordNet()`: Setup and initialization
- `queryWords()`, `querySynsets()`, `querySenses()`: Core queries
- `loadPackage()`, `loadDemoData()`: Data loading
- `getStatus()`, `getStatistics()`: Status and metrics
- `clearData()`: Cleanup operations

### 3. **Fallback Mechanism**
- **Worker-First**: Prefers worker for all heavy operations
- **Graceful Degradation**: Falls back to main thread if worker fails
- **State Synchronization**: Uses refs for immediate access to instances
- **Error Recovery**: Handles worker failures transparently

### 4. **Event System**
- Status updates via return values
- Progress callbacks for long operations
- Error propagation with context

## 🔧 React Integration

### 1. **Hook Architecture**
- **useWordNet**: Main hook that provides WordNet functionality
- **WordNetProvider**: Context provider for global WordNet state
- **WordNetConfigProvider**: Configuration provider for worker settings

### 2. **State Management**
- **Worker State**: Tracks worker availability and status
- **Instance Refs**: Uses refs for immediate access to WordNet instances
- **Fallback State**: Maintains main thread instances for fallback operations

### 3. **Performance Optimization**
- **Worker Isolation**: Heavy operations run in background threads
- **State Synchronization**: Efficient state updates via refs
- **Memory Management**: Proper cleanup and disposal of resources

## 📚 Documentation Standards

### 1. **Code Documentation**
- JSDoc for all public APIs
- Examples in comments
- Type definitions for all interfaces

### 2. **Architecture Documentation**
- Clear separation of concerns
- Data flow diagrams
- Component interaction patterns

### 3. **Usage Examples**
- Basic setup and initialization
- Common query patterns
- Error handling examples

## 🧪 Testing Strategy

### 1. **Unit Tests**
- All public APIs covered
- Mock dependencies for isolation
- Edge case coverage

### 2. **Integration Tests**
- Worker communication
- SQLite operations
- End-to-end workflows

### 3. **Performance Tests**
- Memory usage monitoring
- Query performance benchmarks
- Worker initialization timing

## 🔒 Security Considerations

### 1. **Data Validation**
- Input sanitization for all queries
- SQL injection prevention
- Memory bounds checking

### 2. **Worker Isolation**
- No access to main thread globals
- Sandboxed SQLite operations
- Controlled API exposure

## 📦 Distribution

### 1. **Package Structure**
- ES modules for modern bundlers
- TypeScript declarations included
- Tree-shaking friendly exports

### 2. **Versioning**
- Semantic versioning (SemVer)
- Breaking changes documented
- Migration guides provided

## 🎨 Code Style

### 1. **TypeScript**
- Strict mode enabled
- No implicit any
- Proper interface definitions

### 2. **Naming Conventions**
- PascalCase for classes and interfaces
- camelCase for methods and variables
- UPPER_CASE for constants

### 3. **Error Handling**
- Try-catch blocks for all async operations
- Descriptive error messages
- Proper error propagation

## 🔄 Migration & Compatibility

### 1. **Breaking Changes**
- Major version bumps for breaking changes
- Deprecation warnings in advance
- Migration guides provided

### 2. **Backward Compatibility**
- Maintain API contracts within major versions
- Graceful degradation for removed features
- Polyfills where appropriate

## 📈 Performance Guidelines

### 1. **Memory Management**
- Dispose of workers when not needed
- Clear SQLite data when appropriate
- Monitor memory usage in development

### 2. **Query Optimization**
- Use appropriate indexes
- Limit result sets
- Cache frequently accessed data

### 3. **Worker Efficiency**
- Batch operations where possible
- Minimize data transfer between threads
- Use streaming for large datasets

## 🚨 Common Pitfalls

### 1. **Avoid These Patterns**
- ❌ Using `any` types
- ❌ Duplicating logic across projects
- ❌ Mixing concerns in single modules
- ❌ Ignoring error handling

### 2. **Preferred Patterns**
- ✅ Comprehensive type definitions
- ✅ Single responsibility modules
- ✅ Proper error boundaries
- ✅ Clean separation of concerns

## 📝 Contributing Guidelines

### 1. **Code Review Checklist**
- [ ] Types are properly defined
- [ ] No `any` types used
- [ ] Error handling implemented
- [ ] Tests added/updated
- [ ] Documentation updated

### 2. **Pull Request Process**
- Clear description of changes
- Link to related issues
- Test coverage included
- Breaking changes documented

## 🔮 Future Considerations

### 1. **Planned Features**
- Additional language support
- Advanced query capabilities
- Plugin system for extensions
- Performance monitoring tools

### 2. **Scalability**
- Multiple worker support
- Distributed query processing
- Caching strategies
- Load balancing

---

**This specification is a living document and should be updated as the project evolves.**

Last updated: 2024-12-19

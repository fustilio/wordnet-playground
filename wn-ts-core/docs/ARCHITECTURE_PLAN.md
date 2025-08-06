# wn-ts Architecture Plan

## Overview

This document outlines the comprehensive plan to restructure the wn-ts ecosystem for proper separation of concerns, environment-agnostic core, and consistent APIs across Node.js and browser environments.

## Current State Analysis

### Package Responsibilities

#### **wn-ts-core** (Environment-Agnostic Core)
- ✅ Types and interfaces
- ✅ Abstract base classes (`BaseWordnet`)
- ✅ Environment-agnostic utilities (download, parsers, etc.)
- ❌ Contains Node.js-specific code in `config.ts`
- ❌ Has placeholder database that throws errors
- ❌ Environment provider pattern not properly implemented

#### **wn-ts-node** (Node.js Implementation)
- ✅ Concrete `better-sqlite3` database implementation
- ✅ Node.js-specific file system operations
- ✅ Extends `BaseWordnet` with Node.js capabilities
- ❌ Duplicates some core functionality
- ❌ Could be cleaner separation from core

#### **wn-ts-web** (Browser Implementation)
- ✅ Concrete `@sqlite.org/sqlite-wasm` database implementation
- ✅ Browser-specific features (OPFS, IndexedDB)
- ✅ Extends `BaseWordnet` with browser capabilities
- ❌ Has environment provider that's not being used
- ❌ SQL.js mock issues in tests

#### **wn-ts-web-demo** (Demo Application)
- ✅ React-based demo application
- ✅ Uses `wn-ts-web` for browser functionality
- ✅ Browser testing setup

## Proposed Architecture

### **Phase 1: Clean wn-ts-core (Environment-Agnostic)**

**Goal**: Make `wn-ts-core` truly environment-agnostic

**Files to Fix**:
1. **`wn-ts-core/src/config.ts`** - Remove Node.js-specific code
2. **`wn-ts-core/src/db/database.ts`** - Remove placeholder, keep only interfaces
3. **`wn-ts-core/src/wordnet.ts`** - Make `BaseWordnet` truly abstract
4. **`wn-ts-core/src/interfaces/environment.ts`** - Remove (not needed)

**New Structure**:
```
wn-ts-core/src/
├── types.ts                    # All shared types
├── interfaces/
│   ├── database.ts            # Database interfaces only
│   └── wordnet.ts            # WordNet interfaces only
├── utils/
│   ├── download.ts            # Environment-agnostic download
│   ├── parsers/              # XML/LMF parsers
│   └── archive.ts            # Archive utilities
├── wordnet.ts                # Abstract BaseWordnet class
├── project.ts                # Project management (agnostic)
├── lmf.ts                    # LMF parsing (agnostic)
├── ili.ts                    # ILI handling (agnostic)
└── index.ts                  # Export only agnostic APIs
```

### **Phase 2: Environment-Specific Implementations**

**`wn-ts-node`** (Node.js):
```
wn-ts-node/src/
├── config.ts                 # Node.js-specific config
├── db/
│   └── database.ts          # better-sqlite3 implementation
├── wordnet.ts               # Extends BaseWordnet
├── data-management.ts       # Node.js file operations
└── index.ts                 # Export Node.js APIs
```

**`wn-ts-web`** (Browser):
```
wn-ts-web/src/
├── db/
│   └── database.ts          # @sqlite.org/sqlite-wasm implementation
├── wordnet.ts               # Extends BaseWordnet
├── data-management.ts       # Browser storage operations
├── opfs-manager.ts          # OPFS for persistence
└── index.ts                 # Export browser APIs
```

### **Phase 3: Data Flow Architecture**

**Core Data Flow**:
```
wn-ts-core (interfaces) 
    ↓
wn-ts-node (Node.js impl)    wn-ts-web (Browser impl)
    ↓                              ↓
better-sqlite3              @sqlite.org/sqlite-wasm
    ↓                              ↓
File System                  OPFS/IndexedDB
```

**API Consistency**:
- Both packages implement the same interfaces from `wn-ts-core`
- Both extend `BaseWordnet` with environment-specific capabilities
- Both provide the same high-level API (words, synsets, etc.)

### **Phase 4: Testing Strategy**

**`wn-ts-core`**: Unit tests for agnostic utilities
**`wn-ts-node`**: Node.js tests with real database
**`wn-ts-web`**: Browser tests with SQLite WASM
**`wn-ts-web-demo`**: Integration tests and demos

## Implementation Plan

### **Step 1: Clean wn-ts-core**
1. Remove Node.js-specific code from `config.ts`
2. Remove placeholder database implementation
3. Make `BaseWordnet` truly abstract
4. Keep only environment-agnostic utilities

### **Step 2: Fix wn-ts-node**
1. Implement proper Node.js config
2. Ensure database implementation is complete
3. Extend `BaseWordnet` properly

### **Step 3: Fix wn-ts-web**
1. Remove environment provider pattern
2. Implement proper browser database
3. Extend `BaseWordnet` properly
4. Fix SQL.js mock issues

### **Step 4: Update Dependencies**
1. Ensure proper workspace dependencies
2. Update import/export structure
3. Fix TypeScript compilation

## SQLite Implementation Differences

### **better-sqlite3** (Node.js)
- Synchronous API
- Direct file access
- Better performance for CPU-intensive tasks
- Blocks event loop during operations

### **@sqlite.org/sqlite-wasm** (Browser)
- Asynchronous API
- Requires initialization with SQLite module
- Non-blocking, better for UI responsiveness
- Overhead of async/await

### **Impact on API Design**
- Database interface must be async to support browser
- Transaction handling differs between environments
- Error handling patterns vary

## Current Issues to Address

### **Immediate Issues**
1. **SQL.js Mock Problems**: `stmt.all` and `stmt.get` not available in mock
2. **Environment Provider**: Not properly initialized in tests
3. **TypeScript Errors**: Compilation issues in wn-ts-core

### **Architectural Issues**
1. **Mixed Responsibilities**: wn-ts-core contains environment-specific code
2. **Inconsistent APIs**: Different patterns between Node.js and browser
3. **Testing Complexity**: Different test setups for different environments

## Success Criteria

### **Phase 1 Success**
- [ ] wn-ts-core compiles without TypeScript errors
- [ ] wn-ts-core has no environment-specific code
- [ ] All interfaces are properly defined
- [ ] BaseWordnet is truly abstract

### **Phase 2 Success**
- [ ] wn-ts-node extends BaseWordnet properly
- [ ] wn-ts-web extends BaseWordnet properly
- [ ] Both packages implement same interfaces
- [ ] Both packages have consistent APIs

### **Phase 3 Success**
- [ ] All tests pass in both environments
- [ ] Performance is acceptable in both environments
- [ ] Documentation is updated
- [ ] Examples work in both environments

## Timeline

### **Week 1**: Clean wn-ts-core
- Fix TypeScript compilation issues
- Remove environment-specific code
- Establish proper interfaces

### **Week 2**: Fix environment-specific packages
- Update wn-ts-node to use clean core
- Update wn-ts-web to use clean core
- Fix SQL.js mock issues

### **Week 3**: Testing and Documentation
- Ensure all tests pass
- Update documentation
- Create examples

### **Week 4**: Performance and Polish
- Performance optimization
- Final testing
- Release preparation

## Notes

- This plan prioritizes clean architecture over quick fixes
- Environment-specific code should be isolated to respective packages
- Testing strategy must account for different environments
- Performance considerations differ between Node.js and browser 
# WordNet TypeScript Architecture

This document provides a comprehensive overview of the architecture and relationships between the various projects in the WordNet TypeScript ecosystem.

## 🏗️ **Architecture Overview**

The WordNet TypeScript project follows a **layered architecture** with clear separation of concerns and **explicit client passing** patterns. Each package is optimized for its target environment while maintaining API consistency across platforms.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ wn-ts-web-  │  │   wn-cli    │  │  Custom     │           │
│  │    demo     │  │             │  │  Apps       │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ wn-ts-node  │  │ wn-ts-web   │  │ Future:     │           │
│  │ (Node.js)   │  │ (Browser)   │  │ wn-ts-deno  │           │
│  │ ✅ Complete │  │ ✅ Complete  │  │ 📋 Planned  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Layer                                │
│                    ┌─────────────┐                            │
│                    │ wn-ts-core  │                            │
│                    │ (Shared)    │                            │
│                    │ ✅ Complete  │                            │
│                    └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 **Package Relationships**

### **Core Dependencies**

```mermaid
graph TD
    A[wn-ts-core] --> B[wn-ts-node]
    A --> C[wn-ts-web]
    B --> D[wn-cli]
    C --> E[wn-ts-web-demo]
    
    A --> F[Shared Types]
    A --> G[Module Functions]
    A --> H[Base Classes]
    
    B --> I[better-sqlite3]
    C --> J[@sqlite.org/sqlite-wasm]
    E --> K[React + Vite]
```

### **Data Flow Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   wn-ts-core    │    │   wn-ts-node    │    │   wn-ts-web     │
│                 │    │                 │    │                 │
│ • Package       │───▶│ • Downloads     │───▶│ • Browser       │
│   definitions   │    │   real data     │    │   distribution  │
│ • index.toml    │    │ • E2E tests     │    │ • SQLite WASM   │
│ • Available     │    │ • File system   │    │ • OPFS storage  │
│   packages      │    │   operations    │    │ • WebAssembly   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    wn-ts-web-demo                             │
│                                                               │
│ • React application using wn-ts-web                          │
│ • Real data loading from wn-ts-core/index.toml              │
│ • Interactive UI with data management                        │
│ • E2E tests matching wn-ts-node patterns                     │
│ • Multilingual exploration and search                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **Design Principles**

### **1. Explicit Client Passing**

All module functions explicitly receive `BaseWordnet` instances as their first parameter:

```typescript
// Core module functions
import { words, synsets, lexicons } from 'wn-ts-core';

const wordnetClient = new Wordnet('oewn:2024'); // From wn-ts-node
const wordResults = await words(wordnetClient, 'run', 'v');
const synsetResults = await synsets(wordnetClient, 'run', 'v');
const lexiconResults = await lexicons(wordnetClient);
```

**Benefits:**
- **Decoupling**: Module functions don't instantiate their own clients
- **Testability**: Easy to mock and test individual functions
- **Flexibility**: Can use different client implementations
- **Performance**: No hidden database connections

### **2. Environment-Agnostic Core**

The `wn-ts-core` package contains only environment-agnostic code:

```typescript
// wn-ts-core - Environment-agnostic
export abstract class BaseWordnet {
  abstract async words(form: string, pos?: PartOfSpeech): Promise<Word[]>;
  abstract async synsets(form: string, pos?: PartOfSpeech): Promise<Synset[]>;
  // ... other abstract methods
}

// wn-ts-node - Node.js implementation
export class Wordnet extends BaseWordnet {
  async words(form: string, pos?: PartOfSpeech): Promise<Word[]> {
    // Node.js-specific implementation using better-sqlite3
  }
}

// wn-ts-web - Browser implementation  
export class WebWordnet extends BaseWordnet {
  async words(form: string, pos?: PartOfSpeech): Promise<Word[]> {
    // Browser-specific implementation using SQLite WASM
  }
}
```

### **3. Consistent APIs Across Environments**

All environment-specific packages implement the same interfaces:

```typescript
// Same API, different implementations
const nodeWordnet = new Wordnet('oewn:2024');        // Node.js
const webWordnet = new WebWordnet('oewn:2024');      // Browser

// Identical usage patterns
const words = await nodeWordnet.words('run', 'v');
const words = await webWordnet.words('run', 'v');
```

## 🔧 **Implementation Details**

### **Database Layer**

#### **Node.js (better-sqlite3)**
```typescript
import Database from 'better-sqlite3';

class NodeDatabase implements DatabaseInterface {
  private db: Database.Database;
  
  async initialize(): Promise<void> {
    this.db = new Database('wordnet.db');
    // Create tables, indexes, etc.
  }
  
  async words(form: string): Promise<Word[]> {
    const stmt = this.db.prepare('SELECT * FROM words WHERE form = ?');
    return stmt.all(form);
  }
}
```

#### **Browser (@sqlite.org/sqlite-wasm)**
```typescript
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

class WebDatabase implements DatabaseInterface {
  private db: any;
  
  async initialize(): Promise<void> {
    const sqlite3 = await sqlite3InitModule();
    this.db = new sqlite3.Database();
    // Create tables, indexes, etc.
  }
  
  async words(form: string): Promise<Word[]> {
    const stmt = this.db.prepare('SELECT * FROM words WHERE form = ?');
    return stmt.all(form);
  }
}
```

### **Configuration Management**

#### **Node.js Configuration**
```typescript
// wn-ts-node/src/config.ts
export class ConfigManager extends BaseConfigManager {
  get dataDirectory(): string {
    return process.env.WN_DATA_DIR || path.join(os.homedir(), '.wordnet');
  }
  
  get downloadDirectory(): string {
    return path.join(this.dataDirectory, 'downloads');
  }
}
```

#### **Browser Configuration**
```typescript
// wn-ts-web/src/config.ts
export class ConfigManager extends BaseConfigManager {
  get dataDirectory(): string {
    return 'opfs://wordnet-data';
  }
  
  get downloadDirectory(): string {
    return 'opfs://wordnet-downloads';
  }
}
```

## 📊 **Current Status**

### **✅ Completed Packages**

#### **wn-ts-core** - Environment-Agnostic Core
- **Status**: ✅ Complete
- **Tests**: 207 tests passing
- **Features**:
  - Abstract `BaseWordnet` class
  - Environment-agnostic utilities
  - Shared types and interfaces
  - Module functions with explicit client passing

#### **wn-ts-web** - Browser Implementation
- **Status**: ✅ Complete
- **Tests**: 65 tests passing
- **Features**:
  - SQLite WASM integration
  - OPFS (Origin Private File System) support
  - IndexedDB fallback
  - Browser-optimized performance

### **🔄 In Progress**

#### **wn-ts-node** - Node.js Implementation
- **Status**: 🔄 In Progress
- **Tests**: Needs final integration testing
- **Features**:
  - better-sqlite3 integration
  - File system operations
  - Node.js-specific optimizations

### **📋 Planned**

#### **wn-ts-web-demo** - Demo Application
- **Status**: 📋 Planned
- **Features**:
  - React-based demo
  - Interactive WordNet exploration
  - Real data loading and display

## 🚀 **Performance Characteristics**

### **Node.js Environment**
- **Database**: better-sqlite3 (synchronous, high performance)
- **Storage**: Direct file system access
- **Memory**: Full access to system memory
- **Concurrency**: Event loop with worker threads

### **Browser Environment**
- **Database**: SQLite WASM (asynchronous, UI-friendly)
- **Storage**: OPFS for persistence, IndexedDB fallback
- **Memory**: Limited by browser constraints
- **Concurrency**: Non-blocking async operations

## 🔄 **Migration Strategy**

### **From Mixed Architecture**
```typescript
// Old: Mixed Node.js/browser code
import { Wordnet } from 'wn-ts'; // ❌ Environment-specific

// New: Environment-agnostic with explicit client
import { words, synsets } from 'wn-ts-core';
import { Wordnet } from 'wn-ts-node'; // ✅ Node.js-specific

const wordnet = new Wordnet('oewn:2024');
const results = await words(wordnet, 'run', 'v');
```

### **Benefits of New Architecture**
1. **Clear separation**: Environment-specific code is isolated
2. **Better testing**: Easier to mock and test
3. **Performance**: Optimized for each environment
4. **Maintainability**: Simpler to add new environments
5. **Type safety**: Better TypeScript support

## 📚 **Documentation Structure**

```
docs/
├── architecture/          # Architecture decisions and patterns
├── api/                  # API documentation
├── examples/             # Usage examples
├── migration/            # Migration guides
└── performance/          # Performance benchmarks
```

## 🎯 **Next Steps**

1. **Complete Phase 3**: Finish wn-ts-node integration
2. **Begin Phase 4**: Integration testing across all packages
3. **Performance optimization**: Benchmark and optimize for each environment
4. **Documentation**: Complete API documentation and examples
5. **Release preparation**: Prepare for major version release 
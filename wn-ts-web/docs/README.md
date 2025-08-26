# wn-ts-web Documentation

## 🎯 **Overview**

`wn-ts-web` is the browser-optimized implementation of the WordNet TypeScript ecosystem. It provides React hooks, Web Worker integration, and SQLite storage optimized for web applications, enabling powerful WordNet operations directly in the browser.

## 🚀 **Key Features**

- **React Integration**: Custom hooks and components for seamless React integration
- **Web Worker Architecture**: Offloads heavy operations to maintain UI responsiveness
- **SQLite with OPFS**: Persistent storage using the Origin Private File System
- **Cross-Lingual Support**: Multi-language lexicon management with ILI linking
- **Performance Optimized**: Lazy loading, caching, and parallel processing

## 🏗️ **Architecture Overview**

### **Layered Architecture**

The system follows a clear layered design for maintainability and performance:

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
│  WebWordnet (Core WordNet operations)                         │
│  ├─ Data loading and validation                               │
│  ├─ Query processing                                          │
│  └─ Cache management                                          │
├─────────────────────────────────────────────────────────────────┤
│  Database Layer (SQLite/Kysely)                               │
│  ├─ Schema management                                         │
│  ├─ Data persistence                                          │
│  └─ Query optimization                                        │
└─────────────────────────────────────────────────────────────────┘
```

### **Worker-First Design**

Heavy operations are offloaded to Web Workers to maintain UI responsiveness:

- **LMF XML Parsing**: Large file processing in background
- **Database Operations**: Bulk inserts and complex queries
- **Data Validation**: Schema validation and integrity checks
- **Cross-Lingual Operations**: ILI-based concept mapping

## 📚 **Core Types & Interfaces**

### **WordNet Entity Types**

All types follow the established naming conventions with `Id` suffixes:

```typescript
// Core entity interfaces with consistent ID naming
interface Word {
  id: string;
  lemma: string;
  partOfSpeech: string;
  lexiconId: string;
  syntacticBehaviours?: SyntacticBehaviour[];
  // ... other properties
}

interface Synset {
  id: string;
  partOfSpeech: string;
  iliId?: string;
  memberIds: string[];        // References Word.id[]
  senseIds: string[];         // References Sense.id[]
  // ... other properties
}

interface Sense {
  id: string;
  wordId: string;             // References Word.id
  synsetId: string;           // References Synset.id
  // ... other properties
}
```

### **Key Naming Conventions**

**Rule**: Always use the `Id` suffix for properties that reference IDs of other entities.

**✅ Correct Examples:**
- `wordId: string` - References Word.id
- `synsetId: string` - References Synset.id
- `lexiconId: string` - References Lexicon.id
- `memberIds: string[]` - References Word.id[]
- `senseIds: string[]` - References Sense.id[]

**❌ Incorrect Examples:**
- `word: string` - Should be wordId
- `synset: string` - Should be synsetId
- `members: string[]` - Should be memberIds
- `senses: string[]` - Should be senseIds

## 🔧 **React Integration**

### **useWordNet Hook**

The primary hook for WordNet operations in React components:

```typescript
import { useWordNet } from '@wn-ts/web'

function WordNetComponent() {
  const { 
    wordnet, 
    isLoading, 
    error, 
    loadLexicon, 
    getSynset 
  } = useWordNet()

  useEffect(() => {
    loadLexicon('en', '1.0.0')
  }, [])

  const handleSearch = async (query: string) => {
    const synsets = await getSynset('en', query)
    // Process results
  }

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {/* Component content */}
    </div>
  )
}
```

### **Hook Features**

- **State Management**: Automatic loading and error state handling
- **Worker Coordination**: Seamless Web Worker integration
- **Fallback Logic**: Graceful degradation when workers unavailable
- **Resource Management**: Automatic cleanup and memory management

## 🗄️ **Database & Storage**

### **SQLite with OPFS**

Persistent storage using the Origin Private File System:

```typescript
import { WebWordnet } from '@wn-ts/web'

const wordnet = new WebWordnet({
  databasePath: '/wordnet.db',
  enablePersistence: true
})

// Data persists across browser sessions
await wordnet.loadLexicon('en', '1.0.0')
```

### **Schema Management**

Automatic database schema creation and management:

```typescript
// Tables are created automatically with proper relationships
interface Database {
  lexicons: LexiconTable;      // Lexicon metadata
  words: WordTable;            // Lexical entries
  synsets: SynsetTable;        // Concept groupings
  senses: SenseTable;          // Word-synset relationships
  definitions: DefinitionTable; // Synset definitions
  relations: RelationTable;    // Cross-synset relationships
  examples: ExampleTable;      // Usage examples
  ilis: IliTable;              // Interlingual Index
  forms: FormTable;            // Alternative word forms
}
```

## 🔍 **LMF XML Processing**

### **Parser Features**

- **Schema Validation**: XSD validation against official WN-LMF schemas
- **Deduplication**: Configurable handling of duplicate IDs
- **Error Handling**: Comprehensive error reporting with specific error types
- **Performance**: Optimized for large XML files

### **Parsing Options**

```typescript
interface LmfParseOptions {
  mergeStrategy?: 'keep-first' | 'keep-last' | 'error';
  validateSchema?: boolean;
  strictMode?: boolean;
  progressCallback?: ProgressCallback;
}
```

### **Usage Example**

```typescript
import { LmfParser } from '@wn-ts/web'

const parser = new LmfParser({
  mergeStrategy: 'keep-last',
  validateSchema: true
})

const result = await parser.parse(xmlContent)
```

## 🌐 **Cross-Lingual Operations**

### **ILI-Based Linking**

Interlingual Index enables powerful cross-language operations:

```typescript
// Load multiple language lexicons
await wordnet.loadLexicon('en', '1.0.0')
await wordnet.loadLexicon('fr', '1.0.0')
await wordnet.loadLexicon('de', '1.0.0')

// Find equivalent concepts across languages
const englishSynset = await wordnet.getSynset('en', 'synset-1')
const iliId = englishSynset.iliId

const frenchSynsets = await wordnet.findSynsetsByIli('fr', iliId)
const germanSynsets = await wordnet.findSynsetsByIli('de', iliId)
```

### **Multi-Lexicon Management**

Efficient handling of multiple lexicons:

```typescript
// Orchestrate operations across lexicons
const orchestrator = new WordNetOrchestrator()

await orchestrator.loadMultipleLexicons([
  { language: 'en', version: '1.0.0' },
  { language: 'fr', version: '1.0.0' },
  { language: 'de', version: '1.0.0' }
])

// Cross-lexicon queries
const results = await orchestrator.searchAcrossLanguages('example')
```

## 🚀 **Performance Optimization**

### **Lazy Loading**

Lexicons are loaded on-demand for optimal performance:

```typescript
// Lexicon loaded only when needed
const synset = await wordnet.getSynset('en', 'synset-1')
// Automatically loads English lexicon if not already loaded
```

### **Intelligent Caching**

Multi-level caching strategy:

- **Memory Cache**: Frequently accessed data in memory
- **Database Cache**: Persistent storage for large datasets
- **Worker Cache**: Cached results in Web Workers

### **Parallel Processing**

Concurrent operations using Web Workers:

```typescript
// Multiple operations run in parallel
const [enResult, frResult, deResult] = await Promise.all([
  wordnet.loadLexicon('en', '1.0.0'),
  wordnet.loadLexicon('fr', '1.0.0'),
  wordnet.loadLexicon('de', '1.0.0')
])
```

## 🧪 **Testing & Validation**

### **Comprehensive Testing**

- **Unit Tests**: Core functionality and edge cases
- **Integration Tests**: Module interaction and data flow
- **Browser Tests**: Cross-browser compatibility
- **Performance Tests**: Benchmarking and optimization

### **Test Data Management**

- **Embedded Test Files**: Self-contained test data
- **Real-World Samples**: Actual WordNet data for validation
- **Edge Case Coverage**: Duplicate IDs, malformed XML, etc.

### **Validation Pipeline**

Multi-stage validation ensuring data integrity:

1. **XML Structure**: Schema compliance and well-formedness
2. **Data Consistency**: Referential integrity validation
3. **Business Rules**: WordNet-specific validation logic
4. **Cross-Reference**: ILI mapping validation

## 📖 **API Reference**

### **Core Classes**

```typescript
// Main WordNet implementation
export { WebWordnet, WebWordnetOptions }

// React integration
export { useWordNet, WordNetProvider }

// Orchestration
export { WordNetOrchestrator, MultiLexiconOptions }

// Parsing and validation
export { LmfParser, LmfParseOptions, ValidationResult }
```

### **Type Definitions**

All types are fully documented with JSDoc comments:

- **Property descriptions**: Clear explanation of each field
- **Usage examples**: Practical examples of type usage
- **Validation rules**: Constraints and requirements
- **Relationships**: How types relate to each other

## 🚀 **Getting Started**

### **Installation**

```bash
pnpm add @wn-ts/web
```

### **Basic Usage**

```typescript
import { useWordNet } from '@wn-ts/web'

function App() {
  const { wordnet, loadLexicon, getSynset } = useWordNet()

  useEffect(() => {
    loadLexicon('en', '1.0.0')
  }, [])

  const handleSearch = async (query: string) => {
    const synsets = await getSynset('en', query)
    console.log('Found synsets:', synsets)
  }

  return (
    <div>
      <button onClick={() => handleSearch('example')}>
        Search for "example"
      </button>
    </div>
  )
}
```

### **Advanced Usage**

```typescript
import { WebWordnet, WordNetOrchestrator } from '@wn-ts/web'

// Direct usage without React
const wordnet = new WebWordnet({
  databasePath: '/wordnet.db',
  enablePersistence: true
})

// Multi-lexicon orchestration
const orchestrator = new WordNetOrchestrator()
await orchestrator.loadMultipleLexicons([
  { language: 'en', version: '1.0.0' },
  { language: 'fr', version: '1.0.0' }
])

// Cross-lingual operations
const results = await orchestrator.searchAcrossLanguages('example')
```

## 🔍 **Common Use Cases**

### **Single Language Operations**

- Load and query English WordNet
- Search for synsets and senses
- Navigate semantic relationships
- Extract definitions and examples

### **Cross-Lingual Analysis**

- Compare concepts across languages
- Find equivalent expressions
- Analyze semantic differences
- Build multilingual applications

### **Data Processing**

- Parse LMF XML files
- Validate data integrity
- Transform between formats
- Export processed data

## 📚 **Related Documentation**

### **Core Standards**
- **[Development Conventions](../docs/DEVELOPMENT_CONVENTIONS.md)** - Coding standards and patterns
- **[Database Schema Standards](../docs/DATABASE_SCHEMA_STANDARDS.md)** - Database design and optimization
- **[Testing Strategy](../docs/TESTING_STRATEGY.md)** - Testing approach and coverage requirements

### **Implementation Guides**
- **[API Reference](./API.md)** - Complete API documentation
- **[Architecture](./ARCHITECTURE.md)** - System architecture and design patterns
- **[Worker Architecture](./WORKER_ARCHITECTURE.md)** - Web Worker implementation details
- **[React Integration](./REACT_INTEGRATION.md)** - React-specific patterns and examples

### **Core Library**
- **[wn-ts-core Documentation](../wn-ts-core/docs/)** - Foundation library and types
- **[Main Project README](../README.md)** - Project overview and lexicon format details

---

**Note**: This is the browser-optimized implementation of the WordNet TypeScript ecosystem, providing React integration, Web Worker performance, and persistent storage capabilities.

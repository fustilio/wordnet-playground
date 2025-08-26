# WordNet TypeScript Ecosystem

A comprehensive TypeScript ecosystem for working with WordNet data, featuring cross-lingual support, multiple lexicon formats, and optimized database operations.

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run browser tests
pnpm test:browser

# Run all demo examples
cd demo && pnpm all-use-cases
```

## 📚 **Lexicon Formats & Data Structure**

### **Supported Lexicon Formats**

The ecosystem supports multiple WordNet lexicon formats for maximum compatibility:

- **LMF XML (Lexical Markup Framework)**: Primary format with versions 1.0-1.4
- **JSON-LD (Lemon Vocabulary)**: JSON format with Linked Data semantics  
- **OntoLex RDF**: RDF/OWL representation of WordNet
- **Custom TSV/CSV**: Tabular formats for bulk operations

### **LMF XML Structure**

LMF XML follows the official WordNet-LMF schema with these key elements:

```xml
<LexicalResource>
  <Lexicon id="en-1.0" language="en" version="1.0">
    <LexicalEntry id="word-1" partOfSpeech="n">
      <Lemma writtenForm="example"/>
      <Sense id="sense-1" synset="synset-1"/>
    </LexicalEntry>
    <Synset id="synset-1" ili="i12345" partOfSpeech="n">
      <Definition>An example definition</Definition>
    </Synset>
  </Lexicon>
</LexicalResource>
```

**Critical Processing Order**: LMF XML must be processed in dependency order:
1. **Lexicons** (metadata and versioning)
2. **Words** (lexical entries with lemmas)
3. **Synsets** (concept groupings with ILI mappings)
4. **Senses** (word-synset relationships)
5. **Relations** (cross-synset connections)
6. **Definitions & Examples** (descriptive content)

### **Data Preservation Strategy**

The system preserves all original data while optimizing for cross-lingual operations:

- **Full XML Preservation**: All attributes, elements, and metadata retained
- **ILI-Based Linking**: Interlingual Index entries enable cross-language concept mapping
- **Deduplication Handling**: Configurable strategies for duplicate ID resolution
- **Validation Pipeline**: Multi-stage validation ensuring data integrity

## 🗄️ **Database Schema & Data Mapping**

The system uses a normalized relational database schema optimized for cross-lingual linking and efficient querying:

### **Core Tables Structure**

```typescript
interface Database {
  lexicons: LexiconTable;      // Lexicon metadata and versioning
  words: WordTable;            // Lexical entries (lemmas)
  synsets: SynsetTable;        // Synsets with ILI mappings
  senses: SenseTable;          // Word-synset relationships
  definitions: DefinitionTable; // Synset definitions
  relations: RelationTable;    // Synset-synset relationships
  examples: ExampleTable;      // Usage examples
  ilis: IliTable;              // Interlingual Index entries
  forms: FormTable;            // Alternative word forms
}
```

### **Key Data Mapping Principles**

- **ID Consistency**: All entities use consistent ID patterns (`wordId`, `synsetId`, `lexiconId`)
- **Foreign Key Relationships**: Proper referential integrity with database constraints
- **Cross-Lingual Linking**: ILI-based concept mapping across languages
- **Performance Optimization**: Strategic indexing for common query patterns

### **Cross-Lingual Linking Strategy**

The ILI (Interlingual Index) system enables powerful cross-language operations:

```typescript
// Find equivalent concepts across languages
const englishSynset = await wordnet.getSynset('en', 'synset-1')
const iliId = englishSynset.iliId
const frenchSynsets = await wordnet.findSynsetsByIli('fr', iliId)
const germanSynsets = await wordnet.findSynsetsByIli('de', iliId)
```

## ✅ **Data Integrity & Validation**

### **Schema Compliance**

- **XSD Validation**: All LMF XML validated against official WN-LMF schemas
- **Type Safety**: Full TypeScript typing with strict interfaces
- **Constraint Validation**: Database-level foreign key and uniqueness constraints

### **Comprehensive Validation System**

The validation pipeline ensures data quality at every stage:

1. **XML Structure**: Schema compliance and well-formedness
2. **Data Consistency**: Referential integrity and constraint validation
3. **Business Rules**: WordNet-specific validation logic
4. **Cross-Reference**: ILI mapping validation across lexicons

### **Strategic Indexing**

Performance-optimized database design:

```sql
-- Core lookup indexes
CREATE INDEX idx_senses_word_id ON senses(word_id);
CREATE INDEX idx_senses_synset_id ON senses(synset_id);
CREATE INDEX idx_synsets_ili_id ON synsets(ili_id);

-- Cross-lexicon performance
CREATE INDEX idx_synset_relations_source ON synset_relations(source_synset_id);
CREATE INDEX idx_synset_relations_target ON synset_relations(target_synset_id);
```

## 🏗️ **Architecture Overview**

### **Layered Design**

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

### **Worker-First Architecture**

- **UI Responsiveness**: Heavy operations offloaded to Web Workers
- **Parallel Processing**: Multiple workers for concurrent operations
- **Memory Management**: Efficient resource handling and cleanup
- **Fallback Support**: Graceful degradation when workers unavailable

## 📦 **Core Modules**

### **`wn-ts-core`** - Foundation Library
- Core types and interfaces
- LMF XML parser and validator
- Database schema definitions
- Shared utilities and constants

### **`wn-ts-web`** - Browser Implementation
- React hooks and components
- Web Worker integration
- SQLite with OPFS storage
- Browser-optimized performance

### **`wn-ts-node`** - Node.js Implementation
- Server-side processing
- File system operations
- Database management
- CLI tools and utilities

### **`wn-ts-web-demo`** - Interactive Examples
- Live demonstration of capabilities
- Cross-lingual exploration
- Performance benchmarking
- Development playground

## 🧪 **Testing & Quality**

### **Comprehensive Test Coverage**

- **Unit Tests**: Core functionality and edge cases
- **Integration Tests**: Module interaction and data flow
- **E2E Tests**: Complete user workflows
- **Browser Tests**: Cross-browser compatibility
- **Performance Tests**: Benchmarking and optimization

### **Test Data Management**

- **Embedded Test Files**: Self-contained test data
- **Real-World Samples**: Actual WordNet data for validation
- **Edge Case Coverage**: Duplicate IDs, malformed XML, etc.
- **Cross-Lingual Validation**: Multi-language test scenarios

## 📖 **Documentation**

### **Core Standards**
- **[Development Conventions](./docs/DEVELOPMENT_CONVENTIONS.md)** - Coding standards and patterns
- **[Database Schema Standards](./docs/DATABASE_SCHEMA_STANDARDS.md)** - Database design and optimization
- **[Testing Strategy](./docs/TESTING_STRATEGY.md)** - Testing approach and coverage requirements

### **Implementation Guides**
- **[wn-ts-web Documentation](./wn-ts-web/docs/)** - Browser implementation guide
- **[wn-ts-node Documentation](./wn-ts-node/docs/)** - Node.js implementation guide
- **[API Reference](./wn-ts-web/docs/API.md)** - Complete API documentation

### **Architecture & Design**
- **[System Architecture](./wn-ts-web/docs/ARCHITECTURE.md)** - Comprehensive system design
- **[Worker Architecture](./wn-ts-web/docs/WORKER_ARCHITECTURE.md)** - Web Worker implementation details
- **[React Integration](./wn-ts-web/docs/REACT_INTEGRATION.md)** - React-specific patterns and examples

## 🚀 **Performance & Optimization**

### **Key Performance Features**

- **Lazy Loading**: Lexicons loaded on-demand
- **Intelligent Caching**: Multi-level caching strategy
- **Parallel Processing**: Worker-based concurrent operations
- **Database Optimization**: Strategic indexing and query optimization
- **Memory Management**: Efficient resource handling

### **Benchmark Results**

- **XML Parsing**: < 100ms for 1MB LMF files
- **Database Operations**: < 50ms for single queries
- **Cross-Lingual Queries**: < 200ms for complex ILI lookups
- **Memory Usage**: < 2x input size for processing

## 🔧 **Development & Contributing**

### **Prerequisites**

- Node.js 18+ and pnpm
- TypeScript 5.0+
- Modern browser support (ES2020+)

### **Development Workflow**

```bash
# Setup development environment
pnpm install
pnpm build

# Run tests
pnpm test
pnpm test:browser

# Build packages
pnpm build:packages

# Run benchmarks
pnpm bench
```

### **Code Quality Standards**

- **TypeScript Strict Mode**: Full type safety enforcement
- **ESLint + Prettier**: Consistent code formatting
- **Test Coverage**: Minimum 90% unit test coverage
- **Documentation**: Comprehensive API documentation
- **Performance**: Benchmark requirements for critical paths

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines and development standards in the [docs](./docs/) directory.

## 📚 **References & Resources**

- **[WordNet Project](https://wordnet.princeton.edu/)** - Original WordNet database
- **[LMF Specification](https://www.lexicalmarkupframework.org/)** - Lexical Markup Framework standard
- **[Interlingual Index](https://en.wikipedia.org/wiki/Interlingual_Index)** - Cross-lingual concept mapping
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript language reference


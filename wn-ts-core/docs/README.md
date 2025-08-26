# wn-ts-core Documentation

## 🎯 **Overview**

`wn-ts-core` is the foundational library that provides the core types, interfaces, and utilities for the entire WordNet TypeScript ecosystem. It defines the data structures, parsing logic, and database schemas used across all `wn-ts` modules.

## 📚 **Core Types & Interfaces**

### **WordNet Entity Types**

The core types define the fundamental structure of WordNet data:

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

interface SyntacticBehaviour {
  id: string;
  senseIds: string[];         // References Sense.id[]
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

## 🗄️ **Database Schema**

### **Core Tables**

The database schema is designed for optimal cross-lingual operations:

```typescript
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

### **Schema Builder**

The `SchemaBuilder` class provides static methods to create all database tables and indexes:

```typescript
import { SchemaBuilder } from '@wn-ts/core'

// Create all tables with proper foreign key dependencies
const schema = SchemaBuilder.createAllTables()

// Create specific table
const sensesTable = SchemaBuilder.createSensesTable()
```

## 🔍 **LMF XML Parser**

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
import { LmfParser } from '@wn-ts/core'

const parser = new LmfParser({
  mergeStrategy: 'keep-last',
  validateSchema: true
})

const result = await parser.parse(xmlContent)
```

## ✅ **Data Validation**

### **Validation Pipeline**

The validation system ensures data integrity at multiple levels:

1. **XML Structure**: Schema compliance and well-formedness
2. **Data Consistency**: Referential integrity validation
3. **Business Rules**: WordNet-specific validation logic
4. **Cross-Reference**: ILI mapping validation

### **Validation Results**

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: ValidationStatistics;
}
```

## 🔧 **Utilities & Helpers**

### **Common Utilities**

- **ID Generation**: Consistent ID generation patterns
- **Data Conversion**: Format conversion utilities
- **Validation Helpers**: Common validation functions
- **Performance Tools**: Benchmarking and profiling utilities

### **Constants & Enums**

```typescript
// Part of speech constants
enum PartOfSpeech {
  NOUN = 'n',
  VERB = 'v',
  ADJECTIVE = 'a',
  ADVERB = 'r',
  // ... other POS values
}

// Relation types
enum RelationType {
  HYPERNYM = 'hypernym',
  HYPONYM = 'hyponym',
  SYNONYM = 'synonym',
  // ... other relation types
}
```

## 🧪 **Testing Support**

### **Test Utilities**

- **Mock Data Generators**: Create test data with proper relationships
- **Validation Helpers**: Test data integrity and consistency
- **Performance Benchmarks**: Measure parsing and validation performance

### **Test Data**

```typescript
import { createTestLexicon, createTestWord, createTestSynset } from '@wn-ts/core/test'

const testLexicon = createTestLexicon('en', '1.0.0')
const testWord = createTestWord('test-word', testLexicon.id)
const testSynset = createTestSynset('test-synset', testLexicon.id)
```

## 📊 **Performance Considerations**

### **Optimization Features**

- **Streaming Parsing**: Memory-efficient XML processing
- **Lazy Loading**: Load data on-demand
- **Caching**: Intelligent caching strategies
- **Parallel Processing**: Concurrent operation support

### **Benchmark Results**

- **XML Parsing**: < 100ms for 1MB files
- **Validation**: < 50ms for standard lexicons
- **Memory Usage**: < 2x input size for processing

## 🔗 **Integration Patterns**

### **Module Integration**

`wn-ts-core` is designed to integrate seamlessly with other `wn-ts` modules:

```typescript
// Web implementation
import { Word, Synset, Sense } from '@wn-ts/core'
import { WebWordnet } from '@wn-ts/web'

// Node.js implementation
import { LmfParser } from '@wn-ts/core'
import { NodeWordnet } from '@wn-ts/node'
```

### **Extension Points**

The core library provides extension points for custom functionality:

- **Custom Parsers**: Implement additional format support
- **Validation Rules**: Add custom business logic validation
- **Data Transformers**: Custom data transformation pipelines

## 📖 **API Reference**

### **Core Exports**

```typescript
// Main types
export { Word, Synset, Sense, Lexicon, Relation }
export { LmfParser, LmfParseOptions }
export { SchemaBuilder, Database }

// Utilities
export { createId, validateId, normalizeLemma }
export { ValidationResult, ValidationError }

// Constants
export { PartOfSpeech, RelationType, ErrorCode }
```

### **Type Definitions**

All types are fully documented with JSDoc comments and include:

- **Property descriptions**: Clear explanation of each field
- **Usage examples**: Practical examples of type usage
- **Validation rules**: Constraints and requirements
- **Relationships**: How types relate to each other

## 🚀 **Getting Started**

### **Installation**

```bash
pnpm add @wn-ts/core
```

### **Basic Usage**

```typescript
import { LmfParser, Word, Synset } from '@wn-ts/core'

// Parse LMF XML
const parser = new LmfParser()
const result = await parser.parse(xmlContent)

// Work with parsed data
const words: Word[] = result.words
const synsets: Synset[] = result.synsets
const senses: Sense[] = result.senses
```

### **Advanced Usage**

```typescript
import { SchemaBuilder, ValidationResult } from '@wn-ts/core'

// Create database schema
const schema = SchemaBuilder.createAllTables()

// Validate data
const validation = await validateWordNetData(result)
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors)
}
```

## 🔍 **Common Use Cases**

### **LMF XML Processing**

- Parse WordNet LMF XML files
- Validate against official schemas
- Handle duplicate IDs and conflicts
- Extract structured data for database storage

### **Data Validation**

- Ensure referential integrity
- Validate business rules
- Check schema compliance
- Generate validation reports

### **Schema Management**

- Create database schemas
- Manage table relationships
- Optimize for query performance
- Support schema evolution

## 📚 **Related Documentation**

- **[Main Project README](../README.md)** - Project overview and lexicon format details
- **[Development Conventions](../docs/DEVELOPMENT_CONVENTIONS.md)** - Coding standards and patterns
- **[Database Schema Standards](../docs/DATABASE_SCHEMA_STANDARDS.md)** - Database design and optimization
- **[wn-ts-web Documentation](../wn-ts-web/docs/)** - Browser implementation guide
- **[wn-ts-node Documentation](../wn-ts-node/docs/)** - Node.js implementation guide

---

**Note**: This is the foundational library for the entire `wn-ts` ecosystem. All other modules depend on the types and interfaces defined here.

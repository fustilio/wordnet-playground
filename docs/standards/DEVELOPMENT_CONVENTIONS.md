# Development Conventions & Standards

## 🎯 **Overview**

This document establishes shared development conventions, architectural patterns, and coding standards for all `wn-ts` modules. Following these conventions ensures consistency, maintainability, and interoperability across the ecosystem.

## 🏗️ **Microkernel Architecture**

The WordNet TypeScript ecosystem is built on a microkernel architecture:

### **Core Components**
- **`WordNetCore`**: Interface defining core database and WordNet methods
- **`WordNetKernel`**: Central component managing plugins and schema
- **Plugins**: Type-safe, composable, and optional functionalities

### **Plugin System**
- **Relations Plugin**: WordNet relations (hypernym, hyponym, etc.)
- **Similarity Plugin**: Semantic similarity metrics
- **Translation Plugin**: Cross-lingual mapping and translation

## 📝 **Naming Conventions**

### **ID Properties & References**

**Rule**: Always use the `Id` suffix for properties that reference IDs of other entities.

**✅ Correct Examples:**
```typescript
interface Sense {
  id: string;
  wordId: string;        // References Word.id
  synsetId: string;      // References Synset.id
  lexiconId: string;     // References Lexicon.id
}

interface Synset {
  id: string;
  memberIds: string[];   // References Word.id[]
  senseIds: string[];    // References Sense.id[]
}

interface Word {
  id: string;
  syntacticBehaviours?: SyntacticBehaviour[];  // Use descriptive names
}
```

**❌ Incorrect Examples:**
```typescript
interface Sense {
  id: string;
  word: string;          // Should be wordId
  synset: string;        // Should be synsetId
  lexicon: string;       // Should be lexiconId
}

interface Synset {
  id: string;
  members: string[];     // Should be memberIds
  senses: string[];      // Should be senseIds
}

interface Word {
  id: string;
  frames?: SyntacticBehaviour[];  // Should be syntacticBehaviours
}
```

### **Database Column Naming**

**Rule**: Use `snake_case` for database columns to match SQL conventions.

**✅ Correct Examples:**
```sql
CREATE TABLE senses (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  synset_id TEXT NOT NULL,
  lexicon_id TEXT NOT NULL
);
```

**❌ Incorrect Examples:**
```sql
CREATE TABLE senses (
  id TEXT PRIMARY KEY,
  wordId TEXT NOT NULL,      -- Should be word_id
  synsetId TEXT NOT NULL,    -- Should be synset_id
  lexiconId TEXT NOT NULL    -- Should be lexicon_id
);
```

### **TypeScript Interface Naming**

**Rule**: Use PascalCase for interfaces and types, with descriptive names.

**✅ Correct Examples:**
```typescript
interface WordNetDatabase
interface LmfParserOptions
interface SynsetRelation
interface CrossLingualMapping
```

**❌ Incorrect Examples:**
```typescript
interface wordnet_database    // Should be WordNetDatabase
interface lmf_parser_options  // Should be LmfParserOptions
interface synset_relation     // Should be SynsetRelation
```

### **Function and Variable Naming**

**Rule**: Use camelCase for functions and variables, with descriptive names.

**✅ Correct Examples:**
```typescript
function parseLmfXml(xmlContent: string): ParseResult
const wordNetInstance = new WordNet()
const isLexiconLoaded = await checkLexiconStatus()
```

**❌ Incorrect Examples:**
```typescript
function parse_lmf_xml(xml_content: string): ParseResult  // Should be parseLmfXml
const wordnet_instance = new WordNet()                   // Should be wordNetInstance
const is_lexicon_loaded = await check_lexicon_status()   // Should be isLexiconLoaded
```

## 🏗️ **Architectural Patterns**

### **Layered Architecture**

**Rule**: Maintain clear separation of concerns across layers.

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

**Rule**: Offload heavy operations to Web Workers to maintain UI responsiveness.

**✅ Correct Examples:**
```typescript
// Main thread
const worker = new Worker('./wordnet-worker.js')
const result = await worker.postMessage({ type: 'parseLmf', data: xmlContent })

// Worker thread
self.onmessage = async (event) => {
  if (event.data.type === 'parseLmf') {
    const result = await parseLmfXml(event.data.data)
    self.postMessage(result)
  }
}
```

### **Explicit Client Passing**

**Rule**: Pass dependencies explicitly rather than using global state.

**✅ Correct Examples:**
```typescript
function processLexicon(lexicon: Lexicon, database: Database): void {
  // Process lexicon with explicit database reference
}

class LexiconProcessor {
  constructor(private database: Database) {}
  
  async process(lexicon: Lexicon): Promise<void> {
    // Use injected database instance
  }
}
```

**❌ Incorrect Examples:**
```typescript
function processLexicon(lexicon: Lexicon): void {
  // ❌ Wrong: Implicit global database access
  const database = getGlobalDatabase()
}

class LexiconProcessor {
  async process(lexicon: Lexicon): Promise<void> {
    // ❌ Wrong: Implicit global database access
    const database = getGlobalDatabase()
  }
}
```

## 🔧 **Error Handling**

### **Error Types and Messages**

**Rule**: Use specific error types with descriptive messages.

**✅ Correct Examples:**
```typescript
class LexiconNotFoundError extends Error {
  constructor(lexiconId: string) {
    super(`Lexicon with ID '${lexiconId}' not found`)
    this.name = 'LexiconNotFoundError'
  }
}

class InvalidLmfFormatError extends Error {
  constructor(details: string) {
    super(`Invalid LMF format: ${details}`)
    this.name = 'InvalidLmfFormatError'
  }
}
```

### **Error Handling Patterns**

**Rule**: Handle errors at appropriate levels with proper fallbacks.

**✅ Correct Examples:**
```typescript
try {
  const result = await parseLmfXml(xmlContent)
  return result
} catch (error) {
  if (error instanceof InvalidLmfFormatError) {
    // Handle format errors specifically
    console.warn('LMF format issue:', error.message)
    return fallbackParse(xmlContent)
  }
  // Re-throw unexpected errors
  throw error
}
```

## ⚙️ **Configuration Management**

### **Environment-Specific Configuration**

**Rule**: Use configuration objects that adapt to different environments.

**✅ Correct Examples:**
```typescript
interface WordNetConfig {
  databasePath: string
  workerPath: string
  maxWorkers: number
  enableCaching: boolean
}

const config: WordNetConfig = {
  databasePath: process.env.NODE_ENV === 'production' 
    ? '/wordnet.db' 
    : './temp/wordnet.db',
  workerPath: './wordnet-worker.js',
  maxWorkers: navigator.hardwareConcurrency || 4,
  enableCaching: true
}
```

## 🧪 **Testing Standards**

### **Test Structure and Naming**

**Rule**: Use descriptive test names that explain the expected behavior.

**✅ Correct Examples:**
```typescript
describe('LmfParser', () => {
  describe('parse()', () => {
    it('should parse valid LMF XML and return structured data', async () => {
      // Test implementation
    })
    
    it('should handle duplicate IDs by keeping the last occurrence', async () => {
      // Test implementation
    })
    
    it('should throw InvalidLmfFormatError for malformed XML', async () => {
      // Test implementation
    })
  })
})
```

### **Test Data Management**

**Rule**: Use consistent test data and avoid hardcoded values.

**✅ Correct Examples:**
```typescript
const testLexicon: Lexicon = {
  id: 'test-lexicon-1',
  language: 'en',
  version: '1.0.0',
  label: 'Test English Lexicon'
}

const testWord: Word = {
  id: 'test-word-1',
  lemma: 'test',
  partOfSpeech: 'n',
  lexiconId: testLexicon.id
}
```

## 📚 **Documentation Standards**

### **Code Documentation**

**Rule**: Document all public APIs with JSDoc comments.

**✅ Correct Examples:**
```typescript
/**
 * Parses LMF XML content and returns structured WordNet data.
 * 
 * @param xmlContent - The LMF XML content to parse
 * @param options - Parsing options including merge strategy
 * @returns Promise resolving to parsed WordNet data
 * 
 * @throws {InvalidLmfFormatError} When XML format is invalid
 * @throws {LexiconNotFoundError} When referenced lexicon is missing
 * 
 * @example
 * ```typescript
 * const result = await parseLmfXml(xmlContent, {
 *   mergeStrategy: 'keep-last'
 * })
 * ```
 */
async function parseLmfXml(
  xmlContent: string, 
  options?: LmfParseOptions
): Promise<ParseResult>
```

### **README Documentation**

**Rule**: Keep README files focused and link to detailed documentation.

**✅ Correct Examples:**
```markdown
## Quick Start

```typescript
import { WordNet } from '@wn-ts/web'

const wordnet = new WordNet()
await wordnet.loadLexicon('en', '1.0.0')
```

For detailed usage, see [API Documentation](../api/).
```

## 🚀 **Performance Guidelines**

### **Memory Management**

**Rule**: Implement proper cleanup and avoid memory leaks.

**✅ Correct Examples:**
```typescript
class LexiconManager {
  private lexicons = new Map<string, Lexicon>()
  
  dispose(): void {
    this.lexicons.clear()
    // Clean up other resources
  }
}

// In React component
useEffect(() => {
  const manager = new LexiconManager()
  
  return () => {
    manager.dispose()
  }
}, [])
```

### **Async Operations**

**Rule**: Use proper async patterns and avoid blocking operations.

**✅ Correct Examples:**
```typescript
// Use Promise.all for parallel operations
const results = await Promise.all([
  loadLexicon('en', '1.0.0'),
  loadLexicon('fr', '1.0.0'),
  loadLexicon('de', '1.0.0')
])

// Use AbortController for cancellable operations
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  const result = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
  return result
} catch (error) {
  if (error.name === 'AbortError') {
    // Handle timeout
  }
  throw error
}
```

## 🔒 **Security Considerations**

### **Input Validation**

**Rule**: Validate all external inputs before processing.

**✅ Correct Examples:**
```typescript
function validateLexiconId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Lexicon ID must be a non-empty string')
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    throw new Error('Lexicon ID contains invalid characters')
  }
}

function sanitizeXmlContent(content: string): string {
  // Remove potentially dangerous XML content
  return content.replace(/<!\[CDATA\[.*?\]\]>/g, '')
}
```

## 📋 **Implementation Checklist**

Before implementing any feature, ensure:

- [ ] Follows naming conventions (camelCase for JS/TS, snake_case for SQL)
- [ ] Uses proper ID property naming (wordId, synsetId, etc.)
- [ ] Implements proper error handling with specific error types
- [ ] Includes comprehensive tests with descriptive names
- [ ] Documents public APIs with JSDoc comments
- [ ] Follows layered architecture patterns
- [ ] Implements proper cleanup and resource management
- [ ] Validates all external inputs
- [ ] Uses async patterns appropriately
- [ ] Includes performance considerations

## 🔍 **Common Anti-Patterns to Avoid**

1. **Global state usage**
   ```typescript
   // ❌ Wrong: Global state
   let globalDatabase: Database
   
   // ✅ Correct: Dependency injection
   function processData(database: Database) { }
   ```

2. **Inconsistent naming**
   ```typescript
   // ❌ Wrong: Mixed naming conventions
   interface Sense {
     wordId: string,
     synset_id: string
   }
   
   // ✅ Correct: Consistent camelCase
   interface Sense {
     wordId: string,
     synsetId: string
   }
   ```

3. **Blocking operations in main thread**
   ```typescript
   // ❌ Wrong: Blocking operation
   function processLargeFile() {
     const result = heavyProcessing() // Blocks UI
   }
   
   // ✅ Correct: Use workers
   async function processLargeFile() {
     const worker = new Worker('./processor.js')
     const result = await worker.postMessage(data)
   }
   ```

## 📚 **Related Documentation**

- [Database Schema Standards](./DATABASE_SCHEMA_STANDARDS.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Performance Guidelines](./PERFORMANCE.md)

---

**Remember**: These conventions ensure consistency, maintainability, and interoperability across all `wn-ts` modules. Following them is mandatory for all development work.

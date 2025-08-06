# wn-ts-core Technical Specification

## Overview

`wn-ts-core` is the environment-agnostic core package that provides types, interfaces, and abstract base classes for the wn-ts ecosystem. It serves as the foundation for environment-specific implementations in `wn-ts-node` (Node.js) and `wn-ts-web` (Browser).

## Architecture Principles

### **Environment-Agnostic Design**
- No Node.js-specific imports or code
- No browser-specific imports or code
- Abstract interfaces only (no concrete implementations)
- Pure TypeScript utilities

### **Interface-First Approach**
- Define interfaces that work for both environments
- All database operations must be async to support browser
- Abstract base classes provide common functionality
- Environment-specific packages implement concrete classes

### **Clean Separation of Concerns**
- Database interfaces only (no implementations)
- Abstract base classes only (no concrete implementations)
- Environment-agnostic utilities only
- Clear API boundaries

## Core Components

### **Types and Interfaces**

#### **Database Interfaces**
```typescript
export interface DatabaseInterface {
  run(sql: string, params?: any[]): Promise<DatabaseRunResult>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  close(): Promise<void>;
}

export interface DatabaseRunResult {
  changes: number;
  lastInsertRowid: number;
}

export interface DatabaseRow {
  [key: string]: any;
}
```

#### **WordNet Interfaces**
```typescript
export interface WordnetOptions {
  lexicon?: string;
  lang?: string;
  version?: string;
  expand?: string | string[];
  normalizer?: (form: string) => string;
  lemmatizer?: (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>;
  searchAllForms?: boolean;
}

export interface Word {
  id: string;
  form: string;
  pos?: PartOfSpeech;
  lang?: string;
  pronunciation?: string;
  script?: string;
  tags?: string[];
  senses?: Sense[];
}

export interface Synset {
  id: string;
  ili?: string;
  pos: PartOfSpeech;
  definition?: string;
  examples?: string[];
  relations?: Relation[];
  senses?: Sense[];
  lexfile?: string;
  domain?: string;
}

export interface Sense {
  id: string;
  wordId: string;
  synsetId: string;
  rank?: number;
  tags?: string[];
  word?: Word;
  synset?: Synset;
}
```

### **Abstract Base Classes**

#### **BaseWordnet**
```typescript
export abstract class BaseWordnet {
  protected lexiconId: string;
  protected lexiconVersion?: string;
  protected lang?: string;

  constructor(options: WordnetOptions = {}) {
    this.lexiconId = options.lexicon || '*';
    this.lexiconVersion = options.version;
    this.lang = options.lang;
  }

  // Abstract methods that must be implemented by environment-specific packages
  abstract lexicons(): Promise<Lexicon[]>;
  abstract words(form?: string, pos?: PartOfSpeech): Promise<Word[]>;
  abstract synsets(form: string, pos?: PartOfSpeech, ili?: string): Promise<Synset[]>;
  abstract getSynset(synsetId: string): Promise<Synset | undefined>;
  abstract getSenses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]>;
  abstract close(): Promise<void>;
}
```

### **Environment-Agnostic Utilities**

#### **Download Utilities**
```typescript
export interface DownloadOptions {
  url?: string;
  destination?: string;
  overwrite?: boolean;
  progress?: (progress: number) => void;
}

export async function downloadFile(
  url: string, 
  destination: string, 
  options?: DownloadOptions
): Promise<void> {
  // Environment-agnostic download implementation
}
```

#### **Archive Utilities**
```typescript
export async function extractTarArchive(
  sourcePath: string, 
  destPath: string
): Promise<void> {
  // Environment-agnostic archive extraction
}

export async function decompressXz(
  sourcePath: string, 
  destPath: string
): Promise<void> {
  // Environment-agnostic XZ decompression
}
```

#### **LMF Parsers**
```typescript
export interface LMFDocument {
  // LMF document structure
}

export async function parseLMFXML(xml: string): Promise<LMFDocument> {
  // Environment-agnostic XML parsing
}

export function isLMF(path: string): boolean {
  // Environment-agnostic LMF detection
}
```

## API Design

### **Consistent Async API**
All database operations are async to support both environments:
- Node.js: `better-sqlite3` (synchronous) wrapped in async
- Browser: `@sqlite.org/sqlite-wasm` (asynchronous)

### **Error Handling**
```typescript
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}
```

### **Module Functions**
Environment-agnostic module functions that match Python wn API:
```typescript
export async function words(
  form?: string, 
  pos?: PartOfSpeech
): Promise<Word[]> {
  // Implementation in environment-specific packages
}

export async function synsets(
  form: string, 
  pos?: PartOfSpeech, 
  ili?: string
): Promise<Synset[]> {
  // Implementation in environment-specific packages
}
```

## File Structure

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

## Dependencies

### **Core Dependencies**
- `typescript` - Type definitions
- `smol-toml` - TOML parsing (environment-agnostic)
- `zod` - Runtime type validation (environment-agnostic)

### **No Environment-Specific Dependencies**
- ❌ `better-sqlite3` (Node.js only)
- ❌ `@sqlite.org/sqlite-wasm` (Browser only)
- ❌ `fs`, `path`, `os` (Node.js only)
- ❌ `localStorage`, `IndexedDB` (Browser only)

## Testing Strategy

### **Unit Tests**
- Test environment-agnostic utilities only
- Mock external dependencies
- Test type definitions and interfaces
- Test abstract base class contracts

### **Integration Tests**
- Test in environment-specific packages
- Test with real database implementations
- Test with real file system operations

## Success Criteria

### **Phase 1 Success**
- [ ] wn-ts-core compiles without TypeScript errors
- [ ] wn-ts-core has no environment-specific code
- [ ] All interfaces are properly defined
- [ ] BaseWordnet is truly abstract
- [ ] All tests pass (for agnostic utilities only)

### **API Consistency**
- [ ] Same interfaces used by both wn-ts-node and wn-ts-web
- [ ] Same abstract base classes extended by both packages
- [ ] Same module functions available in both environments
- [ ] Same error handling patterns in both environments

## Notes

- This specification ensures clean architecture
- Environment-specific code belongs in respective packages
- Testing strategy must account for different environments
- Performance considerations differ between Node.js and browser 
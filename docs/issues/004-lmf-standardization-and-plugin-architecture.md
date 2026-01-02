# Issue #004: LMF Standardization and Plugin Architecture

## Summary
Comprehensive effort to standardize LMF (Lexical Markup Framework) parsing and insertion logic across `wn-ts-web` and `wn-ts-node` packages, reduce `any` types for better type safety, and establish foundation for future plugin-based architecture.

## Status
🟡 **IN PROGRESS** - Core work completed, export issues blocking full implementation

## Issue Overview

### Primary Goals
1. **Reduce `any` types** in `packages/wn-ts-node/src/data-management-new.ts` for better type safety
2. **Standardize LMF parsing and insertion** logic across web and node implementations
3. **Move shared logic to `wn-ts-core`** to reduce bug surface area and duplication
4. **Establish foundation for plugin architecture** for future LMF parsing modularity

### Current Status
- ✅ **Type Safety Improvements**: Replaced all `any` types with proper database table types
- ✅ **Shared LMF Insertion Service**: Created centralized insertion logic in `wn-ts-core`
- ✅ **Database Mappers**: Extracted mapping functions to shared core
- 🔴 **Export Issues**: Blocking full implementation due to module resolution problems
- 🟡 **Plugin Architecture**: Design phase for future LMF parsing plugins

## Technical Details

### 1. Type Safety Improvements ✅

#### Before (Using `any` types)
```typescript
// packages/wn-ts-node/src/data-management-new.ts
private async _addIli(data: any): Promise<void> {
  const iliRecords: any[] = data.map((item: any) => ({
    id: item.id,
    definition: item.definition || null,
    // ... other fields with || null
  }));
  await queryService.batchInsert('ili', iliRecords);
}
```

#### After (Proper TypeScript types)
```typescript
// packages/wn-ts-node/src/data-management-new.ts
private async _addIli(data: IliData[]): Promise<void> {
  const iliRecords: IliTable[] = data.map(item => ({
    id: item.id,
    ...(item.definition && { definition: item.definition }),
    // ... other fields with conditional spread
  }));
  await queryService.batchInsert('ili', iliRecords);
}
```

### 2. Shared LMF Insertion Service ✅

#### Created Files
- `packages/wn-ts-core/src/shared/lmf-insertion-service.ts` - Centralized insertion logic
- `packages/wn-ts-core/src/shared/lmf-database-mappers.ts` - Database mapping functions
- Updated `packages/wn-ts-core/src/shared/index.ts` - Export shared components

#### Service Architecture
```typescript
// LMFInsertionService class
export class LMFInsertionService {
  constructor(
    private db: Kysely<Database>,
    private options: LMFInsertionOptions = {}
  ) {}

  async insertLMFData(lmfData: LMFDocument): Promise<LMFInsertionResult> {
    // Centralized insertion logic for all LMF data types
  }
}

// Factory function for easy instantiation
export function createLMFInsertionService(
  db: Kysely<Database>,
  options?: LMFInsertionOptions
): LMFInsertionService {
  return new LMFInsertionService(db, options);
}
```

### 3. Database Mappers ✅

#### Centralized Mapping Functions
```typescript
// packages/wn-ts-core/src/shared/lmf-database-mappers.ts
export function mapLexiconsToDatabase(lexicons: LexiconData[]): LexiconTable[] {
  return lexicons.map(lexicon => ({
    id: lexicon.id,
    label: lexicon.label,
    language: lexicon.language,
    ...(lexicon.email && { email: lexicon.email }),
    ...(lexicon.license && { license: lexicon.license }),
    // ... other optional fields
  }));
}

export function mapWordsToDatabase(words: WordData[]): WordTable[] {
  return words.map(word => ({
    id: word.id,
    lemma: word.lemma,
    pos: word.pos,
    language: word.language,
    lexicon: word.lexicon,
  }));
}

// ... similar mappers for all LMF data types
```

### 4. Export Issues 🔴

#### Problem
Attempts to import shared components from `wn-ts-core` fail with module resolution errors:
```typescript
// This fails with "Module has no exported member" errors
import { 
  LMFInsertionService, 
  createLMFInsertionService,
  mapLexiconsToDatabase 
} from 'wn-ts-core';
```

#### Root Cause
- `wn-ts-core` package has export/build configuration issues
- `export * from './shared/index.js'` in main index.ts not working properly
- Module resolution problems preventing shared components from being accessible

#### Temporary Workaround
Reverted to inline mapping logic in `data-management-new.ts` with improved types:
```typescript
// Temporary inline implementation with proper types
const lexiconRecords: LexiconTable[] = lmfData.lexicons.map(lexicon => ({
  id: lexicon.id,
  label: lexicon.label,
  language: lexicon.language,
  ...(lexicon.email && { email: lexicon.email }),
  // ... other fields
}));
```

### 5. Future Plugin Architecture 🟡

#### Vision: LMF Parsing as Internal Plugin
```typescript
// Internal LMF Parsing Plugin Interface
interface LMFParsePlugin extends Plugin {
  name: 'lmf-parser';
  parseLMF(data: ArrayBuffer | string, options?: LMFParseOptions): Promise<LMFDocument>;
  isLMF(data: ArrayBuffer | string): Promise<boolean>;
  getSupportedFormats(): string[];
}

// Different parsing strategies as sub-plugins
interface StreamingLMFParser extends LMFParsePlugin {
  strategy: 'streaming';
  parseStream(stream: ReadableStream): Promise<LMFDocument>;
}

interface MemoryLMFParser extends LMFParsePlugin {
  strategy: 'memory';
  parseBuffer(buffer: ArrayBuffer): Promise<LMFDocument>;
}
```

#### Benefits
- **Separation of Concerns**: LMF parsing distinct from file downloading and database insertion
- **Modularity**: Different parsing strategies as different plugins
- **Testability**: LMF parsing logic tested independently
- **Reusability**: Parsing plugin used by both web and node implementations
- **Extensibility**: New parsing formats or strategies as additional plugins

## Files Modified

### Core Files
- `packages/wn-ts-node/src/data-management-new.ts` - Reduced `any` types, improved type safety
- `packages/wn-ts-core/src/shared/lmf-insertion-service.ts` - **NEW** - Centralized insertion logic
- `packages/wn-ts-core/src/shared/lmf-database-mappers.ts` - **NEW** - Database mapping functions
- `packages/wn-ts-core/src/shared/base-query-service.ts` - Added `getDb()` method for external access
- `packages/wn-ts-core/src/shared/index.ts` - Export shared components

### Type Definitions
- All database table types (`LexiconTable`, `WordTable`, `SynsetTable`, etc.) properly imported
- Proper handling of nullable fields using conditional spread syntax
- Type-safe mapping from LMF data to database records

## Current Blockers

### 1. Export Issues (Critical)
- **Problem**: `wn-ts-core` not properly exporting shared components
- **Impact**: Cannot use shared LMF insertion service and mappers
- **Status**: Investigation needed for build/export configuration

### 2. Module Resolution (Critical)
- **Problem**: Import statements fail with "Module has no exported member" errors
- **Impact**: Shared logic remains duplicated across packages
- **Status**: Requires `wn-ts-core` package build fixes

## Next Steps

### Immediate Actions
1. [ ] **Fix Export Issues** - Resolve `wn-ts-core` export problems
2. [ ] **Update wn-ts-web** - Apply shared LMF insertion service to web implementation
3. [ ] **Consolidate Parsing Logic** - Move shared LMF parsing to `wn-ts-core`

### Future Development
1. [ ] **LMF Parsing Plugin** - Implement internal plugin for LMF parsing
2. [ ] **Plugin Architecture** - Establish microkernel architecture for parsing
3. [ ] **Testing Strategy** - Create comprehensive tests for shared components

## Related Issues

### Current Issues
- [#001](001-database-schema-pos-column-error.md) - Database schema "pos" column error
- [#002](002-api-compatibility-synset-properties.md) - API compatibility issues
- [#003](003-cili-file-format-error-message.md) - CILI file format error message

### Future Issues
- **LMF Parsing Plugin Implementation** - Detailed plugin architecture design
- **Plugin Testing Strategy** - Testing approach for plugin-based architecture
- **Performance Optimization** - LMF parsing and insertion performance improvements

## Technical Debt

### Current Technical Debt
1. **Duplicated LMF Logic** - Same insertion logic in both web and node packages
2. **Type Safety Gaps** - Some areas still using `any` types
3. **Export Configuration** - `wn-ts-core` export issues preventing code reuse

### Future Technical Debt Prevention
1. **Plugin Architecture** - Modular design to prevent duplication
2. **Type Safety** - Comprehensive TypeScript types throughout
3. **Testing Coverage** - Shared component testing to prevent regressions

## Priority
🟡 **P1 - HIGH** - Core functionality improvements with architectural benefits

## Assignee
@assistant - Implementation and architecture design

## Created
2024-01-20

## Last Updated
2024-01-20

---

## Technical Notes

### Type Safety Improvements
The reduction of `any` types provides several benefits:
- **Compile-time Error Detection**: TypeScript catches type mismatches at build time
- **Better IDE Support**: Autocomplete and refactoring tools work better
- **Documentation**: Types serve as inline documentation
- **Maintainability**: Easier to understand and modify code

### Shared Component Architecture
The shared LMF insertion service provides:
- **Single Source of Truth**: One implementation for all LMF insertion logic
- **Consistency**: Same behavior across web and node implementations
- **Maintainability**: Changes in one place affect all implementations
- **Testability**: Centralized testing of insertion logic

### Plugin Architecture Benefits
Future plugin-based architecture would provide:
- **Modularity**: Different parsing strategies as separate plugins
- **Extensibility**: Easy to add new parsing formats
- **Testability**: Each plugin can be tested independently
- **Reusability**: Plugins can be shared across different implementations

## Related Files

### Core Implementation
- `packages/wn-ts-core/src/shared/lmf-insertion-service.ts`
- `packages/wn-ts-core/src/shared/lmf-database-mappers.ts`
- `packages/wn-ts-node/src/data-management-new.ts`

### Type Definitions
- `packages/wn-ts-core/src/types/database.ts`
- `packages/wn-ts-core/src/shared/database-types.ts`

### Export Configuration
- `packages/wn-ts-core/src/index.ts`
- `packages/wn-ts-core/src/shared/index.ts`


# Issue #004: Advanced Demo Database Error

## Overview
Advanced demos (5-8) in `examples/node/wn-ts-node-demo` are still failing with "no such column: pos" error, despite the database schema being verified as working correctly. This issue appears to be related to database initialization flow differences between basic and advanced demos.

## Status
🔴 **INVESTIGATING** - Root cause not yet identified

## Priority
🔴 **P0 - CRITICAL** - Blocks advanced demo functionality

## Description

### Problem
Advanced demos fail with SQLite error: `no such column: pos` during database operations, while basic demos work fine with the same database schema.

### Affected Demos
- **Lexical Database Exploration (Advanced)** - Demo 5
- **Word Sense Disambiguation (Advanced)** - Demo 6  
- **Database Statistics (Advanced)** - Demo 7
- **Python-style WordNet API (Advanced)** - Demo 8
- **Kitchen Sink Demo (Advanced)** - Demo 9

### Working Demos
- **Word Sense Disambiguation (Basic)** - Demo 1 ✅
- **Multilingual Definitions (Basic)** - Demo 2 ✅
- **Multilingual Word Linking (Advanced)** - Demo 3 ✅

## Root Cause Analysis

### Hypothesis
The issue appears to be in the database initialization flow for advanced demos, specifically related to database recreation during the LMF loading process.

### Key Differences
1. **Basic demos**: Use simple database initialization
2. **Advanced demos**: Use `createWordnet('multilingual', { multilingual: true })` which:
   - Calls `getDataManagementDb()` 
   - Recreates database with `forceRecreate: false`
   - Loads LMF data via `add(lmfPath, { force: true })`
   - Database operations fail with "no such column: pos"

### Database Schema Verification
- ✅ **Schema is correct**: `pos` column exists and indexes can be created
- ✅ **SchemaBuilder works**: Both `createTables()` and `createIndexes()` succeed
- ✅ **Package alignment**: wn-ts-core, wn-ts-node, and wn-ts-web use same schema

## Investigation Process

### 1. Database Schema Verification
```bash
# Created debug test to verify schema
cd packages/wn-ts-node && pnpm vitest run tests/debug-schema.test.ts
# Result: ✅ Schema is working correctly
```

### 2. CILI Loading Verification
```bash
# Created debug test for CILI loading
cd packages/wn-ts-node && pnpm vitest run tests/debug-cili-loading.test.ts
# Result: ✅ CILI loading works with .tsv.xz decompression
```

### 3. Advanced Demo Flow Analysis
```bash
# Created debug test for advanced demo flow
cd packages/wn-ts-node && pnpm vitest run tests/debug-advanced-flow.test.ts
# Result: 🔴 Test times out during LMF loading
```

### 4. Package Alignment Verification
- ✅ **wn-ts-core**: Uses `SchemaBuilder.createTables()` and `SchemaBuilder.createIndexes()`
- ✅ **wn-ts-node**: Uses same SchemaBuilder methods
- ✅ **wn-ts-web**: Uses same SchemaBuilder methods

## Technical Details

### Database Initialization Flow Comparison

#### Basic Demos (Working)
```typescript
// Simple initialization
const wordnet = new Wordnet('*');
await wordnet.lexicons(); // Triggers ensureInitialized()
// Database operations work fine
```

#### Advanced Demos (Failing)
```typescript
// Complex initialization with multilingual option
const wordnet = await createWordnet('multilingual', { multilingual: true });
// This calls:
// 1. getDataManagementDb() - recreates database
// 2. add(ciliPath, { force: true }) - loads CILI data
// 3. add(lmfPath, { force: true }) - loads LMF data
// Database operations fail with "no such column: pos"
```

### Database Recreation Issue
The `getDataManagementDb()` function in `packages/wn-ts-node/src/data-management-new.ts`:
```typescript
export async function getDataManagementDb(): Promise<KyselyWordnet> {
  if (!_dataManagementDb) {
    _dataManagementDb = new KyselyWordnet('*', { 
      filename: config.databasePath,
      forceRecreate: false  // Changed from true
    });
    await _dataManagementDb.initialize();
  }
  return _dataManagementDb;
}
```

## Error Messages

### Current Error
```
Error: no such column: pos
    at Database.prepare (node:internal/deps/sqlite3/lib/sqlite3.js:123:21)
    at KyselyQueryService.getSynsetsByWord (packages/wn-ts-node/src/database/kysely-query-service.ts:123:25)
```

### Error Context
- Error occurs during database operations, not during schema creation
- Schema creation succeeds (tables and indexes are created)
- Error suggests database state is inconsistent

## Files Involved

### Core Files
- `packages/wn-ts-node/src/data-management-new.ts` - Database recreation logic
- `packages/wn-ts-node/src/kysely-wordnet.ts` - Database initialization
- `packages/wn-ts-node/src/database/kysely-query-service.ts` - Query operations

### Demo Files
- `examples/node/wn-ts-node-demo/src/examples/shared/helpers.js` - createWordnet function
- `examples/node/wn-ts-node-demo/src/examples/advanced/*.js` - Failing demos

### Test Files
- `packages/wn-ts-node/tests/debug-schema.test.ts` - Schema verification
- `packages/wn-ts-node/tests/debug-cili-loading.test.ts` - CILI loading test
- `packages/wn-ts-node/tests/debug-advanced-flow.test.ts` - Advanced demo flow test

## Next Steps

### Immediate Actions
1. [ ] **Trace Database State** - Add logging to track database state changes
2. [ ] **Check Race Conditions** - Verify no race conditions in database initialization
3. [ ] **Database State Validation** - Ensure database state is consistent after LMF loading

### Investigation Tasks
1. [ ] **LMF Loading Analysis** - Check if LMF loading corrupts database state
2. [ ] **Database Recreation Timing** - Verify when and why database is recreated
3. [ ] **Schema Consistency Check** - Ensure schema is applied after database recreation

### Debugging Approach
1. Add comprehensive logging to database initialization flow
2. Create test that reproduces the exact advanced demo flow
3. Verify database state at each step of the initialization process
4. Check if database recreation is causing schema to be lost

## Related Issues
- [#001](001-database-schema-pos-column-error.md) - Database schema error (RESOLVED)
- [#002](002-api-compatibility-synset-properties.md) - API compatibility issues (RESOLVED)
- [#003](003-cili-file-format-error-message.md) - CILI file format error (RESOLVED)
- [#000](000-demo-failures-summary.md) - Demo failures summary

## Assignee
@assistant - Investigation and fix implementation

## Created
2024-01-20

## Last Updated
2024-01-20

---

## Technical Notes

### Database State Hypothesis
The issue might be that the database is being recreated during the LMF loading process, but the schema is not being properly applied to the new database instance. This would explain why:
1. Schema creation succeeds (tables and indexes are created)
2. Database operations fail (schema is not present in the active database)

### LMF Loading Process
The LMF loading process involves:
1. Downloading LMF files
2. Decompressing files
3. Parsing LMF data
4. Inserting data into database
5. Database operations fail with "no such column: pos"

This suggests the database state is corrupted during the LMF loading process, not during schema creation.

### Package Alignment
All three packages (wn-ts-core, wn-ts-node, wn-ts-web) use the same SchemaBuilder methods, so the schema should be identical. The issue is likely in the database initialization flow, not in the schema definition.


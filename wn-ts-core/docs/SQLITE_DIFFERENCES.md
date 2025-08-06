# SQLite Implementation Differences

## Overview

The wn-ts project uses different SQLite implementations for different environments:

- **Node.js**: `better-sqlite3` (synchronous API)
- **Browser**: `@sqlite.org/sqlite-wasm` (asynchronous API)

## Key Differences

### 1. Synchronous vs Asynchronous APIs

#### better-sqlite3 (Node.js)
```typescript
// Synchronous operations
const db = new Database('file.db');
const rows = db.prepare('SELECT * FROM words').all();
const result = db.prepare('INSERT INTO words (form) VALUES (?)').run('hello');
```

#### @sqlite.org/sqlite-wasm (Browser)
```typescript
// Asynchronous operations
const db = new Database('file.db');
const rows = await db.prepare('SELECT * FROM words').all();
const result = await db.prepare('INSERT INTO words (form) VALUES (?)').run('hello');
```

### 2. Transaction Handling

#### better-sqlite3
```typescript
// Synchronous transactions
db.transaction(() => {
  db.prepare('INSERT INTO words (form) VALUES (?)').run('word1');
  db.prepare('INSERT INTO words (form) VALUES (?)').run('word2');
})();
```

#### @sqlite.org/sqlite-wasm
```typescript
// Asynchronous transactions
await db.transaction(async () => {
  await db.prepare('INSERT INTO words (form) VALUES (?)').run('word1');
  await db.prepare('INSERT INTO words (form) VALUES (?)').run('word2');
})();
```

### 3. Database Initialization

#### better-sqlite3
```typescript
// Direct file access
const db = new Database('path/to/database.db');
```

#### @sqlite.org/sqlite-wasm
```typescript
// Requires initialization with SQLite module
const sqlite = await initSqlite();
const db = new sqlite.Database(data);
```

## Impact on API Design

### 1. Database Interface

The `DatabaseInterface` in `wn-ts-core` must be designed to handle both synchronous and asynchronous operations:

```typescript
export interface DatabaseInterface {
  // All methods must be async to support browser environment
  run(sql: string, params?: any[]): Promise<DatabaseRunResult>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  close(): Promise<void>;
}
```

### 2. Transaction Support

Transactions need to be handled differently:

```typescript
// Node.js implementation
transaction<T>(fn: () => T): T;

// Browser implementation  
transaction<T>(fn: () => Promise<T>): Promise<T>;
```

### 3. Error Handling

- **Node.js**: Synchronous errors are thrown immediately
- **Browser**: Asynchronous errors are caught in promises

## Implementation Strategy

### 1. Environment-Agnostic Core (`wn-ts-core`)

- Define interfaces that work for both environments
- All database operations must be async
- Provide abstract base classes

### 2. Environment-Specific Implementations

- **`wn-ts-node`**: Node.js implementation using better-sqlite3
- **`wn-ts-web`**: Browser implementation using @sqlite.org/sqlite-wasm

### 3. Adapter Pattern

Use adapters to bridge the differences:

```typescript
// Node.js adapter
class BetterSqlite3Adapter implements DatabaseInterface {
  constructor(private db: Database) {}
  
  async run(sql: string, params?: any[]): Promise<DatabaseRunResult> {
    return this.db.prepare(sql).run(params);
  }
}

// Browser adapter
class SqliteWasmAdapter implements DatabaseInterface {
  constructor(private db: any) {}
  
  async run(sql: string, params?: any[]): Promise<DatabaseRunResult> {
    return await this.db.prepare(sql).run(params);
  }
}
```

## Performance Considerations

### Node.js (better-sqlite3)
- **Pros**: Synchronous operations, better performance for CPU-intensive tasks
- **Cons**: Blocks event loop during database operations

### Browser (@sqlite.org/sqlite-wasm)
- **Pros**: Non-blocking, better for UI responsiveness
- **Cons**: Overhead of async/await, slightly slower for simple operations

## Migration Strategy

1. **Phase 1**: Make all database operations async in `wn-ts-core`
2. **Phase 2**: Update `wn-ts-node` to use async adapters
3. **Phase 3**: Ensure `wn-ts-web` uses proper async patterns
4. **Phase 4**: Add performance optimizations where needed

## Testing Considerations

- Unit tests must account for async operations
- Integration tests need different setups for Node.js vs browser
- Performance benchmarks should be environment-specific 
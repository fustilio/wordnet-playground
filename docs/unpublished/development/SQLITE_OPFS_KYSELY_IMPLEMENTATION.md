# SQLite3 + OPFS + Kysely Implementation Guide

A comprehensive guide for implementing SQLite3 with OPFS persistence and Kysely query builder in web applications. This implementation provides a production-ready, type-safe database solution that works entirely in the browser.

## Quick Start

### 1. Basic Setup

```typescript
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { WebDatabase } from './web-database';
import { Kysely } from 'kysely';

// Initialize SQLite module
const sqlModule = await sqlite3InitModule();

// Create database instance
const database = new WebDatabase({
  preferredAdapter: 'opfs', // auto, opfs, indexeddb, memory
  adapterConfig: {
    databaseName: 'my-app.sqlite3',
    maxRetries: 3,
    verbose: true
  }
});

// Initialize database
await database.initializeWithModule(sqlModule);
await database.createDatabase();

// Create Kysely instance
const db = new Kysely<DatabaseSchema>({
  dialect: createSqliteWasmDialect({
    database: database.getDatabase(),
    sqlModule: sqlModule
  })
});

// Use the database
await db.insertInto('users').values({
  name: 'John Doe',
  email: 'john@example.com'
}).execute();
```

## Architecture Overview

The implementation consists of three main layers:

```
┌─────────────────────────────────────────────────────────┐
│ Application Layer (Your Business Logic)                 │
│ - React Components                                      │
│ - Business Services                                     │
│ - API Layer                                             │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Query Layer (Kysely for Type-Safe SQL)                 │
│ - KyselyQueryService                                    │
│ - SqliteWasmDriver                                      │
│ - Connection Management                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ Storage Layer (SQLite WASM + OPFS)                      │
│ - StorageAdapter Pattern                                │
│ - OPFS Implementation                                   │
│ - Fallback Adapters (IndexedDB, Memory)                 │
└─────────────────────────────────────────────────────────┘
```

## Storage Adapters

The storage adapter pattern provides a clean abstraction for different storage backends:

### OPFS Storage Adapter

```typescript
import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

export interface StorageAdapterConfig {
  databaseName?: string;
  maxRetries?: number;
  retryDelay?: number;
  verbose?: boolean;
}

export class OpfsStorageAdapter implements StorageAdapter {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private config: Required<StorageAdapterConfig>;

  constructor(config: StorageAdapterConfig = {}) {
    this.config = {
      databaseName: config.databaseName ?? 'app.sqlite3',
      maxRetries: config.maxRetries ?? 5,
      retryDelay: config.retryDelay ?? 1000,
      verbose: config.verbose ?? false
    };
  }

  async createDatabase(): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('SQL module not initialized');
    }

    // Try OpfsDb approach first (recommended)
    try {
      const db = new this.sqlModule.oo1.OpfsDb(`/${this.config.databaseName}`);
      this.db = db;
      return;
    } catch (error) {
      // Fallback to VFS approach
      const db = new this.sqlModule.oo1.DB(`file:${this.config.databaseName}?vfs=opfs`);
      this.db = db;
    }
  }
}
```

### IndexedDB Storage Adapter

```typescript
export class IndexedDBStorageAdapter implements StorageAdapter {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;

  async createDatabase(): Promise<void> {
    // Store database as blob in IndexedDB
    // Recreate from blob when needed
    const dbData = await this.loadFromIndexedDB();

    if (dbData) {
      this.db = new this.sqlModule!.oo1.DB();
      this.db.exec(dbData);
    } else {
      this.db = new this.sqlModule!.oo1.DB('memory', 'ct');
    }
  }

  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    // Implementation for storing database blob
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    // Implementation for loading database blob
  }
}
```

### Memory Storage Adapter

```typescript
export class MemoryStorageAdapter implements StorageAdapter {
  private db: Database | null = null;

  async createDatabase(): Promise<void> {
    this.db = new this.sqlModule!.oo1.DB('memory', 'ct');
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'memory',
      persistent: false,
      available: true
    };
  }
}
```

## WebDatabase Facade

The WebDatabase class provides a high-level interface with hot-swapping capabilities:

```typescript
export class WebDatabase {
  private adapter: StorageAdapter | null = null;
  private sqlModule: Sqlite3Static | null = null;

  constructor(config: WebDatabaseConfig = {}) {
    this.config = {
      preferredAdapter: config.preferredAdapter ?? 'auto',
      adapterConfig: config.adapterConfig ?? {}
    };
  }

  async initializeWithModule(sqlModule: Sqlite3Static): Promise<void> {
    this.sqlModule = sqlModule;
    await this.selectAdapter();
  }

  private async selectAdapter(): Promise<void> {
    const availableAdapters = this.getAvailableAdapters();

    for (const adapterType of this.getFallbackOrder()) {
      const adapter = availableAdapters.find(a => a.getName().toLowerCase() === adapterType);
      if (adapter && adapter.isAvailable()) {
        this.adapter = adapter;
        await this.adapter.initialize(this.sqlModule!);
        return;
      }
    }

    throw new Error('No suitable storage adapter available');
  }

  async switchAdapter(type: 'opfs' | 'indexeddb' | 'memory'): Promise<void> {
    if (this.adapter) {
      this.adapter.close();
    }

    const newAdapter = this.createAdapter(type);
    await newAdapter.initialize(this.sqlModule!);
    this.adapter = newAdapter;
  }

  getStorageInfo(): StorageInfo {
    return this.adapter?.getStorageInfo() || {
      type: 'unknown',
      persistent: false,
      available: false
    };
  }
}
```

## Kysely Integration

### SQLite WASM Driver

```typescript
import { CompiledQuery, type DatabaseConnection, type Driver } from "kysely";

export class SqliteWasmDriver implements Driver {
  readonly #config: SqliteWasmDialectConfig;
  readonly #connectionMutex = new ConnectionMutex();

  #db?: Database;
  #connection?: DatabaseConnection;

  async init(): Promise<void> {
    this.#db = typeof this.#config.database === "function"
      ? await this.#config.database()
      : this.#config.database;

    this.#connection = new SqliteWasmConnection(this.#db, this.#config.sqlModule);

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection);
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#connectionMutex.lock();
    return this.#connection!;
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    this.#db?.close();
  }
}
```

### Connection Management

```typescript
export class SqliteWasmConnection implements DatabaseConnection {
  readonly #db: Database;
  readonly #sqlModule: Sqlite3Static;

  constructor(db: Database, sqlModule: Sqlite3Static) {
    this.#db = db;
    this.#sqlModule = sqlModule;
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery;

    const rows = this.#db.exec({
      sql: sql,
      bind: parameters as { [paramName: string]: any },
      returnValue: "resultRows",
      rowMode: "object"
    });

    return Promise.resolve({
      rows: rows as unknown as O[],
      numAffectedRows: this.#db.changes(),
      insertId: this.#sqlModule.capi.sqlite3_last_insert_rowid(this.#db)
    });
  }
}
```

### Type-Safe Schema Definition

```typescript
// Define your database schema
export interface DatabaseSchema {
  users: {
    id: Generated<number>;
    name: string;
    email: string;
    created_at: Generated<string>;
  };
  posts: {
    id: Generated<number>;
    user_id: number;
    title: string;
    content: string;
    published: Generated<boolean>;
  };
}

// Usage with full type safety
const users = await db
  .selectFrom('users')
  .select(['id', 'name', 'email'])
  .where('name', 'like', '%John%')
  .execute();

// TypeScript knows the exact shape of the result
users.forEach(user => {
  console.log(user.name); // ✅ TypeScript knows this is a string
  console.log(user.created_at); // ✅ TypeScript knows this exists
});
```

## Query Service Pattern

Here's how to implement a query service layer on top of the database:

```typescript
// Database schema for a typical application
interface AppDatabase {
  users: {
    id: Generated<number>;
    name: string;
    email: string;
    created_at: Generated<string>;
  };
  posts: {
    id: Generated<number>;
    user_id: number;
    title: string;
    content: string;
    published: Generated<boolean>;
  };
  categories: {
    id: Generated<number>;
    name: string;
    description: string | null;
  };
}

// Query service implementation
export class QueryService {
  constructor(private db: Kysely<AppDatabase>) {}

  async searchUsers(term: string, options: SearchOptions = {}): Promise<User[]> {
    let query = this.db.selectFrom('users').selectAll();

    if (options.exact) {
      query = query.where('name', '=', term);
    } else {
      query = query.where(sql`lower(name)`, 'like', `%${term.toLowerCase()}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query.execute();
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return this.db
      .selectFrom('posts')
      .selectAll()
      .where('user_id', '=', userId)
      .where('published', '=', true)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async createUser(user: { name: string; email: string }): Promise<number> {
    const result = await this.db
      .insertInto('users')
      .values({
        name: user.name,
        email: user.email
      })
      .executeTakeFirst();

    return Number(result.insertId);
  }
}
```

## React Hook Integration

```typescript
import { useState, useEffect } from 'react';
import { WebDatabase } from './web-database';
import { Kysely } from 'kysely';

interface UseWebDatabaseOptions {
  databaseName?: string;
  preferredAdapter?: 'opfs' | 'indexeddb' | 'memory' | 'auto';
}

export function useWebDatabase(options: UseWebDatabaseOptions = {}) {
  const [database, setDatabase] = useState<WebDatabase | null>(null);
  const [kyselyDb, setKyselyDb] = useState<Kysely<DatabaseSchema> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeDatabase() {
      try {
        // Initialize SQLite module
        const sqlModule = await sqlite3InitModule();

        // Create database instance
        const db = new WebDatabase({
          preferredAdapter: options.preferredAdapter ?? 'auto',
          adapterConfig: {
            databaseName: options.databaseName ?? 'app.sqlite3'
          }
        });

        // Initialize database
        await db.initializeWithModule(sqlModule);
        await db.createDatabase();

        // Create Kysely instance
        const kdb = new Kysely<DatabaseSchema>({
          dialect: createSqliteWasmDialect({
            database: db.getDatabase(),
            sqlModule: sqlModule
          })
        });

        if (mounted) {
          setDatabase(db);
          setKyselyDb(kdb);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    initializeDatabase();

    return () => {
      mounted = false;
    };
  }, [options.databaseName, options.preferredAdapter]);

  const switchAdapter = async (type: 'opfs' | 'indexeddb' | 'memory') => {
    if (!database) return false;

    try {
      await database.switchAdapter(type);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  return {
    database,
    db: kyselyDb,
    isReady,
    error,
    switchAdapter,
    storageInfo: database?.getStorageInfo()
  };
}
```

## Web Worker Integration

For better performance, run database operations in a Web Worker:

```typescript
// worker/database-worker.ts
import { expose } from 'comlink';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let sqlModule: Sqlite3Static | null = null;
let db: Kysely<DatabaseSchema> | null = null;

export async function initializeDatabase(schema: DatabaseSchema) {
  sqlModule = await sqlite3InitModule();

  const database = new WebDatabase({
    preferredAdapter: 'opfs',
    adapterConfig: { databaseName: 'worker-db.sqlite3' }
  });

  await database.initializeWithModule(sqlModule);
  await database.createDatabase();

  db = new Kysely<DatabaseSchema>({
    dialect: createSqliteWasmDialect({
      database: database.getDatabase(),
      sqlModule: sqlModule
    })
  });

  return true;
}

export async function executeQuery<T>(queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>): Promise<T> {
  if (!db) throw new Error('Database not initialized');

  return queryFn(db);
}

expose({ initializeDatabase, executeQuery });
```

```typescript
// hooks/useDatabaseWorker.ts
export function useDatabaseWorker() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const w = new Worker(new URL('../workers/database-worker.ts', import.meta.url), {
      type: 'module'
    });

    // Initialize worker database
    const init = async () => {
      const client = wrap<DatabaseWorker>(w);
      await client.initializeDatabase(databaseSchema);
      setIsReady(true);
    };

    init();

    setWorker(w);

    return () => {
      w.terminate();
    };
  }, []);

  const executeQuery = useCallback(async <T>(
    queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>
  ): Promise<T> => {
    if (!worker || !isReady) throw new Error('Worker not ready');

    const client = wrap<DatabaseWorker>(worker);
    return client.executeQuery(queryFn);
  }, [worker, isReady]);

  return { executeQuery, isReady };
}
```

## Troubleshooting

### Common Issues

1. **OPFS Not Available**: Check if the browser supports OPFS and if COOP/COEP headers are set correctly.

```typescript
// Check OPFS availability
function checkOpfsSupport() {
  const isSupported = 'storage' in navigator && 'getDirectory' in navigator.storage;

  if (!isSupported) {
    console.warn('OPFS not supported, falling back to IndexedDB');
    return false;
  }

  return true;
}
```

2. **Database Locked**: Use the cleanup utilities to clear OPFS access handles.

```typescript
// Manual cleanup
import { manualOpfsCleanup, checkOpfsStatus } from './storage/utils/opfs-cleanup';

// Check status
const status = await checkOpfsStatus('my-database.sqlite3');
console.log('OPFS Status:', status);

// Manual cleanup if needed
if (status.recommendations.includes('Try calling manualOpfsCleanup()')) {
  await manualOpfsCleanup('my-database.sqlite3');
}
```

3. **Memory Issues**: Monitor memory usage and implement connection pooling.

```typescript
// Connection pool for high-traffic applications
class DatabaseConnectionPool {
  private connections: Kysely<DatabaseSchema>[] = [];
  private maxConnections = 5;

  async getConnection(): Promise<Kysely<DatabaseSchema>> {
    if (this.connections.length < this.maxConnections) {
      const connection = await this.createConnection();
      this.connections.push(connection);
      return connection;
    }

    return this.connections[Math.floor(Math.random() * this.connections.length)];
  }

  private async createConnection(): Promise<Kysely<DatabaseSchema>> {
    // Create new connection
  }
}
```

### Performance Optimization

1. **Use Prepared Statements**: Kysely handles this automatically, but be aware of query patterns.

2. **Batch Operations**: Group multiple operations in transactions.

```typescript
await db.transaction().execute(async (trx) => {
  await trx.insertInto('users').values(user1).execute();
  await trx.insertInto('users').values(user2).execute();
  await trx.insertInto('users').values(user3).execute();
});
```

3. **Index Management**: Ensure proper indexing for query performance.

```typescript
// Create indexes
await db.schema
  .createIndex('idx_users_email')
  .on('users')
  .column('email')
  .execute();
```

## Migration from Other Solutions

### From better-sqlite3

```typescript
// Before (Node.js)
import Database from 'better-sqlite3';
const db = new Database('database.db');

// After (Browser with OPFS)
const webDb = new WebDatabase({ preferredAdapter: 'opfs' });
await webDb.initializeWithModule(await sqlite3InitModule());
await webDb.createDatabase();

const kyselyDb = new Kysely({
  dialect: createSqliteWasmDialect({
    database: webDb.getDatabase(),
    sqlModule: await sqlite3InitModule()
  })
});
```

### From sqlite3 (Node.js)

```typescript
// Before (Node.js)
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('database.db');

// After (Browser)
const webDb = new WebDatabase({ preferredAdapter: 'opfs' });
await webDb.initializeWithModule(await sqlite3InitModule());
await webDb.createDatabase();

const db = new Kysely({
  dialect: createSqliteWasmDialect({
    database: webDb.getDatabase(),
    sqlModule: await sqlite3InitModule()
  })
});
```

## Web Worker Integration

For optimal performance, run all database operations in Web Workers to avoid blocking the main thread:

### Basic Worker Setup

```typescript
// src/workers/database-worker.ts
import { expose } from 'comlink';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Kysely } from 'kysely';
import { createSqliteWasmDialect } from '../database/sqlite-wasm-dialect';
import { WebDatabase } from '../database/web-database';

let sqlModule: Sqlite3Static | null = null;
let db: Kysely<DatabaseSchema> | null = null;
let database: WebDatabase | null = null;

export async function initializeDatabase(schema: DatabaseSchema, options: DatabaseOptions = {}) {
  // Initialize SQLite module
  sqlModule = await sqlite3InitModule({
    print: console.log,
    printErr: console.error
  });

  // Create database instance with OPFS preference
  database = new WebDatabase({
    preferredAdapter: 'opfs',
    adapterConfig: {
      databaseName: options.databaseName || 'app.sqlite3',
      maxRetries: 3,
      verbose: options.verbose || false
    }
  });

  // Initialize and create database
  await database.initializeWithModule(sqlModule);
  await database.createDatabase();

  // Create Kysely instance
  db = new Kysely<DatabaseSchema>({
    dialect: createSqliteWasmDialect({
      database: database.getDatabase(),
      sqlModule: sqlModule
    })
  });

  return {
    storageInfo: database.getStorageInfo(),
    initialized: true
  };
}

export async function executeQuery<T>(
  queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>
): Promise<T> {
  if (!db) throw new Error('Database not initialized');

  return queryFn(db);
}

export async function executeTransaction<T>(
  transactionFn: (db: Kysely<DatabaseSchema>) => Promise<T>
): Promise<T> {
  if (!db) throw new Error('Database not initialized');

  return db.transaction().execute(transactionFn);
}

export async function getStorageInfo() {
  return database?.getStorageInfo();
}

export async function switchStorageAdapter(type: 'opfs' | 'indexeddb' | 'memory') {
  if (!database) throw new Error('Database not initialized');

  await database.switchAdapter(type);
  return database.getStorageInfo();
}

export async function dispose() {
  if (db) {
    await db.destroy();
    db = null;
  }
  if (database) {
    database.close();
    database = null;
  }
  sqlModule = null;
}

expose({
  initializeDatabase,
  executeQuery,
  executeTransaction,
  getStorageInfo,
  switchStorageAdapter,
  dispose
});
```

### Worker Client Implementation

```typescript
// src/workers/database-client.ts
import { wrap, proxy } from 'comlink';
import type { DatabaseSchema } from '../types/database';

export interface DatabaseOptions {
  databaseName?: string;
  verbose?: boolean;
}

export interface StorageInfo {
  type: 'opfs' | 'memory' | 'indexeddb' | 'localstorage';
  persistent: boolean;
  path?: string;
  available: boolean;
}

export type DatabaseWorker = {
  initializeDatabase: (schema: DatabaseSchema, options?: DatabaseOptions) => Promise<{
    storageInfo: StorageInfo;
    initialized: boolean;
  }>;
  executeQuery: <T>(queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>) => Promise<T>;
  executeTransaction: <T>(transactionFn: (db: Kysely<DatabaseSchema>) => Promise<T>) => Promise<T>;
  getStorageInfo: () => Promise<StorageInfo>;
  switchStorageAdapter: (type: 'opfs' | 'indexeddb' | 'memory') => Promise<StorageInfo>;
  dispose: () => Promise<void>;
};

export class DatabaseWorkerClient {
  private worker: Worker | null = null;
  private remote: DatabaseWorker | null = null;
  private initialized = false;

  async initialize(schema: DatabaseSchema, options: DatabaseOptions = {}): Promise<StorageInfo> {
    if (this.initialized) {
      return this.remote!.getStorageInfo();
    }

    // Create worker
    this.worker = new Worker(new URL('./database-worker.ts', import.meta.url), {
      type: 'module'
    });

    // Wrap with Comlink for type-safe communication
    this.remote = wrap<DatabaseWorker>(this.worker);

    try {
      const result = await this.remote.initializeDatabase(schema, options);
      this.initialized = true;

      // Set up error handling
      this.worker.onerror = (error) => {
        console.error('Database worker error:', error);
      };

      return result.storageInfo;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  async executeQuery<T>(
    queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>
  ): Promise<T> {
    if (!this.initialized || !this.remote) {
      throw new Error('Database not initialized');
    }

    // Create a proxy function that can be serialized across the worker boundary
    const proxyFn = proxy(queryFn);
    return this.remote.executeQuery(proxyFn);
  }

  async executeTransaction<T>(
    transactionFn: (db: Kysely<DatabaseSchema>) => Promise<T>
  ): Promise<T> {
    if (!this.initialized || !this.remote) {
      throw new Error('Database not initialized');
    }

    const proxyFn = proxy(transactionFn);
    return this.remote.executeTransaction(proxyFn);
  }

  async switchAdapter(type: 'opfs' | 'indexeddb' | 'memory'): Promise<StorageInfo> {
    if (!this.initialized || !this.remote) {
      throw new Error('Database not initialized');
    }

    return this.remote.switchStorageAdapter(type);
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!this.initialized || !this.remote) {
      throw new Error('Database not initialized');
    }

    return this.remote.getStorageInfo();
  }

  async dispose(): Promise<void> {
    if (this.remote) {
      await this.remote.dispose();
      this.remote = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.initialized = false;
  }
}
```

### React Hook for Worker Database

```typescript
// src/hooks/useDatabaseWorker.ts
import { useState, useEffect, useCallback } from 'react';
import { DatabaseWorkerClient } from '../workers/database-client';
import type { DatabaseSchema } from '../types/database';

interface UseDatabaseWorkerOptions {
  schema: DatabaseSchema;
  databaseName?: string;
  verbose?: boolean;
}

export function useDatabaseWorker(options: UseDatabaseWorkerOptions) {
  const [client, setClient] = useState<DatabaseWorkerClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let workerClient: DatabaseWorkerClient | null = null;

    async function initializeWorker() {
      try {
        workerClient = new DatabaseWorkerClient();

        const info = await workerClient.initialize(options.schema, {
          databaseName: options.databaseName,
          verbose: options.verbose
        });

        if (mounted) {
          setClient(workerClient);
          setStorageInfo(info);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    initializeWorker();

    return () => {
      mounted = false;
      if (workerClient) {
        workerClient.dispose();
      }
    };
  }, [options.schema, options.databaseName, options.verbose]);

  const executeQuery = useCallback(async <T>(
    queryFn: (db: Kysely<DatabaseSchema>) => Promise<T>
  ): Promise<T> => {
    if (!client) throw new Error('Database not ready');
    return client.executeQuery(queryFn);
  }, [client]);

  const executeTransaction = useCallback(async <T>(
    transactionFn: (db: Kysely<DatabaseSchema>) => Promise<T>
  ): Promise<T> => {
    if (!client) throw new Error('Database not ready');
    return client.executeTransaction(transactionFn);
  }, [client]);

  const switchAdapter = useCallback(async (
    type: 'opfs' | 'indexeddb' | 'memory'
  ): Promise<boolean> => {
    if (!client) return false;

    try {
      const info = await client.switchAdapter(type);
      setStorageInfo(info);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [client]);

  return {
    executeQuery,
    executeTransaction,
    switchAdapter,
    isReady,
    error,
    storageInfo
  };
}
```

### Usage Example

```typescript
// src/components/DatabaseExample.tsx
import React from 'react';
import { useDatabaseWorker } from '../hooks/useDatabaseWorker';
import type { DatabaseSchema } from '../types/database';

const schema: DatabaseSchema = {
  users: {
    id: { type: 'integer', primaryKey: true, autoIncrement: true },
    name: { type: 'string' },
    email: { type: 'string' },
    created_at: { type: 'string', default: 'datetime("now")' }
  },
  posts: {
    id: { type: 'integer', primaryKey: true, autoIncrement: true },
    user_id: { type: 'integer' },
    title: { type: 'string' },
    content: { type: 'string' },
    published: { type: 'boolean', default: false }
  }
};

function DatabaseExample() {
  const {
    executeQuery,
    executeTransaction,
    switchAdapter,
    isReady,
    error,
    storageInfo
  } = useDatabaseWorker({
    schema,
    databaseName: 'example-app.sqlite3',
    verbose: true
  });

  const createUser = async () => {
    try {
      const userId = await executeQuery(async (db) => {
        const result = await db
          .insertInto('users')
          .values({
            name: 'John Doe',
            email: 'john@example.com'
          })
          .executeTakeFirst();

        return Number(result.insertId);
      });

      console.log('Created user with ID:', userId);
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const searchUsers = async (term: string) => {
    try {
      const users = await executeQuery(async (db) => {
        return db
          .selectFrom('users')
          .select(['id', 'name', 'email'])
          .where(sql`lower(name)`, 'like', `%${term.toLowerCase()}%`)
          .execute();
      });

      console.log('Found users:', users);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  if (!isReady) return <div>Loading database...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>
        <strong>Storage:</strong> {storageInfo?.type} ({storageInfo?.persistent ? 'persistent' : 'temporary'})
      </div>

      <div>
        <button onClick={() => switchAdapter('opfs')}>Use OPFS</button>
        <button onClick={() => switchAdapter('indexeddb')}>Use IndexedDB</button>
        <button onClick={() => switchAdapter('memory')}>Use Memory</button>
      </div>

      <div>
        <button onClick={createUser}>Create User</button>
        <button onClick={() => searchUsers('john')}>Search Users</button>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Connection Management

```typescript
// Connection pool for high-traffic applications
class DatabaseConnectionManager {
  private maxConnections = 5;
  private connections: Kysely<DatabaseSchema>[] = [];
  private activeConnections = 0;

  async getConnection(): Promise<Kysely<DatabaseSchema>> {
    // Wait for available connection
    while (this.activeConnections >= this.maxConnections) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeConnections++;

    if (this.connections.length > 0) {
      return this.connections.pop()!;
    }

    // Create new connection via worker
    return this.createConnection();
  }

  async releaseConnection(connection: Kysely<DatabaseSchema>): Promise<void> {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connection);
    }
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  private async createConnection(): Promise<Kysely<DatabaseSchema>> {
    // Implementation depends on your setup
  }
}
```

### Query Optimization

```typescript
// Query builder with common optimizations
export class OptimizedQueryService {
  constructor(private db: Kysely<DatabaseSchema>) {}

  async findUsersWithPagination(
    searchTerm?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: 'name' | 'created_at';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    let query = this.db
      .selectFrom('users')
      .select(['id', 'name', 'email', 'created_at']);

    if (searchTerm) {
      query = query.where(sql`lower(name)`, 'like', `%${searchTerm.toLowerCase()}%`);
    }

    return query
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset(offset)
      .execute();
  }

  async batchInsertUsers(users: Array<{ name: string; email: string }>): Promise<void> {
    // Use transaction for batch operations
    await this.db.transaction().execute(async (trx) => {
      for (const user of users) {
        await trx
          .insertInto('users')
          .values(user)
          .execute();
      }
    });
  }
}
```

## Testing

### Mock Database for Testing

```typescript
// src/test-utils/mock-database.ts
import { Kysely } from 'kysely';
import { createSqliteWasmDialect } from '../database/sqlite-wasm-dialect';

export async function createMockDatabase(): Promise<Kysely<DatabaseSchema>> {
  const sqlModule = await sqlite3InitModule();

  // Create in-memory database for testing
  const db = new sqlModule.oo1.DB('memory', 'ct');

  return new Kysely<DatabaseSchema>({
    dialect: createSqliteWasmDialect({
      database: db,
      sqlModule: sqlModule
    })
  });
}

export async function setupTestData(db: Kysely<DatabaseSchema>): Promise<void> {
  // Create tables
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('created_at', 'text', (col) => col.notNull())
    .execute();

  // Insert test data
  await db
    .insertInto('users')
    .values([
      { name: 'John Doe', email: 'john@example.com', created_at: '2023-01-01' },
      { name: 'Jane Smith', email: 'jane@example.com', created_at: '2023-01-02' }
    ])
    .execute();
}
```

### Testing with Jest/Vitest

```typescript
// src/database/__tests__/query-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryService } from '../query-service';
import { createMockDatabase, setupTestData } from '../../test-utils/mock-database';

describe('QueryService', () => {
  let db: Kysely<DatabaseSchema>;
  let queryService: QueryService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await setupTestData(db);
    queryService = new QueryService(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('should find users by name', async () => {
    const users = await queryService.searchUsers('John');

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('John Doe');
  });

  it('should create new user', async () => {
    const userId = await queryService.createUser({
      name: 'Bob Wilson',
      email: 'bob@example.com'
    });

    expect(userId).toBeGreaterThan(0);

    const users = await queryService.searchUsers('Bob');
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('bob@example.com');
  });
});
```

## Deployment Considerations

### COOP/COEP Headers

For OPFS to work in production, ensure your server sends the correct headers:

```nginx
# nginx.conf
server {
    location / {
        add_header Cross-Origin-Opener-Policy same-origin;
        add_header Cross-Origin-Embedder-Policy require-corp;
    }
}
```

```apache
# .htaccess or apache.conf
<IfModule mod_headers.c>
    Header always set Cross-Origin-Opener-Policy same-origin
    Header always set Cross-Origin-Embedder-Policy require-corp
</IfModule>
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm']
  }
});
```

## Best Practices

1. **Always Use Type Safety**: Define your schema upfront and use Kysely's type system.

2. **Handle Storage Fallbacks**: Always provide fallback storage options for maximum compatibility.

3. **Use Web Workers**: Run database operations in workers to avoid blocking the UI thread.

4. **Monitor Performance**: Track query performance and optimize slow queries with proper indexing.

5. **Connection Management**: Properly manage connections and avoid connection leaks.

6. **Error Handling**: Implement proper error handling and recovery mechanisms.

7. **Testing**: Write comprehensive tests for all database operations.

8. **Security**: Validate all inputs and use parameterized queries to prevent SQL injection.

9. **Backup Strategy**: Even with OPFS persistence, consider implementing backup mechanisms.

10. **Resource Cleanup**: Always dispose of database connections and workers properly.

## Conclusion

This implementation provides a robust, type-safe database solution for web applications using SQLite3, OPFS, and Kysely. The modular architecture allows for easy customization and extension while providing excellent performance and reliability.

### Key Benefits:

- **Persistent Storage**: OPFS provides real filesystem persistence in modern browsers
- **Type Safety**: Kysely provides compile-time type checking for SQL queries
- **Performance**: Web Workers ensure non-blocking database operations
- **Compatibility**: Automatic fallback to IndexedDB and Memory storage
- **Developer Experience**: Clean, type-safe API with excellent error handling

The storage adapter pattern ensures compatibility across different browsers and environments, while the Web Worker integration provides optimal performance for database operations.

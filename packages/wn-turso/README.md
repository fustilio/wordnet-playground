# wn-turso

Turso/libsql database backend and data pipeline utilities for WordNet.

## Features

- **Turso Database Integration** - Connect to Turso via HTTP (remote) or embedded replicas (local SQLite with sync)
- **Kysely Dialect** - Full Kysely support for type-safe SQL queries
- **Data Pipelines** - Functional, streaming data transfer between databases
- **Working DB Pattern** - Transform and extend data for runtime use cases

## Installation

```bash
pnpm add wn-turso
```

## Usage

### Basic WordNet Queries

```typescript
import { TursoWordnet } from "wn-turso";

// Remote mode (serverless)
const wn = new TursoWordnet({
  url: "libsql://your-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
  mode: "remote",
});

await wn.initialize();

const synsets = await wn.synsets({ form: "computer", language: "en" });
const words = await wn.words({ form: "run", pos: "v" });

await wn.close();
```

### Embedded Replicas (Offline-capable)

```typescript
import { TursoWordnet } from "wn-turso";

const wn = new TursoWordnet({
  url: "file:./local-wordnet.db",
  syncUrl: "libsql://your-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
  mode: "embedded",
});

await wn.initialize();

// Queries run against local SQLite
const synsets = await wn.synsets({ form: "computer" });

// Sync with remote when needed
await wn.sync();

await wn.close();
```

### Direct Database Access

```typescript
import { TursoDatabase } from "wn-turso";

const db = new TursoDatabase({
  url: "libsql://your-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN,
  mode: "remote",
});

await db.initialize();

// Get Kysely instance for custom queries
const kysely = db.getDatabase();
const results = await kysely
  .selectFrom("synsets")
  .where("language", "=", "en")
  .selectAll()
  .execute();

// Get query service with all WordNet methods
const qs = db.getQueryService();
const lexicons = await qs.getLexicons();

await db.close();
```

## Pipeline System

The pipeline system enables streaming data transfers between databases with functional transformations.

### Basic Pipeline

```typescript
import { Pipeline, tursoSource, tursoSink } from "wn-turso/pipeline";

const result = await Pipeline.from(tursoSource(sourceConfig, "synsets"))
  .filter((row) => row.language === "en")
  .map((row) => ({ ...row, processed: true }))
  .to(tursoSink(destConfig, "synsets_backup"));

console.log(`Transferred ${result.inserted} rows in ${result.duration}ms`);
```

### Working DB Pattern (Source of Truth → Runtime DB)

```typescript
import { Pipeline, tursoSource, tursoSink } from "wn-turso/pipeline";

// Transfer from canonical DB to working DB with additional columns
const result = await Pipeline.from(tursoSource(sourceConfig, "synsets"))
  .filter((row) => row.language === "en")
  .extend((row) => ({
    // Add runtime columns
    cached_count: 0,
    last_accessed: null,
    popularity_score: computeScore(row),
    source_db: "turso-main",
  }))
  .to(
    tursoSink(workingConfig, "synsets_working", {
      onConflict: "replace",
    })
  );
```

### Checksum Deduplication (Skip Unchanged Rows)

Reduce write operations by skipping rows that haven't changed using checksum-based deduplication.

#### Operator-Level (Manual Control)

```typescript
import {
  Pipeline,
  tursoSource,
  tursoSink,
  loadChecksumsFromTable,
} from "wn-turso/pipeline";

// Load existing checksums from destination
const db = await getDestinationKysely();
const existingChecksums = await loadChecksumsFromTable(
  db,
  "synsets_working",
  "id", // Key field
  "_etl_checksum" // Checksum column
);

// Pipeline will skip rows with matching checksums
const result = await Pipeline.from(tursoSource(sourceConfig, "synsets"))
  .filter((row) => row.language === "en")
  .deduplicateByChecksum({
    keyField: "id",
    checksumFields: ["definition", "pos", "ili"], // Hash these fields only
    existingChecksums,
  })
  .to(tursoSink(destConfig, "synsets_working"));

console.log(`Skipped ${result.skipped_unchanged} unchanged rows`);
```

#### Sink-Level (Automatic)

```typescript
import { Pipeline, tursoSource, tursoSink } from "wn-turso/pipeline";

// Sink automatically compares checksums and skips unchanged rows
const result = await Pipeline.from(tursoSource(sourceConfig, "synsets"))
  .filter((row) => row.language === "en")
  .to(
    tursoSink(destConfig, "synsets_working", {
      checksumDeduplication: {
        enabled: true,
        keyField: "id",
        fields: ["definition", "pos", "ili"], // Hash business fields only
        checksumColumn: "_etl_checksum", // Column to store checksum
        strategy: "skip", // 'skip' = don't write, 'update' = write anyway
      },
    })
  );

console.log(
  `Processed: ${result.processed}, Skipped: ${result.skipped_unchanged}`
);
```

**Benefits:**

- **90%+ write reduction** on incremental syncs (typical)
- **Selective field hashing** - ignore metadata like timestamps
- **Production-proven pattern** - used by Airbyte, Fivetran, dbt

### Pipeline Operators

```typescript
import { Pipeline, arraySource } from 'wn-turso/pipeline';

await Pipeline
  .from(arraySource(data))
  // Filtering
  .filter(row => row.active)

  // Transformation
  .map(row => ({ ...row, upper: row.name.toUpperCase() }))

  // Extend with new columns
  .extend(row => ({ score: row.value * 2 }))

  // Transform with null filtering
  .transform(row => row.valid ? row : null)

  // Side effects (logging, metrics)
  .tap(row => console.log('Processing:', row.id))

  // Pagination
  .skip(10)
  .take(100)

  // Deduplication by key
  .distinct(row => row.id)

  // Checksum-based deduplication (skip unchanged)
  .deduplicateByChecksum({ keyField: 'id', existingChecksums, checksumFields: [...] })

  // Batching
  .batch(50)

  // Terminal operations
  .toArray();      // Collect to array
  .count();        // Count rows
  .to(sink);       // Write to sink
  .forEach(fn);    // Execute for each
```

### Low-Level Streaming

```typescript
import {
  streamTable,
  writeBatches,
  tursoSource,
  kyselySource,
} from "wn-turso/pipeline";

// Stream from any Kysely database
for await (const row of streamTable(kysely, "synsets", { batchSize: 1000 })) {
  // Process row
}

// Write in batches
await writeBatches(kysely, "synsets", asyncIterable, {
  batchSize: 100,
  onConflict: "ignore",
});

// Use with existing Kysely instance
const source = kyselySource(existingKysely, "words");
```

## Configuration

### TursoDatabaseConfig

```typescript
interface TursoDatabaseConfig {
  // Database URL
  // Remote: 'libsql://your-db.turso.io'
  // Embedded: 'file:./local.db'
  url: string;

  // Auth token (required for remote, optional for embedded without sync)
  authToken?: string;

  // Connection mode
  mode: "remote" | "embedded";

  // For embedded: remote URL to sync with
  syncUrl?: string;

  // Sync interval in ms (0 = manual only)
  syncInterval?: number;

  // Encryption key for embedded replicas
  encryptionKey?: string;

  // Read-only mode
  readonly?: boolean;

  // Enable foreign keys
  enableForeignKeys?: boolean;
}
```

## API Reference

### TursoWordnet

Main class for WordNet queries.

| Method              | Description           |
| ------------------- | --------------------- |
| `initialize()`      | Connect to database   |
| `synsets(options?)` | Query synsets         |
| `words(options?)`   | Query words           |
| `senses(options?)`  | Query senses          |
| `lexicons()`        | Get all lexicons      |
| `sync()`            | Sync embedded replica |
| `close()`           | Close connection      |

### TursoDatabase

Low-level database wrapper.

| Method              | Description              |
| ------------------- | ------------------------ |
| `initialize()`      | Connect and setup schema |
| `getDatabase()`     | Get Kysely instance      |
| `getQueryService()` | Get query service        |
| `getAdapter()`      | Get underlying adapter   |
| `sync()`            | Sync embedded replica    |
| `close()`           | Close connection         |

### Pipeline

Fluent pipeline builder.

| Method                           | Description                     |
| -------------------------------- | ------------------------------- |
| `from(source)`                   | Create pipeline from source     |
| `filter(predicate)`              | Filter rows                     |
| `map(fn)`                        | Transform rows                  |
| `extend(fn)`                     | Add properties to rows          |
| `transform(fn)`                  | Transform with null filtering   |
| `tap(fn)`                        | Side effect                     |
| `take(n)`                        | Take first n rows               |
| `skip(n)`                        | Skip first n rows               |
| `distinct(keyFn)`                | Deduplicate by key              |
| `deduplicateByChecksum(options)` | Skip unchanged rows by checksum |
| `batch(size)`                    | Batch into arrays               |
| `to(sink)`                       | Write to sink                   |
| `toArray()`                      | Collect to array                |
| `count()`                        | Count rows                      |

### Checksum Utilities

Functions for manual checksum management.

| Function                                                        | Description                             |
| --------------------------------------------------------------- | --------------------------------------- |
| `computeChecksum(data, fields?)`                                | Compute MD5 hash of row                 |
| `checksumBatch(rows, fields?)`                                  | Compute checksums for array             |
| `loadChecksumsFromTable(db, table, keyField, checksumColumn)`   | Load existing checksums from DB         |
| `compareChecksums(rows, keyField, existingChecksums, fields?)`  | Compare rows against existing checksums |
| `filterChangedRows(rows, keyField, existingChecksums, fields?)` | Filter to only changed/new rows         |

## CLI

```bash
# Upload local SQLite to Turso
wn-turso upload --url libsql://db.turso.io --token $TOKEN --input ./wordnet.db

# Sync embedded replica
wn-turso sync --url file:./local.db --token $TOKEN
```

## Testing

```bash
# Run all tests
pnpm test

# Run e2e tests only
pnpm test:e2e

# Watch mode
pnpm test:watch
```

## License

MIT

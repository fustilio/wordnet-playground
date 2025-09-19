# SQLite OPFS Demo (React + TypeScript)

A focused demo showing SQLite running in the browser (WASM) with persistent storage via OPFS, implemented the right way: in a Web Worker. No WordNet deps — just SQLite + OPFS.

## Features

- **Worker-based OPFS**: OPFS VFS runs off the main thread (required for Atomics.wait()).
- **SQLite WASM**: Execute SQL from a simple React UI.
- **Persistence**: Databases saved in OPFS and listed in the UI.
- **Kitchen Sink**: End‑to‑end example (open → seed → flush → query → list) with console logs.
- **COOP/COEP**: Dev server sends headers to enable SharedArrayBuffer.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:5174)
pnpm dev

# Run Cypress example tests (optional)
pnpm test
```

## How it works

- `src/workers/sqliteWorker.ts`: Hosts `@sqlite.org/sqlite-wasm` in a Worker and exposes RPCs:
  `init`, `open`, `close`, `exec`, `seed`, `flush`, `listOpfs`, `deleteOpfs`.
- `src/hooks/useSqliteOpfs.ts`: React hook that talks to the worker via postMessage.
- `src/lib/sqliteClient.ts`: Kitchen‑sink style client wrapper you can use anywhere.
- `src/app/App.tsx`: Minimal UI with SQL editor, OPFS file list, and a Kitchen Sink button.

Reference: OPFS VFS requires Worker + SAB + COOP/COEP. See the SQLite wasm persistence docs: [persistence.md](https://llmtext.com/sqlite.org/wasm/doc/trunk/persistence.md).

## Using the UI

- Open: opens `demo.sqlite3` (persistent if OPFS VFS is available; otherwise falls back).
- Seed: creates `notes` and inserts sample rows. The worker checkpoints + vacuums to push data into the main db file.
- Run: executes whatever SQL is in the editor and renders a result table.
- Kitchen Sink: runs a full flow against `kitchen.sqlite3` and prints output below the editor. Check DevTools console for detailed logs.

## Programmatic usage

```ts
import { SqliteWorkerClient } from './lib/sqliteClient'

const client = new SqliteWorkerClient()
await client.init()
await client.open('my.db')           // persistent if OPFS VFS is available
await client.exec("CREATE TABLE t(x);")
await client.exec("INSERT INTO t VALUES (1),(2)")
const res = await client.exec("SELECT * FROM t")
await client.flush()                 // ensure bytes move from WAL to main db file
const files = await client.listOpfs()
await client.close()
client.dispose()
```

Hook usage inside React:

```ts
import { useSqliteOpfs } from './hooks/useSqliteOpfs'

const { isReady, openDatabase, exec } = useSqliteOpfs()
// await openDatabase('demo.sqlite3'); await exec('SELECT 1;')
```

## Troubleshooting

- “OPFS VFS cannot run in the main thread” → expected if you try to use OPFS from the main thread. This demo uses a Worker.
- Database shows 0 bytes after writes → in WAL mode, bytes can sit in the WAL; the worker’s `flush` runs `wal_checkpoint`, switches to `DELETE`, and `VACUUM`s to materialize the main file.
- Incognito/Guest modes may restrict persistence or quota.

## License

MIT (example demo)

// SQLite OPFS worker: runs sqlite-wasm in a worker so the OPFS VFS can be installed
// per docs: OPFS VFS only works in worker contexts because it requires Atomics.wait()
// https://sqlite.org/wasm/doc/trunk/persistence.md

import { default as init } from "@sqlite.org/sqlite-wasm";

import type {
  Sqlite3Static as SqliteWasm,
  Database as SqliteDb,
} from "@sqlite.org/sqlite-wasm";

type RpcMessage = {
  id?: number;
  type:
    | "init"
    | "open"
    | "close"
    | "exec"
    | "seed"
    | "flush"
    | "listOpfs"
    | "deleteOpfs";
  payload?: any;
};

type RpcResponse = {
  id?: number;
  ok: boolean;
  error?: string;
  data?: any;
};

let sqlite3: SqliteWasm | null = null;
let db: SqliteDb | null = null;
let persistent = false;
let opfsSupported = false;
let storage: 'opfs' | 'jsstorage' | 'memory' = 'memory';

async function initSqlite() {
  if (sqlite3) return sqlite3;
  sqlite3 = await init({ print: () => {}, printErr: () => {} });

  opfsSupported = !!sqlite3?.oo1?.OpfsDb;
  try {
    console.log("[sqlite-worker] init ok. opfsSupported=", opfsSupported);
  } catch {}
  return sqlite3;
}

async function openDb(filename: string) {
  await initSqlite();
  // Close previous
  if (db) {
    try {
      db.close();
    } catch {}
    db = null;
  }
  persistent = false;
  storage = 'memory';
  // Try OpfsDb
  if (opfsSupported && sqlite3!.oo1.OpfsDb) {
    try {
      db = new sqlite3!.oo1.OpfsDb(filename);
      persistent = true;
      storage = 'opfs';
      try {
        db.exec("PRAGMA journal_mode=WAL;");
      } catch {}
      try {
        console.log("[sqlite-worker] open: OpfsDb persistent db=", filename);
      } catch {}
      return;
    } catch {}
  }
  // Try vfs URI
  try {
    db = new sqlite3!.oo1.DB(`file:${filename}?vfs=opfs`);
    persistent = true;
    storage = 'opfs';
    try {
      db.exec("PRAGMA journal_mode=WAL;");
    } catch {}
    try {
      console.log("[sqlite-worker] open: vfs=opfs persistent db=", filename);
    } catch {}
    return;
  } catch {}
  // Try JsStorageDb (localStorage)
  if (sqlite3?.oo1?.JsStorageDb) {
    try {
      // Note: JsStorageDb uses 'local' or 'session' storage and does not support
      // arbitrary filenames. Using 'local' will merge all databases into one.
      db = new sqlite3.oo1.JsStorageDb("local");
      persistent = true;
      storage = 'jsstorage';
      try {
        console.log(
          `[sqlite-worker] open: JsStorageDb persistent db=local (filename '${filename}' mapped to 'local')`,
        );
      } catch {}
      return;
    } catch (e) {
      try {
        console.warn("[sqlite-worker] open: JsStorageDb failed", e);
      } catch {}
    }
  }
  // Fallback: non-persistent
  db = new sqlite3!.oo1.DB(filename, "ct");
  persistent = false;
  try {
    console.warn("[sqlite-worker] open: fallback non-persistent db=", filename);
  } catch {}
}

function closeDb() {
  if (db) {
    try {
      db.close();
    } catch {}
    db = null;
  }
  try {
    console.log("[sqlite-worker] close ok");
  } catch {}
}

function execSql(sql: string) {
  if (!db) throw new Error("Database not open");
  try {
    console.log("[sqlite-worker] exec sql=", (sql || "").slice(0, 120));
  } catch {}
  const rows: Array<Record<string, unknown>> = [];
  let columns: string[] = [];
  db.exec({
    sql,
    rowMode: "object",
    callback: (row: Record<string, unknown>) => {
      if (columns.length === 0) columns = Object.keys(row);
      rows.push(row);
    },
  });
  return { columns, rows };
}

async function seedSample() {
  if (!db) throw new Error("Database not open");
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO notes(title, body) VALUES
      ('Hello OPFS', 'This row lives in an OPFS-backed SQLite DB'),
      ('SQLite WASM', 'Run SQL right in the browser');
  `);
  // Try to force content to the main db file
  try {
    db.exec("PRAGMA wal_checkpoint(FULL);");
  } catch {}
  try {
    db.exec("PRAGMA journal_mode=DELETE;");
  } catch {}
  try {
    db.exec("VACUUM;");
  } catch {}
  try {
    console.log("[sqlite-worker] seed ok + flushed");
  } catch {}
}

async function flushDb() {
  if (!db) throw new Error("Database not open");
  try {
    db.exec("PRAGMA wal_checkpoint(FULL);");
  } catch {}
  try {
    db.exec("PRAGMA journal_mode=DELETE;");
  } catch {}
  try {
    db.exec("VACUUM;");
  } catch {}
  try {
    console.log("[sqlite-worker] flush ok");
  } catch {}
}

async function listOpfs() {
  try {
    const root: any = await (self as any).navigator.storage.getDirectory();
    const files: Array<{ name: string; size: number }> = [];
    for await (const [name, handle] of root.entries()) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        files.push({ name, size: file.size });
      }
    }
    try {
      console.log("[sqlite-worker] listOpfs count=", files.length);
    } catch {}
    return files.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function deleteOpfs(filename: string) {
  try {
    if (!filename || typeof filename !== "string") return false;
    const root: any = await (self as any).navigator.storage.getDirectory();
    if (typeof root.removeEntry === "function") {
      await root.removeEntry(filename);
    } else if (typeof root.remove === "function") {
      // remove() has no target parameter here; fallback to truncate approach below
      const fh = await root.getFileHandle(filename).catch(() => null);
      if (fh && fh.createSyncAccessHandle) {
        const ah = await fh.createSyncAccessHandle();
        try {
          ah.truncate(0);
          ah.flush();
        } finally {
          ah.close();
        }
      }
    } else {
      const fh = await root.getFileHandle(filename).catch(() => null);
      if (fh && fh.createSyncAccessHandle) {
        const ah = await fh.createSyncAccessHandle();
        try {
          ah.truncate(0);
          ah.flush();
        } finally {
          ah.close();
        }
      }
    }
    if (db && db.filename === filename) closeDb();
    try {
      console.log("[sqlite-worker] deleteOpfs ok file=", filename);
    } catch {}
    return true;
  } catch {
    try {
      console.warn("[sqlite-worker] deleteOpfs failed file=", filename);
    } catch {}
    return false;
  }
}

self.onmessage = async (ev: MessageEvent<RpcMessage>) => {
  const { id, type, payload } = ev.data;
  const respond = (resp: RpcResponse) =>
    (self as any).postMessage({ id, ...resp });
  try {
    switch (type) {
      case "init": {
        await initSqlite();
        respond({ ok: true, data: { opfsSupported } });
        break;
      }
      case "open": {
        await openDb(payload?.filename || "demo.sqlite3");
        respond({ ok: true, data: { persistent, opfsSupported, storage } });
        break;
      }
      case "close": {
        closeDb();
        respond({ ok: true });
        break;
      }
      case "exec": {
        const out = execSql(String(payload?.sql || ""));
        respond({ ok: true, data: out });
        break;
      }
      case "seed": {
        await seedSample();
        respond({ ok: true });
        break;
      }
      case "flush": {
        await flushDb();
        respond({ ok: true });
        break;
      }
      case "listOpfs": {
        const files = await listOpfs();
        respond({ ok: true, data: files });
        break;
      }
      case "deleteOpfs": {
        const ok = await deleteOpfs(String(payload?.filename));
        respond({ ok });
        break;
      }
      default:
        respond({ ok: false, error: `Unknown message type: ${type}` });
    }
  } catch (e) {
    respond({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};

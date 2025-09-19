// SQLite OPFS worker: runs sqlite-wasm in a worker so the OPFS VFS can be installed
// per docs: OPFS VFS only works in worker contexts because it requires Atomics.wait()
// https://sqlite.org/wasm/doc/trunk/persistence.md

import { default as init } from '@sqlite.org/sqlite-wasm'
import { createScopedLogger } from 'utils/logger'

import type { Sqlite3Static as SqliteWasm, Database as SqliteDb } from '@sqlite.org/sqlite-wasm'

type RpcMessage = {
  id?: number
  type: 'init' | 'open' | 'close' | 'exec' | 'seed' | 'flush' | 'listOpfs' | 'deleteOpfs' | 'writeFile'
  payload?: any
}

type RpcResponse = {
  id?: number
  ok: boolean
  error?: string
  data?: any
}

let sqlite3: SqliteWasm | null = null
let db: SqliteDb | null = null
let persistent = false
let opfsSupported = false
let storage: 'opfs' | 'jsstorage' | 'memory' = 'memory'
const logger = createScopedLogger('sqlite-worker')

async function initSqlite() {
  if (sqlite3) return sqlite3
  sqlite3 = await init({ print: () => {}, printErr: () => {} })
  opfsSupported = !!sqlite3?.oo1?.OpfsDb
  try { logger.info('init ok', { opfsSupported }) } catch {}
  return sqlite3
}

async function openDb(filename: string) {
  await initSqlite()
  if (db) {
    try { db.close() } catch {}
    db = null
  }
  persistent = false
  storage = 'memory'
  if (opfsSupported && sqlite3!.oo1.OpfsDb) {
    try {
      db = new sqlite3!.oo1.OpfsDb(filename)
      persistent = true
      storage = 'opfs'
      try { db.exec('PRAGMA journal_mode=WAL;') } catch {}
      try { logger.info('open OpfsDb', { filename }) } catch {}
      return
    } catch {}
  }
  try {
    db = new sqlite3!.oo1.DB(`file:${filename}?vfs=opfs`)
    persistent = true
    storage = 'opfs'
    try { db.exec('PRAGMA journal_mode=WAL;') } catch {}
    try { logger.info('open vfs=opfs', { filename }) } catch {}
    return
  } catch {}
  if (sqlite3?.oo1?.JsStorageDb) {
    try {
      db = new sqlite3.oo1.JsStorageDb('local')
      persistent = true
      storage = 'jsstorage'
      try { logger.info('open JsStorageDb local') } catch {}
      return
    } catch {}
  }
  db = new sqlite3!.oo1.DB(filename, 'ct')
  persistent = false
  try { logger.warn('open fallback non-persistent', { filename }) } catch {}
}

function closeDb() {
  if (db) {
    try { db.close() } catch {}
    db = null
  }
}

function execSql(sql: string) {
  if (!db) throw new Error('Database not open')
  const rows: Array<Record<string, unknown>> = []
  let columns: string[] = []
  db.exec({
    sql,
    rowMode: 'object',
    callback: (row: Record<string, unknown>) => {
      if (columns.length === 0) columns = Object.keys(row)
      rows.push(row)
    },
  })
  return { columns, rows }
}

async function seedSample() {
  if (!db) throw new Error('Database not open')
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
  `)
  try { db.exec('PRAGMA wal_checkpoint(FULL);') } catch {}
  try { db.exec('PRAGMA journal_mode=DELETE;') } catch {}
  try { db.exec('VACUUM;') } catch {}
}

async function flushDb() {
  if (!db) throw new Error('Database not open')
  try { db.exec('PRAGMA wal_checkpoint(FULL);') } catch {}
  try { db.exec('PRAGMA journal_mode=DELETE;') } catch {}
  try { db.exec('VACUUM;') } catch {}
}

async function listOpfs() {
  try {
    const root: any = await (self as any).navigator.storage.getDirectory()
    const files: Array<{ name: string; size: number }> = []
    for await (const [name, handle] of root.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile()
        files.push({ name, size: file.size })
      }
    }
    return files.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

async function deleteOpfs(filename: string) {
  try {
    if (!filename || typeof filename !== 'string') return false
    const root: any = await (self as any).navigator.storage.getDirectory()
    if (typeof root.removeEntry === 'function') {
      await root.removeEntry(filename)
    } else {
      const fh = await root.getFileHandle(filename).catch(() => null)
      if (fh?.createSyncAccessHandle) {
        const ah = await fh.createSyncAccessHandle()
        try { ah.truncate(0); ah.flush() } finally { ah.close() }
      }
    }
    if (db && (db as any).filename === filename) closeDb()
    return true
  } catch {
    return false
  }
}

async function writeFile(filename: string, data: Uint8Array) {
  const root: any = await (self as any).navigator.storage.getDirectory()
  const fh = await root.getFileHandle(filename, { create: true })
  if ((fh as any).createSyncAccessHandle) {
    const ah = await (fh as any).createSyncAccessHandle()
    try { ah.write(new Uint8Array(data)); ah.flush() } finally { ah.close() }
  } else {
    const ws = await (fh as any).createWritable()
    await ws.write(data)
    await ws.close()
  }
  return true
}

self.onmessage = async (ev: MessageEvent<RpcMessage>) => {
  const { id, type, payload } = ev.data
  const start = performance.now()
  const respond = (resp: RpcResponse) => {
    const durationMs = performance.now() - start
    try { logger.info('➡️ handled', { id, type, ok: resp.ok, durationMs }) } catch {}
    ;(self as any).postMessage({ id, ...resp, durationMs })
  }
  try {
    switch (type) {
      case 'init': {
        await initSqlite();
        respond({ ok: true, data: { opfsSupported } })
        break
      }
      case 'open': {
        await openDb(payload?.filename || 'demo.sqlite3')
        respond({ ok: true, data: { persistent, opfsSupported, storage } })
        break
      }
      case 'close': {
        closeDb();
        respond({ ok: true })
        break
      }
      case 'exec': {
        const out = execSql(String(payload?.sql || ''))
        respond({ ok: true, data: out })
        break
      }
      case 'seed': {
        await seedSample();
        respond({ ok: true })
        break
      }
      case 'flush': {
        await flushDb();
        respond({ ok: true })
        break
      }
      case 'listOpfs': {
        const files = await listOpfs();
        respond({ ok: true, data: files })
        break
      }
      case 'deleteOpfs': {
        const ok = await deleteOpfs(String(payload?.filename))
        respond({ ok })
        break
      }
      case 'writeFile': {
        const ok = await writeFile(String(payload?.filename), new Uint8Array(payload?.data || []))
        respond({ ok })
        break
      }
      default:
        respond({ ok: false, error: `Unknown message type: ${type}` })
    }
  } catch (e) {
    try { logger.error('handler error', { id, type, error: e instanceof Error ? e.message : String(e) }) } catch {}
    respond({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
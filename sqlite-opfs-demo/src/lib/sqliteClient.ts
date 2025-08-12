// Lightweight client wrapper around the sqlite worker RPC
// Provides a simple API for init/open/close/exec/seed/flush/list/delete

export type QueryResult = { columns: string[]; rows: Array<Record<string, unknown>> }

type WorkerRequest = { id: number; type: string; payload?: any }
type WorkerResponse = { id?: number; ok: boolean; error?: string; data?: any }

export class SqliteWorkerClient {
  private worker: Worker
  private nextId = 0
  private pending = new Map<number, (resp: WorkerResponse) => void>()

  public opfsSupported = false
  public persistent = false
  public storage: 'opfs' | 'jsstorage' | 'memory' = 'memory'

  constructor() {
    this.worker = new Worker(new URL('../workers/sqliteWorker.ts', import.meta.url), { type: 'module' })
    this.worker.addEventListener('message', (ev: MessageEvent<WorkerResponse>) => {
      const { id } = ev.data
      if (id != null && this.pending.has(id)) {
        const resolve = this.pending.get(id)!
        this.pending.delete(id)
        resolve(ev.data)
      }
    })
  }

  dispose() {
    this.worker.terminate()
    this.pending.clear()
  }

  private rpc<T = any>(type: string, payload?: any): Promise<WorkerResponse & { data?: T }> {
    return new Promise((resolve) => {
      const id = ++this.nextId
      this.pending.set(id, resolve)
      const msg: WorkerRequest = { id, type, payload }
      this.worker.postMessage(msg)
    }) as Promise<WorkerResponse & { data?: T }>
  }

  async init() {
    const resp = await this.rpc<{ opfsSupported: boolean }>('init')
    if (!resp.ok) throw new Error(resp.error || 'init failed')
    this.opfsSupported = !!resp.data?.opfsSupported
    return this.opfsSupported
  }

  async open(filename: string) {
    const resp = await this.rpc<{ persistent: boolean; opfsSupported: boolean; storage: 'opfs' | 'jsstorage' | 'memory' }>('open', { filename })
    if (!resp.ok) throw new Error(resp.error || 'open failed')
    this.persistent = !!resp.data?.persistent
    this.opfsSupported = !!resp.data?.opfsSupported
    this.storage = resp.data?.storage || 'memory'
    return this.persistent
  }

  async close() {
    try {
      const resp = await this.rpc('close')
      if (!resp.ok) throw new Error(resp.error || 'close failed')
    } catch {
      // ignore close errors on already-closed worker/db
    }
  }

  async exec(sql: string): Promise<QueryResult> {
    const resp = await this.rpc<QueryResult>('exec', { sql })
    if (!resp.ok) throw new Error(resp.error || 'exec failed')
    return resp.data as QueryResult
  }

  // Convenience: run multiple statements separated by ';'
  async execAll(sql: string): Promise<QueryResult[]> {
    const results: QueryResult[] = []
    const stmts = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    for (const s of stmts) {
      const res = await this.exec(s)
      results.push(res)
    }
    return results
  }

  async seed() {
    const resp = await this.rpc('seed')
    if (!resp.ok) throw new Error(resp.error || 'seed failed')
  }

  async flush() {
    const resp = await this.rpc('flush')
    if (!resp.ok) throw new Error(resp.error || 'flush failed')
  }

  async listOpfs(): Promise<Array<{ name: string; size: number }>> {
    const resp = await this.rpc<Array<{ name: string; size: number }>>('listOpfs')
    if (!resp.ok) throw new Error(resp.error || 'list failed')
    return resp.data || []
  }

  async deleteOpfs(filename: string) {
    if (!filename || typeof filename !== 'string') return
    const resp = await this.rpc('deleteOpfs', { filename })
    if (!resp.ok) throw new Error(resp.error || 'delete failed')
  }
}



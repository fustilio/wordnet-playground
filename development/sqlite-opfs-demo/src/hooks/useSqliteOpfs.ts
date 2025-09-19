import { useCallback, useEffect, useState } from 'react'
import { SqliteWorkerClient, type QueryResult } from '../lib/sqliteClient'

export type { QueryResult }

export function useSqliteOpfs() {
  const [client, setClient] = useState<SqliteWorkerClient | null>(null)
  const [db, setDb] = useState<boolean>(false)
  const [dbFilename, setDbFilename] = useState<string>('demo.sqlite3')
  const [isReady, setIsReady] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opfsFiles, setOpfsFiles] = useState<Array<{ name: string; size: number }>>([])

  // Create client once
  useEffect(() => {
    const c = new SqliteWorkerClient()
    setClient(c)
    c.init()
      .then(() => setIsReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
    return () => {
      c.dispose()
      setClient(null)
    }
  }, [])

  const listOpfsFiles = useCallback(async () => {
    if (!client) return
    try {
      const files = await client.listOpfs()
      setOpfsFiles(files)
    } catch (e) {
      console.warn('OPFS list failed', e)
      setOpfsFiles([])
    }
  }, [client])

  const openDatabase = useCallback(
    async (filename?: string) => {
      if (!client) throw new Error('SQLite not ready')
      const fname = filename ?? dbFilename
      try {
        await client.open(fname)
        setDb(true)
        setDbFilename(fname)
        await listOpfsFiles()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        return false
      }
    },
    [client, dbFilename, listOpfsFiles],
  )

  const closeDatabase = useCallback(() => {
    if (!client) return
    client.close().finally(() => setDb(false))
  }, [client])

  const exec = useCallback(
    async (sql: string): Promise<QueryResult> => {
      if (!client || !db) throw new Error('Database not open')
      return await client.exec(sql)
    },
    [client, db],
  )

  const runSampleSchema = useCallback(async () => {
    if (!client || !db) throw new Error('Database not open')
    setIsSeeding(true)
    try {
      await client.seed()
      await client.flush()
      await listOpfsFiles()
    } finally {
      setIsSeeding(false)
    }
  }, [client, db, listOpfsFiles])

  const deleteOpfsFile = useCallback(
    async (filename: string) => {
      if (!client) return false
      try {
        await client.deleteOpfs(filename)
        if (filename === dbFilename) closeDatabase()
        await listOpfsFiles()
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        return false
      }
    },
    [client, dbFilename, closeDatabase, listOpfsFiles],
  )

  useEffect(() => {
    // Update file list when SQLite ready
    if (isReady) listOpfsFiles()
  }, [isReady, listOpfsFiles])

  return {
    // state
    isReady,
    isSeeding,
    error,
    db,
    dbFilename,
    opfsFiles,
    opfsSupported: client?.opfsSupported ?? false,
    persistent: client?.persistent ?? false,
    storage: client?.storage ?? 'memory',

    // actions
    openDatabase,
    closeDatabase,
    exec,
    runSampleSchema,
    listOpfsFiles,
    deleteOpfsFile,
  }
}



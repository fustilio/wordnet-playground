import { useEffect, useRef, useState } from 'react'
import '../index.css'
import { useSqliteOpfs } from '../hooks/useSqliteOpfs'
import { SqliteWorkerClient } from '../lib/sqliteClient'

function App() {
  const {
    isReady,
    error,
    db,
    dbFilename,
    opfsFiles,
    openDatabase,
    closeDatabase,
    exec,
    runSampleSchema,
    deleteOpfsFile,
    listOpfsFiles,
    isSeeding,
    persistent,
    storage,
  } = useSqliteOpfs()

  const [sql, setSql] = useState<string>('SELECT 1 as test;')
  const [result, setResult] = useState<{ columns: string[]; rows: Array<Record<string, unknown>> } | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [ksOut, setKsOut] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('')

  const hasOpenedRef = useRef(false)
  useEffect(() => {
    // Open default DB once when WASM is ready
    if (!isReady || hasOpenedRef.current) return
    hasOpenedRef.current = true
    // In original code, this would auto-seed, but that creates test race conditions.
    // Seeding is now an explicit user action.
    ;(async () => {
      await openDatabase('demo.sqlite3')
    })()
  }, [isReady, openDatabase])

  const handleRun = async () => {
    setRunError(null)
    setStatusMessage('')
    try {
      // Ensure database is open before executing
      if (!db) {
        const opened = await openDatabase(dbFilename)
        if (!opened) throw new Error('Database not open')
      }
      // Support multi-statement SQL by executing sequentially and showing last result set
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      let lastResult: { columns: string[]; rows: Array<Record<string, unknown>> } | null = null
      for (const stmt of statements) {
        const res = await exec(stmt)
        lastResult = res
      }
      setResult(lastResult)
      setStatusMessage('SQL executed successfully.')
    } catch (e) {
      setResult(null)
      setRunError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleSeed = async () => {
    setStatusMessage('')
    try {
      await runSampleSchema()
      setStatusMessage('Database seeded successfully.')
    } catch (e) {
      setStatusMessage(`Seeding failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SQLite OPFS Demo</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Run SQLite in the browser and persist to OPFS.</p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Status</h2>
              <p className="text-sm text-gray-700">WASM: {isReady ? 'ready' : 'loading...'}</p>
              <p className="text-sm text-gray-700">DB: {db ? `${dbFilename} (${storage})` : 'not open'}</p>
              <p className="text-xs text-gray-500">Storage: {storage === 'opfs' ? 'OPFS' : storage === 'jsstorage' ? 'localStorage' : 'In-memory'}.</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!isReady} onClick={() => openDatabase(dbFilename)}>Open</button>
                <button className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={!db} onClick={() => closeDatabase()}>Close</button>
                <button className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" disabled={!db || isSeeding} onClick={handleSeed}>{isSeeding ? 'Seeding...' : 'Seed'}</button>
                <button
                  className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50"
                  disabled={!isReady}
                  onClick={async () => {
                    // Kitchen sink: demonstrate full client API usage end-to-end
                    const client = new SqliteWorkerClient()
                    try {
                      await client.init()
                      console.log('[kitchen] init ok. opfsSupported=', client.opfsSupported)
                      await client.open('kitchen.sqlite3')
                      console.log('[kitchen] open ok. persistent=', client.persistent)
                      await client.seed()
                      console.log('[kitchen] seed ok')
                      await client.flush()
                      console.log('[kitchen] flush ok')
                      const res = await client.exec("SELECT COUNT(*) as n FROM notes;")
                      console.log('[kitchen] exec ok', res)
                      const files = await client.listOpfs()
                      console.log('[kitchen] list opfs', files)
                      await client.close()
                      client.dispose()
                      setKsOut(JSON.stringify({ res, files, persistent: client.persistent, opfsSupported: client.opfsSupported, storage: client.storage }, null, 2))
                      // Refresh left panel file list
                      await listOpfsFiles()
                      setStatusMessage('Kitchen sink test completed.')
                    } catch (e) {
                      console.error('[kitchen] error', e)
                      setKsOut(String(e instanceof Error ? e.message : e))
                      client.dispose()
                    }
                  }}
                >Kitchen Sink</button>
              </div>
              {statusMessage && <p data-testid="status-message" className="text-sm text-green-700 mt-2">{statusMessage}</p>}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">OPFS Files</h2>
              <ul className="text-sm space-y-2">
                {opfsFiles.length === 0 && <li className="text-gray-600">No files</li>}
                {opfsFiles.map(f => (
                  <li key={f.name} className="flex items-center justify-between">
                    <span className="truncate" title={f.name}>{f.name} <span className="text-gray-500">({f.size} bytes)</span></span>
                    <button className="px-2 py-1 text-sm bg-red-600 text-white rounded" onClick={() => deleteOpfsFile(f.name)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">SQL</h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded mb-3 font-mono text-sm"
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="Type SQL here"
              />
              <div className="flex gap-2 mb-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleRun} disabled={!db}>Run</button>
              </div>
              {runError && <p className="text-sm text-red-600 mb-2">{runError}</p>}
              {result && (
                <div className="overflow-auto">
                  <table data-testid="sql-results" className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {result.columns.map(col => (
                          <th key={col} className="text-left px-3 py-2 border-b border-gray-200">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50">
                          {result.columns.map(col => (
                            <td key={col} className="px-3 py-2 border-b border-gray-100">
                              {String((row as any)[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {ksOut && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mt-4">
                <h2 className="text-lg font-semibold mb-3">Kitchen Sink Output</h2>
                <pre className="text-xs whitespace-pre-wrap break-all">{ksOut}</pre>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App

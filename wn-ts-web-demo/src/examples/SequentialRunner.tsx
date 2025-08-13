import React from 'react'
import type { useWordNet } from '../hooks/useWordNet'

type RunnerState = ReturnType<typeof useWordNet>
interface SequentialRunnerProps { wordnetState: RunnerState }

type StepStatus = 'idle' | 'running' | 'success' | 'error'

interface StepResult<T = unknown> {
  status: StepStatus
  durationMs?: number
  error?: string
  output?: T
}

export const SequentialRunner: React.FC<SequentialRunnerProps> = ({ wordnetState }) => {
  const [results, setResults] = React.useState<Record<string, StepResult>>({})
  const [isRunningAll, setIsRunningAll] = React.useState(false)

  const setStep = (key: string, updater: (prev: StepResult) => StepResult) => {
    setResults(prev => ({ ...prev, [key]: updater(prev[key] || { status: 'idle' }) }))
  }

  const run = async <T,>(key: string, fn: () => Promise<T>) => {
    setStep(key, () => ({ status: 'running' }))
    const started = performance.now()
    try {
      const output = await fn()
      const durationMs = performance.now() - started
      console.log(`🧪 Step ${key} completed in ${durationMs.toFixed(1)}ms`, output)
      setStep(key, () => ({ status: 'success', durationMs, output: output as unknown }))
      return true
    } catch (e: unknown) {
      const durationMs = performance.now() - started
      const error = e instanceof Error ? e.message : String(e)
      console.error(`🧪 Step ${key} failed in ${durationMs.toFixed(1)}ms:`, e)
      setStep(key, () => ({ status: 'error', durationMs, error }))
      return false
    }
  }

  const steps: Array<{ key: string; label: string; action: () => Promise<any> }> = [
    {
      key: 'initialize',
      label: 'Initialize WordNet',
      action: async () => {
        return {
          initialized: Boolean(wordnetState.wordnet),
          hasDataLoader: Boolean(wordnetState.dataLoader),
        }
      }
    },
    {
      key: 'load-demo',
      label: 'Load Demo (oewn:2024)',
      action: async () => {
        await wordnetState.loadDemoData()
        if (!wordnetState.dataLoader) throw new Error('DataLoader not ready')
        const stats = await wordnetState.dataLoader.getStatistics()
        return stats
      }
    },
    {
      key: 'stats',
      label: 'Fetch Statistics',
      action: async () => {
        if (!wordnetState.dataLoader) throw new Error('DataLoader not ready')
        const stats = await wordnetState.dataLoader.getStatistics()
        return stats
      }
    },
    {
      key: 'query-words',
      label: 'Query Words ("happy")',
      action: async () => {
        const started = performance.now()
        if (!wordnetState.wordnet) throw new Error('WordNet not ready')
        const results = typeof wordnetState.wordnet.searchWords === 'function'
          ? await wordnetState.wordnet.searchWords('happy', { limit: 50 })
          : await wordnetState.wordnet.words('happy')
        const durationMs = performance.now() - started
        return { durationMs, count: Array.isArray(results) ? results.length : 0, sample: results?.slice?.(0, 5) }
      }
    },
    {
      key: 'query-synsets',
      label: 'Query Synsets ("happy")',
      action: async () => {
        const started = performance.now()
        if (!wordnetState.wordnet) throw new Error('WordNet not ready')
        const synsets = await wordnetState.wordnet.synsets('happy')
        const durationMs = performance.now() - started
        return { durationMs, count: synsets.length, sample: synsets.slice(0, 3) }
      }
    },
    {
      key: 'cache-info',
      label: 'Cache Info',
      action: async () => {
        const info = await wordnetState.getCacheInfo()
        return info
      }
    }
  ]

  const runAll = async () => {
    setIsRunningAll(true)
    for (const step of steps) {
      const ok = await run(step.key, step.action)
      if (!ok) break
    }
    setIsRunningAll(false)
  }

  const reset = () => setResults({})

  const statusColor = (status: StepStatus) =>
    status === 'success' ? 'text-green-700 bg-green-50 border-green-200'
      : status === 'error' ? 'text-red-700 bg-red-50 border-red-200'
      : status === 'running' ? 'text-blue-700 bg-blue-50 border-blue-200'
      : 'text-gray-700 bg-gray-50 border-gray-200'

  return (
    <div className="space-y-4" data-testid="sequential-runner">
      <div className="flex gap-2">
        <button onClick={runAll} disabled={isRunningAll} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" data-testid="run-all">Run All</button>
        <button onClick={reset} disabled={isRunningAll} className="px-3 py-2 rounded bg-gray-200 text-gray-800" data-testid="reset-runner">Reset</button>
      </div>

      <div className="space-y-3">
        {steps.map((s) => {
          const r = results[s.key] || { status: 'idle' as StepStatus }
          return (
            <div key={s.key} className={`border rounded p-3 ${statusColor(r.status)}`} data-testid={`step-${s.key}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.label}</div>
                <div className="flex items-center gap-2 text-sm">
                  {r.durationMs != null && <span data-testid={`step-duration-${s.key}`}>{r.durationMs.toFixed(1)}ms</span>}
                  <button onClick={() => run(s.key, s.action)} disabled={isRunningAll || r.status === 'running'} className="px-2 py-1 rounded bg-white text-gray-800 border" data-testid={`run-step-${s.key}`}>Run</button>
                </div>
              </div>
              {r.error && (
                <div className="mt-2 text-xs" data-testid={`step-error-${s.key}`}>Error: {r.error}</div>
              )}
              {typeof r.output !== 'undefined' && (
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-60" data-testid={`step-output-${s.key}`}>{JSON.stringify(r.output as unknown, null, 2)}</pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}



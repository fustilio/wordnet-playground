import React from 'react'
import { BasicWordNetDemo } from './BasicWordNetDemo'
import { DemoDataSection } from './DemoDataSection'
import { ProjectList } from './ProjectList'

type WordNetState = any

interface ExamplesPageProps {
  wordnetState: WordNetState
}

type ExampleId = 'basic' | 'projects' | 'info'

export const ExamplesPage: React.FC<ExamplesPageProps> = ({ wordnetState }) => {
  const [selected, setSelected] = React.useState<ExampleId>('basic')

  const examples: Array<{ id: ExampleId; label: string; render: () => React.ReactNode }> = [
    {
      id: 'basic',
      label: 'Basic WordNet Demo',
      render: () => (
        <BasicWordNetDemo
          wordNetState={wordnetState}
          availablePackages={wordnetState.availablePackages}
          onLoadPackage={async (packageId: string, version: string, onProgress?: (p: number) => void) => {
            const id = `${packageId}:${version}`
            await wordnetState.loadPackageData(id, onProgress)
          }}
          onLoadDemo={async () => {
            await wordnetState.loadDemoData()
          }}
          onUnloadData={async () => {
            await wordnetState.unloadData()
          }}
          onClearCacheAndUnload={async () => {
            await wordnetState.clearCacheAndUnload()
          }}
          getCacheInfo={async () => {
            return await wordnetState.getCacheInfo()
          }}
          isInitializing={wordnetState.isInitializing}
        />
      )
    },
    {
      id: 'projects',
      label: 'Project List',
      render: () => <ProjectList />
    },
    {
      id: 'info',
      label: 'Data Info',
      render: () => <DemoDataSection />
    }
  ]

  const active = examples.find(e => e.id === selected)!

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Shared state chip */}
      <div className="lg:col-span-4">
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <span className="text-sm text-gray-600">Shared State:</span>
          <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-800 border border-blue-200">Loaded Packages: {wordnetState.loadedPackages?.length ?? 0}</span>
          <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-800 border border-green-200">Cache Files: {wordnetState.cacheInfo?.totalFiles ?? 0}</span>
          <span className="px-2 py-1 text-xs rounded bg-purple-50 text-purple-800 border border-purple-200">Cache Size: {Math.round((wordnetState.cacheInfo?.totalSizeMB ?? 0) * 100)/100} MB</span>
        </div>
      </div>

      <aside className="lg:col-span-1 space-y-2">
        <div className="bg-white rounded-lg shadow-md p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Examples</h3>
          <nav className="space-y-1">
            {examples.map(ex => (
              <button
                key={ex.id}
                onClick={() => setSelected(ex.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selected === ex.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <section className="lg:col-span-3">
        {active.render()}
      </section>
    </div>
  )
}



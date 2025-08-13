import { useState, useEffect } from 'react';
import '../index.css';

import { StatusWidget } from '../components/widgets/StatusWidget';
import { StatisticsWidget } from '../components/widgets/StatisticsWidget';
import { OPFSWidget } from '../components/widgets/OPFSWidget';
import { Tabs } from '../components/shared/Tabs';
import { BasicDemo } from '../components/demos/BasicDemo';
import { BilingualDictionary } from '../components/demos/BilingualDictionary';
import { AdvancedDemo } from '../components/demos/AdvancedDemo';
import { DeveloperDemo } from '../components/demos/DeveloperDemo';
import { ExamplesPage } from '../examples/ExamplesPage';
import { useWordNetWorker } from '../hooks/useWordNetWorker';
import { useOPFS } from '../hooks';

function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wn = useWordNetWorker();
  const opfs = useOPFS();

  useEffect(() => {
    console.log('🔍 App: wordnetWorkerState:', wn);
  }, [wn]);

  const tabs = ['Basic', 'Bilingual', 'Advanced', 'Developer', 'Examples'];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">WordNet TypeScript Demo</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            An interactive demo for exploring the WordNet API in the browser using SQLite WASM and OPFS.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <StatusWidget 
              isInitializing={!wn.isReady}
              loading={wn.loading}
              error={wn.error}
              progress={wn.progress}
              progressStage={wn.progressStage}
              loadedPackages={wn.loadedPackages}
            />
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Load Packages</h3>
                <button
                  onClick={wn.refreshStatistics}
                  disabled={wn.loading}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  title="Refresh statistics"
                >
                  🔄
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => wn.loadDemoData()}
                  disabled={wn.loading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wn.loading ? 'Loading...' : 'Load Demo Data'}
                </button>
                <button
                  onClick={() => wn.loadPackageData('oewn:2024')}
                  disabled={wn.loading}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wn.loading ? 'Loading...' : 'Load English WordNet'}
                </button>
                <button
                  onClick={() => wn.loadPackageData('cili:1.0')}
                  disabled={wn.loading}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wn.loading ? 'Loading...' : 'Load CILI Index'}
                </button>
              </div>
              {wn.progress > 0 && wn.progress < 1 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${wn.progress * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{wn.progressStage}</p>
                </div>
              )}
            </div>
            
            <StatisticsWidget stats={wn.statistics} onRefresh={wn.refreshStatistics} />
            <OPFSWidget {...opfs} />
          </aside>

          <div className="lg:col-span-3">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">
              {activeTab === 'Basic' && <BasicDemo {...wn} />}
              {activeTab === 'Bilingual' && (
                <BilingualDictionary 
                  wordnet={(wn as any).wordnet}
                  dataLoader={(wn as any).dataLoader}
                  availablePackages={wn.availablePackages}
                  loadedPackages={wn.loadedPackages}
                  loadPackageData={wn.loadPackageData}
                  refreshPackages={wn.refreshPackages}
                  loading={wn.loading}
                />
              )}
              {activeTab === 'Advanced' && (
                <AdvancedDemo 
                  availablePackages={wn.availablePackages}
                  loadedPackages={wn.loadedPackages}
                  loadPackageData={wn.loadPackageData}
                />
              )}
              {activeTab === 'Developer' && (
                <DeveloperDemo 
                  // For now, only pass the props DeveloperDemo uses
                  unloadData={wn.unloadData as any}
                  getCacheInfo={wn.getCacheInfo as any}
                />
              )}
              {activeTab === 'Examples' && <ExamplesPage wordnetState={wn as any} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

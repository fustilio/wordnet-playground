import { useState } from 'react';
import '../index.css';

import { useWordNet, useOPFS, useSearch, useStatistics } from '../hooks';
import { Tabs } from '../components/shared';
import { StatusWidget, StatisticsWidget, OPFSWidget } from '../components/widgets';
import { BasicDemo, AdvancedDemo, DeveloperDemo, BilingualDictionary } from '../components/demos';
import { ExamplesPage } from '../examples/ExamplesPage';


function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wordnetState = useWordNet();
  const opfsState = useOPFS();
  const searchState = useSearch(wordnetState.wordnet);
  const { stats } = useStatistics(wordnetState.wordnet);

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
            <StatusWidget {...wordnetState} />
            
            {/* Manual Loading Controls */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Load Packages</h3>
              <div className="space-y-2">
                <button
                  onClick={() => wordnetState.loadDemoData()}
                  disabled={wordnetState.loading || !wordnetState.dataLoader}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordnetState.loading ? 'Loading...' : 'Load Demo Data'}
                </button>
                <button
                  onClick={() => wordnetState.loadPackageData('oewn:2024')}
                  disabled={wordnetState.loading || !wordnetState.dataLoader}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordnetState.loading ? 'Loading...' : 'Load English WordNet'}
                </button>
                <button
                  onClick={() => wordnetState.loadPackageData('cili:1.0')}
                  disabled={wordnetState.loading || !wordnetState.dataLoader}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordnetState.loading ? 'Loading...' : 'Load CILI Index'}
                </button>
              </div>
              {wordnetState.progress > 0 && wordnetState.progress < 1 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${wordnetState.progress * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{wordnetState.progressStage}</p>
                </div>
              )}
            </div>
            
            <StatisticsWidget stats={stats} />
            <OPFSWidget {...opfsState} />
          </aside>

          <div className="lg:col-span-3">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">
              {activeTab === 'Basic' && <BasicDemo {...wordnetState} {...searchState} />}
              {activeTab === 'Bilingual' && <BilingualDictionary {...wordnetState} />}
              {activeTab === 'Advanced' && <AdvancedDemo {...wordnetState} {...opfsState} />}
              {activeTab === 'Developer' && <DeveloperDemo {...wordnetState} {...opfsState} />}
              {activeTab === 'Examples' && <ExamplesPage wordnetState={wordnetState} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import './index.css';

import { useWordNet, useOPFS, useSearch, useStatistics } from './hooks';
import { Tabs } from './components/shared';
import { StatusWidget, StatisticsWidget, OPFSWidget, CacheWidget } from './components/widgets';
import { BasicDemo, AdvancedDemo, DeveloperDemo } from './components/demos';
import { ExamplesPage } from './examples/ExamplesPage';


function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wordnetState = useWordNet();
  const opfsState = useOPFS();
  const searchState = useSearch(wordnetState.wordnet);
  const { stats } = useStatistics(wordnetState.wordnet);

  const tabs = ['Basic', 'Advanced', 'Developer', 'Examples'];

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
            <StatisticsWidget stats={stats} />
            <OPFSWidget {...opfsState} />
            <CacheWidget />
          </aside>

          <div className="lg:col-span-3">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">
              {activeTab === 'Basic' && <BasicDemo {...wordnetState} {...searchState} />}
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

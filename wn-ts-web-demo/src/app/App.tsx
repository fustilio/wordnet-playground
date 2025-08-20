import { useState, useEffect } from 'react';
import { StatusWidget } from '../components/widgets/StatusWidget';
import { StatisticsWidget } from '../components/widgets/StatisticsWidget';
import { DataManager } from '../components/DataManager';
import { LexiconRequirementsWidget } from '../components/widgets/LexiconRequirementsWidget';
import { Tabs } from '../components/shared/Tabs';
import { BasicDemo, BilingualDictionary, AdvancedDemo, DeveloperDemo, 
  VisualizationDemo, LexiconIntrospectionDemo
 } from '../components/demos';
import { useWordNetContext } from 'wn-ts-web/react';
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('App');

function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wordNetState = useWordNetContext();

  // Debug logging
  useEffect(() => {
    logger.debug('WordNet state updated', { 
      loadedPackages: wordNetState.loadedPackages,
      statistics: wordNetState.statistics,
      loading: wordNetState.loading,
      error: wordNetState.error
    });
  }, [wordNetState]);

  const tabs = ['Basic', 'Bilingual', 'Data Catalog', 'Visualizations', 'Developer', 'Introspection'];

  const handleTabChange = (tab: string) => {
    logger.info('Tab changed', { from: activeTab, to: tab });
    setActiveTab(tab);
  };

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
              {...wordNetState}
            />
            <LexiconRequirementsWidget />
            <DataManager 
              onUnloadData={wordNetState.unloadData}
              onClearCacheAndUnload={wordNetState.clearCacheAndUnload}
              getCacheInfo={wordNetState.getCacheInfo}
              loading={wordNetState.loading}
              loadedPackage={wordNetState.loadedPackages.length > 0 ? wordNetState.loadedPackages[0] : null}
              loadedVersion={wordNetState.dataSource?.type}
            />
            <StatisticsWidget stats={wordNetState.statistics as any} onRefresh={() => wordNetState.refreshPackages()} />
          </aside>

          <div className="lg:col-span-3">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className="mt-6">
              {activeTab === 'Basic' && <BasicDemo />}
              {activeTab === 'Bilingual' && <BilingualDictionary />}
              {activeTab === 'Data Catalog' && <AdvancedDemo />}
              {activeTab === 'Visualizations' && <VisualizationDemo />}
              {activeTab === 'Developer' && <DeveloperDemo />}
              {activeTab === 'Introspection' && <LexiconIntrospectionDemo />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

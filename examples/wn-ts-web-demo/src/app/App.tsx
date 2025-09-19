import { useState, useEffect } from 'react';
import { StatusWidget } from '../components/widgets/StatusWidget';
import { StatisticsWidget } from '../components/widgets/StatisticsWidget';
import { DataManager } from '../components/DataManager';
import { LexiconRequirementsWidget } from '../components/widgets/LexiconRequirementsWidget';
import { Tabs } from '../components/shared/Tabs';
import { 
  BasicDemo, 
  AdvancedDemo, 
  DeveloperDemo, 
  VisualizationDemo, 
  LexiconIntrospectionDemo,
  TranslationShowcase,
  KernelDemo
} from '../examples/tabs';
import { useWordNetContext } from 'wn-ts-web/react';
import { createScopedLogger, setGlobalLogLevel } from '../../../packages/utils/logger';

const logger = createScopedLogger('App');

function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wordNetState = useWordNetContext();

  // Set log level to reduce noise - only show warnings and errors by default
  useEffect(() => {
    setGlobalLogLevel('warn');
  }, []);

  // Debug logging
  useEffect(() => {
    logger.debug('WordNet state updated', { 
      loadedPackages: wordNetState.loadedPackages,
      statistics: wordNetState.statistics,
      loading: wordNetState.loading,
      error: wordNetState.error
    });
  }, [wordNetState]);

  const tabs = [
    'Basic', 
    'Kernel Demo',
    'Translation Showcase',
    'Data Catalog', 
    'Visualizations', 
    'Developer', 
    'Introspection'
  ];

  const handleTabChange = (tab: string) => {
    logger.info('Tab changed', { from: activeTab, to: tab });
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">WordNet TypeScript Demo</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                An interactive demo for exploring the WordNet API in the browser using SQLite WASM and OPFS.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => wordNetState.refreshPackages()}
                disabled={wordNetState.loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Refresh available packages"
              >
                🔄 Refresh
              </button>
              <button
                onClick={async () => {
                  try {
                    await wordNetState.clearCacheAndUnload();
                    await wordNetState.refreshPackages();
                  } catch (error) {
                    console.error('Force reload failed:', error);
                  }
                }}
                disabled={wordNetState.loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Force reload all lexicons (clears cache and downloads fresh)"
              >
                🚀 Force Reload
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <StatusWidget 
              {...wordNetState as any}
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
              {activeTab === 'Kernel Demo' && <KernelDemo />}
              {activeTab === 'Translation Showcase' && <TranslationShowcase />}
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

import { useState, useEffect } from 'react';
import { StatusWidget } from '../components/widgets/StatusWidget';
import { StatisticsWidget } from '../components/widgets/StatisticsWidget';
import { OPFSWidget } from '../components/widgets/OPFSWidget';
import { Tabs } from '../components/shared/Tabs';
import { BasicDemo } from '../components/demos/BasicDemo';
import { BilingualDictionary } from '../components/demos/BilingualDictionary';
import { AdvancedDemo } from '../components/demos/AdvancedDemo';
import { DeveloperDemo } from '../components/demos/DeveloperDemo';
import { ExamplesPage } from '../examples/ExamplesPage';
import { useWordNetContext } from '../contexts/WordNetContext';
import { useOPFS } from '../hooks';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('App');

function App() {
  const [activeTab, setActiveTab] = useState('Basic');
  const wordNetState = useWordNetContext();
  const opfsState = useOPFS();

  // Debug logging
  useEffect(() => {
    logger.debug('WordNet state updated', { 
      loadedPackages: wordNetState.loadedPackages,
      statistics: wordNetState.statistics,
      loading: wordNetState.loading,
      error: wordNetState.error
    });
  }, [wordNetState]);

  const tabs = ['Basic', 'Bilingual', 'Advanced', 'Developer', 'Examples'];

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
              wordnet={wordNetState.wordnet}
              dataLoader={wordNetState.dataLoader}
              loading={wordNetState.loading}
              isInitializing={wordNetState.isInitializing}
              error={wordNetState.error}
              statistics={wordNetState.statistics}
              integrity={wordNetState.integrity}
              dataSource={wordNetState.dataSource}
              availablePackages={wordNetState.availablePackages}
              loadedPackages={wordNetState.loadedPackages}
              progress={wordNetState.progress}
              progressStage={wordNetState.progressStage}
              cacheInfo={wordNetState.cacheInfo}
            />
            
            {/* Manual Loading Controls */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Load Packages</h3>
                <button
                  onClick={() => {
                    logger.info('Refreshing packages');
                    wordNetState.refreshPackages();
                  }}
                  disabled={wordNetState.loading}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  title="Refresh packages"
                >
                  🔄
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    logger.info('Loading demo data');
                    wordNetState.loadDemoData();
                  }}
                  disabled={wordNetState.loading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordNetState.loading ? 'Loading...' : 'Load Demo Data'}
                </button>
                <button
                  onClick={() => {
                    logger.info('Loading English WordNet package', { packageId: 'oewn:2024' });
                    wordNetState.loadPackageData('oewn:2024');
                  }}
                  disabled={wordNetState.loading}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordNetState.loading ? 'Loading...' : 'Load English WordNet'}
                </button>
                <button
                  onClick={() => {
                    logger.info('Loading CILI Index package', { packageId: 'cili:1.0' });
                    wordNetState.loadPackageData('cili:1.0');
                  }}
                  disabled={wordNetState.loading}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wordNetState.loading ? 'Loading...' : 'Load CILI Index'}
                </button>
              </div>
              {wordNetState.progress > 0 && wordNetState.progress < 1 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${wordNetState.progress * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{wordNetState.progressStage}</p>
                </div>
              )}
            </div>
            
            <StatisticsWidget stats={wordNetState.statistics} onRefresh={() => wordNetState.refreshPackages()} />
            <OPFSWidget {...opfsState} />
          </aside>

          <div className="lg:col-span-3">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className="mt-6">
              {activeTab === 'Basic' && <BasicDemo />}
              {activeTab === 'Bilingual' && <BilingualDictionary />}
              {activeTab === 'Advanced' && <AdvancedDemo />}
              {activeTab === 'Developer' && <DeveloperDemo />}
              {activeTab === 'Examples' && <ExamplesPage />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

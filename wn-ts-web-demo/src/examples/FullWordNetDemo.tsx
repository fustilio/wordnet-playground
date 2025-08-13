import { useState } from 'react';
import { useWordNet } from '../hooks/useWordNet';
import { ProxyStatus } from '../components/ProxyStatus';

export function FullWordNetDemo() {
  const {
    wordnet,
    loading,
    error,
    statistics,
    integrity,
    availablePackages,
    loadedPackages,
    progress,
    progressStage,
    loadPackageData,
    loadDemoData,
    unloadData,
    clearCacheAndUnload,
    getCacheInfo
  } = useWordNet();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'words' | 'synsets'>('words');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    lemma?: string;
    partOfSpeech?: string;
    language?: string;
  }>>([]);
  const [cacheInfo, setCacheInfo] = useState<{
    size: number;
    entries: number;
  } | null>(null);

  const handleSearch = async (query: string) => {
    if (!wordnet || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      console.log(`🔍 Searching for: "${query}"`);
      const results = await wordnet.searchWords(query);
      console.log(`📊 Search results:`, results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleLoadPackage = async (packageId: string) => {
    try {
      await loadPackageData(packageId, (progress: number) => {
        console.log(`Loading progress: ${Math.round(progress * 100)}%`);
      });
    } catch (error) {
      console.error('Failed to load package:', error);
    }
  };

  const handleLoadDemo = async () => {
    try {
      await loadDemoData((progress: number) => {
        console.log(`Demo loading progress: ${Math.round(progress * 100)}%`);
      });
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  };

  const handleUnloadData = async () => {
    try {
      await unloadData();
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to unload data:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCacheAndUnload();
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleGetCacheInfo = async () => {
    try {
      const info = await getCacheInfo();
      setCacheInfo(info as { size: number; entries: number });
    } catch (error) {
      console.error('Failed to get cache info:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🌍 Full WordNet Symphony
        </h1>
        <p className="text-lg text-gray-600">
          Complete WordNet demonstration with real data loading, multilingual queries, and comprehensive features
        </p>
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📊 System Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">WordNet Status</div>
            <div className="text-2xl font-bold text-blue-900">
              {wordnet ? '✅ Active' : '❌ Inactive'}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Loaded Packages</div>
            <div className="text-2xl font-bold text-green-900">
              {loadedPackages.length}
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Available Packages</div>
            <div className="text-2xl font-bold text-purple-900">
              {availablePackages.length}
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-600">Loading Progress</div>
            <div className="text-2xl font-bold text-orange-900">
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{progressStage}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ Error: {error}</p>
          </div>
        )}
      </div>

      {/* CORS Proxy Status Section */}
      <ProxyStatus />

      {/* Data Loading Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📥 Data Management</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Available Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePackages.map((pkg) => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{pkg.label}</h4>
                      <p className="text-sm text-gray-600">
                        {pkg.language} • {pkg.version}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadPackage(`${pkg.id}:${pkg.version}`)}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadedPackages.includes(`${pkg.id}:${pkg.version}`) ? '✅ Loaded' : '📥 Load'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              🚀 Load Demo Data
            </button>
            
            <button
              onClick={handleUnloadData}
              disabled={loading || loadedPackages.length === 0}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              🗑️ Unload Data
            </button>
            
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              🧹 Clear Cache
            </button>
            
            <button
              onClick={handleGetCacheInfo}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📊 Cache Info
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">📈 Database Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{String(statistics?.totalWords || 0)}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{String(statistics?.totalSynsets || 0)}</div>
              <div className="text-sm text-gray-600">Synsets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{String(statistics?.totalSenses || 0)}</div>
              <div className="text-sm text-gray-600">Senses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{String(statistics?.totalILIs || 0)}</div>
              <div className="text-sm text-gray-600">ILIs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{String(statistics?.totalLexicons || 0)}</div>
              <div className="text-sm text-gray-600">Lexicons</div>
            </div>
          </div>

          {integrity && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">🔍 Data Quality Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(integrity as any)?.synsetsWithILI || 0}</div>
                  <div className="text-sm text-gray-600">With ILI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{(integrity as any)?.synsetsWithoutILI || 0}</div>
                  <div className="text-sm text-gray-600">Without ILI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{((integrity as any)?.iliCoveragePercentage || 0).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">ILI Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{(integrity as any)?.emptySynsets || 0}</div>
                  <div className="text-sm text-gray-600">Empty Synsets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{(integrity as any)?.synsetsWithDefinitions || 0}</div>
                  <div className="text-sm text-gray-600">With Definitions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">🔍 WordNet Search</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'words' | 'synsets')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="words">Words</option>
              <option value="synsets">Synsets</option>
            </select>
            
            <button
              onClick={() => handleSearch(searchTerm)}
              disabled={!searchTerm.trim() || !wordnet}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              🔍 Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Search Results ({searchResults.length})</h3>
              <div className="space-y-2">
                {searchResults.slice(0, 10).map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium">{result.lemma || result.id}</div>
                    {result.partOfSpeech && (
                      <div className="text-sm text-gray-600">Part of Speech: {result.partOfSpeech}</div>
                    )}
                    {result.language && (
                      <div className="text-sm text-gray-600">Language: {result.language}</div>
                    )}
                    {/* The original code had result.definitions, but the new type doesn't include it.
                        Assuming the intent was to remove it or that the type is incomplete.
                        For now, removing it as per the new type. */}
                  </div>
                ))}
                {searchResults.length > 10 && (
                  <div className="text-sm text-gray-500">
                    ... and {searchResults.length - 10} more results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Search Button */}
          <div className="mt-4">
            <button
              onClick={async () => {
                if (wordnet) {
                  console.log('🧪 Testing search with "water"...');
                  const results = await wordnet.searchWords('water');
                  console.log('🔍 Search results for "water":', results);
                  setSearchResults(results);
                  setSearchTerm('water');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🧪 Test Search "water"
            </button>
          </div>
        </div>
      </div>

      {/* Cache Information */}
      {cacheInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">💾 Cache Information</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(cacheInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

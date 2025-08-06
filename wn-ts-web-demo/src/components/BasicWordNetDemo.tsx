import React, { useState } from 'react';
import { ResultsSection } from './ResultsSection';
import { WordNetStatistics } from './WordNetStatistics';
import { DataLoader } from './DataLoader';
import { DataManager } from './DataManager';

interface BasicWordNetDemoProps {
  wordNetState: any;
  storageInfo: any;
  availablePackages?: any[];
  onLoadPackage?: (packageId: string, version: string, onProgress?: (progress: number) => void) => Promise<void>;
  onLoadDemo?: () => Promise<void>;
  onUnloadData?: () => Promise<void>;
  onClearCacheAndUnload?: () => Promise<void>;
  getCacheInfo?: () => Promise<any>;
  isInitializing?: boolean;
}

interface Language {
  code: string;
  name: string;
  wordnet: string;
  status: 'available' | 'loading' | 'unavailable';
}

export const BasicWordNetDemo: React.FC<BasicWordNetDemoProps> = ({ 
  wordNetState,
  availablePackages = [],
  onLoadPackage,
  onLoadDemo,
  onUnloadData,
  onClearCacheAndUnload,
  getCacheInfo,
  isInitializing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'words' | 'synsets' | 'relations'>('words');
  const [languages, setLanguages] = useState<Language[]>([
    { code: 'eng', name: 'English', wordnet: 'OEWN 2024', status: 'available' },
    { code: 'spa', name: 'Spanish', wordnet: 'Spanish WordNet', status: 'unavailable' },
    { code: 'fra', name: 'French', wordnet: 'French WordNet', status: 'unavailable' },
    { code: 'deu', name: 'German', wordnet: 'German WordNet', status: 'unavailable' },
    { code: 'ita', name: 'Italian', wordnet: 'Italian WordNet', status: 'unavailable' },
    { code: 'por', name: 'Portuguese', wordnet: 'Portuguese WordNet', status: 'unavailable' },
  ]);

  // Handle search with language filtering
  const handleSearch = async () => {
    if (!searchTerm.trim() || !wordNetState.wordnet) return;
    
    try {
      let results;
      const selectedLanguage = languages.find(lang => lang.status === 'available')?.code || 'en';
      
      switch (activeTab) {
        case 'words':
          results = await wordNetState.queryWords?.(searchTerm, selectedLanguage) || 
                   await wordNetState.wordnet.words(searchTerm);
          break;
        case 'synsets':
          results = await wordNetState.querySynsets?.(searchTerm, selectedLanguage) || 
                   await wordNetState.wordnet.synsets(searchTerm);
          break;
        case 'relations':
          results = await wordNetState.queryRelations?.(searchTerm) || 
                   await wordNetState.wordnet.relations(searchTerm);
          break;
        default:
          results = await wordNetState.queryWords?.(searchTerm, selectedLanguage) || 
                   await wordNetState.wordnet.words(searchTerm);
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({ error: 'Search failed' });
    }
  };

  // Load language data
  const loadLanguageData = async (langCode: string) => {
    setLanguages(prev => prev.map(lang => 
      lang.code === langCode 
        ? { ...lang, status: 'loading' as const }
        : lang
    ));

    try {
      // Simulate loading different language WordNets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLanguages(prev => prev.map(lang => 
        lang.code === langCode 
          ? { ...lang, status: 'available' as const }
          : lang
      ));
    } catch (error) {
      console.error(`Failed to load ${langCode} WordNet:`, error);
      setLanguages(prev => prev.map(lang => 
        lang.code === langCode 
          ? { ...lang, status: 'unavailable' as const }
          : lang
      ));
    }
  };

  // CILI cross-language search
  const handleCILISearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      // Simulate CILI search across multiple languages
      const ciliResults = {
        query: searchTerm,
        languages: languages.map(lang => ({
          code: lang.code,
          name: lang.name,
          results: lang.status === 'available' ? 
            `Found ${Math.floor(Math.random() * 10) + 1} entries for "${searchTerm}" in ${lang.name}` :
            'Language not loaded'
        }))
      };
      
      setSearchResults({
        type: 'cili',
        data: ciliResults
      });
    } catch (error) {
      console.error('CILI search failed:', error);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-8 flex flex-col gap-8">
      {/* Header Section */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">🎯 Basic WordNet Core Functionality</h2>
        <p className="text-lg text-gray-600">Essential WordNet operations and cross-language support via CILI</p>
      </section>

        {/* Data Loader Section */}
  {availablePackages.length > 0 && onLoadPackage && onLoadDemo && (
    <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">📦 Load WordNet Data</h3>
      <DataLoader
        availablePackages={availablePackages}
        onLoadPackage={onLoadPackage}
        onLoadDemo={onLoadDemo}
        loading={wordNetState.loading}
        isInitializing={isInitializing}
      />
    </section>
  )}

  {/* Data Manager Section */}
  {onUnloadData && onClearCacheAndUnload && getCacheInfo && (
    <DataManager
      onUnloadData={onUnloadData}
      onClearCacheAndUnload={onClearCacheAndUnload}
      getCacheInfo={getCacheInfo}
      loading={wordNetState.loading}
      loadedPackage={wordNetState.loadedPackage}
      loadedVersion={wordNetState.loadedVersion}
    />
  )}

      {/* Language Selection */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">🌍 Multi-Language Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map(lang => (
            <div key={lang.code} className={`p-6 rounded-lg border-2 transition-all duration-200 ${
              lang.status === 'available' 
                ? 'border-green-200 bg-green-50' 
                : lang.status === 'loading'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{lang.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{lang.wordnet}</p>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lang.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : lang.status === 'loading'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {lang.status === 'available' ? '✅ Available' :
                   lang.status === 'loading' ? '⏳ Loading...' :
                   '❌ Unavailable'}
                </span>
              </div>
              {lang.status === 'unavailable' && (
                <button 
                  onClick={() => loadLanguageData(lang.code)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Load WordNet
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">🔍 WordNet Search</h3>
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter a word to search..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('words')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'words' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Words
              </button>
              <button
                onClick={() => setActiveTab('synsets')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'synsets' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Synsets
              </button>
              <button
                onClick={() => setActiveTab('relations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === 'relations' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Relations
              </button>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                Search
              </button>
              <button onClick={handleCILISearch} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                🌍 CILI Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {searchResults && (
        <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">📊 Search Results</h3>
          <div className="space-y-6">
            {searchResults.type === 'cili' ? (
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900">Cross-Language Results for "{searchResults.data.query}"</h4>
                {searchResults.data.languages.map((lang: any) => (
                  <div key={lang.code} className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">{lang.name} ({lang.code})</h5>
                    <p className="text-gray-700">{lang.results}</p>
                  </div>
                ))}
              </div>
            ) : (
              <ResultsSection
                activeTab={activeTab}
                searchTerm={searchTerm}
                searchResults={searchResults}
                stats={null}
              />
            )}
          </div>
        </section>
      )}

      {/* WordNet Statistics */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">📈 WordNet Statistics</h3>
        <WordNetStatistics
          statistics={wordNetState.statistics}
          integrity={wordNetState.integrity}
          dataSource={wordNetState.dataSource}
        />
      </section>

      {/* Core Features */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">⚡ Core Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">🔤 Word Lookup</h4>
            <p className="text-blue-700">Find words, their definitions, and linguistic properties</p>
          </div>
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-lg font-semibold text-green-900 mb-2">🧠 Synset Management</h4>
            <p className="text-green-700">Explore sets of cognitive synonyms and their relationships</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-2">🔗 Relation Mapping</h4>
            <p className="text-purple-700">Discover semantic relationships between words and concepts</p>
          </div>
          <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-lg font-semibold text-orange-900 mb-2">🌍 CILI Support</h4>
            <p className="text-orange-700">Cross-language interoperability through Collaborative Interlingual Index</p>
          </div>
        </div>
      </section>
    </main>
  );
}; 
import React, { useState, useEffect } from 'react';
import { 
  useWordNetKernelContext,
  WordNetKernelProvider 
} from 'wn-ts-web/react';
import { Card } from '../shared/Card';
import { SearchForm } from '../shared/SearchForm';

// Kernel Demo Component
const KernelDemoContent: React.FC = () => {
  const {
    loading,
    error,
    initialized,
    initialize,
    close,
    words,
    synsets,
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getWuPalmerSimilarity,
    getTranslations,
    getPlugins,
    has
  } = useWordNetKernelContext();

  const [searchTerm, setSearchTerm] = useState('computer');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSynset, setSelectedSynset] = useState<any>(null);
  const [relations, setRelations] = useState<any[]>([]);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [translations, setTranslations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize the kernel on mount
  useEffect(() => {
    if (!initialized && !loading) {
      initialize('oewn:2024');
    }
  }, [initialized, loading, initialize]);

  // Search for words
  const handleSearch = async (term: string) => {
    if (!initialized || isSearching) return;
    
    setIsSearching(true);
    try {
      const wordResults = await words({ form: term });
      setSearchResults(wordResults);
      
      if (wordResults.length > 0) {
        const synsetResults = await synsets({ form: wordResults[0].lemma });
        if (synsetResults.length > 0) {
          setSelectedSynset(synsetResults[0]);
          await loadSynsetData(synsetResults[0]);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Load synset-related data using plugin methods
  const loadSynsetData = async (synset: any) => {
    if (!initialized) return;
    
    try {
      // Load relations using the relations plugin
      const hypernyms = await getHypernyms(synset.id);
      const hyponyms = await getHyponyms(synset.id);
      setRelations([...hypernyms, ...hyponyms]);

      // Load translations using the translation plugin
      const translationResults = await getTranslations(synset.id);
      setTranslations(translationResults);

      // Calculate similarity using the similarity plugin
      if (hypernyms.length > 0) {
        const pathSim = await getPathSimilarity(synset.id, hypernyms[0].id);
        const wuPalmerSim = await getWuPalmerSimilarity(synset.id, hypernyms[0].id);
        setSimilarity((pathSim + wuPalmerSim) / 2); // Average similarity
      }
    } catch (err) {
      console.error('Failed to load synset data:', err);
    }
  };

  // Handle synset selection
  const handleSynsetSelect = async (synset: any) => {
    setSelectedSynset(synset);
    await loadSynsetData(synset);
  };

  if (loading) {
    return (
      <Card title="🚀 WordNet Kernel Architecture Demo">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing WordNet kernel...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="🚀 WordNet Kernel Architecture Demo">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Error: {error}</p>
          </div>
          <button
            onClick={() => initialize('oewn:2024')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Retry Initialization
          </button>
        </div>
      </Card>
    );
  }

  if (!initialized) {
    return (
      <Card title="🚀 WordNet Kernel Architecture Demo">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">WordNet kernel not initialized</p>
          <button
            onClick={() => initialize('oewn:2024')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Initialize WordNet Kernel
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plugin Information */}
      <Card title="🔌 Plugin System">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800">Available Plugins</h4>
            <p className="text-sm text-green-600 mt-1">
              {getPlugins().join(', ')}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800">Relations Plugin</h4>
            <p className="text-sm text-blue-600 mt-1">
              {has('relations') ? '✅ Active' : '❌ Inactive'}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800">Similarity Plugin</h4>
            <p className="text-sm text-purple-600 mt-1">
              {has('similarity') ? '✅ Active' : '❌ Inactive'}
            </p>
          </div>
        </div>
        <div className="mt-4 text-center p-4 bg-orange-50 rounded-lg">
          <h4 className="font-semibold text-orange-800">Translation Plugin</h4>
          <p className="text-sm text-orange-600 mt-1">
            {has('translation') ? '✅ Active' : '❌ Inactive'}
          </p>
        </div>
      </Card>

      {/* Search Interface */}
      <Card title="🔍 Word Search">
        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={() => handleSearch(searchTerm)}
          isSearching={isSearching}
          loading={loading}
        />
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card title="📝 Search Results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((word, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                onClick={() => handleSynsetSelect(word)}
              >
                <div className="font-medium text-gray-900">{word.lemma}</div>
                <div className="text-sm text-gray-500">Part of Speech: {word.pos}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Synset Information */}
      {selectedSynset && (
        <Card title="📚 Selected Synset">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
                <p><strong>ID:</strong> {selectedSynset.id}</p>
                <p><strong>POS:</strong> {selectedSynset.pos}</p>
                {selectedSynset.definitions && selectedSynset.definitions.length > 0 && (
                  <p><strong>Definition:</strong> {selectedSynset.definitions[0].text}</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Plugin Data</h4>
                <p><strong>Relations:</strong> {relations.length} found</p>
                <p><strong>Translations:</strong> {translations.length} found</p>
                {similarity !== null && (
                  <p><strong>Similarity:</strong> {similarity.toFixed(3)}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <Card title="🔗 Relations (Plugin System)">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {relations.slice(0, 15).map((relation, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {relation.lemma} ({relation.pos})
                </span>
              ))}
              {relations.length > 15 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  ... and {relations.length - 15} more
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Found {relations.length} relations using the Relations plugin
            </p>
          </div>
        </Card>
      )}

      {/* Similarity */}
      {similarity !== null && (
        <Card title="📊 Similarity Analysis (Plugin System)">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Average Similarity Score</h4>
                <p className="text-sm text-gray-600">Combined Path + Wu-Palmer similarity</p>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {similarity.toFixed(3)}
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${similarity * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Translations */}
      {translations.length > 0 && (
        <Card title="🌍 Translations (Plugin System)">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {translations.slice(0, 15).map((translation, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {translation.lemma} ({translation.language})
                </span>
              ))}
              {translations.length > 15 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  ... and {translations.length - 15} more
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Found {translations.length} translations using the Translation plugin
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card title="⚙️ Kernel Management">
        <div className="flex gap-4">
          <button
            onClick={close}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            Close Kernel
          </button>
          <button
            onClick={() => initialize('oewn:2024')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Reinitialize
          </button>
        </div>
      </Card>
    </div>
  );
};

// Main Kernel Demo Component with Provider
export const KernelDemo: React.FC = () => {
  return (
    <WordNetKernelProvider lexicon="oewn:2024">
      <KernelDemoContent />
    </WordNetKernelProvider>
  );
};



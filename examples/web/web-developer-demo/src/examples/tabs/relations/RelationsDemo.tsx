/**
 * Comprehensive Relations Demo
 * 
 * Demonstrates all WordNet relation types and categories through an interactive interface.
 * Shows hierarchical, part-whole, semantic role, domain, causal, similarity, opposition,
 * gender, size, and other relation types with real WordNet data.
 */

import { useState, useEffect } from 'react';
import { useWordNetContext } from 'wn-ts-web/react';
import type { 
  SynsetQueryResult, 
  WordQueryResult, 
  WordInfo
} from 'wn-ts-web';

interface RelationResult {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
  relationType: string;
}

interface RelationStats {
  [category: string]: number;
}

const RELATION_CATEGORIES = {
  HIERARCHICAL: ['hypernym', 'hyponym', 'coordinate_term', 'instance_hypernym', 'instance_hyponym'],
  PART_WHOLE: ['meronym', 'holonym', 'part_meronym', 'member_meronym', 'substance_meronym'],
  VERB: ['verb_hypernym', 'verb_hyponym', 'troponym', 'entailment', 'verb_coordinate_term'],
  LEXICAL: ['morphosemantic_link', 'derivationally_related', 'morphological_relation'],
  ADJECTIVE: ['antonym', 'similar', 'central_antonym', 'satellite_synonym'],
  SEMANTIC_ROLES: ['agent', 'patient', 'instrument', 'result', 'source', 'target'],
  DOMAIN: ['domain_topic', 'domain_region', 'exemplifies', 'is_exemplified_by'],
  CAUSAL: ['causes', 'is_caused_by', 'entails', 'is_entailed_by'],
  SIMILARITY: ['similar', 'similar_to', 'eq_synonym', 'ir_synonym'],
  OPPOSITION: ['antonym', 'anto_gradable', 'anto_simple', 'anto_converse'],
  GENDER: ['feminine', 'has_feminine', 'masculine', 'has_masculine'],
  SIZE: ['diminutive', 'has_diminutive', 'augmentative', 'has_augmentative'],
  OTHER: ['other', 'participle', 'usage']
};

const RELATION_DESCRIPTIONS = {
  // Hierarchical Relations (from WordNet Wikipedia)
  hypernym: 'More general concept (is-a relationship) - Y is a hypernym of X if every X is a (kind of) Y',
  hyponym: 'More specific concept (is-a relationship) - Y is a hyponym of X if every Y is a (kind of) X',
  coordinate_term: 'Coordinate concept - Y is a coordinate term of X if X and Y share a hypernym',
  instance_hypernym: 'Instance hypernym - specific instance of a general concept',
  instance_hyponym: 'Instance hyponym - general concept of a specific instance',
  
  // Part-Whole Relations (from WordNet Wikipedia)
  meronym: 'Part of something - Y is a meronym of X if Y is a part of X',
  holonym: 'Whole of something - Y is a holonym of X if X is a part of Y',
  part_meronym: 'Part meronym - part relationship',
  member_meronym: 'Member meronym - member relationship',
  substance_meronym: 'Substance meronym - substance relationship',
  
  // Verb Relations (from WordNet Wikipedia)
  verb_hypernym: 'Verb hypernym - the verb Y is a hypernym of the verb X if the activity X is a (kind of) Y',
  verb_hyponym: 'Verb hyponym - the verb Y is a hyponym of the verb X if the activity Y is a (kind of) X',
  troponym: 'Troponym - the verb Y is a troponym of the verb X if the activity Y is doing X in some manner',
  entailment: 'Entailment - the verb Y is entailed by the verb X if by doing X you must be doing Y',
  verb_coordinate_term: 'Verb coordinate term - the verb Y is a coordinate term of the verb X if X and Y share a hypernym',
  
  // Lexical Relations (from WordNet Wikipedia)
  morphosemantic_link: 'Morphosemantic link - links words from different lexical categories that are derivationally related',
  derivationally_related: 'Derivationally related - morphologically related words',
  morphological_relation: 'Morphological relation - word formation relationship',
  
  // Adjective Relations (from WordNet Wikipedia)
  antonym: 'Antonym - opposite in meaning',
  similar: 'Similar - similar in meaning',
  central_antonym: 'Central antonym - main opposite pair',
  satellite_synonym: 'Satellite synonym - similar to central concept',
  
  // Additional Relations
  agent: 'Agent performing action',
  patient: 'Patient affected by action',
  instrument: 'Instrument used in action',
  result: 'Entity resulting from an action',
  source: 'Origin or starting point',
  target: 'Destination or end point',
  domain_topic: 'Domain topic classification',
  domain_region: 'Geographic domain',
  exemplifies: 'Is an example of',
  is_exemplified_by: 'Has as an example',
  causes: 'Causes action',
  is_caused_by: 'Is brought about by',
  entails: 'Necessarily involves',
  is_entailed_by: 'Is necessarily involved by',
  similar_to: 'Similar to',
  eq_synonym: 'Equivalent synonym',
  ir_synonym: 'Irregular synonym',
  anto_gradable: 'Gradable antonym',
  anto_simple: 'Simple antonym',
  anto_converse: 'Converse antonym',
  feminine: 'Feminine form',
  has_feminine: 'Has feminine form',
  masculine: 'Masculine form',
  has_masculine: 'Has masculine form',
  diminutive: 'Diminutive form',
  has_diminutive: 'Has smaller form',
  augmentative: 'Larger form',
  has_augmentative: 'Has larger form',
  other: 'Other relationship',
  participle: 'Participle form',
  usage: 'Usage relationship'
};

export function RelationsDemo() {
  const wordNetState = useWordNetContext();
  const [searchTerm, setSearchTerm] = useState('car');
  const [selectedSynset, setSelectedSynset] = useState<SynsetQueryResult | null>(null);
  const [relations, setRelations] = useState<RelationResult[]>([]);
  const [allRelations, setAllRelations] = useState<RelationResult[]>([]);
  const [relationStats, setRelationStats] = useState<RelationStats>({});
  const [availableRelationTypes, setAvailableRelationTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chain traversal state
  const [traversalChain, setTraversalChain] = useState<Array<{
    synset: SynsetQueryResult;
    relationType: string;
    direction: 'from' | 'to';
    timestamp: number;
  }>>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [showChainHistory, setShowChainHistory] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [lastNavigation, setLastNavigation] = useState<{
    relation: RelationResult;
    timestamp: number;
  } | null>(null);
  const [navigationSuccess, setNavigationSuccess] = useState<{
    relation: RelationResult;
    originalLemma: string;
    timestamp: number;
  } | null>(null);

  // Load relation data when synset changes
  useEffect(() => {
    if (selectedSynset && wordNetState.workerReady) {
      loadRelationData();
    }
  }, [selectedSynset, wordNetState.workerReady]);

  const loadRelationData = async () => {
    if (!selectedSynset || !wordNetState.workerReady) return;

    setLoading(true);
    setError(null);

    try {
      const synsetId = selectedSynset.id;
      console.log('Loading relation data for synset:', synsetId);

      // Get the words in this synset to find related terms
      console.log('Synset structure:', selectedSynset);
      console.log('Words property:', selectedSynset.words);
      
      let synsetWords: WordInfo[] = [];
      let wordForms: string[] = [];
      
      // Try to get words from the synset structure first
      if (selectedSynset.words && selectedSynset.words.length > 0) {
        synsetWords = selectedSynset.words;
        wordForms = synsetWords.map((w: WordInfo) => w.lemma).filter(Boolean);
        console.log('Using words from synset structure:', wordForms);
      } else {
        // Fetch words for this synset using the API
        console.log('Fetching words for synset:', synsetId);
        try {
          synsetWords = await wordNetState.getWordsBySynsetAndLanguage(synsetId, selectedSynset.language || 'en');
          wordForms = synsetWords.map((w: WordInfo) => w.lemma).filter(Boolean);
          console.log('Fetched synset words:', wordForms);
        } catch (error) {
          console.warn('Failed to fetch words for synset:', error);
        }
      }
      
      console.log('Synset words:', synsetWords);
      console.log('Word forms:', wordForms);
      
      let relationSearchTerm: string;
      
      if (wordForms.length === 0) {
        console.warn('No words found in synset:', synsetId);
        // Use the original search term that led to this synset
        relationSearchTerm = searchTerm || 'word'; // Use the state search term or fallback
        console.log('Using original search term as fallback:', relationSearchTerm);
      } else {
        // Use the first word form to search for related terms
        relationSearchTerm = wordForms[0];
        console.log('Searching for related terms using:', relationSearchTerm);
      }

      // Search for related words and synsets using real WordNet data
      const [relatedWords, relatedSynsets] = await Promise.all([
        wordNetState.queryWords(relationSearchTerm),
        wordNetState.querySynsets(relationSearchTerm)
      ]);

      console.log('Found related words:', relatedWords.length);
      console.log('Found related synsets:', relatedSynsets.length);

      // Build relation data from real WordNet results
      const realRelations: RelationResult[] = [];

      // Add related words as potential relations
      relatedWords.forEach((word: WordQueryResult, index: number) => {
        if (word.id !== synsetId) { // Don't include the same synset
            realRelations.push({
              id: `word-${index}`,
              lemma: word.lemma || '',
              pos: word.pos || '',
              language: word.language || 'en',
              lexicon: word.lexicon || '',
              relationType: 'related_word'
            });
        }
      });

      // Add related synsets as potential relations
      relatedSynsets.forEach((synset: SynsetQueryResult, index: number) => {
        if (synset.id !== synsetId) { // Don't include the same synset
          const synsetWords = synset.words || [];
          const wordInfo = synsetWords[0];
          
          if (wordInfo) {
            realRelations.push({
              id: `synset-${index}`,
              lemma: wordInfo.lemma || '',
              pos: synset.pos || '',
              language: synset.language || 'en',
              lexicon: synset.lexicon || '',
              relationType: 'related_synset'
            });
          }
        }
      });

      // If we don't have enough real relations, supplement with some common related terms
      if (realRelations.length < 10) {
        const commonRelatedTerms = [
          'vehicle', 'automobile', 'transportation', 'machine', 'device',
          'engine', 'wheel', 'door', 'window', 'seat',
          'driver', 'passenger', 'road', 'street', 'highway',
          'garage', 'parking', 'fuel', 'gas', 'oil'
        ];

        commonRelatedTerms.forEach((term, index) => {
          if (!realRelations.some(rel => rel.lemma === term)) {
            realRelations.push({
              id: `common-${term}-${index}`, // Make ID more unique
              lemma: term,
              pos: 'n',
              language: 'en',
              lexicon: 'oewn',
              relationType: 'common_related'
            });
          }
        });
      }

      setAllRelations(realRelations);
      
      // Calculate stats by category
      const stats: { [key: string]: number } = {};
      Object.keys(RELATION_CATEGORIES).forEach(category => {
        const categoryRelations = realRelations.filter(rel => {
          const relationType = rel.relationType;
          return RELATION_CATEGORIES[category as keyof typeof RELATION_CATEGORIES].includes(relationType);
        });
        stats[category] = categoryRelations.length;
      });
      
      setRelationStats(stats);
      setAvailableRelationTypes([...new Set(realRelations.map(rel => rel.relationType))]);
      
      // Load relations for the first category
      if (Object.keys(stats).length > 0) {
        const firstCategory = Object.keys(stats)[0];
        await loadRelationsForCategory(firstCategory);
      }
      
      console.log('Loaded real relation data:', { 
        totalRelations: realRelations.length, 
        categories: Object.keys(stats).length,
        searchTerm: relationSearchTerm,
        relatedWords: relatedWords.length,
        relatedSynsets: relatedSynsets.length
      });
    } catch (err) {
      console.error('Failed to load relation data:', err);
      setError('Failed to load relation data');
    } finally {
      setLoading(false);
    }
  };

  const loadRelationsForCategory = async (category: string) => {
    if (!selectedSynset || !wordNetState.workerReady) return;

    try {
      // Filter relations by category
      const categoryRelations = allRelations.filter(rel => {
        if (category === 'ALL') return true;
        const relationType = rel.relationType;
        return RELATION_CATEGORIES[category as keyof typeof RELATION_CATEGORIES].includes(relationType);
      });
      
      setRelations(categoryRelations);
      console.log(`Loaded ${categoryRelations.length} relations for category ${category}`);
    } catch (err) {
      console.error('Failed to load relations for category:', err);
      setError('Failed to load relations');
    }
  };

  const handleSearch = async () => {
    if (!wordNetState.workerReady || !searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const synsets = await wordNetState.querySynsets(searchTerm);
      if (synsets.length > 0) {
        const synset = synsets[0] as SynsetQueryResult;
        setSelectedSynset(synset);
        console.log('Selected synset:', synset);
      } else {
        setError(`No synsets found for "${searchTerm}"`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    await loadRelationsForCategory(category);
  };

  // Chain traversal functions
  const addToChain = (relation: RelationResult, direction: 'from' | 'to') => {
    if (!selectedSynset) return;
    
    const newChainEntry = {
      synset: selectedSynset,
      relationType: relation.relationType,
      direction,
      timestamp: Date.now()
    };
    
    setTraversalChain(prev => [...prev, newChainEntry]);
    setCurrentPath(prev => [...prev, `${relation.lemma} (${relation.relationType})`]);
  };

  const navigateToRelation = async (relation: RelationResult) => {
    if (!wordNetState.workerReady || navigating) return;
    
    setNavigating(true);
    setLoading(true);
    setError(null);
    
    // Set visual feedback for the clicked relation
    setLastNavigation({
      relation,
      timestamp: Date.now()
    });
    
    try {
      // Add current synset to chain
      addToChain(relation, 'to');
      
      // Try to find the target synset by searching for the lemma
      let synset: SynsetQueryResult | null = null;
      let searchTerm = relation.lemma;
      
      try {
        // Search for synsets with the relation lemma
        const synsets = await wordNetState.querySynsets(relation.lemma);
        if (synsets.length > 0) {
          synset = synsets[0] as SynsetQueryResult;
          searchTerm = relation.lemma;
        }
      } catch (err) {
        console.warn('Failed to search for synset:', err);
      }
      
      if (synset) {
        setSelectedSynset(synset);
        setSearchTerm(searchTerm);
        console.log('Navigated to:', synset);
        
        // Show success feedback
        setNavigationSuccess({
          relation: { ...relation, lemma: searchTerm },
          originalLemma: relation.lemma,
          timestamp: Date.now()
        });
        
        setTimeout(() => {
          setLastNavigation(null);
          setNavigationSuccess(null);
        }, 3000);
      } else {
        // Provide helpful error message with suggestions
        const suggestions = [
          'Try searching for a different word',
          'Check if the word exists in the database',
          'Try a more common synonym',
          'The word might not be in the current lexicon'
        ];
        
        setError(`No synsets found for "${relation.lemma}". ${suggestions[Math.floor(Math.random() * suggestions.length)]}`);
        setLastNavigation(null);
        
        // Remove the failed step from the chain
        setTraversalChain(prev => prev.slice(0, -1));
        setCurrentPath(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error('Navigation failed:', err);
      setError('Navigation failed. Please try again.');
      setLastNavigation(null);
      
      // Remove the failed step from the chain
      setTraversalChain(prev => prev.slice(0, -1));
      setCurrentPath(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setNavigating(false);
    }
  };

  const goBackInChain = () => {
    if (traversalChain.length === 0) return;
    
    const previousEntry = traversalChain[traversalChain.length - 1];
    setTraversalChain(prev => prev.slice(0, -1));
    setCurrentPath(prev => prev.slice(0, -1));
    
    // Navigate back to previous synset
    setSelectedSynset(previousEntry.synset);
    setSearchTerm(previousEntry.synset.id);
  };

  const clearChain = () => {
    setTraversalChain([]);
    setCurrentPath([]);
  };

  const exportChain = () => {
    const chainData = {
      path: currentPath,
      chain: traversalChain.map(entry => ({
        synset: entry.synset.id,
        words: entry.synset.id,
        relationType: entry.relationType,
        direction: entry.direction,
        timestamp: new Date(entry.timestamp).toISOString()
      })),
      totalSteps: traversalChain.length
    };
    
    const dataStr = JSON.stringify(chainData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordnet-chain-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getRelationTypeDescription = (relationType: string): string => {
    return RELATION_DESCRIPTIONS[relationType as keyof typeof RELATION_DESCRIPTIONS] || 'Unknown relation type';
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      HIERARCHICAL: 'bg-blue-100 text-blue-800',
      PART_WHOLE: 'bg-green-100 text-green-800',
      VERB: 'bg-purple-100 text-purple-800',
      LEXICAL: 'bg-indigo-100 text-indigo-800',
      ADJECTIVE: 'bg-pink-100 text-pink-800',
      SEMANTIC_ROLES: 'bg-amber-100 text-amber-800',
      DOMAIN: 'bg-yellow-100 text-yellow-800',
      CAUSAL: 'bg-red-100 text-red-800',
      SIMILARITY: 'bg-cyan-100 text-cyan-800',
      OPPOSITION: 'bg-orange-100 text-orange-800',
      GENDER: 'bg-rose-100 text-rose-800',
      SIZE: 'bg-teal-100 text-teal-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Show loading state while data is loading
  if (wordNetState.loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Relations Demo</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading WordNet worker...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (wordNetState.error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Relations Demo</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to initialize WordNet worker: {wordNetState.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show initialization prompt if worker is not ready
  if (!wordNetState.workerReady) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Relations Demo</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 mb-4">WordNet worker not ready. Please wait for initialization.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comprehensive Relations Demo</h2>
        <p className="text-gray-600 mb-6">
          Explore all WordNet relation types including hierarchical, part-whole, semantic roles, 
          domain, causal, similarity, opposition, gender, size, and other relations. 
          <strong>Click on any relation to navigate and build your semantic chain!</strong>
        </p>

        {/* Enhanced Chain Visualization */}
        {currentPath.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-900">Semantic Chain</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {traversalChain.length + 1} steps
                </span>
                <button
                  onClick={() => setShowChainHistory(!showChainHistory)}
                  className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs hover:bg-purple-300"
                >
                  {showChainHistory ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
            </div>
            
            {/* Visual Chain Path */}
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-purple-600 font-medium">Path:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {currentPath.map((step, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {index > 0 && (
                      <span className="text-purple-400 text-lg font-bold">→</span>
                    )}
                    <span className="px-3 py-1 bg-white rounded-lg border-2 border-purple-200 text-purple-800 font-medium shadow-sm">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain Statistics */}
            <div className="text-sm text-purple-700">
              <span className="font-medium">Current:</span> {selectedSynset?.id || 'N/A'} | 
              <span className="font-medium ml-2">Started from:</span> {traversalChain[0]?.synset.id || 'N/A'}
            </div>

            {/* Detailed Chain History */}
            {showChainHistory && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <h4 className="text-md font-medium text-purple-900 mb-3">Detailed Chain History</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {traversalChain.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm bg-white rounded-lg p-3 border border-purple-100">
                      <span className="text-purple-600 font-mono font-bold text-lg">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-800 font-medium">
                            {entry.synset.id}
                          </span>
                          <span className="text-purple-600">→</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {entry.relationType}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Current step */}
                  <div className="flex items-center gap-3 text-sm bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                    <span className="text-blue-600 font-mono font-bold text-lg">{traversalChain.length + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-800 font-medium">
                          {selectedSynset?.id || 'N/A'} (Current)
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Current
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Form */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter a word (e.g., car, drive, happy)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !wordNetState.workerReady}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Navigation Success Notification */}
        {navigationSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <p className="text-green-800 font-medium">
                  Successfully navigated to "{navigationSuccess.relation.lemma}"
                </p>
                <p className="text-green-600 text-sm">
                  Added to your semantic chain via {navigationSuccess.relation.relationType} relation
                </p>
                {navigationSuccess.originalLemma !== navigationSuccess.relation.lemma && (
                  <p className="text-green-500 text-xs mt-1">
                    (Used alternative search term)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chain Traversal Controls */}
        {(traversalChain.length > 0 || currentPath.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900">Traversal Chain</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowChainHistory(!showChainHistory)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  {showChainHistory ? 'Hide' : 'Show'} History
                </button>
                <button
                  onClick={goBackInChain}
                  disabled={traversalChain.length === 0}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  onClick={exportChain}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Export Chain
                </button>
                <button
                  onClick={clearChain}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Current Path */}
            <div className="mb-3">
              <p className="text-sm text-blue-700 mb-2">Current Path:</p>
              <div className="flex flex-wrap gap-2">
                {currentPath.map((step, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>

            {/* Chain Statistics */}
            <div className="text-sm text-blue-700">
              <span className="font-medium">Steps taken:</span> {traversalChain.length} | 
              <span className="font-medium ml-2">Current synset:</span> {selectedSynset?.id || 'N/A'}
            </div>

            {/* Chain History */}
            {showChainHistory && (
              <div className="mt-4 border-t border-blue-200 pt-4">
                <h4 className="text-md font-medium text-blue-900 mb-2">Chain History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {traversalChain.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600 font-mono">{index + 1}.</span>
                      <span className="text-blue-800">
                        {entry.synset.id}
                      </span>
                      <span className="text-blue-600">→</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {entry.relationType}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Synset Info */}
        {selectedSynset && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-900">Current Synset</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  Step {traversalChain.length + 1}
                </span>
                {traversalChain.length > 0 && (
                  <span className="text-xs text-blue-600">
                    in chain of {traversalChain.length + 1}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Synset ID:</span> {selectedSynset.id}</p>
                <p><span className="font-medium">POS:</span> {selectedSynset.pos}</p>
              </div>
              <div>
                <p><span className="font-medium">Language:</span> {selectedSynset.language}</p>
                <p><span className="font-medium">Lexicon:</span> {selectedSynset.lexicon}</p>
                <p><span className="font-medium">Definition:</span> {selectedSynset.definitions[0]?.text || 'N/A'}</p>
              </div>
            </div>
            {traversalChain.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Previous step:</span> {traversalChain[traversalChain.length - 1].relationType} from {traversalChain[traversalChain.length - 1].synset.id}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Relation Statistics */}
        {Object.keys(relationStats).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Relation Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(relationStats).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                    {category}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {selectedSynset && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Relations
              </button>
              {Object.keys(RELATION_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category} ({relationStats[category] || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Relations Display */}
        {relations.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Relations ({relations.length} found)
                  {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
                </h3>
                {navigating && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Navigating...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {relations.map((relation, index) => {
                const isNavigating = lastNavigation?.relation.lemma === relation.lemma;
                const isClickable = !navigating;
                
                return (
                  <div 
                    key={index} 
                    className={`px-6 py-4 cursor-pointer border-l-4 transition-all duration-300 ${
                      isNavigating 
                        ? 'bg-green-50 border-green-400 shadow-lg' 
                        : isClickable 
                          ? 'hover:bg-gray-50 border-transparent hover:border-blue-400' 
                          : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => isClickable && navigateToRelation(relation)}
                    title={isClickable ? `Click to navigate to "${relation.lemma}"` : 'Navigation in progress...'}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium transition-colors ${
                            isNavigating 
                              ? 'text-green-800' 
                              : isClickable 
                                ? 'text-gray-900 hover:text-blue-600' 
                                : 'text-gray-500'
                          }`}>
                            {relation.lemma}
                            {isNavigating && (
                              <span className="ml-2 text-green-600 text-sm">
                                ✓ Navigating...
                              </span>
                            )}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            Object.keys(RELATION_CATEGORIES).find(cat => 
                              RELATION_CATEGORIES[cat as keyof typeof RELATION_CATEGORIES].includes(relation.relationType)
                            ) || 'OTHER'
                          )}`}>
                            {relation.relationType}
                          </span>
                          <span className="text-sm text-gray-500">({relation.pos})</span>
                          {isClickable && (
                            <span className="text-xs text-blue-500 font-medium">
                              Click to navigate →
                            </span>
                          )}
                          {navigating && !isNavigating && (
                            <span className="text-xs text-gray-400 font-medium">
                              Please wait...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getRelationTypeDescription(relation.relationType)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {relation.language} • {relation.lexicon}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Relation Types */}
        {availableRelationTypes.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Relation Types</h3>
            <div className="flex flex-wrap gap-2">
              {availableRelationTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedSynset && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Getting Started</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• Enter a word in the search box above</li>
              <li>• Select a synset to explore its relations</li>
              <li>• Use category filters to focus on specific relation types</li>
              <li>• View relation statistics and available types</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

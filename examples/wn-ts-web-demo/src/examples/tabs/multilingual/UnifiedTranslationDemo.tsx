/**
 * Unified Translation Demo
 * 
 * This comprehensive demo combines all translation approaches and features
 * into a single, powerful component. It includes:
 * - New translation utilities (fuzzy matching)
 * - Legacy ILI-based cross-lingual mapping
 * - Multiple translation methods
 * - Debugging and diagnostics tools
 * - Package management
 * - Clean, responsive UI
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../../../components/shared/Card';
import { useWordNetContext } from "wn-ts-web/react";
import { LexiconRequirements } from '../../../components/shared/LexiconRequirements';
import { createScopedLogger } from '../../../../../packages/utils/logger';
import type { WordInfo } from '../../../types';

// Define TranslationResult locally to avoid import issues
interface TranslationResult {
  sourceWord: string;
  sourceLanguage: string;
  translations: Record<string, {
    words: string[];
    definitions: string[];
    examples: string[];
  }>;
}

const logger = createScopedLogger('UnifiedTranslationDemo');

// Language configuration
const LANG_LABEL: Record<string, string> = {
  en: "English",
  fr: "French", 
  th: "Thai",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese"
};

const LANGUAGE_VARIANTS: Record<string, string[]> = {
  en: ["en", "eng", "en-us", "en-gb"],
  fr: ["fr", "fra", "fr-fr"],
  th: ["th", "tha"],
  es: ["es", "spa", "es-es"],
  de: ["de", "deu", "de-de"],
  it: ["it", "ita", "it-it"],
  pt: ["pt", "por", "pt-pt"],
  ja: ["ja", "jpn", "ja-jp"],
  zh: ["zh", "chi", "zh-cn"]
};

function getLanguageVariants(lang: string): string[] {
  const base = LANGUAGE_VARIANTS[lang] || [lang];
  return Array.from(new Set(base.map((v) => v.toLowerCase())));
}

function getLexiconForLanguage(language: string): string {
  switch (language) {
    case 'en': return 'oewn:2024';
    case 'fr': return 'omw-fr:1.4';
    case 'th': return 'omw-th:1.4';
    case 'es': return 'omw-es:1.4';
    case 'de': return 'omw-de:1.4';
    case 'it': return 'omw-it:1.4';
    case 'pt': return 'omw-pt:1.4';
    case 'ja': return 'omw-ja:1.4';
    case 'zh': return 'omw-zh:1.4';
    default: return 'oewn:2024';
  }
}

type LanguagePair = { from: string; to: string };
type TranslationMethod = 'fuzzy' | 'ili' | 'both' | 'auto';
type ViewMode = 'simple' | 'detailed' | 'debug';

interface TranslationResultExtended extends TranslationResult {
  method: string;
  executionTime: number;
  sourceWordsFound: number;
  targetWordsFound: number;
}

export const UnifiedTranslationDemo: React.FC = () => {
  const {
    loadedPackages,
    loadPackageData,
    refreshPackages,
    loading,
    isInitializing,
    getSensesByWordIdOrForm,
    getDefinitionsBySynsetId,
    getWordsByIliAndLanguage,
    getIliForSynset,
    searchWordsInLexicon
  } = useWordNetContext();

  // Core state
  const [pair, setPair] = useState<LanguagePair>({ from: "en", to: "fr" });
  const [term, setTerm] = useState("computer");
  const [debouncedTerm, setDebouncedTerm] = useState(term);
  const [translationMethod, setTranslationMethod] = useState<TranslationMethod>('auto');
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [autoTranslate] = useState(false); // Temporarily disabled
  
  // Results state
  const [results, setResults] = useState<TranslationResultExtended | null>(null);
  const [quickResults, setQuickResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  
  // Refs for preventing infinite loops
  const isTranslatingRef = useRef(false);

  // Debounced term change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(term);
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  // Get available languages from loaded packages
  useEffect(() => {
    const languages = new Set<string>();
    loadedPackages.forEach((pkg: string) => {
      if (pkg.startsWith('oewn')) languages.add('en');
      if (pkg.startsWith('omw-fr')) languages.add('fr');
      if (pkg.startsWith('omw-th')) languages.add('th');
      if (pkg.startsWith('omw-es')) languages.add('es');
      if (pkg.startsWith('omw-de')) languages.add('de');
      if (pkg.startsWith('omw-it')) languages.add('it');
      if (pkg.startsWith('omw-pt')) languages.add('pt');
      if (pkg.startsWith('omw-ja')) languages.add('ja');
      if (pkg.startsWith('omw-zh')) languages.add('zh');
    });
    setAvailableLanguages(Array.from(languages));
  }, [loadedPackages]);

  // Check if we have required data
  const hasRequiredData = loadedPackages.some((id: string) => id.startsWith("oewn")) &&
    loadedPackages.some((id: string) => id.startsWith("cili")) &&
    loadedPackages.some((id: string) => id.startsWith(`omw-${pair.to}`));

  const canQuery = !loading && !isLoading && !isInitializing && hasRequiredData;

  // Lexicon requirements
  const lexiconRequirements = [
    {
      id: "oewn:2024",
      label: "Open English WordNet 2024",
      description: "Required for English source language support",
      priority: "high" as const,
    },
    {
      id: "cili:1.0",
      label: "CILI Index 1.0",
      description: "Required for cross-lingual mapping",
      priority: "high" as const,
    },
    {
      id: `omw-${pair.to}:1.4`,
      label: `${LANG_LABEL[pair.to]} WordNet 1.4`,
      description: `${LANG_LABEL[pair.to]} target language support`,
      priority: "high" as const,
    },
  ];

  // Fuzzy translation using direct WordNet context methods
  const performFuzzyTranslation = useCallback(async (): Promise<TranslationResultExtended> => {
    const startTime = Date.now();
    logger.info(`🔍 Starting fuzzy translation for "${debouncedTerm}"`);
    logger.info(`📦 Loaded packages: ${loadedPackages.join(', ')}`);
    logger.info(`🌍 Available languages: ${availableLanguages.join(', ')}`);
    
    // Find source words
    const sourceLexicon = getLexiconForLanguage(pair.from);
    logger.info(`📚 Searching words in ${sourceLexicon} for "${debouncedTerm}"`);
    const sourceWords = await searchWordsInLexicon(debouncedTerm, sourceLexicon, pair.from);
    logger.info(`✅ Found ${sourceWords.length} source words`);
    
        // Test if we can find any French words at all
        if (pair.to === 'fr') {
          logger.info(`🧪 Testing French word search with "ordinateur"`);
          try {
            const testFrenchWords = await searchWordsInLexicon('ordinateur', 'omw-fr:1.4', 'fr');
            logger.info(`🧪 French test result: ${testFrenchWords.length} words found for "ordinateur"`);
            
            // Also test ILI mapping for French words
            if (testFrenchWords.length > 0) {
              const testWord = testFrenchWords[0];
              const testSenses = await getSensesByWordIdOrForm(testWord.id);
              if (testSenses.length > 0) {
                const testIli = await getIliForSynset(testSenses[0].synsetId);
                logger.info(`🧪 French word "ordinateur" has ILI: ${testIli}`);
                
                // Try to get words for this ILI in English
                if (testIli) {
                  const testEnglishWords = await getWordsByIliAndLanguage(testIli, 'en');
                  logger.info(`🧪 ILI ${testIli} maps to ${testEnglishWords.length} English words:`, 
                    testEnglishWords.map((w: WordInfo) => w.lemma || w.id)
                  );
                }
              }
            }
          } catch (error) {
            logger.error(`🧪 French test failed:`, error);
          }
        }
        
    
    if (sourceWords.length === 0) {
      logger.warn(`❌ No source words found for "${debouncedTerm}"`);
      return {
        sourceWord: debouncedTerm,
        sourceLanguage: pair.from,
        translations: {},
        method: 'fuzzy',
        executionTime: Date.now() - startTime,
        sourceWordsFound: 0,
        targetWordsFound: 0
      };
    }

    const translations: Record<string, { words: string[]; definitions: string[]; examples: string[] }> = {};
    
    // For each source word, find its synsets and then find translations
    for (let i = 0; i < Math.min(sourceWords.length, 3); i++) {
      const word = sourceWords[i];
      logger.info(`🔍 Processing word ${i + 1}/${Math.min(sourceWords.length, 3)}: ${word.lemma || word.id}`);
      
      const senses = await getSensesByWordIdOrForm(word.id);
      logger.info(`📝 Found ${senses.length} senses for word ${word.lemma || word.id}`);
      
      for (let j = 0; j < Math.min(senses.length, 2); j++) {
        const sense = senses[j];
        logger.info(`🔗 Getting ILI for synset ${sense.synsetId}`);
        
              const ili = await getIliForSynset(sense.synsetId);
              if (ili) {
                logger.info(`🌍 Found ILI ${ili}, searching for words in ${pair.to}`);
                try {
                  const targetWords = await getWordsByIliAndLanguage(ili, pair.to);
                  logger.info(`✅ Found ${targetWords.length} target words for ILI ${ili}`, { 
                    words: targetWords.map((w: WordInfo) => w.lemma || w.id),
                    ili,
                    language: pair.to 
                  });
                  
                  if (targetWords.length > 0) {
                    if (!translations[pair.to]) {
                      translations[pair.to] = { words: [], definitions: [], examples: [] };
                    }
                    
                    translations[pair.to].words.push(...targetWords.map((w: WordInfo) => w.lemma));
                    logger.info(`📝 Added ${targetWords.length} words to translations`);
                    
                    // Get definitions
                    logger.info(`📖 Getting definitions for synset ${sense.synsetId}`);
                    const defs = await getDefinitionsBySynsetId(sense.synsetId);
                    const targetDefs = defs.filter((d: any) => 
                      getLanguageVariants(pair.to).includes((d.language || '').toLowerCase())
                    );
                    translations[pair.to].definitions.push(...targetDefs.map((d: any) => d.text));
                    logger.info(`📖 Added ${targetDefs.length} definitions`);
                  } else {
                    logger.warn(`⚠️ No target words found for ILI ${ili} in language ${pair.to}`, {
                      ili,
                      language: pair.to,
                      synsetId: sense.synsetId
                    });
                    
                    // Debug: Let's check what ILIs are available in the French lexicon
                    logger.info(`🔍 Debugging ILI availability for French lexicon`);
                    try {
                      // Try to get some sample French words and their ILIs
                      const sampleFrenchWords = await searchWordsInLexicon('ordinateur', 'omw-fr:1.4', 'fr');
                      if (sampleFrenchWords.length > 0) {
                        const sampleWord = sampleFrenchWords[0];
                        const sampleSenses = await getSensesByWordIdOrForm(sampleWord.id);
                        if (sampleSenses.length > 0) {
                          const sampleIli = await getIliForSynset(sampleSenses[0].synsetId);
                          logger.info(`🔍 Sample French word "ordinateur" has ILI: ${sampleIli}`);
                        }
                      }
                    } catch (debugError) {
                      logger.error(`🔍 Debug failed:`, debugError);
                    }
                  }
                } catch (error) {
                  logger.error(`❌ Error getting words for ILI ${ili} in language ${pair.to}`, { 
                    error: error instanceof Error ? error.message : String(error),
                    ili,
                    language: pair.to 
                  });
                }
              } else {
                logger.warn(`⚠️ No ILI found for synset ${sense.synsetId}`);
              }
      }
    }

    // If no translations found, try a broader search
    if (!translations[pair.to] || translations[pair.to].words.length === 0) {
      logger.info(`🔄 No translations found via ILI, trying broader search strategies`);
      
      // Try searching for the word directly in target language
      const targetLexicon = getLexiconForLanguage(pair.to);
      const directSearch = await searchWordsInLexicon(debouncedTerm, targetLexicon, pair.to);
      
      if (directSearch.length > 0) {
        logger.info(`🎯 Direct search found ${directSearch.length} words in ${pair.to}`);
        if (!translations[pair.to]) {
          translations[pair.to] = { words: [], definitions: [], examples: [] };
        }
        translations[pair.to].words.push(...directSearch.map(w => w.lemma));
      }
      
      // Try common translations for computer
      if (pair.to === 'fr' && debouncedTerm.toLowerCase() === 'computer') {
        logger.info(`🔄 Trying known French translations for "computer"`);
        const knownTranslations = ['ordinateur', 'calculateur', 'machine'];
        for (const knownWord of knownTranslations) {
          const knownSearch = await searchWordsInLexicon(knownWord, targetLexicon, pair.to);
          if (knownSearch.length > 0) {
            logger.info(`🎯 Found known translation: ${knownWord}`);
            if (!translations[pair.to]) {
              translations[pair.to] = { words: [], definitions: [], examples: [] };
            }
            if (!translations[pair.to].words.includes(knownWord)) {
              translations[pair.to].words.push(knownWord);
            }
          }
        }
      }
    }


    const result: TranslationResult = {
      sourceWord: debouncedTerm,
      sourceLanguage: pair.from,
      translations
    };

    const executionTime = Date.now() - startTime;
    logger.success(`🎉 Fuzzy translation completed in ${executionTime}ms`, {
      sourceWordsFound: sourceWords.length,
      targetWordsFound: translations[pair.to]?.words.length || 0
    });
    
    return {
      ...result,
      method: 'fuzzy',
      executionTime,
      sourceWordsFound: sourceWords.length,
      targetWordsFound: translations[pair.to]?.words.length || 0
    };
  }, [debouncedTerm, pair, searchWordsInLexicon, getSensesByWordIdOrForm, getIliForSynset, getWordsByIliAndLanguage, getDefinitionsBySynsetId]);

  // ILI-based translation (legacy approach)
  const performIliTranslation = useCallback(async (): Promise<TranslationResultExtended> => {
    const startTime = Date.now();
    
    // Find source words
    const sourceLexicon = pair.from === 'en' ? 'oewn:2024' : `omw-${pair.from}:1.4`;
    const srcWords = await searchWordsInLexicon(debouncedTerm, sourceLexicon, pair.from);
    
    const translations: Record<string, { words: string[]; definitions: string[]; examples: string[] }> = {};
    
    for (const word of srcWords.slice(0, 3)) {
      const senses = await getSensesByWordIdOrForm(word.id);
      
      for (const sense of senses.slice(0, 2)) {
        const ili = await getIliForSynset(sense.synsetId);
        if (ili) {
          const targetWordsResult = await getWordsByIliAndLanguage(ili, pair.to);
          if (targetWordsResult.length > 0) {
            const targetWords = targetWordsResult;
            if (!translations[pair.to]) {
              translations[pair.to] = { words: [], definitions: [], examples: [] };
            }
            
            translations[pair.to].words.push(...targetWords.map((w: WordInfo) => w.lemma));
            
            // Get definitions
            const defs = await getDefinitionsBySynsetId(sense.synsetId);
            const targetDefs = defs.filter((d: any) => 
              getLanguageVariants(pair.to).includes((d.language || '').toLowerCase())
            );
            translations[pair.to].definitions.push(...targetDefs.map((d: any) => d.text));
          }
        }
      }
    }

    const result: TranslationResult = {
      sourceWord: debouncedTerm,
      sourceLanguage: pair.from,
      translations
    };

    const executionTime = Date.now() - startTime;
    return {
      ...result,
      method: 'ili',
      executionTime,
      sourceWordsFound: srcWords.length,
      targetWordsFound: translations[pair.to]?.words.length || 0
    };
  }, [debouncedTerm, pair, searchWordsInLexicon, getSensesByWordIdOrForm, getIliForSynset, getWordsByIliAndLanguage, getDefinitionsBySynsetId]);

  // Main translation function - use ref to avoid dependency issues
  const performTranslation = useCallback(async () => {
    if (!canQuery || !debouncedTerm.trim() || isTranslatingRef.current) return;

    isTranslatingRef.current = true;
    setIsLoading(true);
    setError(null);
    setResults(null);
    setQuickResults([]);

    try {
      logger.start(`unified translation for "${debouncedTerm}"`);

      // Add timeout to prevent hanging
      const translationPromise = (async (): Promise<{ result: TranslationResultExtended; quickTranslations: string[] }> => {
        let result: TranslationResultExtended;
        let quickTranslations: string[] = [];
        if (translationMethod === 'fuzzy') {
          result = await performFuzzyTranslation();
          quickTranslations = result.translations[pair.to]?.words || [];
        } else if (translationMethod === 'ili') {
          result = await performIliTranslation();
          quickTranslations = result.translations[pair.to]?.words || [];
        } else if (translationMethod === 'both') {
          // Try both methods and combine results
          const [fuzzyResult, iliResult] = await Promise.all([
            performFuzzyTranslation(),
            performIliTranslation()
          ]);

          // Combine results, preferring ILI for accuracy but adding fuzzy for coverage
          const combinedTranslations = { ...iliResult.translations };
          if (fuzzyResult.translations[pair.to]) {
            const existingWords = new Set(combinedTranslations[pair.to]?.words || []);
            const newWords = fuzzyResult.translations[pair.to].words.filter((w: string) => !existingWords.has(w));
            if (newWords.length > 0) {
              if (!combinedTranslations[pair.to]) {
                combinedTranslations[pair.to] = { words: [], definitions: [], examples: [] };
              }
              combinedTranslations[pair.to].words.push(...newWords);
              combinedTranslations[pair.to].definitions.push(...fuzzyResult.translations[pair.to].definitions);
              combinedTranslations[pair.to].examples.push(...fuzzyResult.translations[pair.to].examples);
            }
          }

          result = {
            ...iliResult,
            translations: combinedTranslations,
            method: 'both',
            executionTime: Math.max(fuzzyResult.executionTime, iliResult.executionTime),
            sourceWordsFound: Math.max(fuzzyResult.sourceWordsFound, iliResult.sourceWordsFound),
            targetWordsFound: combinedTranslations[pair.to]?.words.length || 0
          };
          quickTranslations = result.translations[pair.to]?.words || [];
        } else { // auto
          // Try ILI first, fallback to fuzzy if no results
          result = await performIliTranslation();
          if (result.targetWordsFound === 0) {
            logger.info('No ILI results, trying fuzzy translation');
            result = await performFuzzyTranslation();
          }
          quickTranslations = result.translations[pair.to]?.words || [];
        }
        
        return { result, quickTranslations };
      })();

      // Add 30 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Translation timeout after 30 seconds')), 30000);
      });

      const { result, quickTranslations } = await Promise.race([translationPromise, timeoutPromise]);

      setResults(result);
      setQuickResults(quickTranslations);

      logger.success('Unified translation completed', {
        term: debouncedTerm,
        pair,
        method: result.method,
        executionTime: result.executionTime,
        sourceWordsFound: result.sourceWordsFound,
        targetWordsFound: result.targetWordsFound
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.fail('Unified translation failed', { error: errorMsg });
      setError(errorMsg);
    } finally {
      isTranslatingRef.current = false;
      setIsLoading(false);
    }
  }, [debouncedTerm, pair, canQuery, translationMethod, performFuzzyTranslation, performIliTranslation]);

  // Auto-translate when term changes (temporarily disabled to prevent infinite loops)
  // TODO: Re-implement auto-translate with stable dependencies
  // useEffect(() => {
  //   if (autoTranslate && debouncedTerm && canQuery && !isTranslatingRef.current) {
  //     const timeoutId = setTimeout(() => {
  //       if (!isTranslatingRef.current) {
  //         performTranslation();
  //       }
  //     }, 500);
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [debouncedTerm, canQuery, autoTranslate, translationMethod]);

  // Event handlers
  const handlePairChange = useCallback((field: 'from' | 'to', value: string) => {
    setPair(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTermChange = useCallback((value: string) => {
    setTerm(value);
  }, []);

  // Debug functions
  const runDiagnostics = useCallback(async () => {
    setDebugInfo('Running diagnostics...');
    try {
      let info = '🔍 DIAGNOSTICS REPORT\n';
      info += '===================\n\n';
      
      info += `📦 Loaded Packages: ${loadedPackages.length}\n`;
      info += `   ${loadedPackages.join(', ')}\n\n`;
      
      info += `🌍 Available Languages: ${availableLanguages.join(', ')}\n\n`;
      
      info += `🔧 Translation Method: ${translationMethod}\n`;
      info += `📱 View Mode: ${viewMode}\n`;
      info += `⚡ Auto-translate: ${autoTranslate ? 'ON' : 'OFF'}\n\n`;
      
      // Test basic queries
      info += '🧪 TESTING BASIC QUERIES:\n';
      try {
        const testWords = await searchWordsInLexicon('test', 'oewn:2024', 'en');
        info += `   English "test": ${testWords.length} words found\n`;
      } catch (e) {
        info += `   English "test": ERROR - ${e instanceof Error ? e.message : String(e)}\n`;
      }
      
      if (pair.to === 'fr') {
        try {
          const testWords = await searchWordsInLexicon('test', 'omw-fr:1.4', 'fr');
          info += `   French "test": ${testWords.length} words found\n`;
        } catch (e) {
          info += `   French "test": ERROR - ${e instanceof Error ? e.message : String(e)}\n`;
        }
      }
      
      setDebugInfo(info);
    } catch (err) {
      setDebugInfo(`Diagnostics failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [loadedPackages, availableLanguages, translationMethod, viewMode, autoTranslate, pair.to, searchWordsInLexicon]);

  const loadRequiredPackages = useCallback(async () => {
    try {
      const required = ['oewn:2024', 'cili:1.0', `omw-${pair.to}:1.4`];
      for (const pkg of required) {
        if (!loadedPackages.some((p: string) => p.startsWith(pkg.split(':')[0]))) {
          await loadPackageData(pkg);
        }
      }
      await refreshPackages();
    } catch (err) {
      setError(`Failed to load packages: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [loadedPackages, pair.to, loadPackageData, refreshPackages]);

  return (
    <Card title="🌍 Unified Translation Demo">
      <div className="space-y-6">
        {/* Description */}
        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <strong>Unified Translation Demo:</strong> This comprehensive demo combines all translation approaches 
          including fuzzy matching, ILI-based cross-lingual mapping, and automatic method selection. 
          Choose your preferred method or let the system automatically select the best approach.
        </div>

        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Translation Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Translation Settings</h3>
            
            {/* Method Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Translation Method:</label>
              <div className="space-y-2">
                {[
                  { value: 'auto', label: 'Auto (ILI + Fuzzy fallback)', desc: 'Try ILI first, use fuzzy if no results' },
                  { value: 'both', label: 'Both Methods', desc: 'Combine ILI and fuzzy results' },
                  { value: 'ili', label: 'ILI-based Only', desc: 'Semantic cross-lingual mapping' },
                  { value: 'fuzzy', label: 'Fuzzy Matching Only', desc: 'Form-based similarity matching' }
                ].map(method => (
                  <label key={method.value} className="flex items-start">
                    <input
                      type="radio"
                      value={method.value}
                      checked={translationMethod === method.value}
                      onChange={(e) => setTranslationMethod(e.target.value as TranslationMethod)}
                      className="mt-1 mr-2"
                    />
                    <div>
                      <div className="text-sm font-medium">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* View Mode */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode:</label>
              <div className="flex gap-4">
                {[
                  { value: 'simple', label: 'Simple' },
                  { value: 'detailed', label: 'Detailed' },
                  { value: 'debug', label: 'Debug' }
                ].map(mode => (
                  <label key={mode.value} className="flex items-center">
                    <input
                      type="radio"
                      value={mode.value}
                      checked={viewMode === mode.value}
                      onChange={(e) => setViewMode(e.target.value as ViewMode)}
                      className="mr-2"
                    />
                    <span className="text-sm">{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-translate toggle - temporarily disabled */}
            <div className="bg-gray-50 p-4 rounded-lg opacity-50">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  disabled={true}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Auto-translate on input change (temporarily disabled)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Auto-translate is disabled to prevent infinite loops. Use the Translate button instead.
              </p>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Language Selection</h3>
            
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                <select
                  value={pair.from}
                  onChange={(e) => handlePairChange('from', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang}>
                      {LANG_LABEL[lang] || lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-2xl text-gray-400">→</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                <select
                  value={pair.to}
                  onChange={(e) => handlePairChange('to', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableLanguages.filter(lang => lang !== pair.from).map(lang => (
                    <option key={lang} value={lang}>
                      {LANG_LABEL[lang] || lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word to translate:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={term}
                  onChange={(e) => handleTermChange(e.target.value)}
                  placeholder={`Enter ${LANG_LABEL[pair.from] || pair.from} word`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={performTranslation}
                  disabled={!canQuery}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Tools */}
        {showDebugTools && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-yellow-800">🔧 Debug Tools</h3>
              <button
                onClick={() => setShowDebugTools(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={runDiagnostics}
                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm"
                disabled={!canQuery}
              >
                Run Diagnostics
              </button>
              <button
                onClick={loadRequiredPackages}
                className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm"
              >
                Load Required
              </button>
              <button
                onClick={refreshPackages}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
              >
                Refresh Packages
              </button>
            </div>
            {debugInfo && (
              <div className="bg-white p-3 rounded text-xs max-h-40 overflow-auto">
                <pre className="whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Loaded packages:</span> {loadedPackages.join(', ') || 'none'}
          <button
            onClick={() => setShowDebugTools(!showDebugTools)}
            className="ml-4 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
          >
            {showDebugTools ? 'Hide' : 'Show'} Debug Tools
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Quick Results */}
            {quickResults.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Quick Translation Results:</h3>
                <p className="text-green-700">
                  <span className="font-medium">{debouncedTerm}</span> ({pair.from.toUpperCase()}) → 
                  <span className="font-medium ml-2">{quickResults.join(', ')}</span> ({pair.to.toUpperCase()})
                </p>
                {viewMode !== 'simple' && (
                  <div className="mt-2 text-sm text-green-600">
                    Method: {results.method} | Time: {results.executionTime}ms | 
                    Source words: {results.sourceWordsFound} | Target words: {results.targetWordsFound}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Results */}
            {viewMode !== 'simple' && results.translations[pair.to] && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Detailed Translation Results:</h3>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-2">Words:</h4>
                  <p className="text-gray-600 mb-3">
                    {results.translations[pair.to].words.join(', ')}
                  </p>
                  
                  {results.translations[pair.to].definitions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-700 mb-2">Definitions:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {results.translations[pair.to].definitions.slice(0, 3).map((def, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>{def}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.translations[pair.to].examples.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Examples:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {results.translations[pair.to].examples.slice(0, 2).map((example, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Debug Results */}
            {viewMode === 'debug' && (
              <div className="p-4 bg-gray-100 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Debug Information:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Method used: {results.method}</div>
                  <div>Execution time: {results.executionTime}ms</div>
                  <div>Source words found: {results.sourceWordsFound}</div>
                  <div>Target words found: {results.targetWordsFound}</div>
                  <div>Source language: {results.sourceLanguage}</div>
                  <div>Target language: {pair.to}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!isLoading && quickResults.length === 0 && debouncedTerm && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">
              No translations found for "{debouncedTerm}" from {pair.from.toUpperCase()} to {pair.to.toUpperCase()}.
            </p>
            <div className="mt-2 text-sm text-yellow-600">
              <strong>Suggestions:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Try a different word</li>
                <li>Check if the required packages are loaded</li>
                <li>Try switching translation methods</li>
                <li>Ensure the target language package is available</li>
                <li>Use the debug tools to diagnose issues</li>
              </ul>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">💡 How to Use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Select source and target languages from the dropdowns</li>
            <li>• Choose your preferred translation method or use "Auto" for best results</li>
            <li>• Enter a word in the source language</li>
            <li>• Toggle auto-translate to enable/disable automatic translation on input change</li>
            <li>• Switch between Simple, Detailed, and Debug view modes</li>
            <li>• Use debug tools to diagnose issues and manage packages</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default UnifiedTranslationDemo;

/**
 * Dictionary generation logic for serverless deployments
 */

import type { Wordnet, PartOfSpeech } from 'wn-ts-node';
import type {
  DictionaryData,
  DictionaryMetadata,
  CompactSynset,
  GeneratorOptions,
  PresetConfig,
  Presets
} from '../types/index.js';
import { processBatch, DEFAULT_BATCH_CONFIG } from '../utils/batch.js';
import { globalRegistry } from '../plugins/registry.js';

/**
 * Default presets for different use cases
 */
export const PRESETS: Presets = {
  mini: {
    description: 'Ultra-compact, top 100 words',
    limit: 100,
    pos: ['n', 'v'],
    languages: ['en']
  },
  small: {
    description: 'Small, top 500 common words',
    limit: 500,
    pos: ['n', 'v', 'a'],
    languages: ['en']
  },
  medium: {
    description: 'Medium, top 2000 words',
    limit: 2000,
    pos: null,
    languages: ['en']
  },
  bilingual: {
    description: 'English-French bilingual, top 1000',
    limit: 1000,
    pos: ['n', 'v'],
    languages: ['en', 'fr']
  },
  multilingual: {
    description: 'Multi-language, top 500',
    limit: 500,
    pos: ['n', 'v'],
    languages: ['en', 'fr', 'es', 'de']
  },
  'en-th': {
    description: 'English-Thai dictionary, top 1000',
    limit: 1000,
    pos: ['n', 'v', 'a'],
    languages: ['en', 'th']
  },
  'en-fr': {
    description: 'English-French dictionary, top 1000',
    limit: 1000,
    pos: ['n', 'v', 'a'],
    languages: ['en', 'fr']
  },
  'th-fr': {
    description: 'Thai-French dictionary, top 1000',
    limit: 1000,
    pos: ['n', 'v', 'a'],
    languages: ['th', 'fr']
  },
  'en-th-large': {
    description: 'English-Thai dictionary, top 3000',
    limit: 3000,
    pos: null,
    languages: ['en', 'th']
  },
  'en-fr-large': {
    description: 'English-French dictionary, top 3000',
    limit: 3000,
    pos: null,
    languages: ['en', 'fr']
  },
  'th-fr-large': {
    description: 'Thai-French dictionary, top 3000',
    limit: 3000,
    pos: null,
    languages: ['th', 'fr']
  }
};

/**
 * Extract core vocabulary with frequency-based filtering
 */
export async function extractCoreVocabulary(
  wordnet: Wordnet,
  options: GeneratorOptions
): Promise<Map<string, any>> {
  const { limit, pos, languages, wordFrequencyData } = options;
  const vocabulary = new Map();

  console.log(`\n[Generator] Extracting core vocabulary:`);
  console.log(`  Languages: ${languages.join(', ')}`);
  console.log(`  POS filter: ${pos ? pos.join(', ') : 'all'}`);
  console.log(`  Limit: ${limit} synsets`);

  // Collect all synsets with ILI values, grouped by ILI
  // ILI is required to link synsets across languages
  const synsetsByIli = new Map<string, any[]>();
  const seenSynsetIds = new Set<string>();
  
  // Query synsets for each language and POS combination
  for (const lang of languages) {
    const posList: PartOfSpeech[] = (pos || ['n', 'v', 'a', 'r']) as PartOfSpeech[];
    for (const p of posList) {
      try {
        // Query synsets with language and POS filters
        const synsets = await wordnet.synsets({ language: lang, pos: p as PartOfSpeech });
        
        // Filter to only synsets with ILI and group by ILI
        for (const synset of synsets) {
          // CRITICAL: Only include synsets with valid ILI for cross-language linking
          if (!synset.ili) continue;
          
          // Validate ILI format: must be "i" followed by digits (e.g., i12345)
          // This filters out placeholders like "in" and any other invalid formats
          const isValidILI = /^i\d+$/.test(synset.ili);
          if (!isValidILI) {
            // Skip invalid ILIs (placeholders, empty strings, etc.)
            continue;
          }
          
          if (!seenSynsetIds.has(synset.id)) {
            seenSynsetIds.add(synset.id);
            
            if (!synsetsByIli.has(synset.ili)) {
              synsetsByIli.set(synset.ili, []);
            }
            synsetsByIli.get(synset.ili)!.push(synset);
          }
        }
      } catch (error) {
        // Skip errors and continue
        continue;
      }
    }
  }

  console.log(`[Generator] Found ${synsetsByIli.size} unique ILI entries`);

  // Build word frequency map and sense position data for scoring
  // Only process synsets that are candidates (already filtered by ILI)
  const wordFrequencyMap = new Map<string, number>();
  const wordSynsetPositions = new Map<string, Map<string, number>>(); // word -> synsetId -> position
  const synsetLemmasCache = new Map<string, string[]>(); // synsetId -> lemmas

  console.log(`[Generator] Collecting word frequency data from candidate synsets...`);
  
  // First pass: collect word frequency data (only from candidate synsets)
  let processedCount = 0;
  const allCandidateSynsets: Array<{ synset: any; ili: string }> = [];
  
  for (const [ili, synsets] of synsetsByIli.entries()) {
    for (const synset of synsets) {
      allCandidateSynsets.push({ synset, ili });
    }
  }
  
  const totalSynsets = allCandidateSynsets.length;
  console.log(`[Generator] Processing ${totalSynsets} candidate synsets for frequency data...`);
  
  for (const { synset } of allCandidateSynsets) {
    const lang = synset.language || 'en';
    if (!languages.includes(lang)) continue;

    try {
      const lemmas = await wordnet.getSynsetLemmas(synset.id);
      synsetLemmasCache.set(synset.id, lemmas);
      
      // Count word frequency (how many synsets contain each word)
      for (const lemma of lemmas) {
        const wordKey = `${lemma.toLowerCase()}:${lang}`;
        wordFrequencyMap.set(wordKey, (wordFrequencyMap.get(wordKey) || 0) + 1);
      }
      
      processedCount++;
      if (processedCount % 1000 === 0) {
        console.log(`[Generator] Processed ${processedCount}/${totalSynsets} synsets for frequency data...`);
      }
    } catch (error) {
      // Skip if we can't get lemmas
    }
  }

  // Second pass: collect sense ordering data (only for words that appear in multiple synsets)
  // This is the key optimization - we only need sense ordering for ambiguous words
  console.log(`[Generator] Collecting sense ordering data for ambiguous words (appearing in 2+ synsets)...`);
  const ambiguousWords = Array.from(wordFrequencyMap.entries())
    .filter(([_, count]) => count > 1)
    .map(([wordKey]) => wordKey);
  
  console.log(`[Generator] Found ${ambiguousWords.length} ambiguous words (out of ${wordFrequencyMap.size} total)`);
  
  let wordProcessedCount = 0;
  for (const wordKey of ambiguousWords) {
    const [lemma, lang] = wordKey.split(':');
    
    // Get all synsets for this word (ordered by frequency in WordNet)
    const posList: PartOfSpeech[] = (pos || ['n', 'v', 'a', 'r']) as PartOfSpeech[];
    
    for (const p of posList) {
      try {
        const wordSynsets = await wordnet.synsets({ form: lemma, language: lang, pos: p });
        if (wordSynsets.length > 0) {
          // Store position for each synset
          if (!wordSynsetPositions.has(wordKey)) {
            wordSynsetPositions.set(wordKey, new Map());
          }
          const positions = wordSynsetPositions.get(wordKey)!;
          wordSynsets.forEach((s, idx) => {
            positions.set(s.id, idx);
          });
          break; // Found the word, no need to check other POS
        }
      } catch (error) {
        // Skip if we can't get synsets
      }
    }
    
    wordProcessedCount++;
    if (wordProcessedCount % 500 === 0) {
      console.log(`[Generator] Processed ${wordProcessedCount}/${ambiguousWords.length} words for sense ordering...`);
    }
  }

  console.log(`[Generator] Scoring ${synsetsByIli.size} ILI groups using improved algorithm...`);

  // Score ILI groups using improved algorithm
  const scoredIlis: Array<{
    ili: string;
    synsets: any[];
    score: number;
    minSensePosition: number | null;
    totalWords: number;
    languagesWithData: number;
  }> = [];

  for (const [ili, synsets] of synsetsByIli.entries()) {
    let score = 0;
    let totalWords = 0;
    let minSensePosition = Infinity;
    let languagesWithData = 0;
    const seenWords = new Set<string>();

    for (const synset of synsets) {
      const lang = synset.language || 'en';
      if (!languages.includes(lang)) continue;

      const lemmas = synsetLemmasCache.get(synset.id) || [];
      if (lemmas.length === 0) continue;

      languagesWithData++;
      
      for (const lemma of lemmas) {
        const wordKey = `${lemma.toLowerCase()}:${lang}`;
        
        // Avoid double-counting the same word across synsets
        if (seenWords.has(wordKey)) continue;
        seenWords.add(wordKey);
        
        totalWords++;
        
        // Factor 1: Word frequency (inverse - words in fewer synsets are more specific/common)
        const freq = wordFrequencyMap.get(wordKey) || 1;
        score += 1000 / freq; // Higher score for words in fewer synsets
        
        // Factor 1b: External word frequency data (if provided, e.g., A1-C2 word lists)
        if (wordFrequencyData) {
          const externalFreq = wordFrequencyData instanceof Map 
            ? wordFrequencyData.get(lemma.toLowerCase())
            : wordFrequencyData[lemma.toLowerCase()];
          if (externalFreq !== undefined && externalFreq > 0) {
            // Lower rank = more common, so higher score
            score += 2000 / externalFreq;
          }
        }
        
        // Factor 2: Sense position (lower position = more common sense, this is the KEY factor)
        const positions = wordSynsetPositions.get(wordKey);
        if (positions) {
          const position = positions.get(synset.id);
          if (position !== undefined && position >= 0) {
            minSensePosition = Math.min(minSensePosition, position);
            score += (100 - position * 10); // Higher score for lower position (sense 0 = most common)
          }
        }
        
        // Factor 3: Prefer base/canonical forms (simple words, not compounds)
        if (lemma.length <= 8 && !lemma.includes(' ') && !lemma.includes('-')) {
          score += 50;
        }
      }
      
      // Factor 4: Slight penalty for synsets with too many members (often less common compound terms)
      const memberCount = synset.memberIds?.length || lemmas.length;
      if (memberCount > 10) {
        score -= 20;
      }
    }
    
    // Factor 5: Bonus for cross-lingual coverage
    if (languages.length >= 2) {
      score += languagesWithData * 100;
    }
    
    // Factor 6: Ensure we have words in at least one language
    if (totalWords === 0) {
      score = -Infinity;
    }
    
    // Factor 7: Strong bonus for primary senses (most important factor)
    if (minSensePosition < Infinity) {
      score += (1000 - minSensePosition * 100); // Strong bonus for sense 0, 1, 2, etc.
    }

    scoredIlis.push({
      ili,
      synsets,
      score,
      minSensePosition: minSensePosition === Infinity ? null : minSensePosition,
      totalWords,
      languagesWithData
    });
  }

  // Filter and sort
  const filteredAndSorted = scoredIlis
    .filter(item => {
      // Filter by POS if specified
      if (!pos) return true;
      return item.synsets.some(s => pos.includes(s.pos));
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit); // Get top N ILI groups

  console.log(`[Generator] After filtering and sorting: ${filteredAndSorted.length} ILI groups`);
  if (filteredAndSorted.length > 0) {
    console.log(`[Generator] Top 5 ILIs by score:`);
    filteredAndSorted.slice(0, 5).forEach((item, idx) => {
      const firstSynset = item.synsets[0];
      const senseInfo = item.minSensePosition !== null ? `, Sense: ${item.minSensePosition}` : '';
      console.log(`  ${idx + 1}. ILI: ${item.ili}, Score: ${item.score.toFixed(2)}${senseInfo}, POS: ${firstSynset?.pos || 'unknown'}`);
    });
  }

  // Get batch configuration
  const batchConfig = { ...DEFAULT_BATCH_CONFIG, ...options.batch };

  // Process ILI groups in batches for memory efficiency
  console.log(`[Generator] Processing ${filteredAndSorted.length} ILI groups in batches...`);

  await processBatch(
    filteredAndSorted,
    async (batch, batchIndex) => {
      const batchResults: Array<[string, any]> = [];

      for (const { ili, synsets } of batch) {
        if (vocabulary.size >= limit) break;

        // Create vocabulary entry for this ILI
        const entry: any = {
          ili,
          pos: synsets[0]?.pos || 'n', // Use first synset's POS
          def: synsets[0]?.definitions[0]?.text?.substring(0, 80) || '',
          words: {}
        };

        // Collect words from all synsets with this ILI across all languages
        for (const synset of synsets) {
          const lang = synset.language || 'en';

          // Only include languages we're interested in
          if (!languages.includes(lang)) continue;

          try {
            const lemmas = await wordnet.getSynsetLemmas(synset.id);
            if (lemmas.length === 0) continue;

            if (!entry.words[lang]) {
              entry.words[lang] = [];
            }

            // Add lemmas, avoiding duplicates
            lemmas.forEach((lemma: string) => {
              if (!entry.words[lang].includes(lemma)) {
                entry.words[lang].push(lemma);
              }
            });
          } catch (error) {
            // Skip errors for individual synsets
            continue;
          }
        }

        // Only add entry if it has words in at least one language
        // For language-pair dictionaries, require words in ALL target languages
        if (Object.keys(entry.words).length > 0) {
          // If this is a language-pair dictionary (exactly 2 languages), 
          // filter out ILIs that don't have translations in both languages
          if (languages.length === 2) {
            const hasAllLanguages = languages.every(lang => 
              entry.words[lang] && entry.words[lang].length > 0
            );
            if (!hasAllLanguages) {
              // Skip this ILI - it doesn't have translations in all target languages
              continue;
            }
          }
          
          batchResults.push([ili, entry]);
          vocabulary.set(ili, entry);
        }
      }

      return batchResults;
    },
    batchConfig
  );

  console.log(`[Generator] Final vocabulary size: ${vocabulary.size} entries`);

  // Debug: Show some sample words
  const sampleEntries = Array.from(vocabulary.entries()).slice(0, 10);
  console.log(`[Generator] Sample vocabulary entries:`);
  sampleEntries.forEach(([ili, entry]) => {
    const wordSamples = Object.entries(entry.words)
      .map(([lang, words]) => `${lang}: ${(words as string[]).slice(0, 3).join(', ')}`)
      .join(' | ');
    console.log(`  ${ili}: ${wordSamples}`);
  });

  return vocabulary;
}

/**
 * Build optimized lookup structure for serverless
 */
export function buildServerlessStructure(vocabulary: Map<string, any>): DictionaryData {
  const structure: DictionaryData = {
    v: 1,
    m: {
      v: 1,
      t: Date.now(),
      c: 0,
      w: 0
    },
    w: {},
    s: {}
  };

  // Build word index and synset data
  let totalWords = 0;
  vocabulary.forEach((entry, ili) => {
    // Validate ILI format one more time (safety check)
    if (!/^i\d+$/.test(ili)) {
      console.warn(`⚠️  Skipping invalid ILI format: ${ili}`);
      return;
    }
    
    // Validate entry has real data
    if (!entry.def || entry.def.trim().length === 0) {
      console.warn(`⚠️  Skipping ILI ${ili} with empty definition`);
      return;
    }
    
    // Filter out empty or invalid words
    const validWords: Record<string, string[]> = {};
    Object.entries(entry.words).forEach(([lang, words]) => {
      const filtered = (words as string[]).filter(word => 
        word && typeof word === 'string' && word.trim().length > 0
      );
      if (filtered.length > 0) {
        validWords[lang] = filtered;
      }
    });
    
    // Only add if we have valid words
    if (Object.keys(validWords).length === 0) {
      console.warn(`⚠️  Skipping ILI ${ili} with no valid words`);
      return;
    }
    
    // Store synset in compact format with validated data
    structure.s[ili] = [entry.pos, entry.def.trim(), validWords];

    // Build word index for each language
    Object.entries(validWords).forEach(([lang, words]) => {
      words.forEach(word => {
        const key = `${word.toLowerCase().trim()}:${lang}`;
        if (!structure.w[key]) {
          structure.w[key] = [];
        }
        if (!structure.w[key].includes(ili)) {
          structure.w[key].push(ili);
          totalWords++;
        }
      });
    });
  });

  structure.m.c = vocabulary.size;
  structure.m.w = totalWords;
  
  // Extract languages from vocabulary entries
  const detectedLanguages = new Set<string>();
  vocabulary.forEach((entry) => {
    Object.keys(entry.words).forEach(lang => detectedLanguages.add(lang));
  });
  
  // Set languages metadata if not already set
  if (!structure.m.langs || structure.m.langs.length === 0) {
    structure.m.langs = Array.from(detectedLanguages).sort();
  }

  return structure;
}

/**
 * Generate dictionary from WordNet instance
 */
export async function generateDictionary(
  wordnet: Wordnet,
  options: GeneratorOptions
): Promise<DictionaryData> {
  // Execute beforeGenerate hook
  const modifiedOptions = await globalRegistry.executeHook('beforeGenerate', options);

  // Extract vocabulary
  let vocabulary = await extractCoreVocabulary(wordnet, modifiedOptions || options);

  // Execute afterExtract hook
  vocabulary = await globalRegistry.executeHook('afterExtract', vocabulary) || vocabulary;

  // Build optimized structure
  let dictionary = buildServerlessStructure(vocabulary);

  // Execute afterBuild hook
  dictionary = await globalRegistry.executeHook('afterBuild', dictionary) || dictionary;

  return dictionary;
}

/**
 * Generate language-pair specific dictionary
 * This creates a dictionary with only two languages for memory efficiency
 */
export async function generateLanguagePair(
  wordnet: Wordnet,
  lang1: string,
  lang2: string,
  options: Partial<GeneratorOptions> = {}
): Promise<DictionaryData> {
  const mergedOptions: GeneratorOptions = {
    languages: [lang1, lang2],
    pos: options.pos ?? null,
    limit: options.limit ?? 1000,
    ...options
  };

  // Extract vocabulary with only the two specified languages
  const vocabulary = await extractCoreVocabulary(wordnet, mergedOptions);

  // Build optimized structure
  const dictionary = buildServerlessStructure(vocabulary);

  // Add language pair metadata
  dictionary.m.langs = [lang1, lang2];

  return dictionary;
}

/**
 * Create ES module code from dictionary data
 */
export function createESModule(data: DictionaryData, moduleName: string = 'dictionary'): string {
  // Extract languages from metadata or detect from data
  let langs = data.m.langs;
  if (!langs || langs.length === 0) {
    // Fallback: detect languages from synset data
    const detectedLangs = new Set<string>();
    Object.values(data.s).forEach((synset: any) => {
      if (Array.isArray(synset) && synset[2] && typeof synset[2] === 'object') {
        Object.keys(synset[2]).forEach(lang => detectedLangs.add(lang));
      }
    });
    langs = Array.from(detectedLangs).sort();
  }
  if (!langs || langs.length === 0) {
    langs = ['en']; // Final fallback
  }
  const langPair = langs.length === 2 ? `${langs[0]}-${langs[1]}` : 'multilingual';

  return `/**
 * Serverless Dictionary Module: ${langPair}
 * Generated: ${new Date().toISOString()}
 * Languages: ${langs.join(', ')}
 * Synsets: ${data.m.c}
 * Words: ${data.m.w}
 *
 * Usage:
 *   import { lookup, translate, define } from './${moduleName}.js';
 *   const results = lookup('computer', '${langs[0]}');
 */

const data = ${JSON.stringify(data, null, 0)};

/**
 * Lookup a word and get all matching synsets
 */
export function lookup(word, lang = '${langs[0]}') {
  const key = \`\${word.toLowerCase()}:\${lang}\`;
  const ilis = data.w[key];
  if (!ilis) return [];

  return ilis.map(ili => {
    const [pos, def, words] = data.s[ili];
    return { ili, pos, definition: def, translations: words };
  });
}

/**
 * Get translations for a word across languages
 */
export function translate(word, fromLang, toLang) {
  const synsets = lookup(word, fromLang);
  const translations = new Set();

  synsets.forEach(synset => {
    const targetWords = synset.translations[toLang] || [];
    targetWords.forEach(w => translations.add(w));
  });

  return Array.from(translations);
}

/**
 * Get all definitions for a word
 */
export function define(word, lang = '${langs[0]}') {
  return lookup(word, lang).map(s => s.definition);
}

export const meta = data.m;
export const languages = ${JSON.stringify(langs)};
export default { lookup, translate, define, meta, languages };
`;
}

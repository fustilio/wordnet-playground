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
  const { limit, pos, languages } = options;
  const vocabulary = new Map();

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
          // CRITICAL: Only include synsets with ILI for cross-language linking
          if (!synset.ili) continue;
          
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

  // Score ILI groups by total member count across all languages
  const scoredIlis = Array.from(synsetsByIli.entries())
    .map(([ili, synsets]) => {
      // Calculate score: sum of member counts across all synsets for this ILI
      const totalMembers = synsets.reduce((sum, s) => sum + (s.memberIds?.length || 1), 0);
      return {
        ili,
        synsets,
        score: totalMembers
      };
    })
    .filter(item => {
      // Filter by POS if specified
      if (!pos) return true;
      return item.synsets.some(s => pos.includes(s.pos));
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit); // Get top N ILI groups

  // Process each ILI group to build vocabulary
  for (const { ili, synsets } of scoredIlis) {
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
    if (Object.keys(entry.words).length > 0) {
      vocabulary.set(ili, entry);
    }
  }

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
    // Store synset in compact format
    structure.s[ili] = [entry.pos, entry.def, entry.words];

    // Build word index for each language
    Object.entries(entry.words).forEach(([lang, words]) => {
      (words as string[]).forEach(word => {
        const key = `${word.toLowerCase()}:${lang}`;
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

  return structure;
}

/**
 * Generate dictionary from WordNet instance
 */
export async function generateDictionary(
  wordnet: Wordnet,
  options: GeneratorOptions
): Promise<DictionaryData> {
  // Extract vocabulary
  const vocabulary = await extractCoreVocabulary(wordnet, options);

  // Build optimized structure
  const dictionary = buildServerlessStructure(vocabulary);

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
  const langs = data.m.langs || ['en'];
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

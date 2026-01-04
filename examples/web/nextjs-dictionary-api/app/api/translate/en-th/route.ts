import { NextRequest, NextResponse } from 'next/server';

/**
 * English-Thai Translation API
 *
 * This endpoint imports ONLY the en-th language pair dictionary,
 * minimizing memory usage in serverless environments.
 *
 * Memory usage: ~80-120 KB (vs ~200 KB for multilingual)
 */

// Dynamically import the en-th dictionary only when this endpoint is called
// This demonstrates lazy loading for even better memory efficiency
let dictModule: any = null;

async function getDictionary() {
  if (!dictModule) {
    dictModule = await import('../../../../dict-en-th.js');
  }
  return dictModule;
}

/**
 * GET /api/translate/en-th?word=<word>&from=<lang>&to=<lang>
 *
 * Bidirectional translation: en→th or th→en
 *
 * Examples:
 * - /api/translate/en-th?word=computer&from=en&to=th
 * - /api/translate/en-th?word=คอมพิวเตอร์&from=th&to=en
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');
  const from = searchParams.get('from') || 'en';
  const to = searchParams.get('to') || 'th';

  if (!word) {
    return NextResponse.json(
      { error: 'Missing required parameter: word' },
      { status: 400 }
    );
  }

  // Validate language pair
  if (!['en', 'th'].includes(from) || !['en', 'th'].includes(to)) {
    return NextResponse.json(
      {
        error: 'Invalid language pair. This endpoint supports only en-th translations.',
        supportedLanguages: ['en', 'th']
      },
      { status: 400 }
    );
  }

  try {
    const dictModule = await getDictionary();
    // Handle both default export and named exports
    const dict = dictModule.default || dictModule;
    const { lookup, translate, meta, languages } = dict;

    console.log('[EN-TH] Translation request:', { word, from, to });
    console.log('[EN-TH] Dictionary metadata:', meta);
    
    // Detect languages from synset data first (more accurate)
    let detectedLanguages = languages;
    if (!detectedLanguages || detectedLanguages.length === 1) {
      // Try to detect from a sample lookup
      const sampleLookup = lookup('computer', 'en');
      const sampleArray = Array.isArray(sampleLookup) ? sampleLookup : (sampleLookup.results || []);
      if (sampleArray.length > 0 && sampleArray[0].translations) {
        detectedLanguages = Object.keys(sampleArray[0].translations).sort();
      }
    }
    console.log('[EN-TH] Available languages:', detectedLanguages);

    // Translate word - handle both function signature styles
    let translations: string[] = [];
    if (typeof translate === 'function') {
      const result = translate(word, from, to);
      translations = Array.isArray(result) ? result : (result.translations || []);
    }
    console.log('[EN-TH] Translations found:', translations);

    // Get full synset information
    const synsets = lookup(word, from) || [];
    let synsetArray = Array.isArray(synsets) ? synsets : (synsets.results || []);
    
    // Filter out synsets that don't have translations in the target language
    // This removes generic/placeholder ILIs like "in" that have no translations
    synsetArray = synsetArray.filter((s: any) => {
      if (!s.translations || !s.translations[to]) return false;
      return s.translations[to].length > 0;
    });
    
    console.log('[EN-TH] Synsets found:', synsetArray.length);

    // Debug: Check if word exists in dictionary at all
    const wordKey = `${word.toLowerCase()}:${from}`;
    console.log('[EN-TH] Looking up key:', wordKey);

    // Provide helpful message if word not found
    if (synsetArray.length === 0) {
      return NextResponse.json({
        word,
        from,
        to,
        translations: [],
        synsets: [],
        message: `Word "${word}" not found in dictionary. This dictionary contains the top 1000 most common words. Try words like: computer, water, technology, etc.`,
        meta: {
          languages: languages || ['en', 'th'],
          memoryOptimized: true,
          dictionaryType: 'language-pair',
          dictionaryStats: meta
        },
        debug: {
          wordKey,
          synsetsFound: 0,
          translationsFound: 0
        }
      }, { status: 404 });
    }

    // Use detected languages from earlier, or detect from current synsets
    if (!detectedLanguages || detectedLanguages.length === 1) {
      const langSet = new Set<string>();
      synsetArray.forEach((s: any) => {
        if (s.translations) {
          Object.keys(s.translations).forEach(lang => langSet.add(lang));
        }
      });
      if (langSet.size > 0) {
        detectedLanguages = Array.from(langSet).sort();
      } else if (!detectedLanguages || detectedLanguages.length === 1) {
        detectedLanguages = ['en', 'th']; // Default fallback
      }
    }

    return NextResponse.json({
      word,
      from,
      to,
      translations,
      synsets: synsetArray.map((s: any) => ({
        ili: s.ili,
        pos: s.pos,
        definition: s.definition,
        translations: s.translations || {}
      })),
      meta: {
        languages: detectedLanguages,
        memoryOptimized: true,
        dictionaryType: 'language-pair',
        dictionaryStats: meta
      },
      debug: {
        wordKey,
        synsetsFound: synsetArray.length,
        translationsFound: translations.length,
        availableLanguages: detectedLanguages
      }
    });
  } catch (error) {
    console.error('EN-TH Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/translate/en-th
 *
 * Batch translation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, from = 'en', to = 'th' } = body;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: words (array)' },
        { status: 400 }
      );
    }

    const dictModule = await getDictionary();
    const dict = dictModule.default || dictModule;
    const { translate } = dict;

    const results = words.map(word => {
      const result = translate(word, from, to);
      return {
        word,
        translations: Array.isArray(result) ? result : (result.translations || [])
      };
    });

    return NextResponse.json({
      from,
      to,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    return NextResponse.json(
      { error: 'Batch translation failed' },
      { status: 500 }
    );
  }
}

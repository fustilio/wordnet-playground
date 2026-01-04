import { NextRequest, NextResponse } from 'next/server';

/**
 * Thai-French Translation API
 *
 * This endpoint imports ONLY the th-fr language pair dictionary,
 * minimizing memory usage in serverless environments.
 *
 * Memory usage: ~80-120 KB (vs ~200 KB for multilingual)
 */

// Dynamically import the th-fr dictionary only when this endpoint is called
let dictModule: any = null;

async function getDictionary() {
  if (!dictModule) {
    dictModule = await import('../../../../dict-th-fr.js');
  }
  return dictModule;
}

/**
 * GET /api/translate/th-fr?word=<word>&from=<lang>&to=<lang>
 *
 * Bidirectional translation: th→fr or fr→th
 *
 * Examples:
 * - /api/translate/th-fr?word=คอมพิวเตอร์&from=th&to=fr
 * - /api/translate/th-fr?word=ordinateur&from=fr&to=th
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');
  const from = searchParams.get('from') || 'th';
  const to = searchParams.get('to') || 'fr';

  if (!word) {
    return NextResponse.json(
      { error: 'Missing required parameter: word' },
      { status: 400 }
    );
  }

  // Validate language pair
  if (!['th', 'fr'].includes(from) || !['th', 'fr'].includes(to)) {
    return NextResponse.json(
      {
        error: 'Invalid language pair. This endpoint supports only th-fr translations.',
        supportedLanguages: ['th', 'fr']
      },
      { status: 400 }
    );
  }

  try {
    const dictModule = await getDictionary();
    // Handle both default export and named exports
    const dict = dictModule.default || dictModule;
    const { lookup, translate, meta, languages } = dict;

    console.log('[TH-FR] Translation request:', { word, from, to });
    console.log('[TH-FR] Dictionary metadata:', meta);
    console.log('[TH-FR] Available languages:', languages);

    // Translate word - handle both function signature styles
    let translations: string[] = [];
    if (typeof translate === 'function') {
      const result = translate(word, from, to);
      translations = Array.isArray(result) ? result : (result.translations || []);
    }
    console.log('[TH-FR] Translations found:', translations);

    // Get full synset information
    const synsets = lookup(word, from) || [];
    let synsetArray = Array.isArray(synsets) ? synsets : (synsets.results || []);
    
    // Filter out synsets that don't have translations in the target language
    // This removes generic/placeholder ILIs like "in" that have no translations
    synsetArray = synsetArray.filter((s: any) => {
      if (!s.translations || !s.translations[to]) return false;
      return s.translations[to].length > 0;
    });
    
    console.log('[TH-FR] Synsets found:', synsetArray.length);

    // Provide helpful message if word not found
    if (synsetArray.length === 0) {
      return NextResponse.json({
        word,
        from,
        to,
        translations: [],
        synsets: [],
        message: `Word "${word}" not found in dictionary. This dictionary contains the top 1000 most common words.`,
        meta: {
          languages: languages || ['th', 'fr'],
          memoryOptimized: true,
          dictionaryType: 'language-pair',
          dictionaryStats: meta
        },
        debug: {
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
        detectedLanguages = ['th', 'fr']; // Default fallback
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
        synsetsFound: synsetArray.length,
        translationsFound: translations.length,
        availableLanguages: detectedLanguages
      }
    });
  } catch (error) {
    console.error('TH-FR Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/translate/th-fr
 *
 * Batch translation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words, from = 'th', to = 'fr' } = body;

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

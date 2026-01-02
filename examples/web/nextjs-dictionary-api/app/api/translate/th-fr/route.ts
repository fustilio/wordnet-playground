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
    const dict = await getDictionary();

    console.log('[TH-FR] Translation request:', { word, from, to });
    console.log('[TH-FR] Dictionary metadata:', dict.meta);

    // Translate word
    const translations = dict.translate(word, from, to);
    console.log('[TH-FR] Translations found:', translations);

    // Get full synset information
    const synsets = dict.lookup(word, from);
    console.log('[TH-FR] Synsets found:', synsets.length);

    return NextResponse.json({
      word,
      from,
      to,
      translations,
      synsets: synsets.map((s: any) => ({
        ili: s.ili,
        pos: s.pos,
        definition: s.definition
      })),
      meta: {
        languages: dict.languages,
        memoryOptimized: true,
        dictionaryType: 'language-pair',
        dictionaryStats: dict.meta
      },
      debug: {
        synsetsFound: synsets.length,
        translationsFound: translations.length
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

    const dict = await getDictionary();

    const results = words.map(word => ({
      word,
      translations: dict.translate(word, from, to)
    }));

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

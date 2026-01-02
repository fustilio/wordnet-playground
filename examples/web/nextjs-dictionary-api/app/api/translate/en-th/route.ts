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
    const dict = await getDictionary();

    // Translate word
    const translations = dict.translate(word, from, to);

    // Get full synset information
    const synsets = dict.lookup(word, from);

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
        dictionaryType: 'language-pair'
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

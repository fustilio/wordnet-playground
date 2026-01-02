import { NextRequest, NextResponse } from 'next/server';
import { createDictionary } from 'wn-serverless-dict';
import type { DictionaryData } from 'wn-serverless-dict/types';

// Import the pre-generated serverless dictionary
// Auto-generated when running 'pnpm dev' or 'pnpm build'
import dictData from '../../../serverless-dict.json';

// Create dictionary instance with utilities
const dict = createDictionary(dictData as DictionaryData);

/**
 * GET /api/dictionary?word=<word>&lang=<lang>&action=<action>
 *
 * Actions:
 * - lookup: Get all synsets for a word (default)
 * - translate: Translate word (requires fromLang and toLang params)
 * - define: Get definitions only
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');
  const lang = searchParams.get('lang') || 'en';
  const action = searchParams.get('action') || 'lookup';

  if (!word) {
    return NextResponse.json(
      { error: 'Missing required parameter: word' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'lookup': {
        const result = dict.lookup(word, lang);
        return NextResponse.json({
          ...result,
          meta: dict.getMetadata()
        });
      }

      case 'translate': {
        const fromLang = searchParams.get('fromLang') || 'en';
        const toLang = searchParams.get('toLang');

        if (!toLang) {
          return NextResponse.json(
            { error: 'Missing required parameter: toLang' },
            { status: 400 }
          );
        }

        const result = dict.translate(word, fromLang, toLang);
        return NextResponse.json(result);
      }

      case 'define': {
        const result = dict.define(word, lang);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Dictionary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dictionary/stats
 * Get dictionary statistics
 */
export async function HEAD() {
  const stats = dict.getStats();
  return NextResponse.json(stats);
}

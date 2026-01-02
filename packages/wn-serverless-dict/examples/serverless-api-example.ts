/**
 * Example: Serverless API with Language-Pair Dictionaries
 *
 * This example shows how to create memory-efficient serverless APIs
 * by importing only the specific language pair needed for each endpoint.
 */

/**
 * English-Thai Translation API
 * Import only en-th dictionary to minimize memory
 */
// Example file: api/translate-en-th.ts
export async function translateEnTh(request: Request) {
  // Import ONLY the en-th dictionary
  // This keeps memory usage low in serverless environments
  const { lookup, translate } = await import('../dict-en-th.js');

  const url = new URL(request.url);
  const word = url.searchParams.get('word');
  const from = url.searchParams.get('from') || 'en';
  const to = url.searchParams.get('to') || 'th';

  if (!word) {
    return new Response(JSON.stringify({ error: 'Missing word parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Translate word
  const translations = translate(word, from, to);

  // Get definitions
  const synsets = lookup(word, from);

  return new Response(JSON.stringify({
    word,
    from,
    to,
    translations,
    definitions: synsets.map(s => ({
      pos: s.pos,
      definition: s.definition,
      ili: s.ili
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * English-French Translation API
 * Import only en-fr dictionary
 */
// Example file: api/translate-en-fr.ts
export async function translateEnFr(request: Request) {
  // Import ONLY the en-fr dictionary
  const { lookup, translate } = await import('../dict-en-fr.js');

  const url = new URL(request.url);
  const word = url.searchParams.get('word');
  const from = url.searchParams.get('from') || 'en';
  const to = url.searchParams.get('to') || 'fr';

  if (!word) {
    return new Response(JSON.stringify({ error: 'Missing word parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const translations = translate(word, from, to);
  const synsets = lookup(word, from);

  return new Response(JSON.stringify({
    word,
    from,
    to,
    translations,
    definitions: synsets.map(s => ({
      pos: s.pos,
      definition: s.definition,
      ili: s.ili
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Thai-French Translation API
 * Import only th-fr dictionary
 */
// Example file: api/translate-th-fr.ts
export async function translateThFr(request: Request) {
  // Import ONLY the th-fr dictionary
  const { lookup, translate } = await import('../dict-th-fr.js');

  const url = new URL(request.url);
  const word = url.searchParams.get('word');
  const from = url.searchParams.get('from') || 'th';
  const to = url.searchParams.get('to') || 'fr';

  if (!word) {
    return new Response(JSON.stringify({ error: 'Missing word parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const translations = translate(word, from, to);
  const synsets = lookup(word, from);

  return new Response(JSON.stringify({
    word,
    from,
    to,
    translations,
    definitions: synsets.map(s => ({
      pos: s.pos,
      definition: s.definition,
      ili: s.ili
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * AWS Lambda Example
 */
export const lambdaHandlerEnTh = async (event: any) => {
  const { lookup, translate } = await import('../dict-en-th.js');

  const word = event.queryStringParameters?.word;
  const from = event.queryStringParameters?.from || 'en';
  const to = event.queryStringParameters?.to || 'th';

  if (!word) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing word parameter' })
    };
  }

  const translations = translate(word, from, to);
  const synsets = lookup(word, from);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word,
      from,
      to,
      translations,
      definitions: synsets.map(s => ({
        pos: s.pos,
        definition: s.definition
      }))
    })
  };
};

/**
 * Vercel Edge Function Example
 */
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Route to specific language pair based on path
  if (path === '/api/translate/en-th') {
    return translateEnTh(request);
  } else if (path === '/api/translate/en-fr') {
    return translateEnFr(request);
  } else if (path === '/api/translate/th-fr') {
    return translateThFr(request);
  }

  return new Response(JSON.stringify({
    error: 'Unknown endpoint',
    availableEndpoints: [
      '/api/translate/en-th',
      '/api/translate/en-fr',
      '/api/translate/th-fr'
    ]
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Usage Examples:
 *
 * 1. Translate English to Thai:
 *    GET /api/translate/en-th?word=computer&from=en&to=th
 *
 * 2. Translate Thai to English:
 *    GET /api/translate/en-th?word=คอมพิวเตอร์&from=th&to=en
 *
 * 3. Translate English to French:
 *    GET /api/translate/en-fr?word=computer&from=en&to=fr
 *
 * 4. Translate French to English:
 *    GET /api/translate/en-fr?word=ordinateur&from=fr&to=en
 *
 * 5. Translate Thai to French:
 *    GET /api/translate/th-fr?word=คอมพิวเตอร์&from=th&to=fr
 *
 * Benefits:
 * - Each endpoint imports ONLY its language pair
 * - Lower memory usage (e.g., 50KB instead of 200KB)
 * - Faster cold starts
 * - Better performance in memory-constrained environments
 */

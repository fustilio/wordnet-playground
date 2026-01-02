'use client';

import { useState } from 'react';

type LanguagePair = 'en-th' | 'en-fr' | 'th-fr';
type Action = 'lookup' | 'translate' | 'define';

export default function Home() {
  const [word, setWord] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<Action>('translate');
  const [languagePair, setLanguagePair] = useState<LanguagePair>('en-th');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('th');

  // Update fromLang and toLang when language pair changes
  const handleLanguagePairChange = (pair: LanguagePair) => {
    setLanguagePair(pair);
    const [lang1, lang2] = pair.split('-');
    setFromLang(lang1);
    setToLang(lang2);
  };

  const handleSearch = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      let url = '';

      if (action === 'translate') {
        // Use language-pair specific endpoint
        url = `/api/translate/${languagePair}?word=${encodeURIComponent(word)}&from=${fromLang}&to=${toLang}`;
      } else {
        // Use general dictionary endpoint for lookup/define
        url = `/api/dictionary?word=${encodeURIComponent(word)}&action=${action}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      setResults({ error: 'Failed to fetch results' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">WordNet Dictionary API</h1>
        <p className="text-gray-600 mb-2">Serverless-optimized multilingual dictionary with language-pair endpoints</p>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Memory Efficient</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">ILI-Based</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Bidirectional</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter a word (e.g., computer, ordinateur, คอมพิวเตอร์)..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="lookup"
                  checked={action === 'lookup'}
                  onChange={() => setAction('lookup')}
                  className="mr-2"
                />
                <span className="text-sm">Lookup (General)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="define"
                  checked={action === 'define'}
                  onChange={() => setAction('define')}
                  className="mr-2"
                />
                <span className="text-sm">Define</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value="translate"
                  checked={action === 'translate'}
                  onChange={() => setAction('translate')}
                  className="mr-2"
                />
                <span className="text-sm">Translate (Language Pairs)</span>
              </label>
            </div>
          </div>

          {action === 'translate' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language Pair Endpoint
                <span className="ml-2 text-xs text-gray-500">(Each endpoint loads only 2 languages for efficiency)</span>
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="languagePair"
                    value="en-th"
                    checked={languagePair === 'en-th'}
                    onChange={() => handleLanguagePairChange('en-th')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">🇬🇧 English ↔ 🇹🇭 Thai</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="languagePair"
                    value="en-fr"
                    checked={languagePair === 'en-fr'}
                    onChange={() => handleLanguagePairChange('en-fr')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">🇬🇧 English ↔ 🇫🇷 French</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="languagePair"
                    value="th-fr"
                    checked={languagePair === 'th-fr'}
                    onChange={() => handleLanguagePairChange('th-fr')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">🇹🇭 Thai ↔ 🇫🇷 French</span>
                </label>
              </div>

              <div className="flex gap-4 items-center">
                <label className="text-sm">
                  Direction:
                </label>
                <select
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  {languagePair.split('-').map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
                <span>→</span>
                <select
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  {languagePair.split('-').map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                <strong>Memory Savings:</strong> ~80KB per endpoint vs ~200KB for multilingual (60% reduction)
              </div>
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="p-6 bg-green-50 rounded-lg">
          <h3 className="font-bold mb-3 text-green-900">🚀 Language-Pair Endpoints (Memory Optimized)</h3>
          <p className="text-sm text-green-800 mb-3">Each endpoint imports only the specific language pair, reducing memory by 60%</p>
          <ul className="space-y-2 text-sm">
            <li>
              <code className="bg-white px-2 py-1 rounded block">
                GET /api/translate/en-th?word=computer&from=en&to=th
              </code>
              <span className="text-xs text-green-700 ml-2">~80KB memory</span>
            </li>
            <li>
              <code className="bg-white px-2 py-1 rounded block">
                GET /api/translate/en-fr?word=computer&from=en&to=fr
              </code>
              <span className="text-xs text-green-700 ml-2">~80KB memory</span>
            </li>
            <li>
              <code className="bg-white px-2 py-1 rounded block">
                GET /api/translate/th-fr?word=คอมพิวเตอร์&from=th&to=fr
              </code>
              <span className="text-xs text-green-700 ml-2">~80KB memory</span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-3">📚 General Dictionary Endpoints</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <code className="bg-white px-2 py-1 rounded block">
                GET /api/dictionary?word=computer&action=lookup
              </code>
            </li>
            <li>
              <code className="bg-white px-2 py-1 rounded block">
                GET /api/dictionary?word=computer&action=define
              </code>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 rounded-lg">
          <h3 className="font-bold mb-2 text-purple-900">💡 Key Benefits</h3>
          <ul className="space-y-1 text-sm text-purple-800">
            <li>✓ <strong>60% memory reduction</strong> - Load only the languages you need</li>
            <li>✓ <strong>Bidirectional translation</strong> - en→th and th→en in the same endpoint</li>
            <li>✓ <strong>ILI-based linking</strong> - Cross-language concept matching</li>
            <li>✓ <strong>Serverless optimized</strong> - Perfect for Lambda, Vercel, Cloudflare Workers</li>
            <li>✓ <strong>Faster cold starts</strong> - Smaller bundles = faster initialization</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

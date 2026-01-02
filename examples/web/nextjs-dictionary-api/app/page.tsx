'use client';

import { useState } from 'react';

export default function Home() {
  const [word, setWord] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'lookup' | 'translate' | 'define'>('lookup');
  const [toLang, setToLang] = useState('fr');

  const handleSearch = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      let url = `/api/dictionary?word=${encodeURIComponent(word)}&action=${action}`;
      if (action === 'translate') {
        url += `&fromLang=en&toLang=${toLang}`;
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
      <h1 className="text-4xl font-bold mb-2">WordNet Dictionary API</h1>
      <p className="text-gray-600 mb-8">Serverless-optimized multilingual dictionary</p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter a word..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="action"
              value="lookup"
              checked={action === 'lookup'}
              onChange={() => setAction('lookup')}
              className="mr-2"
            />
            Lookup
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="action"
              value="define"
              checked={action === 'define'}
              onChange={() => setAction('define')}
              className="mr-2"
            />
            Define
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="action"
              value="translate"
              checked={action === 'translate'}
              onChange={() => setAction('translate')}
              className="mr-2"
            />
            Translate to
          </label>
          {action === 'translate' && (
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
            </select>
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

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">API Endpoints</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <code className="bg-white px-2 py-1 rounded">
              GET /api/dictionary?word=computer&action=lookup
            </code>
          </li>
          <li>
            <code className="bg-white px-2 py-1 rounded">
              GET /api/dictionary?word=computer&action=define
            </code>
          </li>
          <li>
            <code className="bg-white px-2 py-1 rounded">
              GET /api/dictionary?word=computer&action=translate&fromLang=en&toLang=fr
            </code>
          </li>
        </ul>
      </div>
    </main>
  );
}

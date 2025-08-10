import React from 'react';

export const DemoDataSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">WordNet Data Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">Real WordNet Data Sources</h4>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Open English WordNet (OEWN):</strong> Community-driven English WordNet</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Princeton WordNet:</strong> Original English WordNet</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>MultiWordNet:</strong> Multilingual WordNet resources</span>
            </li>
          </ul>
          <p className="text-blue-700 text-sm mt-4 italic">Note: This demo currently uses a test database. Real WordNet data loading will be implemented soon.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="text-lg font-semibold text-green-900 mb-4">Data Schema</h4>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Words:</strong> Lemmas, parts of speech, languages</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Synsets:</strong> Sets of synonymous words</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Senses:</strong> Word-synset relationships</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Definitions:</strong> Synset definitions</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">•</span>
              <span><strong>Relations:</strong> Synset relationships</span>
            </li>
          </ul>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h4 className="text-lg font-semibold text-purple-900 mb-4">Features</h4>
          <ul className="space-y-2 text-purple-800">
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Real database schema</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Performance optimized</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>OPFS integration</span>
            </li>
            <li className="flex items-center">
              <span className="text-yellow-600 mr-2">🔄</span>
              <span>Real data loading (coming soon)</span>
            </li>
            <li className="flex items-center">
              <span className="text-yellow-600 mr-2">🔄</span>
              <span>Multi-language support</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 
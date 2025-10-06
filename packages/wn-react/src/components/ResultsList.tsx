/**
 * Results list component - displays search results
 */

import React from 'react';
import { useWordNetContext } from '../providers/WordNetProvider.js';
import type { Synset } from 'wn-ts-core';

export interface ResultsListProps {
  className?: string;
  renderResult?: (result: Synset) => React.ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function ResultsList({ 
  className = '',
  renderResult,
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...'
}: ResultsListProps) {
  const { results, loading, error } = useWordNetContext();

  if (loading) {
    return (
      <div className={`results-list loading ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`results-list error ${className}`}>
        <div className="text-red-600 py-4">
          Error: {error.message}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`results-list empty ${className}`}>
        <div className="text-gray-500 py-4 text-center">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`results-list ${className}`}>
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            {renderResult ? (
              renderResult(result)
            ) : (
              <DefaultResultRenderer result={result} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultResultRenderer({ result }: { result: Synset }) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">
        Synset {result.id}
      </h3>
      <p className="text-gray-600 mb-2">
        <span className="font-medium">Part of Speech:</span> {result.pos}
      </p>
      {result.definitions && result.definitions.length > 0 && (
        <div className="mb-2">
          <p className="font-medium text-gray-700">Definition:</p>
          <p className="text-gray-600">{result.definitions[0].text}</p>
        </div>
      )}
      {result.examples && result.examples.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">Example:</p>
          <p className="text-gray-600 italic">"{result.examples[0].text}"</p>
        </div>
      )}
    </div>
  );
}

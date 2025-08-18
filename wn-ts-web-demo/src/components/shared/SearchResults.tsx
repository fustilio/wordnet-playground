import React from 'react';

interface SearchResultsProps {
  title: string;
  results: any;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ title, results, className = '' }) => {
  if (!results) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
      {results.error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {results.error}
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-md">
          <div className="text-xs">
            {Array.isArray(results) ? (
              <div className="space-y-2">
                {results.length === 0 ? (
                  <div className="text-gray-500">No results found.</div>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

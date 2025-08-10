import React from 'react';

interface ResultsSectionProps {
  activeTab: string;
  searchTerm: string;
  searchResults: any;
  stats: any;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  activeTab,
  searchTerm,
  searchResults,
  stats
}) => {
  return (
    <div className="results-section">
      {activeTab === 'stats' ? (
        <div className="stats-container">
          <h3>WordNet Statistics</h3>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Database Statistics</h4>
                <pre>{JSON.stringify(stats.statistics, null, 2)}</pre>
              </div>
              <div className="stat-card">
                <h4>Part of Speech Distribution</h4>
                <pre>{JSON.stringify(stats.posDistribution, null, 2)}</pre>
              </div>
              <div className="stat-card">
                <h4>Lexicon Statistics</h4>
                <pre>{JSON.stringify(stats.lexiconStats, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p>Loading statistics...</p>
          )}
        </div>
      ) : (
        <div className="results-container">
          <h3>Search Results for "{searchTerm}"</h3>
          {searchResults ? (
            <div className="results">
              {searchResults.error ? (
                <div className="error-message">
                  <p>Error: {searchResults.error}</p>
                </div>
              ) : (
                <pre className="results-json">
                  {JSON.stringify(searchResults, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="no-results">
              <p>Click "Search" to find results</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
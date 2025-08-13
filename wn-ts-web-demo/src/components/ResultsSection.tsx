import React from 'react';
import type { StatisticsBundle } from '../types';

interface ResultsSectionProps {
  activeTab: string;
  searchTerm: string;
  searchResults: unknown;
  stats: StatisticsBundle | null;
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
              {typeof searchResults === 'object' && searchResults !== null && 'error' in (searchResults as any) ? (
                <div className="error-message">
                  <p>Error: {(searchResults as any).error}</p>
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
import React from 'react';
import { Card } from '../shared/Card';

interface StatisticsWidgetProps {
  stats: any;
  onRefresh?: () => void;
}

export const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <Card title="Database Statistics">
        <div data-testid="database-stats">
          <p className="text-sm text-gray-500">No statistics available. Load a lexicon to see statistics.</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          )}
        </div>
      </Card>
    );
  }

  const { statistics, posDistribution } = stats;

  // Add defensive check for statistics
  if (!statistics) {
    return (
      <Card title="Database Statistics">
        <div data-testid="database-stats">
          <p className="text-sm text-gray-500">Statistics not available. Load a lexicon to see statistics.</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Database Statistics">
      <div data-testid="database-stats" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-700">Totals</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Refresh statistics"
            >
              🔄
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <p>Words:</p><p className="font-mono text-right">{statistics.totalWords?.toLocaleString() || '0'}</p>
          <p>Synsets:</p><p className="font-mono text-right">{statistics.totalSynsets?.toLocaleString() || '0'}</p>
          <p>Senses:</p><p className="font-mono text-right">{statistics.totalSenses?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <h3 className="text-md font-semibold text-gray-700">Part of Speech</h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {posDistribution && Object.entries(posDistribution).map(([pos, count]) => (
              <React.Fragment key={pos}>
                <p>{pos.toUpperCase()}:</p><p className="font-mono text-right">{(count as number).toLocaleString()}</p>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

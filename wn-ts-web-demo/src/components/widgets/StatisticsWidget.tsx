import React from 'react';
import { Card } from '../shared/Card';

interface StatisticsWidgetProps {
  stats: any;
}

export const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({ stats }) => {
  if (!stats) {
    return (
      <Card title="Database Statistics">
        <div data-testid="database-stats">
          <p className="text-sm text-gray-500">No statistics available. Load a lexicon to see statistics.</p>
        </div>
      </Card>
    );
  }

  const { statistics, posDistribution } = stats;

  return (
    <Card title="Database Statistics">
      <div data-testid="database-stats" className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-gray-700">Totals</h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <p>Words:</p><p className="font-mono text-right">{statistics.totalWords?.toLocaleString()}</p>
            <p>Synsets:</p><p className="font-mono text-right">{statistics.totalSynsets?.toLocaleString()}</p>
            <p>Senses:</p><p className="font-mono text-right">{statistics.totalSenses?.toLocaleString()}</p>
          </div>
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

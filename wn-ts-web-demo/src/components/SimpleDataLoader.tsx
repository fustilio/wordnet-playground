import React, { useState } from 'react';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('SimpleDataLoader');

interface Statistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
}

export const SimpleDataLoader: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    logger.start('demo data load');
    logger.step('starting demo data load');
    
    setLoading(true);
    try {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockStats: Statistics = {
        totalWords: 155287,
        totalSynsets: 117659,
        totalSenses: 206941
      };
      
      logger.success('Demo data loaded successfully', { 
        totalWords: mockStats.totalWords,
        totalSynsets: mockStats.totalSynsets,
        totalSenses: mockStats.totalSenses
      });
      
      setStats(mockStats);
      logger.end('demo data load', mockStats);
    } catch (error) {
      logger.fail('Demo data load failed', error);
      logger.end('demo data load');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={loadData}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Load Demo Data'}
      </button>
      
      {stats && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-blue-600">{stats.totalWords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-green-600">{stats.totalSynsets.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Synsets</div>
            </div>
            <div className="text-center p-3 bg-gray-100 rounded">
              <div className="text-2xl font-bold text-purple-600">{stats.totalSenses.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Senses</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
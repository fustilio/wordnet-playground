import React, { useState, useEffect } from 'react';
import { createWordNetInstance } from 'wn-ts-web';

interface Statistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
}

export const SimpleDataLoader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Starting data load in React component...');
        
        // Create WordNet instance
        console.log('🔧 Creating WordNet instance...');
        const instance = await createWordNetInstance();
        console.log('✅ WordNet instance created');
        
        // Check initial statistics
        console.log('📊 Checking initial statistics...');
        const initialStats = await instance.dataLoader.getStatistics();
        console.log('📊 Initial stats:', initialStats);
        
        // Load data
        console.log('📦 Loading oewn:2024...');
        await instance.dataLoader.downloadAndLoad('oewn:2024', {
          progress: (p: number) => {
            console.log(`📈 Progress: ${(p * 100).toFixed(1)}%`);
            setProgress(p);
          }
        });
        
        // Get final statistics
        console.log('📊 Getting final statistics...');
        const finalStats = await instance.dataLoader.getStatistics();
        console.log('📊 Final stats:', finalStats);
        
        setStatistics({
          totalWords: finalStats.totalWords,
          totalSynsets: finalStats.totalSynsets,
          totalSenses: finalStats.totalSenses,
        });
        
        setLoading(false);
        console.log('✅ Data loading completed in React component!');
        
      } catch (err) {
        console.error('❌ Data loading failed in React component:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h2 className="text-lg font-semibold mb-2">Loading WordNet Data...</h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Progress: {(progress * 100).toFixed(1)}%
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h2 className="text-lg font-semibold mb-2 text-red-800">Error Loading Data</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h2 className="text-lg font-semibold mb-2">No Data Available</h2>
        <p className="text-yellow-600">Statistics not available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h2 className="text-lg font-semibold mb-2 text-green-800">WordNet Data Loaded Successfully!</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{statistics.totalWords.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Words</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{statistics.totalSynsets.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Synsets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{statistics.totalSenses.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Senses</div>
        </div>
      </div>
      <p className="text-sm text-green-600 mt-2">✅ Real WordNet data loaded with statistics!</p>
    </div>
  );
}; 
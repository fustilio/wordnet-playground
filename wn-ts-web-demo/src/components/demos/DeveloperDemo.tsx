import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('DeveloperDemo');

export const DeveloperDemo: React.FC = () => {
  const { unloadData, getCacheInfo } = useWordNetContext();
  const [cacheInfo, setCacheInfo] = React.useState<any>(null);
  
  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Recommended for testing and development features',
      priority: 'medium' as const
    }
  ];
  
  const handleGetCacheInfo = async () => {
    logger.start('getting cache info');
    
    try {
      const info = await getCacheInfo();
      logger.success('Cache info retrieved successfully');
      setCacheInfo(info);
      logger.end('getting cache info', info);
    } catch (error) {
      logger.fail('Failed to get cache info', error);
      logger.end('getting cache info');
    }
  };

  const handleUnloadData = async () => {
    logger.start('unloading data');
    
    try {
      await unloadData();
      logger.success('Data unloaded successfully');
      logger.end('unloading data');
    } catch (error) {
      logger.fail('Failed to unload data', error);
      logger.end('unloading data');
    }
  };

  return (
    <Card title="Developer Tools">
       <div className="space-y-6">
        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />
        
        <div>
          <h3 className="font-semibold text-gray-700">Cache & Storage</h3>
          <p className="text-sm text-gray-600 mb-2">Inspect browser cache and storage.</p>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={handleGetCacheInfo}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Inspect Cache
            </button>
             <button
              onClick={handleUnloadData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Clear DB Data
            </button>
          </div>
          {cacheInfo && (
            <div className="mt-4 max-h-64 overflow-y-auto bg-gray-50 p-3 rounded-md">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(cacheInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('DeveloperDemo');

export const DeveloperDemo: React.FC = () => {
  const { unloadData, testMemoryQueries } = useWordNetContext();
  
  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Recommended for testing and development features',
      priority: 'medium' as const
    }
  ];
  


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

  const handleTestMemoryQueries = async () => {
    logger.start('testing memory queries');
    
    try {
      const results = await testMemoryQueries();
      logger.success('Memory test completed', { results });
      logger.end('testing memory queries');
      
      // Log results to console for debugging
      console.log('🔍 Memory Test Results:', results);
    } catch (error) {
      logger.fail('Memory test failed', error);
      logger.end('testing memory queries');
    }
  };

  return (
    <Card title="Developer Tools">
       <div className="space-y-6">
        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />
        
        <div>
          <h3 className="font-semibold text-gray-700">Database Management</h3>
          <p className="text-sm text-gray-600 mb-2">Manage WordNet database data.</p>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={handleUnloadData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Clear DB Data
            </button>
            <button
              onClick={handleTestMemoryQueries}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Test Memory Queries
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

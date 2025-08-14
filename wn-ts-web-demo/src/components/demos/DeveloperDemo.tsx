import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('DeveloperDemo');

export const DeveloperDemo: React.FC = () => {
  const { unloadData } = useWordNetContext();
  
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
          </div>
        </div>
      </div>
    </Card>
  );
};

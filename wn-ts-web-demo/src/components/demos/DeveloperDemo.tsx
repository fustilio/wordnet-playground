import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from "wn-ts-web/react";
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from 'utils/logger';
import { SequentialRunner } from '../../examples/SequentialRunner';
import { ProxyStatus } from '../ProxyStatus';
import { PerformanceMonitor } from '../developer-tools/PerformanceMonitor';

const logger = createScopedLogger('DeveloperDemo');

export const DeveloperDemo: React.FC = () => {
  const { testMemoryQueries } = useWordNetContext();
  
  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Recommended for testing and development features',
      priority: 'medium' as const
    }
  ];

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
    <div className="space-y-6">
      <Card title="Developer Tools & Tests">
        <div className="space-y-6">
          <LexiconRequirements requirements={lexiconRequirements} />
          
          <SequentialRunner />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProxyStatus />
            <PerformanceMonitor />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Actions</h3>
            <p className="text-sm text-gray-600 mb-2">Run specific developer actions.</p>
            <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

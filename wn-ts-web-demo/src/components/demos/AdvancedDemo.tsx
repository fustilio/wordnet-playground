import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('AdvancedDemo');

export const AdvancedDemo: React.FC = () => {
  const { availablePackages, loadPackageData, loadedPackages } = useWordNetContext();
  
  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for advanced data management features',
      priority: 'high' as const
    }
  ];
  
  const handleLoadPackage = async (packageId: string) => {
    logger.start(`loading package ${packageId} for advanced demo`);
    
    try {
      await loadPackageData(packageId);
      logger.success('Package loaded successfully for advanced demo', { packageId });
      logger.end(`loading package ${packageId} for advanced demo`, { packageId });
    } catch (error) {
      logger.fail('Failed to load package for advanced demo', { packageId, error });
      logger.end(`loading package ${packageId} for advanced demo`);
    }
  };
  
  return (
    <Card title="Advanced Data Management">
      <div className="space-y-6">
        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />
        
        <div>
          <h3 className="font-semibold text-gray-700">Available Packages</h3>
          <p className="text-sm text-gray-600 mb-2">Click to load a WordNet package into the database.</p>
          <div className="flex flex-wrap gap-2">
            {availablePackages.map(pkg => (
              <button
                key={`${pkg.id}-${pkg.version}`}
                onClick={() => handleLoadPackage(`${pkg.id}:${pkg.version}`)}
                disabled={loadedPackages.includes(`${pkg.id}:${pkg.version}`)}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {pkg.label} ({pkg.version})
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

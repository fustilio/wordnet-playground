import React from 'react';
import { Card } from '../shared/Card';

type AdvancedDemoProps = {
  availablePackages: Array<{ id: string; label: string; language: string; version: string }>;
  loadedPackages: string[];
  loadPackageData: (projectIdWithVersion: string) => Promise<void>;
};

export const AdvancedDemo: React.FC<AdvancedDemoProps> = ({ 
  availablePackages, 
  loadPackageData, 
  loadedPackages
}) => {
  return (
    <Card title="Advanced Data Management">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700">Available Packages</h3>
          <p className="text-sm text-gray-600 mb-2">Click to load a WordNet package into the database.</p>
          <div className="flex flex-wrap gap-2">
            {availablePackages.map(pkg => (
              <button
                key={`${pkg.id}-${pkg.version}`}
                onClick={() => loadPackageData(`${pkg.id}:${pkg.version}`)}
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

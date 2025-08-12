import React from 'react';
import { Card } from '../shared/Card';
import type { useWordNet } from '../../hooks/useWordNet';
import type { useOPFS } from '../../hooks/useOPFS';

type AdvancedDemoProps = ReturnType<typeof useWordNet> & ReturnType<typeof useOPFS>;

export const AdvancedDemo: React.FC<AdvancedDemoProps> = ({ 
  availablePackages, 
  loadPackageData, 
  loadedPackages, 
  wordnet, 
  dataLoader,
  exportDatabase, 
  importDatabase,
  saveToOPFS,
  clearAllOPFS,
  getStorageInfo 
}) => {
  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  
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

        <div>
          <h3 className="font-semibold text-gray-700">Database Operations</h3>
          <p className="text-sm text-gray-600 mb-2">Export the current database or import one from your local machine.</p>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={() => exportDatabase(wordnet)}
              disabled={!wordnet}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              data-testid="export-db"
            >
              Export Database
            </button>
            <button
              onClick={() => importDatabase(dataLoader, setIsImporting, setImportProgress)}
              disabled={!wordnet || isImporting}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              data-testid="import-db"
            >
              {isImporting ? `Importing... ${importProgress}%` : 'Import Database'}
            </button>
            <button
              onClick={() => saveToOPFS(wordnet)}
              disabled={!wordnet}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
              data-testid="save-opfs"
            >
              Save to OPFS
            </button>
            <button
              onClick={async () => { await clearAllOPFS(); await getStorageInfo?.(); }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              data-testid="clear-opfs"
            >
              Clear OPFS
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

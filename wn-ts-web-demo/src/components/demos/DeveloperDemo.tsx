import React from 'react';
import { Card } from '../shared/Card';
import type { useWordNet } from '../../hooks/useWordNet';
import type { useOPFS } from '../../hooks/useOPFS';

type DeveloperDemoProps = ReturnType<typeof useWordNet> & ReturnType<typeof useOPFS>;

export const DeveloperDemo: React.FC<DeveloperDemoProps> = ({ wordnet, saveToOPFS, clearAllOPFS, unloadData, getCacheInfo }) => {
  const [cacheInfo, setCacheInfo] = React.useState<any>(null);
  
  const handleGetCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  return (
    <Card title="Developer Tools">
       <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700">Cache & Storage</h3>
          <p className="text-sm text-gray-600 mb-2">Manage browser cache and OPFS storage.</p>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={handleGetCacheInfo}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Inspect Cache
            </button>
             <button
              onClick={unloadData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Clear DB Data
            </button>
             <button
              onClick={clearAllOPFS}
              className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 transition-colors"
            >
              Clear All OPFS
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

        <div>
          <h3 className="font-semibold text-gray-700">OPFS Operations</h3>
          <p className="text-sm text-gray-600 mb-2">Save the current database state to a new file in OPFS.</p>
          <div className="flex space-x-2">
             <button
              onClick={() => saveToOPFS(wordnet)}
              disabled={!wordnet}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-400"
            >
              Save Snapshot to OPFS
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

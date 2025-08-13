import React from 'react';
import { Card } from '../shared/Card';
import type { useWordNet } from '../../hooks/useWordNet';
import type { useOPFS } from '../../hooks/useOPFS';

type DeveloperDemoProps = ReturnType<typeof useWordNet> & ReturnType<typeof useOPFS>;

export const DeveloperDemo: React.FC<DeveloperDemoProps> = ({ unloadData, getCacheInfo }) => {
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
          <p className="text-sm text-gray-600 mb-2">Inspect browser cache and storage.</p>
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

import React from 'react';
import { useWordNetCache } from '../../hooks/useWordNetCache';

export const CacheWidget: React.FC = () => {
  const cache = useWordNetCache();
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    // Initialize cache support check
    cache.checkOPFSSupport();
  }, [cache]);

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached WordNet databases? This will require re-downloading them next time.')) {
      const success = await cache.clearCache();
      if (success) {
        alert('Cache cleared successfully!');
      } else {
        alert('Failed to clear cache. Please try again.');
      }
    }
  };

  const handleRemovePackage = async (packageId: string) => {
    if (confirm(`Are you sure you want to remove ${packageId} from cache?`)) {
      const success = await cache.removeFromCache(packageId);
      if (success) {
        alert(`${packageId} removed from cache successfully!`);
      } else {
        alert(`Failed to remove ${packageId} from cache. Please try again.`);
      }
    }
  };

  const stats = cache.getCacheStats();

  return (
    <div className="bg-white rounded-lg shadow-md p-4" data-testid="cache-status">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Cache Status</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${stats.isSupported ? 'text-green-600' : 'text-red-600'}`}>
            {stats.isSupported ? 'Supported' : 'Not Supported'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Cached Files:</span>
          <span className="font-medium">{stats.totalFiles}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Size:</span>
          <span className="font-medium">{stats.totalSizeMB} MB</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Available Space:</span>
          <span className="font-medium">{stats.availableSpaceMB} MB</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cached Packages</h4>
            {cache.cacheStatus.files.length > 0 ? (
              <div className="space-y-2">
                {cache.cacheStatus.files.map((file) => (
                  <div key={file.filename} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{file.packageId}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(file.size / (1024 * 1024) * 100) / 100} MB • 
                        {new Date(file.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePackage(file.packageId)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No packages cached</div>
            )}
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cache Management</h4>
            <div className="space-y-2">
              <button
                onClick={handleClearCache}
                disabled={cache.cacheStatus.files.length === 0}
                className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Clear All Cache
              </button>
              <button
                onClick={() => cache.updateCacheInfo()}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Cache Info
              </button>
            </div>
          </div>

          {!stats.isSupported && (
            <div className="border-t pt-3">
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded">
                <strong>OPFS Not Supported:</strong> Your browser doesn't support the Origin Private File System, 
                so caching is not available. WordNet databases will be downloaded each time.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


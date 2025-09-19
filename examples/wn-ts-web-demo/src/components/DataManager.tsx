import React, { useState, useEffect } from 'react';
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('DataManager');

interface DataManagerProps {
  onUnloadData: () => Promise<void>;
  onClearCacheAndUnload: () => Promise<void>;
  getCacheInfo: () => Promise<any>;
  loading: boolean;
  loadedPackage?: string | null;
  loadedVersion?: string | null;
}

export const DataManager: React.FC<DataManagerProps> = ({
  onUnloadData,
  onClearCacheAndUnload,
  getCacheInfo,
  loading,
  loadedPackage,
  loadedVersion
}) => {

  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [refreshingCache, setRefreshingCache] = useState(false);

  const handleUnloadData = async () => {
    if (window.confirm('Are you sure you want to unload the current data? (Cache will be preserved)')) {
      logger.start('data unload');
      logger.step('confirming user action', { loadedPackage, loadedVersion });
      
      try {
        await onUnloadData();
        logger.success('Data unload completed successfully');
        logger.end('data unload');
      } catch (error) {
        logger.fail('Data unload failed', error);
        logger.end('data unload');
      }
    }
  };

  const handleClearCacheAndUnload = async () => {
    if (window.confirm('Are you sure you want to clear all cache and unload data? This will perform a full reset.')) {
      logger.start('cache clear and data unload');
      logger.step('confirming user action', { loadedPackage, loadedVersion });
      
      try {
        await onClearCacheAndUnload();
        logger.success('Cache clear and data unload completed successfully');
        logger.end('cache clear and data unload');
      } catch (error) {
        logger.fail('Cache clear and data unload failed', error);
        logger.end('cache clear and data unload');
      }
    }
  };

  const refreshCacheInfo = async () => {
    setRefreshingCache(true);
    logger.start('refreshing cache info');
    
    try {
      const info = await getCacheInfo();
      logger.success('Cache info refreshed successfully');
      logger.end('refreshing cache info', { 
        hasStorageQuota: !!info.hasStorageQuota,
        hasIndexedDB: !!info.hasIndexedDB,
        hasLocalStorage: !!info.hasLocalStorage,
        hasSessionStorage: !!info.hasSessionStorage
      });
      setCacheInfo(info);
    } catch (error) {
      logger.fail('Failed to get cache info', error);
      logger.end('refreshing cache info');
    } finally {
      setRefreshingCache(false);
    }
  };

  useEffect(() => {
    refreshCacheInfo();
  }, []);

  const formatBytes = (bytes: number | undefined) => {
    if (bytes === undefined) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (usage: number | undefined, quota: number | undefined) => {
    if (usage === undefined || quota === undefined || quota === 0) return 'Unknown';
    return `${((usage / quota) * 100).toFixed(1)}%`;
  };

  return (
    <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">🗄️ Data Management</h3>
      
      {/* Operation Mode Status - Temporarily disabled until worker integration is complete */}
      {/* <div className="operation-mode-status">
        <div className="status-indicator fallback-mode">
          <span className="status-icon">🔄</span>
          <span className="status-text">Fallback Mode</span>
          <span className="status-description">
            Running in main thread with graceful fallback
          </span>
        </div>
      </div> */}

      {/* Current Data Status */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Current Data Status</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          {loadedPackage && loadedVersion ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Loaded Package:</span> {loadedPackage}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Version:</span> {loadedVersion}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data currently loaded</p>
          )}
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Data Actions</h4>
        <div className="space-y-3">
          <button
            onClick={handleUnloadData}
            disabled={loading || !loadedPackage}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Unloading...
              </div>
            ) : (
              <>
                <span className="mr-2">🗑️</span>
                Unload Data (Keep Cache)
              </>
            )}
          </button>

          <button
            onClick={handleClearCacheAndUnload}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Clearing...
              </div>
            ) : (
              <>
                <span className="mr-2">🗑️🔥</span>
                Clear Cache & Unload (Full Reset)
              </>
            )}
          </button>

          <button
            onClick={async () => {
              try {
                await handleClearCacheAndUnload();
                // After clearing cache, refresh packages to show available ones
                await refreshCacheInfo();
              } catch (error) {
                console.error('Force reload failed:', error);
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Force Reloading...
              </div>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Force Reload All (Fresh Download)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cache Information */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium text-gray-800">Cache Information</h4>
          <button
            onClick={refreshCacheInfo}
            disabled={refreshingCache}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors duration-200"
          >
            {refreshingCache ? '🔄' : '🔄 Refresh'}
          </button>
        </div>

        <button
          onClick={() => setShowCacheInfo(!showCacheInfo)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center justify-between"
        >
          <span>📊 Storage & Cache Details</span>
          <span className="text-lg">{showCacheInfo ? '▼' : '▶'}</span>
        </button>

        {showCacheInfo && cacheInfo && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Storage Quota */}
            {cacheInfo.storageQuota && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Storage Quota</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Usage: {formatBytes(cacheInfo.storageQuota.usage)} 
                    ({formatPercentage(cacheInfo.storageQuota.usage, cacheInfo.storageQuota.quota)})
                  </p>
                  <p className="text-gray-600">
                    Quota: {formatBytes(cacheInfo.storageQuota.quota)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${cacheInfo.storageQuota.quota ? 
                          Math.min((cacheInfo.storageQuota.usage / cacheInfo.storageQuota.quota) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* IndexedDB */}
            {cacheInfo.indexedDB && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">IndexedDB</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Databases: {cacheInfo.indexedDB.count}
                  </p>
                  {cacheInfo.indexedDB.databases.length > 0 && (
                    <div className="ml-4">
                      {cacheInfo.indexedDB.databases.map((db: any, index: number) => (
                        <p key={index} className="text-gray-500 text-xs">
                          • {db.name} (v{db.version})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* localStorage */}
            {cacheInfo.localStorage && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">localStorage</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Keys: {cacheInfo.localStorage.count}
                  </p>
                  {cacheInfo.localStorage.keys.length > 0 && (
                    <div className="ml-4">
                      {cacheInfo.localStorage.keys.map((key: string, index: number) => (
                        <p key={index} className="text-gray-500 text-xs">
                          • {key}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* sessionStorage */}
            {cacheInfo.sessionStorage && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">sessionStorage</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Keys: {cacheInfo.sessionStorage.count}
                  </p>
                  {cacheInfo.sessionStorage.keys.length > 0 && (
                    <div className="ml-4">
                      {cacheInfo.sessionStorage.keys.map((key: string, index: number) => (
                        <p key={index} className="text-gray-500 text-xs">
                          • {key}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}; 
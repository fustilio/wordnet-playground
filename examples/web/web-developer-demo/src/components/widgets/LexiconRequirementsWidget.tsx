import React, { useState, useMemo } from 'react';
import { useWordNetContext } from 'wn-react';
import { createScopedLogger } from 'utils/logger';
import { isRequirementSatisfied, isRequirementAvailable, findBestPackageForRequirement, getPackageIdToLoad } from '../../utils/package-utils';

const logger = createScopedLogger('LexiconRequirementsWidget');

interface LexiconRequirement {
  id: string;
  label: string;
  description: string;
  requiredFor: string[];
  priority: 'high' | 'medium' | 'low';
}

interface LexiconRequirementWithStatus extends LexiconRequirement {
  isLoaded: boolean;
  isAvailable: boolean;
  bestPackage?: { id: string; versions?: string[] };
  canLoad: boolean;
  canForceReload: boolean;
}

export const LexiconRequirementsWidget: React.FC = () => {
  const { 
    availablePackages, 
    loadedPackages, 
    loadPackageData, 
    refreshPackages,
    unloadData,
    clearCacheAndUnload,
    loading 
  } = useWordNetContext();
  
  const [showDetails, setShowDetails] = useState(false);
  const [forceReloading, setForceReloading] = useState(false);

  // Define lexicon requirements for the entire demo
  const lexiconRequirements: LexiconRequirement[] = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Core English lexicon for all demos',
      requiredFor: ['Basic', 'Bilingual', 'Advanced', 'Developer', 'Visualizations'],
      priority: 'high'
    },
    {
      id: 'cili:1.0',
      label: 'CILI Index 1.0',
      description: 'Cross-lingual mapping index',
      requiredFor: ['Bilingual'],
      priority: 'high'
    },
    {
      id: 'omw-fr:1.4',
      label: 'French WordNet 1.4',
      description: 'French language support',
      requiredFor: ['Bilingual'],
      priority: 'high'
    },
    {
      id: 'omw-th:1.4',
      label: 'Thai WordNet 1.4',
      description: 'Thai language support',
      requiredFor: ['Bilingual'],
      priority: 'medium'
    }
  ];

  const checkRequirements = (): LexiconRequirementWithStatus[] => {
    const requirements = lexiconRequirements.map(req => {
      try {
        const isLoaded = isRequirementSatisfied(req.id, loadedPackages);
        const isAvailable = isRequirementAvailable(req.id, availablePackages);
        const bestPackage = findBestPackageForRequirement(req.id, availablePackages);
        
        return {
          ...req,
          isLoaded,
          isAvailable,
        bestPackage,
        canLoad: isAvailable && !isLoaded,
        canForceReload: isAvailable && isLoaded // Can force reload if already loaded
      };
      } catch (error) {
        logger.error("Error checking requirement", { 
          requirementId: req.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
        // Return a safe fallback for this requirement
        return {
          ...req,
          isLoaded: false,
          isAvailable: false,
          bestPackage: undefined,
          canLoad: false,
          canForceReload: false
        };
      }
    });
    
    return requirements;
  };

  const handleLoadAll = async () => {
    logger.start('loading all missing lexicons');
    
    try {
      const requirements = checkRequirements();
      const missingRequirements = requirements.filter(req => !req.isLoaded && req.isAvailable);
      
      if (missingRequirements.length === 0) {
        logger.info('All required lexicons are already loaded');
        return;
      }
      
      logger.step(`loading ${missingRequirements.length} missing lexicons`);
      
      for (const req of missingRequirements) {
        if (req.bestPackage) {
          // Use getPackageIdToLoad to properly construct the package ID
          const packageId = getPackageIdToLoad(req.id, req.bestPackage);
          logger.step(`loading ${packageId}`);
          await loadPackageData(packageId);
        }
      }
      
      await refreshPackages();
      logger.success('All missing lexicons loaded successfully');
    } catch (error) {
      logger.fail('Failed to load all lexicons', error);
    } finally {
      logger.end('loading all missing lexicons');
    }
  };

  const loadMissingLexicons = async () => {
    logger.start('loading missing lexicons');
    
    try {
      const requirements = checkRequirements();
      const missingRequirements = requirements.filter(req => !req.isLoaded && req.isAvailable);
      
      if (missingRequirements.length === 0) {
        logger.info('No missing lexicons to load');
        return;
      }
      
      logger.step(`loading ${missingRequirements.length} missing lexicons`);
      
      for (const req of missingRequirements) {
        if (req.bestPackage) {
          // Use getPackageIdToLoad to properly construct the package ID
          const packageId = getPackageIdToLoad(req.id, req.bestPackage);
          logger.step(`loading ${packageId}`);
          await loadPackageData(packageId);
        }
      }
      
      await refreshPackages();
      logger.success('Missing lexicons loaded successfully');
    } catch (error) {
      logger.fail('Failed to load missing lexicons', error);
    } finally {
      logger.end('loading missing lexicons');
    }
  };

  const handleForceReload = async (requirementId: string) => {
    logger.start(`force reloading lexicon ${requirementId}`);
    
    try {
      // Step 1: Unload the specific lexicon
      logger.step('unloading current lexicon data');
      await unloadData();
      
      // Step 2: Clear cache completely
      logger.step('clearing cache');
      await clearCacheAndUnload();
      
      // Step 3: Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Find and reload the specific lexicon
      const requirements = checkRequirements();
      const requirement = requirements.find(req => req.id === requirementId);
      if (requirement && requirement.bestPackage) {
        const packageId = getPackageIdToLoad(requirement.id, requirement.bestPackage);
        logger.step(`reloading ${packageId} fresh`);
        await loadPackageData(packageId);
      }
      
      // Step 5: Refresh packages
      await refreshPackages();
      
      logger.success(`Force reload completed for ${requirementId}`);
    } catch (error) {
      logger.fail(`Force reload failed for ${requirementId}`, error);
    } finally {
      logger.end(`force reloading lexicon ${requirementId}`);
    }
  };

  const handleForceReloadAll = async () => {
    logger.start('force reloading all lexicons');
    
    try {
      // Step 1: Unload all data
      logger.step('unloading all lexicon data');
      await unloadData();
      
      // Step 2: Clear cache completely
      logger.step('clearing cache');
      await clearCacheAndUnload();
      
      // Step 3: Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Reload all required lexicons fresh
      logger.step('reloading all lexicons fresh');
      await loadMissingLexicons();
      
      logger.success('Force reload all completed successfully');
    } catch (error) {
      logger.fail('Force reload all failed', error);
    } finally {
      logger.end('force reloading all lexicons');
    }
  };

  const handleRefreshPackages = async () => {
    setForceReloading(true);
    logger.start('refreshing available packages');
    
    try {
      await refreshPackages();
      logger.success('Available packages refreshed');
    } catch (error) {
      logger.fail('Failed to refresh packages', error);
    } finally {
      setForceReloading(false);
      logger.end('refreshing available packages');
    }
  };

  const requirements = useMemo(() => checkRequirements(), [loadedPackages, availablePackages]);
  const loadedCount = requirements.filter(req => req.isLoaded).length;
  const totalCount = requirements.length;
  const progress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-blue-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  const isLoaded = (id: string) => isRequirementSatisfied(id, loadedPackages);
  const isLoading = (id: string) => loading && !isLoaded(id);

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">📚 Lexicon Requirements</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {loadedCount}/{totalCount} lexicons loaded</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={loadMissingLexicons}
          disabled={loading || forceReloading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading && !forceReloading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Load Missing'
          )}
        </button>
        
        <button
          onClick={handleLoadAll}
          disabled={loading || forceReloading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading && !forceReloading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Load All Required'
          )}
        </button>

        <button
          onClick={handleForceReloadAll}
          disabled={loading || forceReloading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {forceReloading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Force Reloading...
            </div>
          ) : (
            '🚀 Force Reload All'
          )}
        </button>

        <button
          onClick={handleRefreshPackages}
          disabled={loading || forceReloading}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Requirements List */}
      {showDetails && (
        <div className="space-y-3">
          {requirements.map((req) => (
            <div 
              key={req.id} 
              className={`p-3 rounded-lg border ${getPriorityBorder(req.priority)} ${
                req.isLoaded ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(req.priority)}`}>
                      {req.priority.toUpperCase()}
                    </span>
                    <span className="font-medium text-gray-900">{req.label}</span>
                    {req.isLoaded && (
                      <span className="text-green-600 text-sm">✅ Loaded</span>
                    )}
                    {isLoading(req.id) && (
                      <span className="text-blue-600 text-sm">🔄 Loading...</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                  <div className="text-xs text-gray-500">
                    Required for: {req.requiredFor.join(', ')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {req.canLoad && (
                    <button
                      onClick={() => {
                        if (req.bestPackage) {
                          const packageId = getPackageIdToLoad(req.id, req.bestPackage);
                          loadPackageData(packageId);
                        }
                      }}
                      disabled={loading || forceReloading}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded transition-colors"
                    >
                      Load
                    </button>
                  )}
                  
                  {req.canForceReload && (
                    <button
                      onClick={() => handleForceReload(req.id)}
                      disabled={loading || forceReloading}
                      className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded transition-colors"
                      title="Force reload this lexicon (clears cache and downloads fresh)"
                    >
                      🔄 Reload
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <div className="font-medium mb-1">💡 Force Reload Options:</div>
        <ul className="space-y-1">
          <li><strong>Load Missing:</strong> Downloads only lexicons that aren't loaded yet</li>
          <li><strong>Load All Required:</strong> Downloads all required lexicons regardless of current state</li>
          <li><strong>Force Reload All:</strong> Clears cache and downloads all lexicons fresh (fixes corruption)</li>
          <li><strong>Individual Reload:</strong> Click the 🔄 button next to any loaded lexicon to force reload just that one</li>
        </ul>
      </div>
    </section>
  );
}; 

import React, { useEffect, useState } from 'react';
import { useWordNetContext } from "wn-ts-web/react";
import { createScopedLogger } from 'utils/logger';
import { 
  isRequirementSatisfied, 
  isRequirementAvailable, 
  findBestPackageForRequirement,
  getPackageIdToLoad 
} from '../../utils/package-utils';

const logger = createScopedLogger('LexiconRequirements');

interface LexiconRequirement {
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface LexiconRequirementsProps {
  requirements: LexiconRequirement[];
  title?: string;
  className?: string;
  showLoadButton?: boolean;
  onLoadAll?: () => void;
}

export const LexiconRequirements: React.FC<LexiconRequirementsProps> = React.memo(({ 
  requirements, 
  title = "Required Lexicons",
  className = "",
  showLoadButton = false,
  onLoadAll
}) => {
  const { availablePackages, loadedPackages, loadPackageData, loading, refreshPackages } = useWordNetContext();
  const [missingLexicons, setMissingLexicons] = useState<LexiconRequirement[]>([]);
  
  // Calculate loading progress
  const totalRequired = requirements.length;
  const loadedCount = requirements.filter(r => isRequirementSatisfied(r.id, loadedPackages)).length;
  const loadingCount = requirements.filter(r => loading && !isRequirementSatisfied(r.id, loadedPackages)).length;
  const progressPercentage = (loadedCount / totalRequired) * 100;

  useEffect(() => {
    logger.debug('LexiconRequirements render', {
      requirements: requirements.length,
      availablePackages: availablePackages.length,
      loadedPackages: loadedPackages.length
    });
    
    if (availablePackages.length > 0) {
      logger.debug('First few available packages', { packages: availablePackages.slice(0, 3) });
      logger.debug('Package structure sample', {
        firstPackage: availablePackages[0],
        hasId: !!availablePackages[0]?.id,
        hasVersion: !!availablePackages[0]?.versions?.length
      });
    }
    
    if (availablePackages.length > 0 && availablePackages[0]) {
      logger.debug('Package ID format analysis', {
        sampleId: availablePackages[0].id,
        hasColon: availablePackages[0].id.includes(':'),
        parts: availablePackages[0].id.split(':')
      });
    }
  }, [requirements, availablePackages, loadedPackages]);

  useEffect(() => {
    const checkRequirements = () => {
      const missing: LexiconRequirement[] = [];
      
      for (const requirement of requirements) {
        const isLoaded = isRequirementSatisfied(requirement.id, loadedPackages);
        
        if (!isLoaded) {
          missing.push(requirement);
        }
      }
      
      setMissingLexicons(missing);
    };
    
    checkRequirements();
  }, [requirements, loadedPackages, isRequirementSatisfied]);

  const handleLoadAll = async () => {
    if (!onLoadAll) return;
    
    logger.start('loading all required lexicons');
    
    try {
      await onLoadAll();
      logger.success('All required lexicons loaded successfully');
      logger.end('loading all required lexicons');
    } catch (error) {
      logger.fail('Failed to load all required lexicons', error);
      logger.end('loading all required lexicons');
    }
  };

  const loadMissingLexicons = async () => {
    logger.start('loading missing lexicons');
    logger.step('checking missing lexicons', { missingCount: missingLexicons.length });
    
    const availableMissing = missingLexicons.filter(lexicon => {
      const lexiconAvailable = isRequirementAvailable(lexicon.id, availablePackages);
      
      logger.step(`checking lexicon ${lexicon.id}`, { available: lexiconAvailable });
      
      return lexiconAvailable;
    });
    
    if (availableMissing.length === 0) {
      logger.warn('No available missing lexicons found', { 
        availablePackages: availablePackages.length,
        availablePackageIds: availablePackages.map((p: any) => `${p.id}:${p.version}`)
      });
      
      // Special handling for OEWN packages
      const oewnPackages = availablePackages.filter((p: any) => p.id.startsWith('oewn'));
      if (oewnPackages.length > 0) {
        logger.step('OEWN packages found', oewnPackages.map((p: any) => ({
          id: p.id,
          version: p.version,
          label: p.label
        })));
      }
      
      logger.end('loading missing lexicons');
      return;
    }
    
    logger.step('loading available missing lexicons', availableMissing);
    
    for (const lexicon of availableMissing) {
      try {
        // Find the best available package for this lexicon
        const bestPackage = findBestPackageForRequirement(lexicon.id, availablePackages);
        
        if (bestPackage) {
          const packageId = getPackageIdToLoad(lexicon.id, bestPackage);
          
          logger.step(`loading package ${packageId} for lexicon ${lexicon.id}`);
          await loadPackageData(packageId);
          logger.step(`package ${packageId} loaded successfully`);
        }
      } catch (error) {
        logger.fail(`Failed to load lexicon ${lexicon.id}`, error);
      }
    }
    
    logger.success('Missing lexicons loading completed');
    logger.end('loading missing lexicons');
  };

  const handleRefreshPackages = async () => {
    logger.start('refreshing available packages');
    
    try {
      await refreshPackages();
      logger.success('Available packages refreshed successfully');
      logger.end('refreshing available packages');
    } catch (error) {
      logger.fail('Failed to refresh available packages', error);
      logger.end('refreshing available packages');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshPackages}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
          {showLoadButton && onLoadAll && (
            <button
              onClick={handleLoadAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Load All
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress: {loadedCount} / {totalRequired} loaded</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {loadingCount > 0 && (
          <div className="text-sm text-blue-600">
            Loading {loadingCount} lexicon{loadingCount !== 1 ? 's' : ''}...
          </div>
        )}
      </div>

      {/* Requirements List */}
      <div className="space-y-3">
        {requirements.map((requirement) => {
          const isLoaded = isRequirementSatisfied(requirement.id, loadedPackages);
          const isAvailable = isRequirementAvailable(requirement.id, availablePackages);
          
          return (
            <div 
              key={requirement.id}
              className={`p-4 rounded-lg border ${
                isLoaded 
                  ? 'bg-green-50 border-green-200' 
                  : isAvailable 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(requirement.priority)}`}>
                      {getPriorityIcon(requirement.priority)} {requirement.priority}
                    </span>
                    <h4 className="font-medium text-gray-900">{requirement.label}</h4>
                    {isLoaded && <span className="text-green-600">✅ Loaded</span>}
                    {!isLoaded && isAvailable && <span className="text-yellow-600">⚠️ Available</span>}
                    {!isLoaded && !isAvailable && <span className="text-red-600">❌ Unavailable</span>}
                  </div>
                  <p className="text-sm text-gray-600">{requirement.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missing Lexicons Actions */}
      {missingLexicons.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-800">
                Missing Lexicons ({missingLexicons.length})
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Some required lexicons are not loaded. Click below to load available ones.
              </p>
            </div>
            <button
              onClick={loadMissingLexicons}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Load Available
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

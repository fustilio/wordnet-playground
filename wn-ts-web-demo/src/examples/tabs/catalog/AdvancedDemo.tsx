import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Card } from '../../../components/shared/Card';
import { useWordNetContext, getAvailableProjects, type ProjectInfo, type ProgressCallback } from "wn-ts-web/react";
import { LexiconRequirements } from '../../../components/shared/LexiconRequirements';
import { createScopedLogger } from 'utils/logger';
import { ProjectList } from '../../ProjectList';
import { Tabs } from '../../../components/shared/Tabs';

const logger = createScopedLogger('AdvancedDemo');

export const AdvancedDemo: React.FC = () => {
  const context = useWordNetContext();
  const { availablePackages, loadPackageData, loadedPackages } = context as any;
  const [activeTab, setActiveTab] = useState('Catalog');
  
  // Track loading state for individual packages
  const [loadingPackages, setLoadingPackages] = useState<Map<string, { progress: number; message?: string }>>(new Map());
  const [cancelledPackages, setCancelledPackages] = useState<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  
  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for advanced data management features',
      priority: 'high' as const
    }
  ];
  
  const handleLoadPackage = useCallback(async (packageId: string) => {
    // Check if already loading or cancelled
    if (loadingPackages.has(packageId) || cancelledPackages.has(packageId)) {
      return;
    }
    
    logger.start(`loading package ${packageId} for advanced demo`);
    
    // Create abort controller for this package
    const abortController = new AbortController();
    abortControllers.current.set(packageId, abortController);
    
    // Set initial loading state
    setLoadingPackages(prev => new Map(prev).set(packageId, { progress: 0, message: 'Starting download...' }));
    
    try {
      // Create progress callback
      const progressCallback: ProgressCallback = (progress: number, message?: string) => {
        setLoadingPackages(prev => new Map(prev).set(packageId, { progress, message }));
      };
      
      // Load package with progress tracking
      await loadPackageData(packageId, progressCallback);
      
      // Check if cancelled
      if (abortController.signal.aborted) {
        logger.info(`Package ${packageId} loading was cancelled`);
        return;
      }
      
      logger.success('Package loaded successfully for advanced demo', { packageId });
      logger.end(`loading package ${packageId} for advanced demo`, { packageId });
    } catch (error) {
      if (abortController.signal.aborted) {
        logger.info(`Package ${packageId} loading was cancelled`);
        return;
      }
      logger.fail('Failed to load package for advanced demo', { packageId, error });
      logger.end(`loading package ${packageId} for advanced demo`);
    } finally {
      // Clean up loading state
      setLoadingPackages(prev => {
        const newMap = new Map(prev);
        newMap.delete(packageId);
        return newMap;
      });
      abortControllers.current.delete(packageId);
    }
  }, [loadPackageData, loadingPackages, cancelledPackages]);
  
  const handleCancelPackage = useCallback((packageId: string) => {
    const abortController = abortControllers.current.get(packageId);
    if (abortController) {
      abortController.abort();
      setCancelledPackages(prev => new Set(prev).add(packageId));
      setLoadingPackages(prev => {
        const newMap = new Map(prev);
        newMap.delete(packageId);
        return newMap;
      });
      logger.info(`Cancelled loading package ${packageId}`);
    }
  }, []);

  type Status = 'loaded' | 'unloaded' | 'superseded' | 'loading' | 'cancelled';
  interface Row { key: string; id: string; version: string; label: string; language: string; status: Status }

  const rows: Row[] = useMemo(() => {
    // Build from the full catalog (all projects), not just currently available
    const catalog = getAvailableProjects() as Array<ProjectInfo & { versions?: string[]; version?: string }>; // from wn-ts-web
    const byBaseId = new Map<string, Array<{ version: string }>>();
    const infoByKey = new Map<string, { id: string; label: string; language: string; version: string }>();

    for (const proj of catalog) {
      const base = proj.id;
      const versions = (proj.versions && proj.versions.length > 0) ? proj.versions : (proj.version ? [proj.version] : []);
      for (const version of versions) {
        const key = `${base}:${version}`;
        infoByKey.set(key, { id: base, label: proj.label || base, language: proj.language || 'en', version });
        if (!byBaseId.has(base)) byBaseId.set(base, []);
        if (!byBaseId.get(base)!.some(v => v.version === version)) byBaseId.get(base)!.push({ version });
      }
    }

    // Include any loaded versions that might not be in catalog (defensive)
    const loadedKeys = new Set(loadedPackages);
    const loadingKeys = new Set(loadingPackages.keys());
    const cancelledKeys = new Set(cancelledPackages);
    
    for (const lp of loadedPackages) {
      const [base, version = ''] = lp.split(':');
      if (!byBaseId.has(base)) byBaseId.set(base, []);
      const arr = byBaseId.get(base)!;
      if (!arr.some(v => v.version === version)) arr.push({ version });
      if (!infoByKey.has(lp)) {
        infoByKey.set(lp, { id: base, label: base, language: 'en', version });
      }
    }

    const compareVersion = (a: string, b: string) => {
      const na = parseFloat(a.replace(/[^0-9.]/g, ''));
      const nb = parseFloat(b.replace(/[^0-9.]/g, ''));
      const va = Number.isFinite(na) ? na : -Infinity;
      const vb = Number.isFinite(nb) ? nb : -Infinity;
      if (va === vb) return a.localeCompare(b);
      return va - vb;
    };

    const out: Row[] = [];
    for (const [base, versions] of byBaseId.entries()) {
      const maxVersion = versions.reduce((m, v) => (compareVersion(m, v.version) < 0 ? v.version : m), versions[0]?.version ?? '');
      for (const { version } of versions) {
        const key = `${base}:${version}`;
        const meta = infoByKey.get(key) ?? { id: base, label: base, language: 'en', version };
        
        let status: Status;
        if (loadedKeys.has(key)) {
          status = 'loaded';
        } else if (loadingKeys.has(key)) {
          status = 'loading';
        } else if (cancelledKeys.has(key)) {
          status = 'cancelled';
        } else {
          status = compareVersion(version, maxVersion) < 0 ? 'superseded' : 'unloaded';
        }
        
        out.push({ key, id: base, version, label: meta.label || base, language: meta.language || 'en', status });
      }
    }

    // Sort by id then version desc
    out.sort((a, b) => (a.id === b.id ? compareVersion(b.version, a.version) : a.id.localeCompare(b.id)));
    return out;
  }, [availablePackages, loadedPackages, loadingPackages, cancelledPackages]);

  const statusClasses: Record<Status, string> = {
    loaded: 'bg-green-100 text-green-800 border border-green-200',
    unloaded: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    superseded: 'bg-gray-100 text-gray-700 border border-gray-200',
    loading: 'bg-blue-50 text-blue-700 border border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200'
  };

  const statusLabel: Record<Status, string> = {
    loaded: 'Loaded',
    unloaded: 'Available',
    superseded: 'Superseded',
    loading: 'Loading',
    cancelled: 'Cancelled'
  };
  
  const TABS = ['Catalog', 'Browser'];

  return (
    <Card title="Data Catalog & Browser">
      <div className="space-y-6">
        <LexiconRequirements requirements={lexiconRequirements} />
        
        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="mt-4">
          {activeTab === 'Catalog' && (
            <div>
              <h3 className="font-semibold text-gray-700">Lexicon Catalog</h3>
              <p className="text-sm text-gray-600 mb-2">All detected lexicon versions and their status.</p>
              <div className="space-y-2">
                {rows.length === 0 ? (
                  <div className="text-sm text-gray-500">No lexicons detected yet.</div>
                ) : (
                  rows.map(row => {
                    const loadingInfo = loadingPackages.get(row.key);
                    const isCancelled = cancelledPackages.has(row.key);
                    
                    return (
                      <div key={row.key} className={`flex items-center justify-between rounded-md px-3 py-2 ${statusClasses[row.status]}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium">{row.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{row.id}:{row.version}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{row.language.toUpperCase()}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{statusLabel[row.status]}</span>
                          
                          {/* Progress bar for loading packages */}
                          {row.status === 'loading' && loadingInfo && (
                            <div className="flex-1 max-w-xs">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${Math.round(loadingInfo.progress * 100)}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {Math.round(loadingInfo.progress * 100)}% - {loadingInfo.message || 'Loading...'}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {row.status === 'unloaded' && !isCancelled && (
                            <button
                              onClick={() => handleLoadPackage(`${row.id}:${row.version}`)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Load
                            </button>
                          )}
                          
                          {row.status === 'loading' && (
                            <button
                              onClick={() => handleCancelPackage(row.key)}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          
                          {row.status === 'cancelled' && (
                            <button
                              onClick={() => {
                                setCancelledPackages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(row.key);
                                  return newSet;
                                });
                              }}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {activeTab === 'Browser' && <ProjectList />}
        </div>
      </div>
    </Card>
  );
};

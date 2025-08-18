import React, { useMemo, useState } from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext, getAvailableProjects, type ProjectInfo } from "wn-ts-web/react";
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from 'utils/logger';
import { ProjectList } from '../../examples/ProjectList';
import { Tabs } from '../shared/Tabs';

const logger = createScopedLogger('AdvancedDemo');

export const AdvancedDemo: React.FC = () => {
  const { availablePackages, loadPackageData, loadedPackages } = useWordNetContext();
  const [activeTab, setActiveTab] = useState('Catalog');
  
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

  type Status = 'loaded' | 'unloaded' | 'superseded';
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
        const status: Status = loadedKeys.has(key) ? 'loaded' : (compareVersion(version, maxVersion) < 0 ? 'superseded' : 'unloaded');
        out.push({ key, id: base, version, label: meta.label || base, language: meta.language || 'en', status });
      }
    }

    // Sort by id then version desc
    out.sort((a, b) => (a.id === b.id ? compareVersion(b.version, a.version) : a.id.localeCompare(b.id)));
    return out;
  }, [availablePackages, loadedPackages]);

  const statusClasses: Record<Status, string> = {
    loaded: 'bg-green-100 text-green-800 border border-green-200',
    unloaded: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    superseded: 'bg-gray-100 text-gray-700 border border-gray-200'
  };

  const statusLabel: Record<Status, string> = {
    loaded: 'Loaded',
    unloaded: 'Available',
    superseded: 'Superseded'
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
                  rows.map(row => (
                    <div key={row.key} className={`flex items-center justify-between rounded-md px-3 py-2 ${statusClasses[row.status]}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{row.id}:{row.version}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{row.language.toUpperCase()}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-800 border border-gray-300">{statusLabel[row.status]}</span>
                      </div>
                      <div>
                        {row.status === 'unloaded' && (
                          <button
                            onClick={() => handleLoadPackage(`${row.id}:${row.version}`)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Load
                          </button>
                        )}
                      </div>
                    </div>
                  ))
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

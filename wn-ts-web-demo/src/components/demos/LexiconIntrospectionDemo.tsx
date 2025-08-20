import React, { useState } from 'react';
import { useWordNetContext } from "wn-ts-web/react";
import { Card } from '../shared/Card';
import { createScopedLogger } from 'utils/logger';
import type {
  LexiconIntrospection,
  ResourceTypeInfo,
  CategorizedResources,
  CrossLingualAnalysis,
  MappingCoverage,
  IntegrityReport,
  CompatibilityReport
} from 'wn-ts-web';

const logger = createScopedLogger('LexiconIntrospectionDemo');

export const LexiconIntrospectionDemo: React.FC = () => {
  const { 
    introspectLexicon, 
    introspectAllResources, 
    categorizeResources,
    detectResourceType,
    analyzeCrossLingualCapabilities,
    getCrossLingualMappingCoverage,
    validateResourceIntegrity,
    checkResourceCompatibility,
    loadedPackages,
    workerReady
  } = useWordNetContext();
  
  // Define valid lexicon IDs for introspection (these are the actual lexicon IDs, not package IDs)
  // Note: The worker stores lexicons with base IDs (e.g., "oewn"), but we can introspect with package IDs (e.g., "oewn:2024")
  const validLexiconIds = ['oewn:2024', 'cili:1.0', 'omw-fr:1.4', 'omw-th:1.4'];
  
  // Filter to only show lexicons that are actually loaded
  // We check if any loaded package starts with the base lexicon ID
  const availableLexicons = validLexiconIds.filter(lexiconId => 
    loadedPackages.some(pkg => pkg.startsWith(lexiconId.split(':')[0]))
  );
  
  const [lexiconInfo, setLexiconInfo] = useState<LexiconIntrospection | null>(null);
  const [allResources, setAllResources] = useState<LexiconIntrospection[]>([]);
  const [categorized, setCategorized] = useState<CategorizedResources | null>(null);
  const [resourceType, setResourceType] = useState<ResourceTypeInfo | null>(null);
  const [crossLingualAnalysis, setCrossLingualAnalysis] = useState<CrossLingualAnalysis | null>(null);
  const [mappingCoverage, setMappingCoverage] = useState<MappingCoverage | null>(null);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLexicon, setSelectedLexicon] = useState<string>('');

  const handleIntrospectLexicon = async (lexiconId: string) => {
    if (!workerReady) {
      logger.warn('Worker not ready');
      return;
    }

    try {
      setLoading(true);
      setSelectedLexicon(lexiconId);
      
      const info = await introspectLexicon(lexiconId);
      setLexiconInfo(info);
      
      const type = await detectResourceType(lexiconId);
      setResourceType(type);
      
      const integrity = await validateResourceIntegrity(lexiconId);
      setIntegrityReport(integrity);
      
      logger.success('Lexicon introspection completed', { lexiconId, info, type, integrity });
    } catch (error) {
      logger.fail('Lexicon introspection failed', { error, lexiconId });
    } finally {
      setLoading(false);
    }
  };

  const handleIntrospectAll = async () => {
    if (!workerReady) {
      logger.warn('Worker not ready');
      return;
    }

    try {
      setLoading(true);
      
      const [resources, categorized, analysis, coverage] = await Promise.all([
        introspectAllResources(),
        categorizeResources(),
        analyzeCrossLingualCapabilities(),
        getCrossLingualMappingCoverage()
      ]);
      
      setAllResources(resources);
      setCategorized(categorized);
      setCrossLingualAnalysis(analysis);
      setMappingCoverage(coverage);
      
      logger.success('Full introspection completed', { 
        resourcesCount: resources.length,
        categorized,
        analysis,
        coverage
      });
    } catch (error) {
      logger.fail('Full introspection failed', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCompatibility = async () => {
    if (!workerReady || availableLexicons.length < 2) {
      logger.warn('Need at least 2 available lexicons to check compatibility');
      return;
    }

    try {
      setLoading(true);
      
      const compatibility = await checkResourceCompatibility(availableLexicons);
      setCompatibilityReport(compatibility);
      
      logger.success('Compatibility check completed', { compatibility });
    } catch (error) {
      logger.fail('Compatibility check failed', { error });
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lexicon': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ili': return 'bg-green-100 text-green-800 border-green-200';
      case 'mixed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card title="Lexicon Introspection & Resource Analysis">
      <div className="space-y-6">
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <strong>What this demo shows:</strong> This demo showcases the new lexicon introspection capabilities that automatically detect and categorize resources as either <strong>Lexicons</strong> (language-specific word collections) or <strong>ILIs</strong> (cross-lingual mapping indexes). It provides comprehensive analysis of multilingual capabilities and resource compatibility.
        </div>

        {/* Control Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Control Panel</h3>
          
          {/* Debug Info */}
          <div className="mb-3 text-xs text-gray-600 bg-white p-2 rounded border">
            <div><strong>Loaded Packages:</strong> {loadedPackages.join(', ') || 'None'}</div>
            <div><strong>Available for Introspection:</strong> {availableLexicons.join(', ') || 'None'}</div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableLexicons.length > 0 && (
              <select
                value={selectedLexicon}
                onChange={(e) => setSelectedLexicon(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a lexicon...</option>
                {availableLexicons.map(lexiconId => (
                  <option key={lexiconId} value={lexiconId}>{lexiconId}</option>
                ))}
              </select>
            )}
            
            <button
              onClick={() => selectedLexicon && handleIntrospectLexicon(selectedLexicon)}
              disabled={!workerReady || !selectedLexicon || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Introspect Selected
            </button>
            
            <button
              onClick={handleIntrospectAll}
              disabled={!workerReady || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Introspect All Resources
            </button>
            
            <button
              onClick={handleCheckCompatibility}
              disabled={!workerReady || availableLexicons.length < 2 || loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Check Compatibility
            </button>
          </div>
          
          {loading && (
            <div className="mt-3 text-sm text-gray-600">
              🔄 Loading introspection data...
            </div>
          )}
        </div>

        {/* Individual Lexicon Info */}
        {lexiconInfo && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">
              Lexicon Info: {lexiconInfo.id}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs border ${getTypeColor(lexiconInfo.type)}`}>
                  {lexiconInfo.type.toUpperCase()}
                </span>
              </div>
              <div><span className="font-medium">Language:</span> {lexiconInfo.language}</div>
              <div><span className="font-medium">Version:</span> {lexiconInfo.version}</div>
              <div><span className="font-medium">Words:</span> {lexiconInfo.wordCount.toLocaleString()}</div>
              <div><span className="font-medium">Synsets:</span> {lexiconInfo.synsetCount.toLocaleString()}</div>
              <div><span className="font-medium">Senses:</span> {lexiconInfo.senseCount.toLocaleString()}</div>
              {lexiconInfo.type === 'ili' && (
                <div><span className="font-medium">ILI Count:</span> {lexiconInfo.iliCount?.toLocaleString()}</div>
              )}
              <div><span className="font-medium">Has ILI Mappings:</span> {lexiconInfo.hasILIMappings ? '✅ Yes' : '❌ No'}</div>
              {lexiconInfo.crossLingualLinks && (
                <div><span className="font-medium">Cross-lingual Links:</span> {lexiconInfo.crossLingualLinks.toLocaleString()}</div>
              )}
            </div>
          </div>
        )}

        {/* Resource Type Info */}
        {resourceType && (
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Resource Type Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs border ${getTypeColor(resourceType.type)}`}>
                  {resourceType.type.toUpperCase()}
                </span>
              </div>
              <div><span className="font-medium">Cross-lingual Mappings:</span> {resourceType.hasCrossLingualMappings ? '✅ Yes' : '❌ No'}</div>
              <div><span className="font-medium">Primary Language:</span> {resourceType.primaryLanguage}</div>
              <div><span className="font-medium">Mapping Confidence:</span> {(resourceType.mappingConfidence * 100).toFixed(1)}%</div>
              <div className="col-span-2">
                <span className="font-medium">Supported Languages:</span>
                <div className="mt-1">
                  {resourceType.supportedLanguages.map(lang => (
                    <span key={lang} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1 mb-1">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Categorization */}
        {categorized && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Resource Categorization</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Lexicons:</span> 
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {categorized.lexicons.length}
                </span>
              </div>
              <div>
                <span className="font-medium">ILIs:</span> 
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  {categorized.ilis.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Mixed:</span> 
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {categorized.mixed.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Total:</span> 
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  {categorized.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cross-Lingual Analysis */}
        {crossLingualAnalysis && (
          <div className="border border-gray-200 p-4 rounded-lg bg-blue-50">
            <h3 className="font-medium text-gray-900 mb-3">Cross-Lingual Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <span className="font-medium">Supported Languages:</span>
                <div className="mt-1">
                  {crossLingualAnalysis.supportedLanguages.map(lang => (
                    <span key={lang} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1 mb-1">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div><span className="font-medium">Primary Language:</span> {crossLingualAnalysis.primaryLanguage}</div>
              <div><span className="font-medium">Total ILI Mappings:</span> {crossLingualAnalysis.totalILIMappings.toLocaleString()}</div>
              <div><span className="font-medium">Fully Mapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.fullyMapped.toLocaleString()}</div>
              <div><span className="font-medium">Partially Mapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.partiallyMapped.toLocaleString()}</div>
              <div><span className="font-medium">Unmapped Concepts:</span> {crossLingualAnalysis.conceptCoverage.unmapped.toLocaleString()}</div>
              <div><span className="font-medium">Average Mapping Confidence:</span> {(crossLingualAnalysis.mappingQuality.averageConfidence * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Mapping Coverage */}
        {mappingCoverage && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Cross-Lingual Mapping Coverage</h3>
            <div className="text-sm">
              <div className="mb-3">
                <span className="font-medium">Total Mappings:</span> {mappingCoverage.totalMappings.toLocaleString()}
              </div>
              
              <div className="mb-3">
                <span className="font-medium">Language Pairs:</span>
                <div className="mt-2 space-y-2">
                  {mappingCoverage.languagePairs.map((pair, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{pair.source} → {pair.target}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{pair.mappingCount.toLocaleString()} mappings</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {pair.coveragePercentage}% coverage
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrity Report */}
        {integrityReport && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Resource Integrity Report</h3>
            <div className="text-sm">
              <div className="mb-3">
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  integrityReport.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {integrityReport.isValid ? '✅ Valid' : '❌ Issues Found'}
                </span>
              </div>
              
              {integrityReport.issues.length > 0 && (
                <div className="mb-3">
                  <span className="font-medium">Issues:</span>
                  <div className="mt-2 space-y-2">
                    {integrityReport.issues.map((issue, index) => (
                      <div key={index} className={`p-2 rounded text-xs border ${
                        issue.type === 'error' ? 'bg-red-50 border-red-200' :
                        issue.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <span className={`font-medium ${
                          issue.type === 'error' ? 'text-red-800' :
                          issue.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {issue.type.toUpperCase()}:
                        </span> {issue.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {integrityReport.recommendations.length > 0 && (
                <div>
                  <span className="font-medium">Recommendations:</span>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {integrityReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compatibility Report */}
        {compatibilityReport && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Resource Compatibility Report</h3>
            <div className="text-sm">
              <div className="mb-3">
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  compatibilityReport.compatible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {compatibilityReport.compatible ? '✅ Compatible' : '❌ Compatibility Issues'}
                </span>
              </div>
              
              {compatibilityReport.conflicts.length > 0 && (
                <div className="mb-3">
                  <span className="font-medium">Conflicts:</span>
                  <div className="mt-2 space-y-2">
                    {compatibilityReport.conflicts.map((conflict, index) => (
                      <div key={index} className={`p-2 rounded text-xs border ${getSeverityColor(conflict.severity)}`}>
                        <span className="font-medium">{conflict.type.toUpperCase()}:</span> {conflict.description}
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          conflict.severity === 'high' ? 'bg-red-200 text-red-900' :
                          conflict.severity === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {conflict.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {compatibilityReport.recommendations.length > 0 && (
                <div>
                  <span className="font-medium">Recommendations:</span>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {compatibilityReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Resources Overview */}
        {allResources.length > 0 && (
          <div className="border border-gray-200 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">All Resources Overview ({allResources.length})</h3>
            <div className="space-y-2">
              {allResources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{resource.id}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs border ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {resource.language} • {resource.wordCount.toLocaleString()} words
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!lexiconInfo && !allResources.length && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p>No introspection data available yet.</p>
            <p className="text-sm mt-2">Load some packages and use the controls above to explore resource capabilities.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

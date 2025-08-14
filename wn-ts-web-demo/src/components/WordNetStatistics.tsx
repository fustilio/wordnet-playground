import React from 'react';
import type { WordNetStats, WordNetIntegrityInfo, DataSourceInfo } from '../types';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('WordNetStatistics');

interface WordNetStatisticsProps {
  statistics?: WordNetStats;
  integrity?: WordNetIntegrityInfo;
  dataSource?: DataSourceInfo;
}

export const WordNetStatistics: React.FC<WordNetStatisticsProps> = ({
  statistics,
  integrity,
  dataSource
}) => {
  // Log when statistics are updated
  React.useEffect(() => {
    if (statistics) {
      logger.debug('Statistics updated', { 
        totalWords: statistics.totalWords,
        totalSynsets: statistics.totalSenses,
        totalSenses: statistics.totalSenses
      });
    }
  }, [statistics]);

  // Log when integrity info is updated
  React.useEffect(() => {
    if (integrity) {
      logger.info('Integrity information updated', { 
        isValid: integrity.isValid,
        qualityScore: integrity.qualityScore,
        fileSize: integrity.fileSize,
        format: integrity.format,
        errorCount: integrity.errors.length,
        warningCount: integrity.warnings.length
      });
    }
  }, [integrity]);

  // Log when data source info is updated
  React.useEffect(() => {
    if (dataSource) {
      logger.debug('Data source information updated', { 
        id: dataSource.id,
        name: dataSource.name,
        version: dataSource.version,
        status: dataSource.status
      });
    }
  }, [dataSource]);

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  if (!statistics && !integrity && !dataSource) {
    logger.debug('No statistics data available');
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Statistics */}
      {statistics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalWords?.toLocaleString() || 'N/A'}</div>
              <div className="text-sm text-gray-600">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.totalSynsets?.toLocaleString() || 'N/A'}</div>
              <div className="text-sm text-gray-600">Total Synsets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.totalSenses?.toLocaleString() || 'N/A'}</div>
              <div className="text-sm text-gray-600">Total Senses</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Integrity */}
      {integrity && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Integrity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Overall Quality:</span>
              <span className={`font-semibold ${getQualityColor(integrity.qualityScore)}`}>
                {integrity.qualityScore}% - {getQualityLabel(integrity.qualityScore)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">File Size:</span>
              <span className="font-mono text-gray-900">{integrity.fileSize.toLocaleString()} bytes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Format:</span>
              <span className="font-mono text-gray-900">{integrity.format}</span>
            </div>
            {integrity.compressionType && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Compression:</span>
                <span className="font-mono text-gray-900">{integrity.compressionType}</span>
              </div>
            )}
            {integrity.checksum && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Checksum:</span>
                <span className="font-mono text-xs text-gray-900 truncate max-w-xs">{integrity.checksum}</span>
              </div>
            )}
            
            {/* Errors and Warnings */}
            {integrity.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Errors ({integrity.errors.length})</h4>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  {integrity.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">• {error}</div>
                  ))}
                </div>
              </div>
            )}
            
            {integrity.warnings.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">Warnings ({integrity.warnings.length})</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  {integrity.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-700">• {warning}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Source Information */}
      {dataSource && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Source</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Name:</span>
              <span className="font-medium text-gray-900">{dataSource.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Version:</span>
              <span className="font-mono text-gray-900">{dataSource.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                dataSource.status === 'available' ? 'bg-green-100 text-green-800' :
                dataSource.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {dataSource.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Last Checked:</span>
              <span className="text-sm text-gray-900">{dataSource.lastChecked}</span>
            </div>
            {dataSource.description && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-gray-700">Description:</span>
                <p className="text-sm text-gray-900 mt-1">{dataSource.description}</p>
              </div>
            )}
            {dataSource.url && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-gray-700">URL:</span>
                <a 
                  href={dataSource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm ml-2 break-all"
                >
                  {dataSource.url}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 
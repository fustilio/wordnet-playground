import React from 'react';

interface WordNetStatistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalRelations: number;
  totalDefinitions: number;
  languages: string[];
  partsOfSpeech: string[];
  dataSize: number;
  lastUpdated: string;
  source: string;
}

interface WordNetIntegrity {
  isValid: boolean;
  checksum?: string;
  fileSize: number;
  compressionType?: string;
  format: string;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

interface DataSourceInfo {
  id: string;
  name: string;
  version: string;
  url: string;
  description: string;
  lastChecked: string;
  status: 'available' | 'unavailable' | 'error';
}

interface WordNetStatisticsProps {
  statistics?: WordNetStatistics;
  integrity?: WordNetIntegrity;
  dataSource?: DataSourceInfo;
}

export const WordNetStatistics: React.FC<WordNetStatisticsProps> = ({
  statistics,
  integrity,
  dataSource
}) => {
  if (!statistics || !integrity || !dataSource) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">WordNet Data Analysis</h3>
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <div className="space-y-6">
      {/* Data Source Information */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Data Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-600 font-medium">Name</p>
            <p className="text-blue-900">{dataSource.name}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Version</p>
            <p className="text-blue-900">{dataSource.version}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Status</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              dataSource.status === 'available' ? 'bg-green-100 text-green-800' :
              dataSource.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {dataSource.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Last Checked</p>
            <p className="text-blue-900">{new Date(dataSource.lastChecked).toLocaleString()}</p>
          </div>
        </div>
        {dataSource.description && (
          <div className="mt-3">
            <p className="text-sm text-blue-600 font-medium">Description</p>
            <p className="text-blue-900 text-sm">{dataSource.description}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Data Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.totalWords.toLocaleString()}</p>
            <p className="text-sm text-green-700">Words</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.totalSynsets.toLocaleString()}</p>
            <p className="text-sm text-green-700">Synsets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.totalSenses.toLocaleString()}</p>
            <p className="text-sm text-green-700">Senses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.totalRelations.toLocaleString()}</p>
            <p className="text-sm text-green-700">Relations</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-green-600 font-medium">Data Size</p>
            <p className="text-green-900">{formatFileSize(statistics.dataSize)}</p>
          </div>
          <div>
            <p className="text-sm text-green-600 font-medium">Definitions</p>
            <p className="text-green-900">{statistics.totalDefinitions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-green-600 font-medium">Languages</p>
            <p className="text-green-900">{statistics.languages.join(', ') || 'None detected'}</p>
          </div>
          <div>
            <p className="text-sm text-green-600 font-medium">Parts of Speech</p>
            <p className="text-green-900">{statistics.partsOfSpeech.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Integrity Check */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">Data Integrity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${getQualityColor(integrity.qualityScore)}`}>
              {integrity.qualityScore}%
            </p>
            <p className="text-sm text-purple-700">Quality Score</p>
            <p className={`text-xs font-medium ${getQualityColor(integrity.qualityScore)}`}>
              {getQualityLabel(integrity.qualityScore)}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${integrity.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {integrity.isValid ? '✓' : '✗'}
            </p>
            <p className="text-sm text-purple-700">Valid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatFileSize(integrity.fileSize)}</p>
            <p className="text-sm text-purple-700">File Size</p>
          </div>
        </div>
        
        {/* Errors and Warnings */}
        {(integrity.errors.length > 0 || integrity.warnings.length > 0) && (
          <div className="space-y-3">
            {integrity.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Errors ({integrity.errors.length})</p>
                <ul className="space-y-1">
                  {integrity.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {integrity.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Warnings ({integrity.warnings.length})</p>
                <ul className="space-y-1">
                  {integrity.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {integrity.errors.length === 0 && integrity.warnings.length === 0 && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">✓ No issues detected</p>
            <p className="text-sm text-green-600">Data integrity check passed</p>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          Last updated: {new Date(statistics.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}; 
import React from 'react';
import type { StorageInfo, DatabaseInfo } from '../types/index';

interface DataManagementProps {
  storageInfo: StorageInfo | null;
  onExportDatabase: () => void;
  onImportDatabase: () => void;
  onSaveToOPFS: () => void;
  isImporting: boolean;
  importProgress: number;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  storageInfo,
  onExportDatabase,
  onImportDatabase,
  onSaveToOPFS,
  isImporting,
  importProgress
}) => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Data Management (CLI Features)</h3>
      
      {/* Basic Controls */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Operations</h4>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onExportDatabase} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Export Database
          </button>
          <button 
            onClick={onImportDatabase} 
            disabled={isImporting}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {isImporting ? `Importing... ${importProgress}%` : 'Import Database'}
          </button>
          <button 
            onClick={onSaveToOPFS} 
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
          >
            Save to OPFS
          </button>
        </div>
      </div>

      {/* Storage Information */}
      {storageInfo && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{(storageInfo.total / 1024 / 1024).toFixed(2)} MB</div>
              <div className="text-sm text-gray-600">Total Space</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{(storageInfo.used / 1024 / 1024).toFixed(2)} MB</div>
              <div className="text-sm text-gray-600">Used Space</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{(storageInfo.available / 1024 / 1024).toFixed(2)} MB</div>
              <div className="text-sm text-gray-600">Available Space</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{((storageInfo.used / storageInfo.total) * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Usage</div>
            </div>
          </div>

          {storageInfo.databases.length > 0 && (
            <div className="mt-6">
              <h5 className="text-md font-semibold text-gray-900 mb-3">Stored Databases</h5>
              <div className="space-y-2">
                {storageInfo.databases.map((db: DatabaseInfo, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">{db.name} - {(db.size / 1024 / 1024).toFixed(2)} MB</div>
                    <div className="text-sm text-gray-600">Last modified: {db.lastModified.toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming Soon Features */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon (CLI Features)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="font-semibold text-blue-900 mb-1">Project Management:</div>
            <div className="text-blue-700 text-sm">Download WordNet projects (oewn:2024, omw-fr:1.4, etc.)</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="font-semibold text-green-900 mb-1">Export Formats:</div>
            <div className="text-green-700 text-sm">JSON, XML, CSV export with filtering options</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="font-semibold text-purple-900 mb-1">Backup & Restore:</div>
            <div className="text-purple-700 text-sm">Create and restore database backups</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="font-semibold text-orange-900 mb-1">Storage Cleanup:</div>
            <div className="text-orange-700 text-sm">Automatic cleanup of old files</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="font-semibold text-yellow-900 mb-1">Statistics:</div>
            <div className="text-yellow-700 text-sm">Comprehensive database statistics and quality metrics</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="font-semibold text-indigo-900 mb-1">Multilingual Support:</div>
            <div className="text-indigo-700 text-sm">Cross-language search and analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
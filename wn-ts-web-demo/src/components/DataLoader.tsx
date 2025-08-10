import React, { useState } from 'react';

interface WordNetPackage {
  id: string;
  label: string;
  language: string;
  license: string;
  versions: Record<string, {
    url?: string;
    error?: string;
  }>;
}

interface DataLoaderProps {
  availablePackages: WordNetPackage[];
  onLoadPackage: (packageId: string, version: string, onProgress?: (progress: number) => void) => Promise<void>;
  onLoadDemo: () => Promise<void>;
  loading: boolean;
  isInitializing: boolean;
}

export const DataLoader: React.FC<DataLoaderProps> = ({
  availablePackages,
  onLoadPackage,
  onLoadDemo,
  loading,
  isInitializing
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');

  const handlePackageChange = (packageId: string) => {
    setSelectedPackage(packageId);
    setSelectedVersion(''); // Reset version when package changes
  };

  const handleLoadPackage = async () => {
    if (!selectedPackage || !selectedVersion) {
      alert('Please select both a package and version');
      return;
    }
    
    setProgress(0);
    setProgressStage('Starting download...');
    
    const handleProgress = (progressValue: number) => {
      setProgress(progressValue);
      setProgressStage(`Loading ${selectedPackage}:${selectedVersion}...`);
    };
    
    await onLoadPackage(selectedPackage, selectedVersion, handleProgress);
    
    setProgress(0);
    setProgressStage('');
  };

  const selectedPackageInfo = availablePackages.find(pkg => pkg.id === selectedPackage);
  const availableVersions = selectedPackageInfo ? Object.keys(selectedPackageInfo.versions) : [];

  return (
    <div className="data-loader bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Load WordNet Data</h3>
      
      <div className="space-y-4">
        {/* Package Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Package
          </label>
          <select
            value={selectedPackage}
            onChange={(e) => handlePackageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || isInitializing}
          >
            <option value="">Choose a package...</option>
            {availablePackages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.label} ({pkg.language})
              </option>
            ))}
          </select>
        </div>

        {/* Version Selection */}
        {selectedPackage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Version
            </label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || isInitializing}
            >
              <option value="">Choose a version...</option>
              {availableVersions.map(version => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Package Info */}
        {selectedPackageInfo && (
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">Package Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Label:</strong> {selectedPackageInfo.label}</p>
              <p><strong>Language:</strong> {selectedPackageInfo.language}</p>
              <p><strong>License:</strong> <a href={selectedPackageInfo.license} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedPackageInfo.license}</a></p>
              <p><strong>Available Versions:</strong> {availableVersions.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleLoadPackage}
            disabled={!selectedPackage || !selectedVersion || loading || isInitializing}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load Package'}
          </button>
          
          <button
            onClick={onLoadDemo}
            disabled={loading || isInitializing}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load Demo Data'}
          </button>
        </div>

        {/* Status */}
        {(loading || isInitializing) && (
          <div className="text-center py-4">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">
                {isInitializing ? 'Initializing WordNet...' : progressStage || 'Loading data...'}
              </span>
            </div>
            {progress > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {Math.round(progress * 100)}% complete
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 
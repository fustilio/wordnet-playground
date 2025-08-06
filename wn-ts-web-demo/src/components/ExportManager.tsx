import React, { useState } from 'react';
import { useExport } from '../hooks/useExport';
import type { ExportOptions } from '../hooks/useExport';

export const ExportManager: React.FC = () => {
  const { exportData, downloadExport, isExporting, exportProgress, supportedFormats } = useExport();
  
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'xml' | 'csv' | 'sql'>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCompression, setIncludeCompression] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['word', 'synset', 'definition', 'pos', 'language']);
  const [filters, setFilters] = useState({
    words: [] as string[],
    languages: ['eng'] as string[],
    partsOfSpeech: [] as string[],
    relations: [] as string[]
  });

  const availableColumns = [
    'word', 'synset', 'definition', 'pos', 'language', 
    'frequency', 'confidence', 'source', 'created_at'
  ];

  const handleExport = async () => {
    const options: ExportOptions = {
      format: selectedFormat,
      includeMetadata,
      compression: includeCompression,
      columns: selectedColumns,
      filters
    };

    const result = await exportData(options);
    
    if (result.success) {
      downloadExport(result);
    } else {
      console.error('Export failed:', result.error);
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Data Export Manager</h3>
        <p className="text-blue-700 text-sm">
          Export WordNet data in various formats with filtering and customization options.
        </p>
      </div>

      {/* Format Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Export Format</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {supportedFormats.map(format => (
            <label key={format} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value={format}
                checked={selectedFormat === format}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="text-blue-600"
              />
              <span className="text-sm font-medium capitalize">{format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">Include metadata (export date, version, source)</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeCompression}
              onChange={(e) => setIncludeCompression(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">Enable compression (if supported)</span>
          </label>
        </div>
      </div>

      {/* Column Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Columns to Include</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableColumns.map(column => (
            <label key={column} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(column)}
                onChange={() => handleColumnToggle(column)}
                className="text-blue-600"
              />
              <span className="text-sm capitalize">{column.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Filters</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Languages
            </label>
            <input
              type="text"
              value={filters.languages.join(', ')}
              onChange={(e) => setFilters(prev => ({ ...prev, languages: e.target.value.split(',').map(s => s.trim()) }))}
              placeholder="eng, spa, fra"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parts of Speech
            </label>
            <input
              type="text"
              value={filters.partsOfSpeech.join(', ')}
              onChange={(e) => setFilters(prev => ({ ...prev, partsOfSpeech: e.target.value.split(',').map(s => s.trim()) }))}
              placeholder="n, v, adj, adv"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Progress */}
      {isExporting && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-800">Exporting...</span>
            <span className="text-sm text-yellow-600">{exportProgress}%</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-6 py-2 rounded-md font-medium text-white transition-colors ${
            isExporting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
        </button>
      </div>

      {/* Format Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Format Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>JSON:</strong> Structured data with metadata and statistics</p>
          <p><strong>XML:</strong> LMF (Lexical Markup Framework) format for interoperability</p>
          <p><strong>CSV:</strong> Comma-separated values for spreadsheet applications</p>
          <p><strong>SQL:</strong> Database dump with schema and sample data</p>
        </div>
      </div>
    </div>
  );
}; 
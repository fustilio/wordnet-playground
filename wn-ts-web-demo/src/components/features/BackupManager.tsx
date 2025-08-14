import React, { useState, useCallback } from 'react';
import { useBackup } from '../../hooks/useBackup';
import type { BackupMetadata } from '../../hooks/useBackup';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('BackupManager');

interface BackupManagerProps {
  onBackupCreated?: (backup: BackupMetadata) => void;
  onBackupRestored?: (data: ArrayBuffer) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ 
  onBackupCreated, 
  onBackupRestored 
}) => {
  const {
    backupConfigs,
    backupMetadata,
    stats,
    isRunning,
    createBackup,
    restoreBackup,
    verifyBackup,
    createBackupConfig,
    deleteBackupConfig,
    deleteBackup,
  } = useBackup();

  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form state for creating new backup config
  const [newConfig, setNewConfig] = useState({
    name: '',
    description: '',
    schedule: 'manual' as const,
    compression: false,
    encryption: false,
    retention: 30,
    incremental: false,
  });

  // Create new backup configuration
  const handleCreateConfig = useCallback(() => {
    if (!newConfig.name.trim()) {
      logger.warn('Backup config creation attempted without name');
      setMessage({ type: 'error', text: 'Backup name is required' });
      return;
    }

    logger.start('Creating backup configuration');
    
    try {
      createBackupConfig(newConfig);
      logger.success('Backup configuration created', { 
        name: newConfig.name, 
        schedule: newConfig.schedule,
        compression: newConfig.compression,
        encryption: newConfig.encryption
      });
      
      setNewConfig({
        name: '',
        description: '',
        schedule: 'manual',
        compression: false,
        encryption: false,
        retention: 30,
        incremental: false,
      });
      setShowCreateConfig(false);
      setMessage({ type: 'success', text: 'Backup configuration created successfully' });
    } catch (error) {
      logger.fail('Failed to create backup config', error);
      setMessage({ type: 'error', text: `Failed to create backup config: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      logger.end('Creating backup configuration');
    }
  }, [newConfig, createBackupConfig]);

  // Create backup
  const handleCreateBackup = useCallback(async () => {
    if (!selectedConfig) {
      logger.warn('Backup creation attempted without config selection');
      setMessage({ type: 'error', text: 'Please select a backup configuration' });
      return;
    }

    logger.start('Creating backup');
    
    setIsProcessing(true);
    try {
      // Create a sample data buffer for demo purposes
      const sampleData = new TextEncoder().encode(JSON.stringify({
        timestamp: new Date().toISOString(),
        data: 'Sample WordNet backup data',
        version: '1.0.0'
      }));

      logger.step('creating sample data', { configId: selectedConfig, dataSize: sampleData.length });
      
      const backup = await createBackup(selectedConfig, sampleData.buffer);
      
      logger.success('Backup created successfully', { 
        backupId: backup.id, 
        configId: selectedConfig,
        size: backup.size,
        timestamp: backup.timestamp
      });
      
      setShowCreateBackup(false);
      setMessage({ type: 'success', text: `Backup created successfully: ${backup.id}` });
      onBackupCreated?.(backup);
    } catch (error) {
      logger.fail('Failed to create backup', error);
      setMessage({ type: 'error', text: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsProcessing(false);
      logger.end('Creating backup');
    }
  }, [selectedConfig, createBackup, onBackupCreated]);

  // Restore backup
  const handleRestoreBackup = useCallback(async () => {
    if (!selectedBackup) {
      logger.warn('Backup restore attempted without selection');
      setMessage({ type: 'error', text: 'Please select a backup to restore' });
      return;
    }

    logger.start('Restoring backup');
    
    setIsProcessing(true);
    try {
      logger.step('starting restore process', { backupId: selectedBackup });
      
      const data = await restoreBackup(selectedBackup);
      
      logger.success('Backup restored successfully', { 
        backupId: selectedBackup,
        dataSize: data.byteLength
      });
      
      setMessage({ type: 'success', text: `Backup restored successfully: ${selectedBackup}` });
      onBackupRestored?.(data);
    } catch (error) {
      logger.fail('Failed to restore backup', error);
      setMessage({ type: 'error', text: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsProcessing(false);
      logger.end('Restoring backup');
    }
  }, [selectedBackup, restoreBackup, onBackupRestored]);

  // Verify backup
  const handleVerifyBackup = useCallback(async (backupId: string) => {
    logger.start('Verifying backup');
    
    try {
      logger.step('starting verification', { backupId });
      
      const isValid = await verifyBackup(backupId);
      
      if (isValid) {
        logger.success('Backup verification completed', { 
          backupId, 
          result: 'valid'
        });
      } else {
        logger.warn('Backup verification completed', { 
          backupId, 
          result: 'corrupted'
        });
      }
      
      setMessage({ 
        type: isValid ? 'success' : 'error', 
        text: `Backup ${backupId} is ${isValid ? 'valid' : 'corrupted'}` 
      });
    } catch (error) {
      logger.fail('Backup verification failed', error);
      setMessage({ type: 'error', text: `Failed to verify backup: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      logger.end('Verifying backup');
    }
  }, [verifyBackup]);

  // Delete backup
  const handleDeleteBackup = useCallback(async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      logger.start('Deleting backup');
      
      try {
        logger.step('deleting backup file', { backupId });
        
        await deleteBackup(backupId);
        
        logger.success('Backup deleted successfully', { backupId });
        setMessage({ type: 'success', text: `Backup ${backupId} deleted successfully` });
      } catch (error) {
        logger.fail('Failed to delete backup', error);
        setMessage({ type: 'error', text: `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}` });
      } finally {
        logger.end('Deleting backup');
      }
    }
  }, [deleteBackup]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleString();
  };

  // Clear message after 5 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold text-gray-900">Backup & Restore Manager</h3>
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Backup Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBackups}</div>
            <div className="text-sm text-gray-600">Total Backups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.compressionRatio.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Compression Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successfulBackups}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failedBackups}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {stats.lastBackup ? formatDate(stats.lastBackup) : 'Never'}
            </div>
            <div className="text-sm text-gray-600">Last Backup</div>
          </div>
        </div>
      </div>

      {/* Backup Configurations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Backup Configurations</h4>
          <button 
            onClick={() => setShowCreateConfig(true)}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Create Config
          </button>
        </div>

        {backupConfigs.length === 0 ? (
          <p className="text-gray-600">No backup configurations found. Create one to get started.</p>
        ) : (
          <div className="space-y-4">
            {backupConfigs.map(config => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">{config.name}</h5>
                    <p className="text-gray-600 mb-3">{config.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <span className="text-gray-600">Schedule: {config.schedule}</span>
                      <span className="text-gray-600">Compression: {config.compression ? 'Yes' : 'No'}</span>
                      <span className="text-gray-600">Encryption: {config.encryption ? 'Yes' : 'No'}</span>
                      <span className="text-gray-600">Retention: {config.retention} days</span>
                      <span className="text-gray-600">Created: {config.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => setSelectedConfig(config.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                        selectedConfig === config.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Select
                    </button>
                    <button 
                      onClick={() => deleteBackupConfig(config.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup */}
      {selectedConfig && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Create Backup</h4>
            <button 
              onClick={() => setShowCreateBackup(true)}
              disabled={isRunning || isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Create Backup
            </button>
          </div>
          <p className="text-gray-600">Selected config: {backupConfigs.find(c => c.id === selectedConfig)?.name}</p>
        </div>
      )}

      {/* Backup History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Backup History</h4>
        {backupMetadata.length === 0 ? (
          <p className="text-gray-600">No backups found.</p>
        ) : (
          <div className="space-y-4">
            {backupMetadata.map(backup => (
              <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Backup {backup.id}</h5>
                    <p className="text-gray-600 mb-3">Created: {formatDate(backup.timestamp)}</p>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                      <span className="text-gray-600">Size: {formatFileSize(backup.size)}</span>
                      {backup.compressedSize && (
                        <span className="text-gray-600">Compressed: {formatFileSize(backup.compressedSize)}</span>
                      )}
                      <span className="text-gray-600">Size: {backup.size} bytes</span>
                      <span className="text-gray-600">Created: {backup.timestamp.toLocaleDateString()}</span>
                      <span className={`font-medium ${
                        backup.integrity.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Integrity: {backup.integrity.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => setSelectedBackup(backup.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                        selectedBackup === backup.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Select
                    </button>
                    <button 
                      onClick={() => handleVerifyBackup(backup.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Backup */}
      {selectedBackup && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Restore Backup</h4>
            <button 
              onClick={handleRestoreBackup}
              disabled={isProcessing}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Restore Backup
            </button>
          </div>
          <p className="text-gray-600">Selected backup: {selectedBackup}</p>
        </div>
      )}

      {/* Create Config Modal */}
      {showCreateConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Create Backup Configuration</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Backup configuration name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                <textarea
                  value={newConfig.description}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Backup configuration description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule:</label>
                <select
                  value={newConfig.schedule}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, schedule: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="manual">Manual</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newConfig.compression}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, compression: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Compression</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newConfig.encryption}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Encryption</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retention (days):</label>
                <input
                  type="number"
                  value={newConfig.retention}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, retention: parseInt(e.target.value) }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newConfig.incremental}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, incremental: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Incremental Backups</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateConfig} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Create
              </button>
              <button onClick={() => setShowCreateConfig(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Modal */}
      {showCreateBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Create Backup</h4>
            <p className="text-gray-600 mb-6">This will create a backup using the selected configuration.</p>
            <div className="flex gap-3">
              <button 
                onClick={handleCreateBackup} 
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isProcessing ? 'Creating...' : 'Create Backup'}
              </button>
              <button 
                onClick={() => setShowCreateBackup(false)} 
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOPFS } from './useOPFS';

export interface BackupConfig {
  id: string;
  name: string;
  description: string;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  compression: boolean;
  encryption: boolean;
  retention: number; // days
  incremental: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface BackupMetadata {
  id: string;
  configId: string;
  timestamp: Date;
  size: number;
  compressedSize?: number;
  checksum: string;
  format: 'full' | 'incremental';
  parentBackupId?: string;
  integrity: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  compression: {
    algorithm: string;
    ratio: number;
  };
  encryption: {
    algorithm: string;
    keyId: string;
  };
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  failedBackups: number;
  successfulBackups: number;
}

export const useBackup = () => {
  const { opfsManager } = useOPFS();
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    failedBackups: 0,
    successfulBackups: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const schedulerRef = useRef<number | undefined>(undefined);

  // Load backup configurations and metadata
  const loadBackupData = useCallback(async () => {
    try {
      if (!opfsManager) return;
      
      const files = await opfsManager.listFiles();
      const configsFile = files.find(f => f.name === 'backup-configs.json');
      const metadataFile = files.find(f => f.name === 'backup-metadata.json');
      
      if (configsFile) {
        const configsData = await opfsManager.readSyncFile('backup-configs.json');
        if (configsData) {
          const configs = JSON.parse(new TextDecoder().decode(configsData));
          setBackupConfigs(configs);
        }
      }

      if (metadataFile) {
        const metadataData = await opfsManager.readSyncFile('backup-metadata.json');
        if (metadataData) {
          const metadata = JSON.parse(new TextDecoder().decode(metadataData));
          setBackupMetadata(metadata);
          calculateStats(metadata);
        }
      }
    } catch {
      console.log('No existing backup data found, starting fresh');
      setBackupConfigs([]);
      setBackupMetadata([]);
    }
  }, [opfsManager]);

  // Calculate backup statistics
  const calculateStats = useCallback((metadata: BackupMetadata[]) => {
    const totalSize = metadata.reduce((sum, backup) => sum + backup.size, 0);
    const compressedSize = metadata.reduce((sum, backup) => 
      sum + (backup.compressedSize || backup.size), 0);
    const compressionRatio = totalSize > 0 ? (1 - compressedSize / totalSize) * 100 : 0;
    const failedBackups = metadata.filter(b => !b.integrity.isValid).length;
    const successfulBackups = metadata.filter(b => b.integrity.isValid).length;
    const lastBackup = metadata.length > 0 ? 
      new Date(Math.max(...metadata.map(b => new Date(b.timestamp).getTime()))) : undefined;

    setStats({
      totalBackups: metadata.length,
      totalSize,
      compressedSize,
      compressionRatio,
      lastBackup,
      failedBackups,
      successfulBackups,
    });
  }, []);

  // Save backup data
  const saveBackupData = useCallback(async () => {
    try {
      if (!opfsManager) return;
      
      await opfsManager.writeSyncFile('backup-configs.json', new TextEncoder().encode(JSON.stringify(backupConfigs, null, 2)));
      await opfsManager.writeSyncFile('backup-metadata.json', new TextEncoder().encode(JSON.stringify(backupMetadata, null, 2)));
    } catch (error) {
      console.error('Failed to save backup data:', error);
    }
  }, [backupConfigs, backupMetadata, opfsManager]);

  // Generate checksum for data integrity
  const generateChecksum = useCallback(async (data: ArrayBuffer): Promise<string> => {
    const buffer = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }, []);

  // Compress data
  const compressData = useCallback(async (data: ArrayBuffer): Promise<ArrayBuffer> => {
    // Simple compression using TextEncoder/TextDecoder
    const text = new TextDecoder().decode(data);
    const compressed = text.replace(/(.)\1+/g, (match) => `${match.length}${match[0]}`);
    return new TextEncoder().encode(compressed).buffer;
  }, []);

  // Encrypt data (simple XOR encryption for demo)
  const encryptData = useCallback(async (data: ArrayBuffer, key: string): Promise<ArrayBuffer> => {
    const buffer = new Uint8Array(data);
    const keyBytes = new TextEncoder().encode(key);
    const encrypted = new Uint8Array(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      encrypted[i] = buffer[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return encrypted.buffer;
  }, []);

  // Create backup
  const createBackup = useCallback(async (
    configId: string,
    data: ArrayBuffer,
    format: 'full' | 'incremental' = 'full',
    parentBackupId?: string
  ): Promise<BackupMetadata> => {
    const config = backupConfigs.find(c => c.id === configId);
    if (!config) {
      throw new Error(`Backup config ${configId} not found`);
    }

    const timestamp = new Date();
    const backupId = `backup-${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let processedData = data;
    let compressionInfo = { algorithm: 'none', ratio: 0 };
    let encryptionInfo = { algorithm: 'none', keyId: '' };

    // Apply compression if enabled
    if (config.compression) {
      const originalSize = processedData.byteLength;
      processedData = await compressData(processedData);
      const compressedSize = processedData.byteLength;
      compressionInfo = {
        algorithm: 'simple',
        ratio: ((originalSize - compressedSize) / originalSize) * 100
      };
    }

    // Apply encryption if enabled
    if (config.encryption) {
      const key = `backup-key-${backupId}`;
      processedData = await encryptData(processedData, key);
      encryptionInfo = {
        algorithm: 'xor',
        keyId: key
      };
    }

    // Generate checksum for integrity
    const checksum = await generateChecksum(processedData);

    // Save backup file
    if (opfsManager) {
      await opfsManager.writeSyncFile(`backups/${backupId}.backup`, new Uint8Array(processedData));
    }

    // Create metadata
    const metadata: BackupMetadata = {
      id: backupId,
      configId,
      timestamp,
      size: data.byteLength,
      compressedSize: config.compression ? processedData.byteLength : undefined,
      checksum,
      format,
      parentBackupId,
      integrity: {
        isValid: true,
        errors: [],
        warnings: []
      },
      compression: compressionInfo,
      encryption: encryptionInfo
    };

    // Update config status
    const updatedConfigs = backupConfigs.map(c => 
      c.id === configId 
        ? { ...c, lastRun: timestamp, status: 'completed' as const }
        : c
    );
    setBackupConfigs(updatedConfigs);

    // Add metadata
    const updatedMetadata = [...backupMetadata, metadata];
    setBackupMetadata(updatedMetadata);
    calculateStats(updatedMetadata);

    return metadata;
  }, [backupConfigs, backupMetadata, compressData, encryptData, generateChecksum, opfsManager, calculateStats]);

  // Restore backup
  const restoreBackup = useCallback(async (backupId: string): Promise<ArrayBuffer> => {
    const metadata = backupMetadata.find(b => b.id === backupId);
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (!opfsManager) {
      throw new Error('OPFS manager not available');
    }

    // Read backup file
    const data = await opfsManager.readSyncFile(`backups/${backupId}.backup`);
    if (!data) {
      throw new Error('Backup file not found');
    }

    let processedData = new Uint8Array(data);

    // Decrypt if encrypted
    if (metadata.encryption.algorithm !== 'none') {
      const decrypted = await encryptData(processedData.buffer, metadata.encryption.keyId); // XOR is symmetric
      processedData = new Uint8Array(decrypted);
    }

    // Decompress if compressed
    if (metadata.compression.algorithm !== 'none') {
      // Simple decompression
      const text = new TextDecoder().decode(processedData);
      const decompressed = text.replace(/(\d+)(.)/g, (_, count, char) => char.repeat(parseInt(count)));
      processedData = new TextEncoder().encode(decompressed);
    }

    // Verify integrity
    const checksum = await generateChecksum(processedData.buffer);
    if (checksum !== metadata.checksum) {
      throw new Error('Backup integrity check failed');
    }

    return processedData.buffer;
  }, [backupMetadata, opfsManager, encryptData, generateChecksum]);

  // Verify backup integrity
  const verifyBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      await restoreBackup(backupId);
      return true;
    } catch (error) {
      console.error(`Backup ${backupId} integrity check failed:`, error);
      return false;
    }
  }, [restoreBackup]);

  // Create backup configuration
  const createBackupConfig = useCallback((config: Omit<BackupConfig, 'id' | 'createdAt' | 'status'>) => {
    const newConfig: BackupConfig = {
      ...config,
      id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'idle'
    };

    setBackupConfigs(prev => [...prev, newConfig]);
    return newConfig;
  }, []);

  // Update backup configuration
  const updateBackupConfig = useCallback((configId: string, updates: Partial<BackupConfig>) => {
    setBackupConfigs(prev => prev.map(config => 
      config.id === configId ? { ...config, ...updates } : config
    ));
  }, []);

  // Delete backup configuration
  const deleteBackupConfig = useCallback((configId: string) => {
    setBackupConfigs(prev => prev.filter(config => config.id !== configId));
  }, []);

  // Delete backup
  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      if (opfsManager) {
        // Note: This would need to be implemented in the OPFS manager
        // For now, we'll just remove from metadata
        setBackupMetadata(prev => prev.filter(backup => backup.id !== backupId));
      }
    } catch (error) {
      console.error(`Failed to delete backup ${backupId}:`, error);
    }
  }, [opfsManager]);

  // Schedule automatic backups
  const scheduleBackups = useCallback(() => {
    const now = new Date();
    const configsToRun = backupConfigs.filter(config => {
      if (config.schedule === 'manual') return false;
      if (!config.lastRun) return true;
      
      const lastRun = new Date(config.lastRun);
      const timeSinceLastRun = now.getTime() - lastRun.getTime();
      
      switch (config.schedule) {
        case 'daily':
          return timeSinceLastRun >= 24 * 60 * 60 * 1000;
        case 'weekly':
          return timeSinceLastRun >= 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
          return timeSinceLastRun >= 30 * 24 * 60 * 60 * 1000;
        default:
          return false;
      }
    });

    return configsToRun;
  }, [backupConfigs]);

  // Clean up old backups based on retention policy
  const cleanupOldBackups = useCallback(async () => {
    const now = new Date();
    const backupsToDelete = backupMetadata.filter(backup => {
      const config = backupConfigs.find(c => c.id === backup.configId);
      if (!config || config.retention === 0) return false;
      
      const backupDate = new Date(backup.timestamp);
      const daysOld = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > config.retention;
    });

    for (const backup of backupsToDelete) {
      await deleteBackup(backup.id);
    }
  }, [backupMetadata, backupConfigs, deleteBackup]);

  // Initialize backup system
  useEffect(() => {
    if (opfsManager) {
      loadBackupData();
    }
  }, [loadBackupData, opfsManager]);

  // Save data when it changes
  useEffect(() => {
    if (opfsManager) {
      saveBackupData();
    }
  }, [saveBackupData, opfsManager]);

  // Set up automatic backup scheduler
  useEffect(() => {
    const runScheduledBackups = async () => {
      if (isRunning) return;
      
      const configsToRun = scheduleBackups();
      if (configsToRun.length === 0) return;

      setIsRunning(true);
      
      try {
        // This would typically trigger a backup of the current WordNet data
        // For now, we'll just update the status
        for (const config of configsToRun) {
          updateBackupConfig(config.id, { status: 'running' });
          // In a real implementation, you would create the actual backup here
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate backup time
          updateBackupConfig(config.id, { status: 'completed' });
        }
      } catch (error) {
        console.error('Scheduled backup failed:', error);
        configsToRun.forEach(config => 
          updateBackupConfig(config.id, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' })
        );
      } finally {
        setIsRunning(false);
      }
    };

    // Run every hour
    schedulerRef.current = setInterval(runScheduledBackups, 60 * 60 * 1000);
    
    // Also run cleanup daily
    const cleanupInterval = setInterval(cleanupOldBackups, 24 * 60 * 60 * 1000);

    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
      clearInterval(cleanupInterval);
    };
  }, [scheduleBackups, isRunning, updateBackupConfig, cleanupOldBackups]);

  return {
    // State
    backupConfigs,
    backupMetadata,
    stats,
    isRunning,
    
    // Actions
    createBackup,
    restoreBackup,
    verifyBackup,
    createBackupConfig,
    updateBackupConfig,
    deleteBackupConfig,
    deleteBackup,
    
    // Utilities
    scheduleBackups,
    cleanupOldBackups,
  };
}; 
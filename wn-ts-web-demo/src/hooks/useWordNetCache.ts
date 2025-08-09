import { useState, useCallback } from 'react';

interface CacheInfo {
  filename: string;
  size: number;
  lastModified: Date;
  checksum?: string;
  packageId: string;
}

interface CacheStatus {
  isSupported: boolean;
  files: CacheInfo[];
  totalSize: number;
  availableSpace: number;
}

export const useWordNetCache = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isSupported: false,
    files: [],
    totalSize: 0,
    availableSpace: 0
  });

  // Check if OPFS is supported
  const checkOPFSSupport = useCallback(async (): Promise<boolean> => {
    try {
      const isSecureContext = window.isSecureContext;
      const hasOPFS = 'storage' in navigator && 'getDirectory' in navigator.storage;
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      
      const supported = hasOPFS && hasSharedArrayBuffer && isSecureContext;
      setCacheStatus(prev => ({ ...prev, isSupported: supported }));
      
      if (supported) {
        await updateCacheInfo();
      }
      
      return supported;
    } catch (error) {
      console.error('Error checking OPFS support:', error);
      return false;
    }
  }, []);

  // Update cache information
  const updateCacheInfo = useCallback(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      const files: CacheInfo[] = [];
      let totalSize = 0;

      // List all files in OPFS
      for await (const [name, handle] of (root as any).entries()) {
        if (handle.kind === 'file') {
          const file = await (handle as any).getFile();
          const fileInfo: CacheInfo = {
            filename: name,
            size: file.size,
            lastModified: new Date(file.lastModified),
            packageId: extractPackageId(name)
          };
          files.push(fileInfo);
          totalSize += file.size;
        }
      }

      // Get storage quota
      const quota = await navigator.storage.estimate();
      const availableSpace = (quota.quota || 0) - (quota.usage || 0);

      setCacheStatus(prev => ({
        ...prev,
        files,
        totalSize,
        availableSpace
      }));
    } catch (error) {
      console.error('Error updating cache info:', error);
    }
  }, []);

  // Extract package ID from filename
  const extractPackageId = (filename: string): string => {
    // Expected format: "wordnet-{packageId}.db"
    const match = filename.match(/wordnet-(.+)\.db/);
    return match ? match[1] : 'unknown';
  };

  // Check if a package is cached
  const isPackageCached = useCallback((packageId: string): boolean => {
    return cacheStatus.files.some(file => file.packageId === packageId);
  }, [cacheStatus.files]);

  // Get cached package info
  const getCachedPackageInfo = useCallback((packageId: string): CacheInfo | null => {
    return cacheStatus.files.find(file => file.packageId === packageId) || null;
  }, [cacheStatus.files]);

  // Save database to cache
  const saveToCache = useCallback(async (
    packageId: string, 
    databaseBuffer: ArrayBuffer,
    progress?: (progress: number) => void
  ): Promise<boolean> => {
    try {
      if (!cacheStatus.isSupported) {
        console.warn('OPFS not supported, cannot cache database');
        return false;
      }

      const root = await navigator.storage.getDirectory();
      const filename = `wordnet-${packageId}.db`;
      
      // Create file handle
      const fileHandle = await (root as any).getFileHandle(filename, { create: true });
      
      // Get sync access handle for efficient writing
      const syncAccessHandle = await fileHandle.createSyncAccessHandle();
      
      try {
        const uint8Array = new Uint8Array(databaseBuffer);
        const chunkSize = 1024 * 1024; // 1MB chunks
        let written = 0;
        
        for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
          const chunk = uint8Array.slice(offset, offset + chunkSize);
          syncAccessHandle.write(chunk, { at: offset });
          written += chunk.length;
          
          if (progress) {
            progress(written / uint8Array.length);
          }
        }
        
        syncAccessHandle.flush();
        console.log(`✅ Database cached successfully: ${filename} (${uint8Array.length} bytes)`);
        
        // Update cache info
        await updateCacheInfo();
        
        return true;
      } finally {
        syncAccessHandle.close();
      }
    } catch (error) {
      console.error('Error saving to cache:', error);
      return false;
    }
  }, [cacheStatus.isSupported, updateCacheInfo]);

  // Load database from cache
  const loadFromCache = useCallback(async (
    packageId: string,
    progress?: (progress: number) => void
  ): Promise<ArrayBuffer | null> => {
    try {
      if (!cacheStatus.isSupported) {
        console.warn('OPFS not supported, cannot load from cache');
        return null;
      }

      const filename = `wordnet-${packageId}.db`;
      const root = await navigator.storage.getDirectory();
      
      try {
        const fileHandle = await (root as any).getFileHandle(filename);
        const file = await fileHandle.getFile();
        
        if (progress) progress(0.1);
        
        const arrayBuffer = await file.arrayBuffer();
        
        if (progress) progress(1.0);
        
        console.log(`✅ Database loaded from cache: ${filename} (${arrayBuffer.byteLength} bytes)`);
        return arrayBuffer;
      } catch (error) {
        console.log(`❌ Database not found in cache: ${filename}`);
        return null;
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }, [cacheStatus.isSupported]);

  // Clear cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      if (!cacheStatus.isSupported) {
        console.warn('OPFS not supported, cannot clear cache');
        return false;
      }

      const root = await navigator.storage.getDirectory();
      
      // Remove all WordNet database files
      for await (const [name, handle] of (root as any).entries()) {
        if (handle.kind === 'file' && name.startsWith('wordnet-')) {
          await (root as any).removeEntry(name);
          console.log(`🗑️ Removed cached file: ${name}`);
        }
      }
      
      await updateCacheInfo();
      console.log('✅ Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, [cacheStatus.isSupported, updateCacheInfo]);

  // Remove specific package from cache
  const removeFromCache = useCallback(async (packageId: string): Promise<boolean> => {
    try {
      if (!cacheStatus.isSupported) {
        console.warn('OPFS not supported, cannot remove from cache');
        return false;
      }

      const filename = `wordnet-${packageId}.db`;
      const root = await navigator.storage.getDirectory();
      
      try {
        await (root as any).removeEntry(filename);
        console.log(`🗑️ Removed from cache: ${filename}`);
        await updateCacheInfo();
        return true;
      } catch (error) {
        console.log(`❌ File not found in cache: ${filename}`);
        return false;
      }
    } catch (error) {
      console.error('Error removing from cache:', error);
      return false;
    }
  }, [cacheStatus.isSupported, updateCacheInfo]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const totalFiles = cacheStatus.files.length;
    const totalSizeMB = Math.round(cacheStatus.totalSize / (1024 * 1024) * 100) / 100;
    const availableSpaceMB = Math.round(cacheStatus.availableSpace / (1024 * 1024) * 100) / 100;
    
    return {
      totalFiles,
      totalSizeMB,
      availableSpaceMB,
      isSupported: cacheStatus.isSupported
    };
  }, [cacheStatus]);

  return {
    // State
    cacheStatus,
    
    // Methods
    checkOPFSSupport,
    updateCacheInfo,
    isPackageCached,
    getCachedPackageInfo,
    saveToCache,
    loadFromCache,
    clearCache,
    removeFromCache,
    getCacheStats
  };
};



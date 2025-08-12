import { useState, useEffect } from 'react';
import type { StorageInfo } from '../types/index';

// Type declarations for File System API
declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    remove(options?: { recursive?: boolean }): Promise<void>;
  }
  
  interface FileSystemFileHandle {
    createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
  }
  
  interface FileSystemSyncAccessHandle {
    getSize(): number;
    write(data: Uint8Array, options?: { at?: number }): number;
    read(buffer: DataView, options?: { at?: number }): number;
    truncate(size: number): void;
    flush(): void;
    close(): void;
  }
}


interface OPFSManager {
  initialize(): Promise<boolean>;
  listFiles(): Promise<Array<{ name: string; size: number; lastModified: Date; type: string }>>;
  writeSyncFile(filename: string, data: Uint8Array): Promise<boolean>;
  readSyncFile(filename: string): Promise<Uint8Array | null>;
  getStorageQuota(): Promise<{ quota: number; usage: number; available: number }>;
  clearAll(): Promise<boolean>;
}

/**
 * Enhanced OPFS hook with SQLite WASM best practices
 * Based on patterns from https://llmtext.com/developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system
 * Enhanced with Mozilla OPFS documentation: https://llmtext.com/developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
 */
export const useOPFS = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [opfsManager, setOpfsManager] = useState<OPFSManager | null>(null);

  // Check for OPFS and SharedArrayBuffer support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check for secure context (required for OPFS)
        const isSecure = window.isSecureContext;
        if (!isSecure) {
          console.warn('OPFS requires secure context (HTTPS) - some features may not work');
        }

        const hasOPFS = 'storage' in navigator && 'getDirectory' in (navigator.storage as any);
        const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
        const hasWebWorkers = typeof Worker !== 'undefined';
        
        // Treat OPFS as supported when OPFS API is present and secure context, even without SAB
        const supported = !!(hasOPFS && isSecure);
        setIsSupported(supported);
        
        if (!hasOPFS) {
          console.warn('OPFS not supported in this browser');
        }
        if (!hasSharedArrayBuffer) {
          console.info('SharedArrayBuffer not available - SQLite WASM OPFS VFS requires COOP/COEP. Using standard ArrayBuffer for non-worker OPFS operations.');
        }
        if (!hasWebWorkers) {
          console.warn('Web Workers not supported - synchronous OPFS access unavailable');
        }
        if (!isSecure) {
          console.warn('Secure context required for OPFS - use HTTPS');
        }

        // Initialize OPFSManager if supported
        if (supported) {
          console.log('🚀 Initializing OPFS manager...');
          const manager: OPFSManager = {
            async initialize() {
              try {
                console.log('📁 Getting OPFS root directory...');
                await (navigator.storage as any).getDirectory();
                console.log('✅ OPFS root directory obtained');
                return true;
              } catch (error) {
                console.error('❌ Failed to initialize OPFS:', error);
                return false;
              }
            },
            async listFiles() {
              const root = await (navigator.storage as any).getDirectory();
              const files: Array<{ name: string; size: number; lastModified: Date; type: string }> = [];
              
              try {
                for await (const [name, handle] of (root as FileSystemDirectoryHandle).entries()) {
                  if ((handle as any).kind === 'file') {
                    const file = await (handle as any as FileSystemFileHandle).getFile();
                    files.push({
                      name,
                      size: file.size,
                      lastModified: new Date(file.lastModified),
                      type: (file as any).type || 'application/octet-stream'
                    });
                  }
                }
              } catch (error) {
                console.error('Failed to list OPFS files:', error);
              }
              
              return files;
            },
            async writeSyncFile(filename: string, data: Uint8Array) {
              try {
                const root = await (navigator.storage as any).getDirectory();
                const fileHandle = await (root as any).getFileHandle(filename, { create: true });
                
                // Use the new OPFS API with createSyncAccessHandle if available
                if (fileHandle.createSyncAccessHandle) {
                  const accessHandle = await fileHandle.createSyncAccessHandle();
                  try {
                    accessHandle.write(data);
                    accessHandle.flush();
                    return true;
                  } finally {
                    accessHandle.close();
                  }
                } else {
                  // Fallback: write via writable stream
                  const writable = await (fileHandle as any).createWritable();
                  await writable.write(data);
                  await writable.close();
                  return true;
                }
              } catch (error) {
                console.error('Failed to write sync file:', error);
                return false;
              }
            },
            async readSyncFile(filename: string) {
              try {
                const root = await (navigator.storage as any).getDirectory();
                const fileHandle = await (root as any).getFileHandle(filename);
                
                // Use the new OPFS API with createSyncAccessHandle if available
                if (fileHandle.createSyncAccessHandle) {
                  const accessHandle = await fileHandle.createSyncAccessHandle();
                  try {
                    const size = accessHandle.getSize();
                    const buffer = new ArrayBuffer(size);
                    const view = new DataView(buffer);
                    accessHandle.read(view);
                    return new Uint8Array(buffer);
                  } finally {
                    accessHandle.close();
                  }
                } else {
                  const file = await (fileHandle as any).getFile();
                  const buf = await file.arrayBuffer();
                  return new Uint8Array(buf);
                }
              } catch (error) {
                console.error('Failed to read sync file:', error);
                return null;
              }
            },
            async getStorageQuota() {
              try {
                const estimate = await navigator.storage.estimate();
                const quota = estimate.quota || 0;
                const usage = estimate.usage || 0;
                const available = Math.max(0, quota - usage);
                return { quota, usage, available };
              } catch (error) {
                console.error('Failed to get storage quota:', error);
                return { quota: 0, usage: 0, available: 0 };
              }
            },
            async clearAll() {
              try {
                const root = await (navigator.storage as any).getDirectory();
                await (root as FileSystemDirectoryHandle).remove({ recursive: true });
                return true;
              } catch (error) {
                console.error('Failed to clear OPFS:', error);
                return false;
              }
            }
          };
          
          const initialized = await manager.initialize();
          if (initialized) {
            setOpfsManager(manager);
          }
        }
      } catch (error) {
        console.error('Support check failed:', error);
        setIsSupported(false);
      }
    };
    
    checkSupport();
  }, []);

  const getStorageInfo = async (): Promise<StorageInfo> => {
    const startTime = performance.now();
    
    try {
      // Check if OPFS is supported
      if (!isSupported) {
        throw new Error('OPFS not supported in this browser');
      }

      if (!opfsManager) {
        throw new Error('OPFS manager not initialized');
      }

      // Use OPFSManager for better performance
      const files = await opfsManager.listFiles();
      const quota = await opfsManager.getStorageQuota();
      
      const databases = files
        .filter((file: { name: string; size: number; lastModified: Date; type: string }) => 
          file.name.endsWith('.db') || file.name.endsWith('.sqlite') || file.name.endsWith('.sqlite3'))
        .map((file: { name: string; size: number; lastModified: Date; type: string }) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          tables: [] // TODO: Get actual table list from SQLite
        }));

      // Per sqlite wasm OPFS docs, prefer navigator.storage.estimate() usage/quota as the source of truth
      // for space usage, since not all OPFS files are necessarily visible or accounted for individually.
      const total = quota.quota;
      const used = quota.usage; // use whole-origin usage as the best signal
      const available = Math.max(0, total - used);

      const duration = performance.now() - startTime;
      console.log(`Storage info retrieved in ${duration.toFixed(2)}ms`);

      return {
        total,
        used,
        available,
        databases
      };
    } catch (error) {
      console.warn('Could not get storage info:', error);
      return {
        total: 0,
        used: 0,
        available: 0,
        databases: []
      };
    }
  };

  const exportDatabase = async (wordnet: any) => {
    if (!wordnet) return;
    
    const startTime = performance.now();
    
    try {
      const data = await wordnet.export();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wordnet-database-${Date.now()}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const duration = performance.now() - startTime;
      console.log(`Database exported in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const importDatabase = async (
    dataLoader: any,
    setIsImporting: (importing: boolean) => void,
    setImportProgress: (progress: number) => void
  ) => {
    const startTime = performance.now();
    
    try {
      setIsImporting(true);
      setImportProgress(0);

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db,.sqlite,.sqlite3';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          setImportProgress(25);
          const arrayBuffer = await file.arrayBuffer();
          setImportProgress(50);
          
          // The project ID for an arbitrary DB is unknown, so we use a placeholder
          await dataLoader.loadDbFromBuffer(arrayBuffer, 'imported-db:1.0');
          setImportProgress(100);
          
          // Refresh storage info
          const newStorageInfo = await getStorageInfo();
          setStorageInfo(newStorageInfo);
          
          const duration = performance.now() - startTime;
          console.log(`Database imported in ${duration.toFixed(2)}ms`);
          
          alert('Database imported successfully! You may need to refresh the page to see changes.');
        } catch (error) {
          console.error('Import failed:', error);
          alert('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setIsImporting(false);
          setImportProgress(0);
        }
      };
      input.click();
    } catch (error) {
      setIsImporting(false);
      setImportProgress(0);
      console.error('Import failed:', error);
      alert('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const saveToOPFS = async (wordnet: any) => {
    if (!wordnet) return;
    
    const startTime = performance.now();
    
    try {
      if (!isSupported) {
        throw new Error('OPFS not supported in this browser');
      }

      if (!opfsManager) {
        throw new Error('OPFS manager not initialized');
      }

      console.log('🔄 Starting OPFS save operation...');
      const data = await wordnet.export();
      console.log(`📦 Exported ${data.length} bytes of data`);
      
      const filename = `wordnet-${Date.now()}.db`;
      console.log(`💾 Saving to OPFS as: ${filename}`);
      
      // Use synchronous write for better performance when available
      const success = await opfsManager.writeSyncFile(filename, data);
      
      if (!success) {
        throw new Error('Failed to write to OPFS');
      }
      
      console.log('✅ Successfully wrote to OPFS');
      
      // Refresh storage info
      const newStorageInfo = await getStorageInfo();
      setStorageInfo(newStorageInfo);
      
      const duration = performance.now() - startTime;
      console.log(`💾 Database saved to OPFS in ${duration.toFixed(2)}ms`);
      console.log('🔍 Check the OPFS explorer extension to see the saved file');
      
      alert(`Database saved to OPFS as ${filename}`);
    } catch (error) {
      console.error('❌ Save to OPFS failed:', error);
      alert('Save to OPFS failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };


  // Delete database from OPFS
  const deleteFromOPFS = async (filename: string) => {
    try {
      if (!isSupported) {
        throw new Error('OPFS not supported in this browser');
      }

      if (!opfsManager) {
        throw new Error('OPFS manager not initialized');
      }

      // Use OPFSManager for better error handling
      const root: any = await (navigator.storage as any).getDirectory();
      if (typeof root.removeEntry === 'function') {
        await root.removeEntry(filename);
      } else {
        const fh = await root.getFileHandle(filename).catch(() => null);
        if (fh?.createSyncAccessHandle) {
          const ah = await fh.createSyncAccessHandle();
          try {
            ah.truncate(0);
            ah.flush();
          } finally {
            ah.close();
          }
        }
      }
      
      // Refresh storage info
      const newStorageInfo = await getStorageInfo();
      setStorageInfo(newStorageInfo);
      
      console.log(`Database ${filename} deleted from OPFS`);
    } catch (error) {
      console.error('Delete from OPFS failed:', error);
      throw error;
    }
  };

  // Clear all OPFS data
  const clearAllOPFS = async () => {
    try {
      if (!isSupported) {
        throw new Error('OPFS not supported in this browser');
      }

      if (!opfsManager) {
        throw new Error('OPFS manager not initialized');
      }

      const success = await opfsManager.clearAll();
      
      if (success) {
        // Refresh storage info
        const newStorageInfo = await getStorageInfo();
        setStorageInfo(newStorageInfo);
        
        console.log('All OPFS data cleared');
        alert('All OPFS data cleared successfully');
      }
    } catch (error) {
      console.error('Clear OPFS failed:', error);
      alert('Clear OPFS failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return {
    isSupported,
    storageInfo,
    getStorageInfo,
    exportDatabase,
    importDatabase,
    saveToOPFS,
    deleteFromOPFS,
    clearAllOPFS,
  } as const;
}

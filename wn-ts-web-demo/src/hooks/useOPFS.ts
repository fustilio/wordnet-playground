import { useState, useEffect } from 'react';
import type { StorageInfo } from '../types/index';
import { SqliteWorkerClient } from '../lib/sqliteClient';

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

export const useOPFS = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [client, setClient] = useState<SqliteWorkerClient | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const isSecure = window.isSecureContext;
        const hasOPFS = 'storage' in navigator && 'getDirectory' in (navigator.storage as any);
        const hasWorkers = typeof Worker !== 'undefined';
        const supported = !!(isSecure && hasOPFS && hasWorkers);
        setIsSupported(supported);
        if (!supported) return;

        const c = new SqliteWorkerClient();
        await c.init();
        await c.open('wn-demo.sqlite3');
        setClient(c);
        try {
          const info = await getStorageInfo();
          setStorageInfo(info);
        } catch {}
      } catch (e) {
        console.warn('OPFS worker setup failed; continuing without worker', e);
        setIsSupported(false);
      }
    };
    setup();
    return () => {
      try { client?.close?.(); } catch {}
      try { client?.dispose?.(); } catch {}
    };
  }, []);

  const getStorageInfo = async (): Promise<StorageInfo> => {
    try {
      if (!isSupported || !client) throw new Error('OPFS not available');
      const files = await client.listOpfs();
      const estimate = await navigator.storage.estimate();
      const databases = files
        .filter((f) => f.name.endsWith('.db') || f.name.endsWith('.sqlite') || f.name.endsWith('.sqlite3'))
        .map((f) => ({ name: f.name, size: f.size, lastModified: new Date(), tables: [] }));
      return {
        total: estimate.quota || 0,
        used: estimate.usage || 0,
        available: Math.max(0, (estimate.quota || 0) - (estimate.usage || 0)),
        databases,
      };
    } catch (e) {
      return { total: 0, used: 0, available: 0, databases: [] };
    }
  };

  return {
    isSupported,
    storageInfo,
    getStorageInfo,
  } as const;
}

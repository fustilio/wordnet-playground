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
      } catch (e) {
        console.warn('OPFS worker setup failed; continuing without worker', e);
        setIsSupported(false);
      }
    };
    setup();
    return () => {
      // no-op; worker will be GC'd when component unmounts
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

  const exportDatabase = async (wordnet: any) => {
    if (!wordnet) return;
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
  };

  const importDatabase = async (
    dataLoader: any,
    setIsImporting: (importing: boolean) => void,
    setImportProgress: (progress: number) => void
  ) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db,.sqlite,.sqlite3';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setImportProgress(25);
        const arrayBuffer = await file.arrayBuffer();
        setImportProgress(50);
        await dataLoader.loadDbFromBuffer(arrayBuffer, 'imported-db:1.0');
        setImportProgress(100);
        const info = await getStorageInfo();
        setStorageInfo(info);
      };
      input.click();
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const saveToOPFS = async (wordnet: any) => {
    if (!isSupported || !client || !wordnet) throw new Error('OPFS not available');
    const data = await wordnet.export();
    const filename = `wordnet-${Date.now()}.db`;
    await client.writeFile(filename, data);
    const info = await getStorageInfo();
    setStorageInfo(info);
    alert(`Database saved to OPFS as ${filename}`);
  };

  const deleteFromOPFS = async (filename: string) => {
    if (!isSupported || !client) throw new Error('OPFS not available');
    await client.deleteOpfs(filename);
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const clearAllOPFS = async () => {
    if (!isSupported || !client) throw new Error('OPFS not available');
    const files = await client.listOpfs();
    await Promise.all(files.map((f) => client.deleteOpfs(f.name)));
    const info = await getStorageInfo();
    setStorageInfo(info);
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

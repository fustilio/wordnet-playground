/**
 * OPFS Manager for wn-ts-web
 * Provides comprehensive file system operations for browser-based WordNet data management
 */

export type OPFSFileInfo = {
  name: string;
  size: number;
  lastModified: Date;
  type: 'database' | 'download' | 'export' | 'backup';
}

export type OPFSStorageInfo = {
  total: number;
  used: number;
  available: number;
  files: OPFSFileInfo[];
  databases: OPFSFileInfo[];
  downloads: OPFSFileInfo[];
  exports: OPFSFileInfo[];
  backups: OPFSFileInfo[];
}

export type DownloadProgress = {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  status: 'downloading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export type DownloadOptions = {
  onProgress?: (progress: DownloadProgress) => void;
  force?: boolean;
  timeout?: number;
}

export class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null;

  /**
   * Initialize OPFS access
   */
  async initialize(): Promise<void> {
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('OPFS not supported in this browser');
    }
    
    try {
      this.root = await navigator.storage.getDirectory();
    } catch (error) {
      throw new Error(`Failed to access OPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive storage information
   */
  async getStorageInfo(): Promise<OPFSStorageInfo> {
    if (!this.root) {
      await this.initialize();
    }

    const files: OPFSFileInfo[] = [];
    let totalSize = 0;

    // Scan all files in OPFS
    for await (const [name, handle] of (this.root as any).entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        const size = file.size;
        totalSize += size;

        const fileInfo: OPFSFileInfo = {
          name,
          size,
          lastModified: new Date(file.lastModified),
          type: this.getFileType(name)
        };

        files.push(fileInfo);
      }
    }

    // Group files by type
    const databases = files.filter(f => f.type === 'database');
    const downloads = files.filter(f => f.type === 'download');
    const exports = files.filter(f => f.type === 'export');
    const backups = files.filter(f => f.type === 'backup');

    // Get storage quota
    const quota = await navigator.storage.estimate();
    const total = quota.quota || 0;
    const used = totalSize;
    const available = total - used;

    return {
      total,
      used,
      available,
      files,
      databases,
      downloads,
      exports,
      backups
    };
  }

  /**
   * Download a WordNet project to OPFS
   */
  async downloadProject(projectId: string, options: DownloadOptions = {}): Promise<string> {
    if (!this.root) {
      await this.initialize();
    }

    const { onProgress, force = false, timeout = 30000 } = options;

    try {
      // Parse project ID
      const [projectIdClean, version] = projectId.split(':');
      if (!version) {
        throw new Error(`Project ID must include version (e.g., 'oewn:2024'): ${projectId}`);
      }

      // Check if already downloaded
      const filename = `${projectIdClean}-${version}.xml.gz`;
      const existingFile = await this.getFile(filename);
      
      if (existingFile && !force) {
        onProgress?.({
          bytesDownloaded: existingFile.size,
          totalBytes: existingFile.size,
          percentage: 100,
          status: 'complete',
          message: 'File already exists'
        });
        return filename;
      }

      // Get download URL (this would need to be implemented based on project index)
      const downloadUrl = await this.getProjectDownloadUrl(projectId);
      
      // Download file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Create readable stream for progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to create download stream');
      }

      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        bytesDownloaded += value.length;

        onProgress?.({
          bytesDownloaded,
          totalBytes,
          percentage: totalBytes > 0 ? (bytesDownloaded / totalBytes) * 100 : 0,
          status: 'downloading',
          message: `Downloading ${projectId}...`
        });
      }

      // Combine chunks and save to OPFS
      const blob = new Blob(chunks);
      await this.saveFile(filename, blob, 'download');

      onProgress?.({
        bytesDownloaded,
        totalBytes,
        percentage: 100,
        status: 'complete',
        message: 'Download complete'
      });

      return filename;

    } catch (error) {
      onProgress?.({
        bytesDownloaded: 0,
        totalBytes: 0,
        percentage: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Download failed'
      });
      throw error;
    }
  }

  /**
   * Add a lexical resource from a file
   */
  async addLexicalResource(file: File, options: { force?: boolean } = {}): Promise<string> {
    if (!this.root) {
      await this.initialize();
    }

    const { force = false } = options;
    const filename = file.name;

    // Check if file already exists
    const existingFile = await this.getFile(filename);
    if (existingFile && !force) {
      throw new Error(`File already exists: ${filename}. Use force option to overwrite.`);
    }

    // Save file to OPFS
    await this.saveFile(filename, file, 'download');
    
    return filename;
  }

  /**
   * Export database to various formats
   */
  async exportDatabase(
    databaseData: Uint8Array,
    format: 'json' | 'xml' | 'csv' = 'json',
    options: { 
      include?: string[];
      exclude?: string[];
      filename?: string;
    } = {}
  ): Promise<string> {
    if (!this.root) {
      await this.initialize();
    }

    const { include, exclude, filename } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFilename = filename || `wordnet-export-${timestamp}.${format}`;

    let exportData: string | Blob;

    switch (format) {
      case 'json':
        // Convert database to JSON format
        exportData = await this.convertToJSON(databaseData, include, exclude);
        break;
      case 'xml':
        // Convert database to XML format
        exportData = await this.convertToXML(databaseData, include, exclude);
        break;
      case 'csv':
        // Convert database to CSV format
        exportData = await this.convertToCSV(databaseData, include, exclude);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Save export file
    await this.saveFile(exportFilename, exportData, 'export');
    
    return exportFilename;
  }

  /**
   * List all available projects (from project index)
   */
  async listProjects(): Promise<Array<{ id: string; name: string; versions: string[] }>> {
    // This would need to fetch from a project index
    // For now, return a mock list
    return [
      { id: 'oewn', name: 'Open English WordNet', versions: ['2024', '2023'] },
      { id: 'omw-fr', name: 'French WordNet', versions: ['1.4', '1.3'] },
      { id: 'omw-de', name: 'German WordNet', versions: ['1.4', '1.3'] }
    ];
  }

  /**
   * List all available lexicons
   */
  async listLexicons(): Promise<Array<{ id: string; language: string; name: string }>> {
    // This would need to query the database
    // For now, return a mock list
    return [
      { id: 'oewn', language: 'en', name: 'Open English WordNet' },
      { id: 'omw-fr', language: 'fr', name: 'French WordNet' },
      { id: 'omw-de', language: 'de', name: 'German WordNet' }
    ];
  }

  /**
   * Get database statistics
   */
  async getDatabaseStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalLexicons: number;
    posDistribution: Record<string, number>;
  }> {
    // This would need to query the actual database
    // For now, return mock statistics
    return {
      totalWords: 155287,
      totalSynsets: 117659,
      totalSenses: 206941,
      totalLexicons: 3,
      posDistribution: {
        n: 82115,
        v: 13767,
        a: 18156,
        r: 3621
      }
    };
  }

  /**
   * Clean up old files
   */
  async cleanup(options: { 
    olderThan?: number; // days
    keepLatest?: number;
    types?: Array<'database' | 'download' | 'export' | 'backup'>;
  } = {}): Promise<{ deleted: string[]; freed: number }> {
    if (!this.root) {
      await this.initialize();
    }

    const { olderThan = 30, keepLatest = 5, types = ['download', 'export'] } = options;
    const storageInfo = await this.getStorageInfo();
    const deleted: string[] = [];
    let freedBytes = 0;

    for (const type of types) {
      const files = storageInfo[`${type}s` as keyof OPFSStorageInfo] as OPFSFileInfo[];
      
      // Sort by last modified (oldest first)
      const sortedFiles = files.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime());
      
      // Keep the latest files
      const filesToDelete = sortedFiles.slice(0, Math.max(0, sortedFiles.length - keepLatest));
      
      // Delete old files
      for (const file of filesToDelete) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThan);
        
        if (file.lastModified < cutoffDate) {
          try {
            await this.deleteFile(file.name);
            deleted.push(file.name);
            freedBytes += file.size;
          } catch (error) {
            console.warn(`Failed to delete ${file.name}:`, error);
          }
        }
      }
    }

    return { deleted, freed: freedBytes };
  }

  /**
   * Create a backup of current database
   */
  async createBackup(databaseData: Uint8Array, description?: string): Promise<string> {
    if (!this.root) {
      await this.initialize();
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.db`;
    
    // Add description as metadata if provided
    if (description) {
      const metadata = { description, timestamp: new Date().toISOString() };
      const metadataFilename = `backup-${timestamp}.json`;
      await this.saveFile(metadataFilename, JSON.stringify(metadata), 'backup');
    }

    await this.saveFile(backupFilename, databaseData, 'backup');
    
    return backupFilename;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupFilename: string): Promise<Uint8Array> {
    if (!this.root) {
      await this.initialize();
    }

    const file = await this.getFile(backupFilename);
    if (!file) {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }

    return new Uint8Array(await file.arrayBuffer());
  }

  // Private helper methods

  private getFileType(filename: string): OPFSFileInfo['type'] {
    if (filename.endsWith('.db') || filename.endsWith('.sqlite')) {
      return 'database';
    } else if (filename.endsWith('.gz') || filename.endsWith('.xml')) {
      return 'download';
    } else if (filename.startsWith('export-') || filename.includes('export')) {
      return 'export';
    } else if (filename.startsWith('backup-')) {
      return 'backup';
    } else {
      return 'download';
    }
  }

  private async getFile(filename: string): Promise<File | null> {
    try {
      const handle = await (this.root as any).getFileHandle(filename);
      return await handle.getFile();
    } catch {
      return null;
    }
  }

  private async saveFile(filename: string, data: string | Blob | File | Uint8Array, type: OPFSFileInfo['type']): Promise<void> {
    const handle = await (this.root as any).getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    
    if (typeof data === 'string') {
      await writable.write(data);
    } else if (data instanceof Uint8Array) {
      await writable.write(data);
    } else {
      await writable.write(data);
    }
    
    await writable.close();
  }

  private async deleteFile(filename: string): Promise<void> {
    await (this.root as any).removeEntry(filename);
  }

  private async getProjectDownloadUrl(projectId: string): Promise<string> {
    // This would need to fetch from a project index
    // For now, return a mock URL
    return `https://example.com/wordnet/${projectId}.xml.gz`;
  }

  private async convertToJSON(databaseData: Uint8Array, include?: string[], exclude?: string[]): Promise<string> {
    // Mock implementation - would need actual database conversion
    return JSON.stringify({ 
      type: 'wordnet-export',
      timestamp: new Date().toISOString(),
      data: 'mock-json-data'
    });
  }

  private async convertToXML(databaseData: Uint8Array, include?: string[], exclude?: string[]): Promise<string> {
    // Mock implementation - would need actual database conversion
    return `<?xml version="1.0" encoding="UTF-8"?>
<wordnet-export timestamp="${new Date().toISOString()}">
  <data>mock-xml-data</data>
</wordnet-export>`;
  }

  private async convertToCSV(databaseData: Uint8Array, include?: string[], exclude?: string[]): Promise<string> {
    // Mock implementation - would need actual database conversion
    return `id,lemma,pos,definition
1,example,n,An example word
2,test,v,To test something`;
  }
} 
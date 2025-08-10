/**
 * Data Manager for wn-ts-web
 * Provides comprehensive data management features matching CLI capabilities
 */

import {
  OPFSManager,
  type OPFSStorageInfo,
  type DownloadOptions,
} from "./opfs-manager.js";
import { WebWordnet } from "./web-wordnet.js";

export interface ProjectInfo {
  id: string;
  name: string;
  versions: string[];
  description?: string;
  url?: string;
}

export interface LexiconInfo {
  id: string;
  language: string;
  name: string;
  wordCount?: number;
  synsetCount?: number;
}

export interface DatabaseStatistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalLexicons: number;
  posDistribution: Record<string, number>;
  qualityMetrics?: {
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  };
}

export interface ExportOptions {
  format: "json" | "xml" | "csv";
  include?: string[];
  exclude?: string[];
  filename?: string;
}

export interface CleanupOptions {
  olderThan?: number; // days
  keepLatest?: number;
  types?: Array<"database" | "download" | "export" | "backup">;
  dryRun?: boolean;
}

export class DataManager {
  private opfsManager: OPFSManager;
  private wordnet: WebWordnet | null = null;

  constructor() {
    this.opfsManager = new OPFSManager();
  }

  /**
   * Initialize the data manager
   */
  async initialize(): Promise<void> {
    await this.opfsManager.initialize();
  }

  /**
   * Set the current WordNet instance
   */
  setWordnet(wordnet: WebWordnet): void {
    this.wordnet = wordnet;
  }

  /**
   * Download a WordNet project
   */
  async download(
    projectId: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    return this.opfsManager.downloadProject(projectId, options);
  }

  /**
   * Add a lexical resource from a file
   */
  async add(file: File, options: { force?: boolean } = {}): Promise<string> {
    return this.opfsManager.addLexicalResource(file, options);
  }

  /**
   * Export database to various formats
   */
  async export(options: ExportOptions): Promise<string> {
    if (!this.wordnet) {
      throw new Error("No WordNet instance available");
    }

    const databaseData = await this.wordnet.exportData();
    return this.opfsManager.exportDatabase(databaseData, options.format, {
      include: options.include,
      exclude: options.exclude,
      filename: options.filename,
    });
  }

  /**
   * List available projects
   */
  async listProjects(): Promise<ProjectInfo[]> {
    return this.opfsManager.listProjects();
  }

  /**
   * List available lexicons
   */
  async listLexicons(): Promise<LexiconInfo[]> {
    return this.opfsManager.listLexicons();
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<DatabaseStatistics> {
    return this.opfsManager.getDatabaseStatistics();
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<OPFSStorageInfo> {
    return this.opfsManager.getStorageInfo();
  }

  /**
   * Clean up old files
   */
  async cleanup(
    options: CleanupOptions = {}
  ): Promise<{ deleted: string[]; freed: number }> {
    return this.opfsManager.cleanup(options);
  }

  /**
   * Create a backup
   */
  async createBackup(description?: string): Promise<string> {
    if (!this.wordnet) {
      throw new Error("No WordNet instance available");
    }

    const databaseData = await this.wordnet.exportData();
    return this.opfsManager.createBackup(databaseData, description);
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupFilename: string): Promise<Uint8Array> {
    return this.opfsManager.restoreFromBackup(backupFilename);
  }

  /**
   * Remove a lexicon (mock implementation)
   */
  async remove(
    lexiconId: string,
    options: { force?: boolean } = {}
  ): Promise<void> {
    // This would need to be implemented based on actual database operations
    console.log(`Would remove lexicon: ${lexiconId}`, options);
    throw new Error("Remove operation not yet implemented");
  }

  /**
   * Get project information
   */
  async getProject(projectId: string): Promise<ProjectInfo | null> {
    const projects = await this.listProjects();
    return projects.find((p) => p.id === projectId) || null;
  }

  /**
   * Get project versions
   */
  async getProjectVersions(projectId: string): Promise<string[]> {
    const project = await this.getProject(projectId);
    return project?.versions || [];
  }

  /**
   * Validate project ID format
   */
  validateProjectId(projectId: string): { valid: boolean; error?: string } {
    if (!projectId.includes(":")) {
      return {
        valid: false,
        error: 'Project ID must include version (e.g., "oewn:2024")',
      };
    }

    const [id, version] = projectId.split(":");
    if (!id || !version) {
      return { valid: false, error: "Invalid project ID format" };
    }

    return { valid: true };
  }

  /**
   * Check if a project is available
   */
  async isProjectAvailable(projectId: string): Promise<boolean> {
    const project = await this.getProject(projectId);
    return project !== null;
  }

  /**
   * Get download status for a project
   */
  async getDownloadStatus(projectId: string): Promise<{
    downloaded: boolean;
    filename?: string;
    size?: number;
    lastModified?: Date;
  }> {
    const storageInfo = await this.getStorageInfo();
    const filename = `${projectId.replace(":", "-")}.xml.gz`;

    const file = storageInfo.downloads.find((f) => f.name === filename);

    return {
      downloaded: !!file,
      filename: file?.name,
      size: file?.size,
      lastModified: file?.lastModified,
    };
  }

  /**
   * Get all downloaded projects
   */
  async getDownloadedProjects(): Promise<
    Array<{
      projectId: string;
      filename: string;
      size: number;
      lastModified: Date;
    }>
  > {
    const storageInfo = await this.getStorageInfo();

    return storageInfo.downloads
      .filter((f) => f.name.includes(".xml.gz"))
      .map((f) => {
        const projectId = f.name.replace(".xml.gz", "").replace("-", ":");
        return {
          projectId,
          filename: f.name,
          size: f.size,
          lastModified: f.lastModified,
        };
      });
  }

  /**
   * Get export history
   */
  async getExportHistory(): Promise<
    Array<{
      filename: string;
      format: string;
      size: number;
      lastModified: Date;
    }>
  > {
    const storageInfo = await this.getStorageInfo();

    return storageInfo.exports.map((f) => {
      const format = f.name.split(".").pop() || "unknown";
      return {
        filename: f.name,
        format,
        size: f.size,
        lastModified: f.lastModified,
      };
    });
  }

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<
    Array<{
      filename: string;
      size: number;
      lastModified: Date;
      description?: string;
    }>
  > {
    const storageInfo = await this.getStorageInfo();

    return storageInfo.backups.map((f) => {
      return {
        filename: f.name,
        size: f.size,
        lastModified: f.lastModified,
      };
    });
  }

  /**
   * Get storage usage summary
   */
  async getStorageSummary(): Promise<{
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
    fileCounts: {
      databases: number;
      downloads: number;
      exports: number;
      backups: number;
    };
  }> {
    const storageInfo = await this.getStorageInfo();

    return {
      total: storageInfo.total,
      used: storageInfo.used,
      available: storageInfo.available,
      usagePercentage:
        storageInfo.total > 0
          ? (storageInfo.used / storageInfo.total) * 100
          : 0,
      fileCounts: {
        databases: storageInfo.databases.length,
        downloads: storageInfo.downloads.length,
        exports: storageInfo.exports.length,
        backups: storageInfo.backups.length,
      },
    };
  }

  /**
   * Perform a dry run of an operation
   */
  async dryRun(
    operation: "download" | "add" | "export" | "cleanup",
    options: any = {}
  ): Promise<{
    operation: string;
    wouldExecute: boolean;
    details: any;
  }> {
    switch (operation) {
      case "download":
        const projectId = options.projectId;
        const validation = this.validateProjectId(projectId);
        const isAvailable = await this.isProjectAvailable(projectId);
        const downloadStatus = await this.getDownloadStatus(projectId);

        return {
          operation: "download",
          wouldExecute:
            validation.valid &&
            isAvailable &&
            (!downloadStatus.downloaded || options.force),
          details: {
            projectId,
            validation,
            isAvailable,
            downloadStatus,
            force: options.force,
          },
        };

      case "add":
        return {
          operation: "add",
          wouldExecute: true,
          details: {
            filename: options.file?.name,
            size: options.file?.size,
            force: options.force,
          },
        };

      case "export":
        return {
          operation: "export",
          wouldExecute: !!this.wordnet,
          details: {
            format: options.format,
            include: options.include,
            exclude: options.exclude,
            filename: options.filename,
          },
        };

      case "cleanup":
        const storageInfo = await this.getStorageInfo();
        const filesToDelete = storageInfo.files.filter((f) => {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - (options.olderThan || 30));
          return f.lastModified < cutoffDate;
        });

        return {
          operation: "cleanup",
          wouldExecute: filesToDelete.length > 0,
          details: {
            filesToDelete: filesToDelete.map((f) => f.name),
            totalSize: filesToDelete.reduce((sum, f) => sum + f.size, 0),
            options,
          },
        };

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}

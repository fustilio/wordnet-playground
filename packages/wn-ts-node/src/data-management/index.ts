/**
 * Data Management Module for wn-ts-node
 * 
 * This module provides the Node.js-specific implementations of the shared data management system
 */

// Re-export the NodeDataManager and related types
export * from './adapters/index.js';

// Create a singleton instance for backward compatibility
import { NodeDataManager } from './adapters/node-data-manager.js';
import { KyselyWordnet } from '../kysely-wordnet.js';
import { config } from '../config.js';

// Global database instance for backward compatibility
let _dataManagementDb: KyselyWordnet | null = null;
let _dataManager: NodeDataManager | null = null;

/**
 * Set the data management database instance (for testing)
 */
export function setDataManagementDb(db: KyselyWordnet): void {
  _dataManagementDb = db;
  _dataManager = null; // Reset manager to force recreation
}

/**
 * Clear the data management singletons (for testing)
 */
export function clearDataManagementSingletons(): void {
  _dataManagementDb = null;
  _dataManager = null;
}

/**
 * Get the data management database instance
 */
export async function getDataManagementDb(): Promise<KyselyWordnet> {
  if (!_dataManagementDb) {
    // Don't use forceRecreate in production - it deletes existing data!
    // Only recreate if explicitly requested via options
    _dataManagementDb = new KyselyWordnet('*', { 
      filename: config.databasePath,
      forceRecreate: false // Changed from true - this was causing Bug #2!
    });
    await _dataManagementDb.initialize();
  }
  return _dataManagementDb;
}

/**
 * Get the data manager instance
 */
async function getDataManager(): Promise<NodeDataManager> {
  if (!_dataManager) {
    const db = await getDataManagementDb();
    _dataManager = new NodeDataManager({
      database: { getQueryService: () => db.getQueryService() as any },
      wordnet: { getQueryService: () => db.getQueryService() as any },
      downloadDirectory: config.downloadDirectory,
    });
  }
  return _dataManager;
}

/**
 * Download a project from the web
 */
export async function download(
  projectId: string,
  options: any = {}
): Promise<string> {
  const manager = await getDataManager();
  await manager.downloadAndLoad(projectId, options);
  return projectId; // Return the project ID as the path
}

/**
 * Add a lexical resource to the database
 */
export async function add(
  path: string,
  options: any = {}
): Promise<boolean> {
  const manager = await getDataManager();
  return await manager.add(path, options);
}

/**
 * Remove a lexical resource from the database
 */
export async function remove(lexiconId: string): Promise<boolean> {
  const manager = await getDataManager();
  return await manager.remove(lexiconId);
}

/**
 * Export data from the database
 */
export async function exportData(
  options: any = { format: 'json' }
): Promise<any> {
  const manager = await getDataManager();
  return await manager.exportData(options);
}

// Export aliases for backward compatibility
export const addLexicalResource = add;
export const removeLexicalResource = remove;
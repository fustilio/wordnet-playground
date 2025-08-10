/**
 * Placeholder database implementation for wn-ts-core
 * This package is environment-agnostic and doesn't include concrete database implementations
 */

import type { DatabaseInterface, DatabaseManagerInterface, DatabaseRunResult, DatabaseRow } from './interface.js';
import { DatabaseError } from '../types.js';

/**
 * Placeholder database implementation
 * This will be replaced by concrete implementations in environment-specific packages
 */
export class PlaceholderDatabase implements DatabaseInterface {
  private _initialized = false;

  initialize(): void {
    this._initialized = true;
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  close(): void {
    this._initialized = false;
    // No-op for placeholder
  }

  run(_sql: string, _params: unknown[] = []): DatabaseRunResult {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  get<T = DatabaseRow>(_sql: string, _params: unknown[] = []): T | undefined {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  all<T = DatabaseRow>(_sql: string, _params: unknown[] = []): T[] {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  transaction(_fn: () => void): void {
    throw new DatabaseError('Database not available in wn-ts-core. Use wn-ts-node for Node.js database support.');
  }

  clearConnections(): void {
    // No-op for placeholder
  }

  reset(): void {
    // No-op for placeholder
  }

  isLocked(): boolean {
    return false;
  }
}

/**
 * Placeholder database manager
 */
export class PlaceholderDatabaseManager implements DatabaseManagerInterface {
  private db: DatabaseInterface | null = null;

  getDatabase(): DatabaseInterface {
    if (!this.db) {
      this.db = new PlaceholderDatabase();
    }
    return this.db;
  }

  createDatabase(): DatabaseInterface {
    return new PlaceholderDatabase();
  }

  isAvailable(): boolean {
    return false;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export the placeholder manager as the default
export const db = new PlaceholderDatabaseManager();

// Export types for compatibility
export type Database = DatabaseInterface;

// Placeholder function
export function isDatabaseLocked(): boolean {
  return false;
}

// Browser environment check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Gracefully close the database on process exit or unhandled errors
const gracefulShutdown = () => {
  try {
    db.close();
    // On Windows, add a short delay to help release file handles
    if (isNode && process.platform === 'win32') {
      const waitUntil = Date.now() + 200;
      while (Date.now() < waitUntil) {}
    }
  } catch (err) {
    // Ignore errors if already closed
  }
};

// These handlers help avoid persistent DB locks if the process is interrupted or crashes.
// Only register in Node.js environment
if (isNode) {
  process.on('exit', gracefulShutdown);
  process.on('SIGINT', () => { gracefulShutdown(); process.exit(0); });
  process.on('SIGTERM', () => { gracefulShutdown(); process.exit(0); });
  process.on('uncaughtException', (err) => { gracefulShutdown(); throw err; });
  process.on('unhandledRejection', (reason) => { gracefulShutdown(); throw reason; });
}

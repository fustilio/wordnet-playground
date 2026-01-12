/**
 * Turso database configuration
 */

import type { BaseDatabaseConfig } from 'wn-ts-core/shared';

/**
 * Connection mode for Turso
 * - 'remote': HTTP-only connection to Turso cloud
 * - 'embedded': Local SQLite replica with Turso sync
 */
export type TursoConnectionMode = 'remote' | 'embedded';

/**
 * Turso-specific database configuration
 */
export interface TursoDatabaseConfig extends BaseDatabaseConfig {
  /**
   * Turso database URL
   * - For remote: libsql://db-org.turso.io
   * - For embedded: file:./local.db
   */
  url: string;

  /**
   * Auth token for Turso connection
   * Required for remote connections and embedded sync
   */
  authToken?: string;

  /**
   * Connection mode
   * - 'remote': HTTP-only connection to Turso cloud
   * - 'embedded': Local SQLite with Turso sync
   */
  mode: TursoConnectionMode;

  /**
   * For embedded replicas: remote Turso URL to sync with
   */
  syncUrl?: string;

  /**
   * Sync interval in milliseconds (for embedded mode)
   * Default: 0 (manual sync only)
   */
  syncInterval?: number;

  /**
   * Encryption key for embedded replicas
   */
  encryptionKey?: string;

  /**
   * Connection timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable foreign key constraints
   */
  enableForeignKeys?: boolean;
}

/**
 * Sync configuration for embedded replicas
 */
export interface SyncConfig {
  /** Enable automatic sync */
  autoSync: boolean;
  /** Sync interval in ms */
  interval: number;
  /** Sync on startup */
  syncOnStart: boolean;
  /** Sync on close */
  syncOnClose: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
}

/**
 * Default sync configuration
 */
export const defaultSyncConfig: SyncConfig = {
  autoSync: false,
  interval: 0,
  syncOnStart: true,
  syncOnClose: true,
  maxRetries: 3,
};

/**
 * Validate Turso configuration
 */
export function validateTursoConfig(config: TursoDatabaseConfig): void {
  if (!config.url) {
    throw new Error('Turso config: url is required');
  }

  if (config.mode === 'remote') {
    if (!config.authToken) {
      throw new Error('Turso config: authToken is required for remote mode');
    }
    if (!config.url.startsWith('libsql://') && !config.url.startsWith('https://')) {
      throw new Error('Turso config: remote URL must start with libsql:// or https://');
    }
  }

  if (config.mode === 'embedded') {
    if (!config.url.startsWith('file:')) {
      throw new Error('Turso config: embedded URL must start with file:');
    }
    if (config.syncUrl && !config.authToken) {
      throw new Error('Turso config: authToken is required when syncUrl is provided');
    }
  }
}

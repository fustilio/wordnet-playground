/**
 * Turso adapter interface
 */

import type { Client } from '@libsql/client';
import type { TursoDatabaseConfig } from '../config.js';

/**
 * Adapter status information
 */
export interface TursoAdapterInfo {
  /** Adapter mode */
  mode: 'remote' | 'embedded';
  /** Whether connected to database */
  connected: boolean;
  /** Sync status (for embedded mode) */
  syncStatus?: 'synced' | 'pending' | 'error';
  /** Last sync timestamp */
  lastSync?: Date;
}

/**
 * Turso adapter interface
 * Provides abstraction over remote and embedded connection modes
 */
export interface TursoAdapter {
  /**
   * Initialize the adapter with configuration
   */
  initialize(config: TursoDatabaseConfig): Promise<void>;

  /**
   * Get the underlying libsql client
   */
  getClient(): Client;

  /**
   * Get adapter information
   */
  getInfo(): TursoAdapterInfo;

  /**
   * Check if the adapter is connected
   */
  isConnected(): boolean;

  /**
   * Close the connection
   */
  close(): Promise<void>;

  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Sync with remote (for embedded mode)
   */
  sync?(): Promise<void>;
}

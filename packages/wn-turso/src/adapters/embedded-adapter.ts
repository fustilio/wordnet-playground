/**
 * Embedded Turso adapter - Local SQLite with sync
 */

import { createClient, type Client } from '@libsql/client';
import type { TursoDatabaseConfig } from '../config.js';
import type { TursoAdapter, TursoAdapterInfo } from './adapter.js';

/**
 * Embedded Turso adapter for local SQLite with optional sync
 */
export class EmbeddedTursoAdapter implements TursoAdapter {
  private client?: Client;
  private config?: TursoDatabaseConfig;
  private connected = false;
  private lastSync?: Date;
  private syncStatus: 'synced' | 'pending' | 'error' = 'pending';

  async initialize(config: TursoDatabaseConfig): Promise<void> {
    this.config = config;

    // Create embedded replica client
    this.client = createClient({
      url: config.url, // Local file path: file:./local.db
      syncUrl: config.syncUrl,
      authToken: config.authToken,
      encryptionKey: config.encryptionKey,
    });

    // Initial sync if sync URL is configured
    if (config.syncUrl && config.authToken) {
      await this.sync();
    }

    this.connected = true;
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Adapter not initialized');
    }
    return this.client;
  }

  getInfo(): TursoAdapterInfo {
    return {
      mode: 'embedded',
      connected: this.connected,
      syncStatus: this.syncStatus,
      lastSync: this.lastSync,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async close(): Promise<void> {
    if (this.client) {
      // Sync before close if configured
      if (this.config?.syncUrl) {
        try {
          await this.sync();
        } catch (error) {
          console.warn('Failed to sync before close:', error);
        }
      }
      this.client.close();
      this.connected = false;
    }
  }

  getName(): string {
    return 'embedded-turso';
  }

  async sync(): Promise<void> {
    if (!this.client) {
      throw new Error('Adapter not initialized');
    }

    try {
      await this.client.sync();
      this.lastSync = new Date();
      this.syncStatus = 'synced';
    } catch (error) {
      this.syncStatus = 'error';
      throw error;
    }
  }
}

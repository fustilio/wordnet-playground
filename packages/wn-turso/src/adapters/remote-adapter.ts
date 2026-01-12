/**
 * Remote Turso adapter - HTTP-only connection
 */

import { createClient, type Client } from '@libsql/client';
import type { TursoDatabaseConfig } from '../config.js';
import type { TursoAdapter, TursoAdapterInfo } from './adapter.js';

/**
 * Remote Turso adapter for HTTP-only connections
 */
export class RemoteTursoAdapter implements TursoAdapter {
  private client?: Client;
  private config?: TursoDatabaseConfig;
  private connected = false;

  async initialize(config: TursoDatabaseConfig): Promise<void> {
    if (!config.authToken) {
      throw new Error('authToken is required for remote Turso connections');
    }

    this.config = config;
    this.client = createClient({
      url: config.url,
      authToken: config.authToken,
    });

    // Test connection
    await this.client.execute('SELECT 1');
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
      mode: 'remote',
      connected: this.connected,
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async close(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.connected = false;
    }
  }

  getName(): string {
    return 'remote-turso';
  }
}

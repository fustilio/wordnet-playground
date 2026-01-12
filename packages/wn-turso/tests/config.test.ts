/**
 * Config tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateTursoConfig,
  defaultSyncConfig,
  type TursoDatabaseConfig,
} from '../src/config.js';

describe('TursoConfig', () => {
  describe('validateTursoConfig()', () => {
    it('should accept valid remote config', () => {
      const config: TursoDatabaseConfig = {
        url: 'libsql://my-db.turso.io',
        authToken: 'token123',
        mode: 'remote',
      };

      expect(() => validateTursoConfig(config)).not.toThrow();
    });

    it('should accept valid embedded config', () => {
      const config: TursoDatabaseConfig = {
        url: 'file:./local.db',
        mode: 'embedded',
      };

      expect(() => validateTursoConfig(config)).not.toThrow();
    });

    it('should accept embedded config with sync', () => {
      const config: TursoDatabaseConfig = {
        url: 'file:./local.db',
        syncUrl: 'libsql://my-db.turso.io',
        authToken: 'token123',
        mode: 'embedded',
      };

      expect(() => validateTursoConfig(config)).not.toThrow();
    });

    it('should reject remote config without auth token', () => {
      const config: TursoDatabaseConfig = {
        url: 'libsql://my-db.turso.io',
        mode: 'remote',
      };

      expect(() => validateTursoConfig(config)).toThrow('authToken is required');
    });

    it('should reject remote config with file URL', () => {
      const config: TursoDatabaseConfig = {
        url: 'file:./local.db',
        authToken: 'token123',
        mode: 'remote',
      };

      expect(() => validateTursoConfig(config)).toThrow('must start with libsql://');
    });

    it('should reject embedded config with libsql URL', () => {
      const config: TursoDatabaseConfig = {
        url: 'libsql://my-db.turso.io',
        mode: 'embedded',
      };

      expect(() => validateTursoConfig(config)).toThrow('must start with file:');
    });

    it('should reject embedded config with syncUrl but no auth token', () => {
      const config: TursoDatabaseConfig = {
        url: 'file:./local.db',
        syncUrl: 'libsql://my-db.turso.io',
        mode: 'embedded',
      };

      expect(() => validateTursoConfig(config)).toThrow('authToken is required');
    });

    it('should reject config without URL', () => {
      const config = {
        mode: 'remote',
        authToken: 'token',
      } as TursoDatabaseConfig;

      expect(() => validateTursoConfig(config)).toThrow('url is required');
    });
  });

  describe('defaultSyncConfig', () => {
    it('should have expected defaults', () => {
      expect(defaultSyncConfig.autoSync).toBe(false);
      expect(defaultSyncConfig.interval).toBe(0);
      expect(defaultSyncConfig.syncOnStart).toBe(true);
      expect(defaultSyncConfig.syncOnClose).toBe(true);
      expect(defaultSyncConfig.maxRetries).toBe(3);
    });
  });
});

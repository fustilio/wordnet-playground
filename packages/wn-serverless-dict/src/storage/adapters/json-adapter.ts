/**
 * JSON file storage adapter
 * Stores dictionaries as JSON files (optionally compressed)
 */

import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { gzipSync, gunzipSync } from 'zlib';
import type { StorageAdapter, StorageAdapterOptions } from '../adapter.js';
import type { DictionaryData } from '../../types/index.js';

/**
 * JSON file storage adapter
 */
export class JsonStorageAdapter implements StorageAdapter {
  readonly name = 'json';
  private options: Required<StorageAdapterOptions>;

  constructor(options: StorageAdapterOptions = {}) {
    this.options = {
      compress: false,
      pretty: false,
      encoding: 'utf-8',
      ...options
    };
  }

  async save(data: DictionaryData, destination: string): Promise<void> {
    const jsonStr = this.options.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    if (this.options.compress) {
      const compressed = gzipSync(jsonStr);
      writeFileSync(destination, compressed);
    } else {
      writeFileSync(destination, jsonStr, this.options.encoding);
    }
  }

  async load(source: string): Promise<DictionaryData> {
    if (!existsSync(source)) {
      throw new Error(`Dictionary not found at: ${source}`);
    }

    let jsonStr: string;

    if (this.options.compress || source.endsWith('.gz')) {
      const compressed = readFileSync(source);
      const decompressed = gunzipSync(compressed);
      jsonStr = decompressed.toString(this.options.encoding);
    } else {
      jsonStr = readFileSync(source, this.options.encoding);
    }

    return JSON.parse(jsonStr);
  }

  async exists(source: string): Promise<boolean> {
    return existsSync(source);
  }

  async getMetadata(source: string) {
    if (!existsSync(source)) {
      throw new Error(`Dictionary not found at: ${source}`);
    }

    const stats = statSync(source);
    return {
      size: stats.size,
      modified: stats.mtime,
      compressed: this.options.compress || source.endsWith('.gz')
    };
  }

  async delete(source: string): Promise<void> {
    if (existsSync(source)) {
      unlinkSync(source);
    }
  }
}

/**
 * ES Module storage adapter
 * Stores dictionaries as JavaScript ES modules with embedded utilities
 */

import { writeFileSync, readFileSync, existsSync, statSync, unlinkSync } from 'fs';
import type { StorageAdapter, StorageAdapterOptions } from '../adapter.js';
import type { DictionaryData } from '../../types/index.js';
import { createESModule } from '../../generators/index.js';

/**
 * ES Module storage adapter
 */
export class ESModuleStorageAdapter implements StorageAdapter {
  readonly name = 'esmodule';
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
    // Extract module name from destination
    const moduleName = destination
      .replace(/\.(m?js|ts)$/, '')
      .split('/')
      .pop() || 'dictionary';

    const moduleCode = createESModule(data, moduleName);
    writeFileSync(destination, moduleCode, this.options.encoding);
  }

  async load(source: string): Promise<DictionaryData> {
    if (!existsSync(source)) {
      throw new Error(`Dictionary module not found at: ${source}`);
    }

    // For ES modules, we need to dynamically import and extract the embedded data
    // This is a simplified loader - in production you'd use dynamic import
    const moduleCode = readFileSync(source, this.options.encoding);

    // Extract the data object from the module code
    const dataMatch = moduleCode.match(/const data = ({[\s\S]*?});/);
    if (!dataMatch) {
      throw new Error('Invalid ES module format: data object not found');
    }

    try {
      // Parse the data object (note: this uses eval which is generally unsafe
      // In production, you'd use a proper parser or dynamic import)
      const data = JSON.parse(dataMatch[1]);
      return data as DictionaryData;
    } catch (error) {
      throw new Error(`Failed to parse dictionary data: ${error}`);
    }
  }

  async exists(source: string): Promise<boolean> {
    return existsSync(source);
  }

  async getMetadata(source: string) {
    if (!existsSync(source)) {
      throw new Error(`Dictionary module not found at: ${source}`);
    }

    const stats = statSync(source);
    return {
      size: stats.size,
      modified: stats.mtime,
      compressed: false
    };
  }

  async delete(source: string): Promise<void> {
    if (existsSync(source)) {
      unlinkSync(source);
    }
  }
}

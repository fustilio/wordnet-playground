/**
 * Plugin system types
 * Inspired by WordNetKernel plugin architecture from wn-ts-core
 */

import type { DictionaryData, GeneratorOptions } from '../types/index.js';

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called before dictionary generation starts
   * Can modify generator options
   */
  beforeGenerate?: (options: GeneratorOptions) => Promise<GeneratorOptions> | GeneratorOptions;

  /**
   * Called after vocabulary extraction, before building structure
   * Can modify or filter vocabulary entries
   */
  afterExtract?: (vocabulary: Map<string, any>) => Promise<Map<string, any>> | Map<string, any>;

  /**
   * Called after dictionary structure is built
   * Can modify the final dictionary data
   */
  afterBuild?: (data: DictionaryData) => Promise<DictionaryData> | DictionaryData;

  /**
   * Called before dictionary is saved/exported
   * Can modify the output or perform side effects
   */
  beforeExport?: (data: DictionaryData, outputPath?: string) => Promise<void> | void;

  /**
   * Called when dictionary is loaded at runtime
   * Can modify or augment dictionary data
   */
  onLoad?: (data: DictionaryData) => Promise<DictionaryData> | DictionaryData;

  /**
   * Called when a word is looked up
   * Can modify lookup behavior or results
   */
  onLookup?: (word: string, lang: string, results: any[]) => Promise<any[]> | any[];
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Dependencies on other plugins */
  dependencies?: string[];
}

/**
 * Base plugin interface
 */
export interface Plugin {
  /** Plugin metadata */
  meta: PluginMetadata;

  /** Plugin lifecycle hooks */
  hooks: PluginHooks;

  /**
   * Initialize the plugin
   * Called when plugin is registered
   */
  initialize?: () => Promise<void> | void;

  /**
   * Cleanup the plugin
   * Called when plugin is unregistered
   */
  dispose?: () => Promise<void> | void;
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /** Auto-initialize plugin after registration */
  autoInitialize?: boolean;
  /** Plugin priority (lower = earlier execution) */
  priority?: number;
}

/**
 * Plugin context passed to hooks
 */
export interface PluginContext {
  /** Plugin metadata */
  plugin: PluginMetadata;
  /** Shared data between plugins */
  shared: Map<string, any>;
}

/**
 * Environment Module
 * 
 * Provides environment-specific configuration and utilities.
 * This module handles configuration management across different environments.
 * 
 * This is a CORE MODULE - essential for WordNet functionality.
 */

// Re-export individual functions and classes for direct use
export { config, ConfigManager, PlaceholderConfigManager } from './config.js';
export type { 
  ProjectVersion, 
  ProjectConfig, 
  ProjectInfo, 
  Config 
} from './config.js';

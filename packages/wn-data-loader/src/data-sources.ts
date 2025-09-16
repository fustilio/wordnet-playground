import type { WordNetDataSource, WordNetDataSourceRegistry } from "./types.js";
import dataSourcesJson from "./data-sources.json" with { type: "json" };

/**
 * Registry of WordNet data sources
 * This provides WordNet-specific data sources that work with the generic data-loader package.
 * 
 * Note: This file imports from data-sources.json which is auto-generated from wn-ts-core/src/index.toml
 * Do not edit data-sources.json manually. Run 'npm run build:data-sources' to regenerate.
 */
export const WORDNET_DATA_SOURCES: WordNetDataSourceRegistry = dataSourcesJson as WordNetDataSourceRegistry;

/**
 * Get a WordNet data source by ID
 */
export function getWordNetDataSource(projectId: string): WordNetDataSource | undefined {
  return WORDNET_DATA_SOURCES[projectId];
}

/**
 * Get all available WordNet data sources
 */
export function getAllWordNetDataSources(): WordNetDataSource[] {
  return Object.values(WORDNET_DATA_SOURCES);
}

/**
 * Get WordNet data sources by language
 */
export function getWordNetDataSourcesByLanguage(language: string): WordNetDataSource[] {
  return Object.values(WORDNET_DATA_SOURCES).filter(source => source.language === language);
}

/**
 * Get WordNet data sources by format
 */
export function getWordNetDataSourcesByFormat(format: string): WordNetDataSource[] {
  return Object.values(WORDNET_DATA_SOURCES).filter(source => source.format === format);
}

/**
 * Check if a project ID is a valid WordNet data source
 */
export function isValidWordNetProject(projectId: string): boolean {
  return projectId in WORDNET_DATA_SOURCES;
}
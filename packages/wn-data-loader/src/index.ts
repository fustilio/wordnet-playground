// Export all WordNet-specific functionality
export * from "./types.js";
export * from "./data-sources.js";
export * from "./wordnet-content-detector.js";
export * from "./wordnet-processor.js";

// Re-export commonly used types and classes
export type { 
  WordNetDataSource, 
  WordNetProject, 
  WordNetContentType, 
  WordNetProcessingResult, 
  WordNetProcessingOptions 
} from "./types.js";

export { 
  WordNetProcessor
} from "./wordnet-processor.js";

export { 
  WordNetContentDetector 
} from "./wordnet-content-detector.js";

export { 
  getWordNetDataSource, 
  getAllWordNetDataSources, 
  getWordNetDataSourcesByLanguage, 
  getWordNetDataSourcesByFormat, 
  isValidWordNetProject,
  WORDNET_DATA_SOURCES 
} from "./data-sources.js";

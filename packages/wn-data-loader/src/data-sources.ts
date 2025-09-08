import type { WordNetDataSource, WordNetDataSourceRegistry } from "./types.js";

/**
 * Registry of WordNet data sources
 * This provides WordNet-specific data sources that work with the generic data-loader package.
 * 
 * Note: This is a focused subset of WordNet data sources. The main repository
 * has comprehensive data source management in wn-ts-web/src/project.ts and related files.
 */
export const WORDNET_DATA_SOURCES: WordNetDataSourceRegistry = {
  // Open English WordNet
  "oewn:2021": {
    id: "oewn:2021",
    name: "Open English WordNet 2021",
    language: "en",
    version: "2021",
    url: "https://en-word.net/static/english-wordnet-2021.xml.gz",
    format: "tar.gz",
    description: "Complete English WordNet in LMF format",
    size: "~50MB compressed",
    lastUpdated: "2021-01-01"
  },
  "oewn:2022": {
    id: "oewn:2022",
    name: "Open English WordNet 2022",
    language: "en",
    version: "2022",
    url: "https://en-word.net/static/english-wordnet-2022.xml.gz",
    format: "tar.gz",
    description: "Complete English WordNet in LMF format",
    size: "~50MB compressed",
    lastUpdated: "2022-01-01"
  },
  "oewn:2023": {
    id: "oewn:2023",
    name: "Open English WordNet 2023",
    language: "en",
    version: "2023",
    url: "https://en-word.net/static/english-wordnet-2023.xml.gz",
    format: "tar.gz",
    description: "Complete English WordNet in LMF format",
    size: "~50MB compressed",
    lastUpdated: "2023-01-01"
  },
  "oewn:2024": {
    id: "oewn:2024",
    name: "Open English WordNet 2024",
    language: "en",
    version: "2024",
    url: "https://en-word.net/static/english-wordnet-2024.xml.gz",
    format: "tar.gz",
    description: "Complete English WordNet in LMF format",
    size: "~50MB compressed",
    lastUpdated: "2024-01-01"
  },

  // English WordNet (OMW)
  "omw-en:1.4": {
    id: "omw-en:1.4",
    name: "English WordNet (OMW)",
    language: "en",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-en.xml",
    format: "xml",
    description: "English WordNet from Open Multilingual WordNet",
    size: "~5MB",
    lastUpdated: "2023-12-01"
  },

  // French WordNet (OMW)
  "omw-fr:1.4": {
    id: "omw-fr:1.4",
    name: "French WordNet (OMW)",
    language: "fr",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-fr.xml",
    format: "xml",
    description: "French WordNet from Open Multilingual WordNet",
    size: "~15MB",
    lastUpdated: "2023-12-01"
  },

  // German WordNet (OMW)
  "omw-de:1.4": {
    id: "omw-de:1.4",
    name: "German WordNet (OMW)",
    language: "de",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-de.xml",
    format: "xml",
    description: "German WordNet from Open Multilingual WordNet",
    size: "~20MB",
    lastUpdated: "2023-12-01"
  },

  // Spanish WordNet (OMW)
  "omw-es:1.4": {
    id: "omw-es:1.4",
    name: "Spanish WordNet (OMW)",
    language: "es",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-es.xml",
    format: "xml",
    description: "Spanish WordNet from Open Multilingual WordNet",
    size: "~18MB",
    lastUpdated: "2023-12-01"
  },

  // CILI (Collaborative Interlingual Index)
  "cili:1.0": {
    id: "cili:1.0",
    name: "Collaborative Interlingual Index",
    language: "multilingual",
    version: "1.0",
    url: "https://raw.githubusercontent.com/globalwordnet/cili/master/cili-1.0.tsv",
    format: "xml",
    description: "Interlingual index for cross-lingual wordnet alignment",
    size: "~5MB",
    lastUpdated: "2023-11-01"
  },

  // Thai WordNet (OMW)
  "omw-th:1.4": {
    id: "omw-th:1.4",
    name: "Thai WordNet (OMW)",
    language: "th",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-th.xml",
    format: "xml",
    description: "Thai WordNet from Open Multilingual WordNet",
    size: "~12MB",
    lastUpdated: "2023-12-01"
  },

  // Italian WordNet (OMW)
  "omw-it:1.4": {
    id: "omw-it:1.4",
    name: "Italian WordNet (OMW)",
    language: "it",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-it.xml",
    format: "xml",
    description: "Italian WordNet from Open Multilingual WordNet",
    size: "~16MB",
    lastUpdated: "2023-12-01"
  },

  // Portuguese WordNet (OMW)
  "omw-pt:1.4": {
    id: "omw-pt:1.4",
    name: "Portuguese WordNet (OMW)",
    language: "pt",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-pt.xml",
    format: "xml",
    description: "Portuguese WordNet from Open Multilingual WordNet",
    size: "~14MB",
    lastUpdated: "2023-12-01"
  },

  // Dutch WordNet (OMW)
  "omw-nl:1.4": {
    id: "omw-nl:1.4",
    name: "Dutch WordNet (OMW)",
    language: "nl",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-nl.xml",
    format: "xml",
    description: "Dutch WordNet from Open Multilingual WordNet",
    size: "~17MB",
    lastUpdated: "2023-12-01"
  },

  // Japanese WordNet (OMW)
  "omw-ja:1.4": {
    id: "omw-ja:1.4",
    name: "Japanese WordNet (OMW)",
    language: "ja",
    version: "1.4",
    url: "https://raw.githubusercontent.com/globalwordnet/omw-data/main/omw-1.4/omw-ja.xml",
    format: "xml",
    description: "Japanese WordNet from Open Multilingual WordNet",
    size: "~22MB",
    lastUpdated: "2023-12-01"
  }
};

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

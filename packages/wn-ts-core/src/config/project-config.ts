/**
 * Centralized project configuration system
 * Eliminates hardcoded values throughout the codebase
 */

export interface ProjectConfig {
  id: string;
  label: string;
  language: string;
  license: string;
  type?: string;
  versions: Record<string, ProjectVersionConfig>;
}

export interface ProjectVersionConfig {
  url: string | string[];
  error?: string;
  description?: string;
  size?: string;
  lastUpdated?: string;
}

export interface ProxyConfig {
  enabled: boolean;
  baseUrl: string;
  endpoints: Record<string, {
    target: string;
    rewrite: (path: string) => string;
  }>;
}

export interface DataSourceConfig {
  projects: Record<string, ProjectConfig>;
  proxy: ProxyConfig;
  fallbackUrls: Record<string, string[]>;
}

/**
 * Default project configurations
 */
export const DEFAULT_PROJECTS: Record<string, ProjectConfig> = {
  'oewn': {
    id: 'oewn',
    label: 'Open English WordNet',
    language: 'en',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    type: 'wordnet',
    versions: {
      '2021': {
        url: 'https://en-word.net/static/english-wordnet-2021.xml.gz',
        description: 'Open English WordNet 2021',
        size: '~50MB compressed',
        lastUpdated: '2021-01-01'
      },
      '2022': {
        url: [
          'https://en-word.net/static/english-wordnet-2022.xml.gz',
          'https://github.com/globalwordnet/english-wordnet/releases/download/2022-edition/english-wordnet-2022.xml.gz'
        ],
        description: 'Open English WordNet 2022',
        size: '~50MB compressed',
        lastUpdated: '2022-01-01'
      },
      '2023': {
        url: [
          'https://en-word.net/static/english-wordnet-2023.xml.gz',
          'https://github.com/globalwordnet/english-wordnet/releases/download/2023-edition/english-wordnet-2023.xml.gz'
        ],
        description: 'Open English WordNet 2023',
        size: '~50MB compressed',
        lastUpdated: '2023-01-01'
      },
      '2024': {
        url: [
          'https://en-word.net/static/english-wordnet-2024.xml.gz',
          'https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz'
        ],
        description: 'Open English WordNet 2024',
        size: '~50MB compressed',
        lastUpdated: '2024-01-01'
      }
    }
  },
  'ewn': {
    id: 'ewn',
    label: 'Open English WordNet',
    language: 'en',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    type: 'wordnet',
    versions: {
      '2019': {
        url: 'https://en-word.net/static/english-wordnet-2019.xml.gz',
        description: 'Open English WordNet 2019',
        size: '~50MB compressed',
        lastUpdated: '2019-01-01'
      },
      '2020': {
        url: 'https://en-word.net/static/english-wordnet-2020.xml.gz',
        description: 'Open English WordNet 2020',
        size: '~50MB compressed',
        lastUpdated: '2020-01-01'
      }
    }
  },
  'cili': {
    id: 'cili',
    label: 'Collaborative Interlingual Index',
    language: 'unknown',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    type: 'ili',
    versions: {
      '1.0': {
        url: 'https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz',
        description: 'Collaborative Interlingual Index 1.0',
        size: '~1MB compressed',
        lastUpdated: '2020-01-01'
      }
    }
  },
  'omw-fr': {
    id: 'omw-fr',
    label: 'Open Multilingual Wordnet - French',
    language: 'fr',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    type: 'wordnet',
    versions: {
      '1.4': {
        url: 'https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz',
        description: 'French WordNet in LMF format',
        size: '~5MB compressed',
        lastUpdated: '2020-01-01'
      }
    }
  },
  'omw-th': {
    id: 'omw-th',
    label: 'Open Multilingual Wordnet - Thai',
    language: 'th',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    type: 'wordnet',
    versions: {
      '1.4': {
        url: 'https://github.com/omwn/omw-data/releases/download/v1.4/omw-th-1.4.tar.xz',
        description: 'Thai WordNet in LMF format',
        size: '~2MB compressed',
        lastUpdated: '2020-01-01'
      }
    }
  }
};

/**
 * Default proxy configuration for development
 */
export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  enabled: true,
  baseUrl: 'http://localhost:5173',
  endpoints: {
    'wordnet': {
      target: 'https://en-word.net',
      rewrite: (path) => path // Keep the full path for proxy URLs
    },
    'github': {
      target: 'https://github.com',
      rewrite: (path) => path // Keep the full path for proxy URLs
    },
    'omwn-releases': {
      target: 'https://github.com/omwn/omw-data/releases/download',
      rewrite: (path) => path.replace(/^\/api\/omwn-releases\//, '/')
    },
    'raw-github': {
      target: 'https://raw.githubusercontent.com',
      rewrite: (path) => path.replace(/^\/api\/raw-github\//, '/')
    },
    'github-api': {
      target: 'https://api.github.com',
      rewrite: (path) => path.replace(/^\/api\/github-api\//, '/')
    },
    'release-assets': {
      target: 'https://release-assets.githubusercontent.com',
      rewrite: (path) => path.replace(/^\/api\/release-assets\//, '/')
    },
    'external': {
      target: 'https://httpbin.org',
      rewrite: (path) => path.replace(/^\/api\/external\//, '/')
    }
  }
};

/**
 * Fallback URLs for when primary sources fail
 */
export const FALLBACK_URLS: Record<string, string[]> = {
  'oewn:2024': [
    'https://en-word.net/static/english-wordnet-2024.xml.gz'
  ],
  'oewn:2023': [
    'https://en-word.net/static/english-wordnet-2023.xml.gz'
  ],
  'oewn:2022': [
    'https://en-word.net/static/english-wordnet-2022.xml.gz'
  ],
  'cili:1.0': [
    'https://raw.githubusercontent.com/globalwordnet/cili/main/cili.tsv'
  ]
};

/**
 * Get project configuration by ID
 */
export function getProjectConfig(projectId: string): ProjectConfig | undefined {
  const [baseId] = projectId.split(':');
  if (!baseId) return undefined;
  return DEFAULT_PROJECTS[baseId];
}

/**
 * Get project version configuration
 */
export function getProjectVersionConfig(projectId: string): ProjectVersionConfig | undefined {
  const [baseId, version] = projectId.split(':');
  if (!baseId || !version) return undefined;
  const project = DEFAULT_PROJECTS[baseId];
  if (!project) return undefined;
  return project.versions[version];
}

/**
 * Get all URLs for a project version
 */
export function getProjectUrls(projectId: string): string[] {
  const versionConfig = getProjectVersionConfig(projectId);
  if (!versionConfig) return [];
  
  if (typeof versionConfig.url === 'string') {
    return [versionConfig.url];
  }
  return versionConfig.url || [];
}

/**
 * Get fallback URLs for a project
 */
export function getFallbackUrls(projectId: string): string[] {
  return FALLBACK_URLS[projectId] || [];
}

/**
 * Get all available URLs (primary + fallback) for a project
 */
export function getAllProjectUrls(projectId: string): string[] {
  const primaryUrls = getProjectUrls(projectId);
  const fallbackUrls = getFallbackUrls(projectId);
  return [...primaryUrls, ...fallbackUrls];
}

/**
 * Check if a project exists
 */
export function projectExists(projectId: string): boolean {
  const [baseId, version] = projectId.split(':');
  if (!baseId || !version) return false;
  
  const project = DEFAULT_PROJECTS[baseId];
  if (!project) return false;
  
  return project.versions[version] !== undefined;
}

/**
 * Get all available project IDs
 */
export function getAllProjectIds(): string[] {
  const projectIds: string[] = [];
  for (const [baseId, project] of Object.entries(DEFAULT_PROJECTS)) {
    for (const version of Object.keys(project.versions)) {
      projectIds.push(`${baseId}:${version}`);
    }
  }
  return projectIds;
}

/**
 * Validate project ID format
 */
export function validateProjectId(projectId: string): boolean {
  const parts = projectId.split(':');
  return parts.length === 2 && Boolean(parts[0] && parts[0].length > 0 && parts[1] && parts[1].length > 0);
}

/**
 * Get proxy URL for a given URL
 */
export function getProxyUrl(url: string, proxyConfig: ProxyConfig = DEFAULT_PROXY_CONFIG): string {
  if (!proxyConfig.enabled) return url;
  
  // Check each endpoint to see if URL matches
  for (const [endpointName, endpoint] of Object.entries(proxyConfig.endpoints)) {
    if (url.startsWith(endpoint.target)) {
      // Replace the target URL with the proxy endpoint
      const proxyUrl = url.replace(endpoint.target, `/api/${endpointName}`);
      // Apply the rewrite function to clean up the path
      return endpoint.rewrite(proxyUrl);
    }
  }
  
  // For any other external URL, use the generic external proxy
  if (url.startsWith('https://')) {
    return url.replace('https://', '/api/external/');
  }
  
  return url;
}

/**
 * Check if a URL needs to be proxied
 */
export function needsProxy(url: string, proxyConfig: ProxyConfig = DEFAULT_PROXY_CONFIG): boolean {
  if (!proxyConfig.enabled) return false;
  
  // Check if URL matches any of our known endpoints
  for (const endpoint of Object.values(proxyConfig.endpoints)) {
    if (url.includes(endpoint.target)) return true;
  }
  
  // Check if it's an external HTTPS URL
  return url.startsWith('https://');
}

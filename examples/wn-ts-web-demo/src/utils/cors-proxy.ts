/**
 * CORS Proxy Utilities for WordNet Demo
 * 
 * This module provides utilities to handle CORS issues when downloading
 * WordNet data from external sources in the browser demo.
 */

import { createScopedLogger } from '../../../packages/utils/logger';

const logger = createScopedLogger('CorsProxy');

export interface ProxyConfig {
  enabled: boolean;
  baseUrl: string;
  endpoints: {
    [key: string]: {
      target: string;
      rewrite?: (path: string) => string;
    };
  };
}

/**
 * Default proxy configuration for development
 */
export const defaultProxyConfig: ProxyConfig = {
  enabled: true,
  baseUrl: 'http://localhost:5174', // Vite dev server
  endpoints: {
    'en-word-net': {
      target: 'https://en-word.net',
      rewrite: (path) => path.replace(/^\/api\/en-word-net/, ''),
    },
    'globalwordnet': {
      target: 'https://github.com',
      rewrite: (path) => path.replace(/^\/api\/globalwordnet/, '/globalwordnet'),
    },
    'github': {
      target: 'https://github.com',
      rewrite: (path) => path.replace(/^\/api\/github/, ''),
    },
    'release-assets': {
      target: 'https://release-assets.githubusercontent.com',
      rewrite: (path) => path.replace(/^\/api\/release-assets/, ''),
    },
    'raw-github': {
      target: 'https://raw.githubusercontent.com',
      rewrite: (path) => path.replace(/^\/api\/raw-github/, ''),
    },
    'external': {
      target: 'https://httpbin.org',
      rewrite: (path) => path.replace(/^\/api\/external/, ''),
    },
  },
};

/**
 * Convert external URLs to proxy URLs to bypass CORS
 */
export function toProxyUrl(url: string, config: ProxyConfig = defaultProxyConfig): string {
  // Check if we're in a development environment
  const isDev = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1');
  
  if (!isDev || !config.enabled) {
    return url; // Return original URL in production or when proxy is disabled
  }

  // Convert external URLs to proxy URLs
  if (url.includes('en-word.net')) {
    return url.replace('https://en-word.net', '/api/en-word-net');
  }
  
  if (url.includes('release-assets.githubusercontent.com')) {
    return url.replace('https://release-assets.githubusercontent.com', '/api/release-assets');
  }
  
  if (url.includes('github.com/globalwordnet')) {
    return url.replace('https://github.com/globalwordnet', '/api/globalwordnet');
  }
  
  if (url.includes('github.com')) {
    return url.replace('https://github.com', '/api/github');
  }
  
  // For any other external URL, use the generic proxy
  if (url.startsWith('https://')) {
    return url.replace('https://', '/api/external/');
  }
  
  return url;
}

/**
 * Check if a URL needs to be proxied
 */
export function needsProxy(url: string): boolean {
  const isDev = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1');
  
  if (!isDev) {
    return false;
  }

  return url.startsWith('https://') && 
         (url.includes('en-word.net') || 
          url.includes('github.com') || 
          url.includes('globalwordnet') ||
          url.includes('release-assets.githubusercontent.com'));
}

/**
 * Get proxy status information
 */
export function getProxyStatus(): {
  enabled: boolean;
  isDev: boolean;
  baseUrl: string;
} {
  const isDev = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1');
  
  return {
    enabled: isDev && defaultProxyConfig.enabled,
    isDev,
    baseUrl: defaultProxyConfig.baseUrl,
  };
}

/**
 * Create a fetch wrapper that automatically handles proxy URLs
 */
export function createProxiedFetch(config: ProxyConfig = defaultProxyConfig) {
  return async (url: string): Promise<Response> => {
    const proxyUrl = toProxyUrl(url, config);
    
    // Log the proxying action
    logger.debug(`Proxying request: ${url} -> ${proxyUrl}`);
    
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'WordNet-Demo/1.0'
        }
      });
      return response;
    } catch (error) {
      logger.error(`Error proxying request: ${url} -> ${proxyUrl}`, error);
      throw error;
    }
  };
}

/**
 * Test proxy connectivity
 */
export async function testProxyConnectivity(): Promise<{
  success: boolean;
  endpoints: Array<{
    name: string;
    status: 'success' | 'error' | 'timeout';
    responseTime?: number;
    error?: string;
  }>;
}> {
  const endpoints = [
    { name: 'en-word-net', url: '/api/en-word-net/static/english-wordnet-2024.xml.gz' },
    { name: 'globalwordnet', url: '/api/globalwordnet/globalwordnet/english-wordnet/releases/latest' },
    { name: 'github', url: '/api/github/globalwordnet/english-wordnet' },
    { name: 'release-assets', url: '/api/release-assets/' },
    { name: 'raw-github', url: '/api/raw-github/globalwordnet/english-wordnet/2024-edition/english-wordnet-2024.xml.gz' },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const startTime = Date.now();
      try {
        const response = await fetch(endpoint.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        const responseTime = Date.now() - startTime;
        
        return {
          name: endpoint.name,
          status: response.ok ? 'success' : 'error' as const,
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
          name: endpoint.name,
          status: 'error' as const,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return {
    success: results.some(result => 
      result.status === 'fulfilled' && result.value.status === 'success'
    ),
    endpoints: results.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            name: endpoints[index].name,
            status: 'error' as const,
            error: 'Request failed',
          }
    ) as Array<{
      name: string;
      status: 'success' | 'error' | 'timeout';
      responseTime?: number;
      error?: string;
    }>,
  };
} 
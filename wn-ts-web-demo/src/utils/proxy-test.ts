/**
 * Proxy Test Utility
 * 
 * This utility helps test the CORS proxy configuration
 * and verify that external data sources are accessible.
 */

import { testProxyConnectivity, getProxyStatus } from './cors-proxy';

/**
 * Run comprehensive proxy tests
 */
export async function runProxyTests(): Promise<{
  success: boolean;
  results: {
    status: any;
    connectivity: any;
    testUrls: Array<{
      url: string;
      status: 'success' | 'error';
      responseTime?: number;
      error?: string;
    }>;
  };
}> {
  console.log('🧪 Running CORS Proxy Tests...');

  // Test 1: Check proxy status
  const status = getProxyStatus();
  console.log('📊 Proxy Status:', status);

  // Test 2: Test connectivity
  const connectivity = await testProxyConnectivity();
  console.log('🔗 Connectivity Test:', connectivity);

  // Test 3: Test specific URLs
  const testUrls = [
    '/api/en-word-net/static/english-wordnet-2024.xml.gz',
    '/api/globalwordnet/globalwordnet/english-wordnet/releases/latest',
    '/api/github/globalwordnet/english-wordnet',
  ];

  const urlResults = await Promise.allSettled(
    testUrls.map(async (url) => {
      const startTime = Date.now();
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        const responseTime = Date.now() - startTime;
        
        return {
          url,
          status: response.ok ? 'success' : 'error' as const,
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
          url,
          status: 'error' as const,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const testUrlResults = urlResults.map((result, index) => 
    result.status === 'fulfilled' 
      ? result.value 
      : {
          url: testUrls[index],
          status: 'error' as const,
          error: 'Request failed',
        }
  );

  const success = status.enabled && connectivity.success && 
                 testUrlResults.some(r => r.status === 'success');

  console.log('✅ Proxy Tests Complete:', { success, testUrlResults });

  return {
    success,
    results: {
      status,
      connectivity,
      testUrls: testUrlResults,
    },
  };
}

/**
 * Test a specific URL through the proxy
 */
export async function testProxyUrl(url: string): Promise<{
  success: boolean;
  responseTime: number;
  status: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      responseTime,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get proxy configuration summary
 */
export function getProxySummary(): {
  enabled: boolean;
  endpoints: string[];
  isDev: boolean;
  baseUrl: string;
} {
  const status = getProxyStatus();
  
  return {
    enabled: status.enabled,
    endpoints: ['/api/en-word-net', '/api/globalwordnet', '/api/github', '/api/external'],
    isDev: status.isDev,
    baseUrl: status.baseUrl,
  };
}

/**
 * Validate proxy configuration
 */
export function validateProxyConfig(): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const status = getProxyStatus();
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check if proxy should be enabled
  if (status.isDev && !status.enabled) {
    issues.push('Proxy should be enabled in development environment');
  }

  if (!status.isDev && status.enabled) {
    warnings.push('Proxy is enabled in production environment');
  }

  // Check base URL
  if (!status.baseUrl.includes('localhost') && !status.baseUrl.includes('127.0.0.1')) {
    warnings.push('Base URL does not appear to be localhost');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
} 
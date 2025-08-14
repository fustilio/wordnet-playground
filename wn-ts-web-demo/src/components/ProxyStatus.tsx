import React, { useState, useEffect } from 'react';
import { getProxyStatus, testProxyConnectivity } from '../utils/cors-proxy';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('ProxyStatus');

interface ProxyStatusProps {
  onStatusChange?: (status: { enabled: boolean; isDev: boolean }) => void;
}

export const ProxyStatus: React.FC<ProxyStatusProps> = ({ onStatusChange }) => {
  const [status] = useState(getProxyStatus());
  const [connectivity, setConnectivity] = useState<{
    success: boolean;
    endpoints: Array<{
      name: string;
      status: 'success' | 'error' | 'timeout';
      responseTime?: number;
      error?: string;
    }>;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    onStatusChange?.(status);
    logger.debug('Proxy status initialized', { status });
  }, [status, onStatusChange]);

  const handleTestConnectivity = async () => {
    logger.start('proxy connectivity test');
    logger.step('starting proxy connectivity test');
    
    setIsTesting(true);
    try {
      const result = await testProxyConnectivity();
      
      logger.success('Proxy connectivity test completed', { 
        success: result.success,
        endpointCount: result.endpoints.length,
        successfulEndpoints: result.endpoints.filter(e => e.status === 'success').length
      });
      
      // Log detailed endpoint results
      result.endpoints.forEach(endpoint => {
        if (endpoint.status === 'success') {
          logger.step('endpoint test successful', { 
            name: endpoint.name, 
            responseTime: endpoint.responseTime 
          });
        } else {
          logger.step('endpoint test failed', { 
            name: endpoint.name, 
            status: endpoint.status, 
            error: endpoint.error 
          });
        }
      });
      
      setConnectivity(result);
      logger.end('proxy connectivity test', result);
    } catch (error) {
      logger.fail('Proxy connectivity test failed', error);
      setConnectivity({
        success: false,
        endpoints: [],
      });
      logger.end('proxy connectivity test');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'timeout') => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'timeout':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'timeout') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'timeout':
        return '⏰';
      default:
        return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">CORS Proxy Status</h3>
      
      {/* Proxy Status */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              status.enabled ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.enabled ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-sm text-gray-600">Proxy Status</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              status.isDev ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {status.isDev ? 'Development' : 'Production'}
            </div>
            <div className="text-sm text-gray-600">Environment</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {status.baseUrl}
            </div>
            <div className="text-sm text-gray-600">Base URL</div>
          </div>
        </div>
      </div>

      {/* Connectivity Test */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-gray-900">Connectivity Test</h4>
          <button
            onClick={handleTestConnectivity}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isTesting ? 'Testing...' : 'Test Connectivity'}
          </button>
        </div>

        {connectivity && (
          <div className="space-y-3">
            <div className={`text-center p-3 rounded-lg border ${
              connectivity.success 
                ? 'text-green-600 bg-green-50 border-green-200' 
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              <div className="font-semibold">
                {connectivity.success ? '✅ Proxy Working' : '❌ Proxy Issues Detected'}
              </div>
              <div className="text-sm">
                {connectivity.success 
                  ? 'All endpoints are accessible through the proxy'
                  : 'Some endpoints are not accessible'
                }
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {connectivity.endpoints.map((endpoint) => (
                <div
                  key={endpoint.name}
                  className={`p-3 rounded-lg border ${getStatusColor(endpoint.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-lg">{getStatusIcon(endpoint.status)}</div>
                  </div>
                  {endpoint.responseTime && (
                    <div className="text-sm mt-1">
                      {endpoint.responseTime}ms
                    </div>
                  )}
                  {endpoint.error && (
                    <div className="text-sm mt-1 text-red-600">
                      {endpoint.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-900 mb-2">About CORS Proxy</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            The CORS proxy allows the demo to download WordNet data from external sources 
            without CORS restrictions during development.
          </p>
          <p>
            <strong>Endpoints:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><code>/api/en-word-net</code> - Proxies en-word.net</li>
            <li><code>/api/globalwordnet</code> - Proxies GitHub globalwordnet releases</li>
            <li><code>/api/github</code> - Proxies GitHub API</li>
            <li><code>/api/external</code> - Generic proxy for other HTTPS URLs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 
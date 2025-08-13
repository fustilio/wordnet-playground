import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  timing: {
    loadTime: number;
    renderTime: number;
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      if ('performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics({
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          },
          timing: {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            renderTime: Date.now() - performance.timing.loadEventEnd,
          },
        });
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return <div className="text-gray-500">Performance metrics unavailable</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Performance Monitor</h3>
      <div className="space-y-2 text-sm">
        <div>Memory: {metrics.memory.used}MB / {metrics.memory.total}MB (Limit: {metrics.memory.limit}MB)</div>
        <div>Load Time: {metrics.timing.loadTime}ms</div>
        <div>Render Time: {metrics.timing.renderTime}ms</div>
      </div>
    </div>
  );
};

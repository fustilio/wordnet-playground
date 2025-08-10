import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  ops: number;
  memoryUsage: number;
  databaseSize: number;
  queryTime: number;
  cpuUsage: number;
  networkLatency: number;
}

interface PerformanceMonitorProps {
  wordnet: any;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  verbose?: boolean; // New prop to control logging
  logInterval?: number; // How often to log (in ms)
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  wordnet,
  onMetricsUpdate,
  verbose = false, // Default to quiet mode
  logInterval = 5000 // Log every 5 seconds by default
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ops: 0,
    memoryUsage: 0,
    databaseSize: 0,
    queryTime: 0,
    cpuUsage: 0,
    networkLatency: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [maxHistoryLength] = useState(100);
  const [isVerbose, setIsVerbose] = useState(verbose); // Local state for verbose toggle
  const intervalRef = useRef<number | null>(null);
  const lastQueryTime = useRef<number>(0);
  const queryCount = useRef<number>(0);
  const lastLogTime = useRef<number>(0); // Track when we last logged

  // Get memory usage
  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  };

  // Get database size
  const getDatabaseSize = async (): Promise<number> => {
    if (!wordnet) return 0;
    try {
      const data = await wordnet.exportData();
      return data.byteLength / 1024 / 1024; // MB
    } catch {
      return 0;
    }
  };

  // Estimate CPU usage
  const getCPUUsage = (): number => {
    // Simple estimation based on time between calls
    const now = performance.now();
    const timeDiff = now - lastQueryTime.current;
    lastQueryTime.current = now;
    
    // Rough estimation: if time between calls is very small, CPU usage is high
    return Math.min(100, Math.max(0, 100 - timeDiff));
  };

  // Measure query performance
  const measureQueryPerformance = async (queryFn: () => Promise<any>): Promise<number> => {
    const start = performance.now();
    try {
      await queryFn();
      const end = performance.now();
      return end - start;
    } catch {
      return 0;
    }
  };

  // Update metrics with controlled logging
  const updateMetrics = async () => {
    const memoryUsage = getMemoryUsage();
    const databaseSize = await getDatabaseSize();
    const cpuUsage = getCPUUsage();

    const newMetrics: PerformanceMetrics = {
      ops: queryCount.current,
      memoryUsage,
      databaseSize,
      queryTime: metrics.queryTime,
      cpuUsage,
      networkLatency: metrics.networkLatency
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Only log if verbose mode is enabled and enough time has passed
    const now = performance.now();
    if (isVerbose && (now - lastLogTime.current) >= logInterval) {
      console.log('Performance metrics updated:', newMetrics);
      lastLogTime.current = now;
    }

    // Update history
    setHistory(prev => {
      const newHistory = [...prev, newMetrics];
      if (newHistory.length > maxHistoryLength) {
        return newHistory.slice(-maxHistoryLength);
      }
      return newHistory;
    });
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    intervalRef.current = setInterval(updateMetrics, 1000); // Update every second
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Run benchmark test
  const runBenchmark = async () => {
    if (!wordnet) return;

    const benchmarkResults = {
      wordLookup: 0,
      synsetQuery: 0,
      exportTime: 0,
      importTime: 0
    };

    // Test word lookup performance
    benchmarkResults.wordLookup = await measureQueryPerformance(async () => {
      for (let i = 0; i < 10; i++) {
        await wordnet.words('test');
        queryCount.current++;
      }
    });

    // Test synset query performance
    benchmarkResults.synsetQuery = await measureQueryPerformance(async () => {
      for (let i = 0; i < 10; i++) {
        await wordnet.synsets('test');
        queryCount.current++;
      }
    });

    // Test export performance
    benchmarkResults.exportTime = await measureQueryPerformance(async () => {
      await wordnet.exportData();
    });

    console.log('Benchmark Results:', benchmarkResults);
    return benchmarkResults;
  };

  useEffect(() => {
    if (wordnet) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [wordnet]);

  // Calculate averages
  const getAverageMetrics = () => {
    if (history.length === 0) return null;

    const sum = history.reduce((acc, curr) => ({
      ops: acc.ops + curr.ops,
      memoryUsage: acc.memoryUsage + curr.memoryUsage,
      databaseSize: acc.databaseSize + curr.databaseSize,
      queryTime: acc.queryTime + curr.queryTime,
      cpuUsage: acc.cpuUsage + curr.cpuUsage,
      networkLatency: acc.networkLatency + curr.networkLatency
    }), {
      ops: 0,
      memoryUsage: 0,
      databaseSize: 0,
      queryTime: 0,
      cpuUsage: 0,
      networkLatency: 0
    });

    const count = history.length;
    return {
      ops: sum.ops / count,
      memoryUsage: sum.memoryUsage / count,
      databaseSize: sum.databaseSize / count,
      queryTime: sum.queryTime / count,
      cpuUsage: sum.cpuUsage / count,
      networkLatency: sum.networkLatency / count
    };
  };

  const averageMetrics = getAverageMetrics();

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>Performance Monitor</h3>
        <div className="monitor-controls">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`monitor-button ${isMonitoring ? 'active' : ''}`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          <button onClick={runBenchmark} className="benchmark-button">
            Run Benchmark
          </button>
          <button 
            onClick={() => setIsVerbose(!isVerbose)} 
            className={`verbose-button ${isVerbose ? 'active' : ''}`}
            title={isVerbose ? 'Disable verbose logging' : 'Enable verbose logging'}
          >
            {isVerbose ? '🔊 Verbose' : '🔇 Quiet'}
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Operations Per Second</h4>
          <div className="metric-value">{metrics.ops.toFixed(2)}</div>
          <div className="metric-unit">ops/sec</div>
        </div>

        <div className="metric-card">
          <h4>Memory Usage</h4>
          <div className="metric-value">{metrics.memoryUsage.toFixed(2)}</div>
          <div className="metric-unit">MB</div>
        </div>

        <div className="metric-card">
          <h4>Database Size</h4>
          <div className="metric-value">{metrics.databaseSize.toFixed(2)}</div>
          <div className="metric-unit">MB</div>
        </div>

        <div className="metric-card">
          <h4>Query Time</h4>
          <div className="metric-value">{metrics.queryTime.toFixed(2)}</div>
          <div className="metric-unit">ms</div>
        </div>

        <div className="metric-card">
          <h4>CPU Usage</h4>
          <div className="metric-value">{metrics.cpuUsage.toFixed(1)}</div>
          <div className="metric-unit">%</div>
        </div>

        <div className="metric-card">
          <h4>Network Latency</h4>
          <div className="metric-value">{metrics.networkLatency.toFixed(2)}</div>
          <div className="metric-unit">ms</div>
        </div>
      </div>

      {averageMetrics && (
        <div className="average-metrics">
          <h4>Average Metrics (Last {history.length} samples)</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <h5>Avg OPS</h5>
              <div className="metric-value">{averageMetrics.ops.toFixed(2)}</div>
            </div>
            <div className="metric-card">
              <h5>Avg Memory</h5>
              <div className="metric-value">{averageMetrics.memoryUsage.toFixed(2)} MB</div>
            </div>
            <div className="metric-card">
              <h5>Avg Query Time</h5>
              <div className="metric-value">{averageMetrics.queryTime.toFixed(2)} ms</div>
            </div>
            <div className="metric-card">
              <h5>Avg CPU</h5>
              <div className="metric-value">{averageMetrics.cpuUsage.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="performance-tips">
        <h4>Performance Tips</h4>
        <ul>
          <li>Keep memory usage under 100MB for optimal performance</li>
          <li>Query times should be under 100ms for basic operations</li>
          <li>Monitor CPU usage to avoid browser freezing</li>
          <li>Use the benchmark tool to test different operations</li>
        </ul>
      </div>
    </div>
  );
}; 
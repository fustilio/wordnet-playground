import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, TrashIcon, DocumentArrowDownIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { createScopedLogger } from '../../logger';

const logger = createScopedLogger('DebugConsole');

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  data?: any;
  source?: string;
  duration?: number;
}

interface DebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  onExportLogs: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  maxLogs?: number;
  theme?: 'light' | 'dark';
  width?: number;
  height?: number;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onExportLogs,
  isPaused,
  onTogglePause,
  maxLogs = 1000,
  theme = 'light',
  width = 800,
  height = 400
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug' | 'success'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const themeClasses = {
    light: {
      container: 'bg-white border-gray-200',
      header: 'bg-gray-50 border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      input: 'bg-white border-gray-300 focus:border-blue-500',
      button: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      buttonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonDanger: 'bg-red-500 hover:bg-red-600 text-white'
    },
    dark: {
      container: 'bg-gray-800 border-gray-700',
      header: 'bg-gray-900 border-gray-700',
      text: 'text-gray-100',
      textSecondary: 'text-gray-400',
      border: 'border-gray-700',
      input: 'bg-gray-700 border-gray-600 focus:border-blue-400',
      button: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonDanger: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const currentTheme = themeClasses[theme];

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filter logs based on level and search term
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Get log level color
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'debug': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // Get log level background color
  const getLevelBgColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20';
      case 'warn': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      case 'debug': return 'bg-blue-50 dark:bg-blue-900/20';
      default: return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Format duration
  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const handleClearLogs = () => {
    logger.info('Clearing debug console logs', { logCount: logs.length });
    onClearLogs();
  };

  const handleExportLogs = () => {
    logger.info('Exporting debug console logs', { logCount: logs.length });
    onExportLogs();
  };

  const handleTogglePause = () => {
    logger.debug('Toggling debug console pause state', { currentState: isPaused });
    onTogglePause();
  };

  const handleClose = () => {
    logger.debug('Closing debug console');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 border rounded-lg shadow-xl ${currentTheme.container}`}
      style={{ width, height }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${currentTheme.header} ${currentTheme.border}`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-semibold ${currentTheme.text}`}>
            Debug Console
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${currentTheme.textSecondary}`}>
              {filteredLogs.length} logs
            </span>
            {isPaused && (
              <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded">
                PAUSED
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`p-2 rounded ${currentTheme.button} transition-colors`}
            title={isPaused ? 'Resume logging' : 'Pause logging'}
          >
            {isPaused ? (
              <PlayIcon className="w-4 h-4" />
            ) : (
              <PauseIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleExportLogs}
            className={`p-2 rounded ${currentTheme.button} transition-colors`}
            title="Export logs"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearLogs}
            className={`p-2 rounded ${currentTheme.buttonDanger} transition-colors`}
            title="Clear logs"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className={`p-2 rounded ${currentTheme.button} transition-colors`}
            title="Close console"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className={`px-4 py-2 border-b ${currentTheme.border} bg-gray-50 dark:bg-gray-900`}>
        <div className="flex items-center gap-4">
          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${currentTheme.textSecondary}`}>Level:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className={`text-xs px-2 py-1 rounded border ${currentTheme.input} ${currentTheme.text}`}
            >
              <option value="all">All</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
              <option value="success">Success</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${currentTheme.textSecondary}`}>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className={`text-xs px-2 py-1 rounded border w-32 ${currentTheme.input} ${currentTheme.text}`}
            />
          </div>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            <span className={`text-xs ${currentTheme.textSecondary}`}>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto" style={{ height: height - 140 }}>
        <div className="space-y-1 p-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded text-xs ${getLevelBgColor(log.level)} border-l-4 border-l-current`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono ${getLevelColor(log.level)}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className={`font-mono ${currentTheme.textSecondary}`}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.source && (
                        <span className={`px-1 py-0.5 rounded text-xs ${currentTheme.textSecondary} bg-gray-200 dark:bg-gray-700`}>
                          {log.source}
                        </span>
                      )}
                      {log.duration && (
                        <span className={`px-1 py-0.5 rounded text-xs ${currentTheme.textSecondary} bg-gray-200 dark:bg-gray-700`}>
                          {formatDuration(log.duration)}
                        </span>
                      )}
                    </div>
                    <div className={`${currentTheme.text} break-words`}>
                      {log.message}
                    </div>
                    {log.data && (
                      <details className="mt-2">
                        <summary className={`cursor-pointer ${currentTheme.textSecondary} hover:${currentTheme.text}`}>
                          Show data
                        </summary>
                        <pre className={`mt-1 p-2 rounded bg-gray-100 dark:bg-gray-800 text-xs overflow-x-auto ${currentTheme.text}`}>
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center ${currentTheme.textSecondary}`}>
                <p>No logs to display</p>
                <p className="text-xs mt-1">Try adjusting the filters</p>
              </div>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t ${currentTheme.border} bg-gray-50 dark:bg-gray-900`}>
        <div className="flex items-center justify-between text-xs">
          <div className={`${currentTheme.textSecondary}`}>
            Showing {filteredLogs.length} of {logs.length} logs
            {maxLogs && logs.length > maxLogs && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                (max {maxLogs} reached)
              </span>
            )}
          </div>
          <div className={`${currentTheme.textSecondary}`}>
            {logs.length > 0 && (
              <span>
                Last log: {formatTimestamp(logs[logs.length - 1].timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole; 
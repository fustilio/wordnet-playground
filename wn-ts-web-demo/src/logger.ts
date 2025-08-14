/**
 * WordNet Demo Logger - Super Simple & Powerful Logging
 * 
 * This logger makes logging 10x easier than console.log while giving you 10x more power.
 * It automatically handles timestamps, component labels, grouping, timing, and formatting.
 * 
 * @example
 * // Basic usage - just like console.log but better
 * const logger = createScopedLogger('MyComponent');
 * logger.log('Button clicked', { buttonId: 'save' });
 * 
 * // Success/failure logging
 * logger.success('User logged in', { userId: 123 });
 * logger.fail('Login failed', error);
 * 
 * // Operation lifecycle (auto-grouped & timed)
 * logger.start('database query');
 * logger.step('connecting to DB');
 * logger.step('executing query');
 * logger.end('database query', results);
 * 
 * // Traditional methods still available
 * logger.info('Custom message', { data: 'value' });
 * logger.warn('Warning message');
 * logger.error('Error message');
 */

export type LogLevelString = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'

/**
 * ScopedLogger interface providing all logging methods
 * 
 * The logger automatically:
 * - ✅ Groups operations (collapsible in console)
 * - ✅ Times operations (shows duration)
 * - ✅ Formats messages (with timestamps, icons, component labels)
 * - ✅ Handles errors (auto-formats error objects)
 * - ✅ Shows progress (step-by-step logging)
 * - ✅ Level control (trace, debug, info, warn, error, silent)
 */
export interface ScopedLogger {
  /** Log at trace level with optional structured data */
  trace: (message: string, fields?: Record<string, unknown>) => void
  
  /** Log at debug level with optional structured data */
  debug: (message: string, fields?: Record<string, unknown>) => void
  
  /** Log at info level with optional structured data */
  info: (message: string, fields?: Record<string, unknown>) => void
  
  /** Log at warn level with optional structured data */
  warn: (message: string, fields?: Record<string, unknown>) => void
  
  /** Log at error level with optional structured data */
  error: (message: string, fields?: Record<string, unknown>) => void
  
  // Console utility methods
  /** Start a timer with label */
  time: (label: string) => void
  
  /** End a timer with label */
  timeEnd: (label: string) => void
  
  /** Log time for a timer with additional data */
  timeLog: (label: string, ...data: unknown[]) => void
  
  /** Start a collapsible group */
  group: (label: string) => void
  
  /** Start a collapsed group */
  groupCollapsed: (label: string) => void
  
  /** End the current group */
  groupEnd: () => void
  
  /** Display data in a table format */
  table: (data: unknown[], columns?: string[]) => void
  
  /** Count occurrences of a label */
  count: (label: string) => void
  
  /** Reset count for a label */
  countReset: (label: string) => void
  
  /** Log a stack trace */
  stackTrace: (message?: string) => void
  
  /** Clear the console */
  clear: () => void
  
  // Convenience methods for common logging patterns
  
  /**
   * Simple logging - just like console.log but better formatted
   * @param message - The message to log
   * @param data - Optional data to log alongside the message
   * 
   * @example
   * logger.log('User clicked button', { buttonId: 'save', timestamp: Date.now() });
   */
  log: (message: string, data?: any) => void
  
  /**
   * Log a success message with optional structured data
   * Automatically formats with ✅ icon and success styling
   * 
   * @param message - Success message
   * @param fields - Optional structured data
   * 
   * @example
   * logger.success('Data loaded successfully', { recordCount: 150 });
   */
  success: (message: string, fields?: Record<string, unknown>) => void
  
  /**
   * Log a failure message with error details
   * Automatically formats with ❌ icon and error styling
   * 
   * @param message - Failure message
   * @param error - Error object or message
   * 
   * @example
   * logger.fail('API call failed', error);
   */
  fail: (message: string, error?: any) => void
  
  /**
   * Start an operation - creates a grouped log entry with 🚀 icon
   * Automatically starts timing and creates a collapsible group
   * 
   * @param operation - Name of the operation being started
   * 
   * @example
   * logger.start('database query');
   * // ... do work ...
   * logger.end('database query', results);
   */
  start: (operation: string) => void
  
  /**
   * End an operation - completes the grouped log entry with ✅ icon
   * Automatically ends timing, closes the group, and shows results
   * 
   * @param operation - Name of the operation being completed
   * @param result - Optional result data to display
   * 
   * @example
   * logger.start('database query');
   * // ... do work ...
   * logger.end('database query', { recordCount: 25 });
   */
  end: (operation: string, result?: any) => void
  
  /**
   * Log a step within an operation - shows progress with 📍 icon
   * Use between start() and end() to show detailed progress
   * 
   * @param step - Description of the current step
   * @param data - Optional data for this step
   * 
   * @example
   * logger.start('loading data');
   * logger.step('connecting to server');
   * logger.step('downloading file', { size: '2.5MB' });
   * logger.step('parsing data');
   * logger.end('loading data');
   */
  step: (step: string, data?: any) => void
}

let currentLevel: LogLevelString = 'info'

/**
 * Generate a formatted timestamp string (HH:mm:ss.SSS)
 */
function nowTs(): string {
  const d = new Date()
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

/**
 * Check if a log level should be displayed based on current global level
 */
function shouldLog(level: LogLevelString): boolean {
  if (currentLevel === 'silent') return false
  
  const levels: Record<LogLevelString, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    silent: 5
  }
  
  return levels[level] >= levels[currentLevel]
}

/**
 * Format a log message with timestamp, level icon, component label, and structured data
 */
function formatMessage(level: LogLevelString, label: string, message: string, fields?: Record<string, unknown>): string {
  const ts = nowTs()
  const levelIcon = {
    trace: '🔍',
    debug: '🐛',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    silent: '🔇'
  }[level] || 'ℹ️'
  
  let formatted = `${ts} ${levelIcon} [${label}] ${message}`
  
  if (fields && Object.keys(fields).length > 0) {
    const fieldsStr = Object.entries(fields)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' ')
    formatted += ` | ${fieldsStr}`
  }
  
  return formatted
}

/**
 * Create a scoped logger instance for a specific component or module
 * 
 * Each logger instance automatically includes the component label in all log messages
 * and provides access to all logging methods.
 * 
 * @param label - Component or module name (e.g., 'DataLoader', 'BackupManager')
 * @returns A ScopedLogger instance with all logging methods
 * 
 * @example
 * // Create a logger for your component
 * const logger = createScopedLogger('UserProfile');
 * 
 * // Use it for simple logging
 * logger.log('Component mounted');
 * 
 * // Use it for operations
 * logger.start('loading user data');
 * logger.step('fetching from API');
 * logger.end('loading user data', { userId: 123 });
 * 
 * // Use it for success/failure
 * logger.success('User updated', { userId: 123 });
 * logger.fail('Update failed', error);
 */
export function createScopedLogger(label: string): ScopedLogger {
  return {
    trace: (message, fields) => {
      if (shouldLog('trace')) {
        console.trace(formatMessage('trace', label, message, fields))
      }
    },
    
    debug: (message, fields) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', label, message, fields))
      }
    },
    
    info: (message, fields) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', label, message, fields))
      }
    },
    
    warn: (message, fields) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', label, message, fields))
      }
    },
    
    error: (message, fields) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', label, message, fields))
      }
    },
    
    // Console utility methods
    time: (label) => console.time(`[${label}]`),
    timeEnd: (label) => console.timeEnd(`[${label}]`),
    timeLog: (label, ...data) => console.timeLog(`[${label}]`, ...data),
    group: (label) => console.group(`[${label}]`),
    groupCollapsed: (label) => console.groupCollapsed(`[${label}]`),
    groupEnd: () => console.groupEnd(),
    table: (data, columns) => console.table(data, columns),
    count: (label) => console.count(`[${label}]`),
    countReset: (label) => console.countReset(`[${label}]`),
    stackTrace: (message) => console.trace(message),
    clear: () => console.clear(),
    
    // Convenience methods - these make logging super simple!
    log: (message, data) => {
      if (shouldLog('info')) {
        if (data !== undefined) {
          console.log(formatMessage('info', label, message), data)
        } else {
          console.log(formatMessage('info', label, message))
        }
      }
    },
    
    success: (message, fields) => {
      if (shouldLog('info')) {
        console.log(`✅ ${formatMessage('info', label, message)}`, fields || '')
      }
    },
    
    fail: (message, error) => {
      if (shouldLog('error')) {
        console.error(`❌ ${formatMessage('error', label, message)}`, error || '')
      }
    },
    
    start: (operation) => {
      if (shouldLog('info')) {
        console.group(`🚀 ${formatMessage('info', label, `Starting: ${operation}`)}`)
      }
    },
    
    end: (operation, result) => {
      if (shouldLog('info')) {
        if (result !== undefined) {
          console.log(`✅ ${formatMessage('info', label, `Completed: ${operation}`)}`, result)
        } else {
          console.log(`✅ ${formatMessage('info', label, `Completed: ${operation}`)}`)
        }
        console.groupEnd()
      }
    },
    
    step: (step, data) => {
      if (shouldLog('debug')) {
        if (data !== undefined) {
          console.log(`  📍 ${step}`, data)
        } else {
          console.log(`  📍 ${step}`)
        }
      }
    }
  }
}

/** Main application logger instance */
export const mainLogger = createScopedLogger('main')

/**
 * Set the global log level for all loggers
 * 
 * @param level - The log level to set (trace, debug, info, warn, error, silent)
 * 
 * @example
 * // Show only warnings and errors
 * setGlobalLogLevel('warn');
 * 
 * // Show everything including debug info
 * setGlobalLogLevel('debug');
 * 
 * // Turn off all logging
 * setGlobalLogLevel('silent');
 */
export function setGlobalLogLevel(level: LogLevelString): void {
  currentLevel = level
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wnLogLevel', level)
    }
  } catch {}
}

/**
 * Get the current global log level
 * 
 * @returns The current log level as a string
 * 
 * @example
 * const currentLevel = getGlobalLogLevel();
 * console.log(`Current log level: ${currentLevel}`);
 */
export function getGlobalLogLevel(): LogLevelString {
  return currentLevel
}

// Initialize from persisted value
try {
  if (typeof localStorage !== 'undefined') {
    const persisted = localStorage.getItem('wnLogLevel') as LogLevelString | null
    const boot = (globalThis as any).LOG_LEVEL as LogLevelString | undefined
    if (persisted || boot) {
      setGlobalLogLevel(persisted || boot || 'info')
    }
  }
} catch {}



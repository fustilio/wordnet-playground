/**
 * Logger utility for controlling verbosity levels
 */

export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private prefix: string = '';

  constructor(level?: LogLevel, prefix?: string) {
    if (level !== undefined) this.level = level;
    if (prefix !== undefined) this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string): string {
    return this.prefix ? `${this.prefix} ${level}: ${message}` : `${level}: ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  verbose(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(this.formatMessage('VERBOSE', message), ...args);
    }
  }

  // Convenience methods for common patterns
  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  progress(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`📊 ${message}`, ...args);
    }
  }

  config(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔧 ${message}`, ...args);
    }
  }

  data(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`📝 ${message}`, ...args);
    }
  }

  synset(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`📚 ${message}`, ...args);
    }
  }

  download(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`⬇️ ${message}`, ...args);
    }
  }

  extract(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`📦 ${message}`, ...args);
    }
  }

  insert(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`💾 ${message}`, ...args);
    }
  }
}

// Global logger instance
export const logger = new Logger();

// Environment-based configuration
if (process.env.WN_TS_LOG_LEVEL) {
  const level = parseInt(process.env.WN_TS_LOG_LEVEL);
  if (!isNaN(level) && level >= 0 && level <= 5) {
    logger.setLevel(level);
  }
}

// Test environment: be more quiet by default
if (process.env.NODE_ENV === 'test') {
  logger.setLevel(LogLevel.ERROR);
}

export { Logger }; 
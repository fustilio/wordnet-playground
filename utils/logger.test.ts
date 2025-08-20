/**
 * Comprehensive tests for the WordNet Project Logger
 * 
 * Tests all logging methods, log levels, instance-specific settings,
 * and edge cases to ensure the logger works correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createScopedLogger,
  setGlobalLogLevel,
  getGlobalLogLevel,
  createMinimalLogger,
  createVerboseLogger,
  createDebugLogger,
  getLoggingConfig,
  updateLoggingConfig,
  mainLogger
} from './logger'

// Mock console methods to capture output
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn(),
  timeLog: vi.fn(),
  groupCollapsed: vi.fn(),
  table: vi.fn(),
  count: vi.fn(),
  countReset: vi.fn(),
  clear: vi.fn()
}

describe('WordNet Logger', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock console methods
    Object.defineProperty(global, 'console', {
      value: mockConsole,
      writable: true
    })
    
    // Reset global log level to default
    setGlobalLogLevel('warn')
  })

  afterEach(() => {
    // Restore console
    Object.defineProperty(global, 'console', {
      value: console,
      writable: true
    })
  })

  describe('Global Log Level Control', () => {
    it('should set and get global log level', () => {
      expect(getGlobalLogLevel()).toBe('warn')
      
      setGlobalLogLevel('debug')
      expect(getGlobalLogLevel()).toBe('debug')
      
      setGlobalLogLevel('silent')
      expect(getGlobalLogLevel()).toBe('silent')
    })

    it('should persist log level in localStorage', () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      }
      
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
      
      setGlobalLogLevel('debug')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('wnLogLevel', 'debug')
    })

    it('should handle localStorage errors gracefully', () => {
      const localStorageMock = {
        getItem: vi.fn(() => { throw new Error('Storage error') }),
        setItem: vi.fn(() => { throw new Error('Storage error') }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      }
      
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
      
      // Should not throw
      expect(() => setGlobalLogLevel('debug')).not.toThrow()
    })
  })

  describe('Logger Instance Creation', () => {
    it('should create logger with default global log level', () => {
      setGlobalLogLevel('info')
      const logger = createScopedLogger('TestComponent')
      
      logger.log('test message')
      expect(mockConsole.log).toHaveBeenCalled()
    })

    it('should create logger with custom initial log level', () => {
      setGlobalLogLevel('warn') // Global is warn
      const logger = createScopedLogger('TestComponent', 'debug') // Instance is debug
      
      // This should work because instance level is debug
      logger.debug('debug message')
      expect(mockConsole.debug).toHaveBeenCalled()
      
      // But global level still affects other instances
      const globalLogger = createScopedLogger('GlobalComponent')
      globalLogger.debug('global debug message')
      expect(mockConsole.debug).toHaveBeenCalledTimes(1) // Only the first one
    })

    it('should create specialized logger types', () => {
      setGlobalLogLevel('info')
      
      const minimalLogger = createMinimalLogger('Minimal')
      const verboseLogger = createVerboseLogger('Verbose')
      const debugLogger = createDebugLogger('Debug')
      
      // Minimal logger should only show warn+
      minimalLogger.log('info message') // Should not show
      minimalLogger.warn('warning message') // Should show
      expect(mockConsole.log).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalled()
      
      // Verbose logger should show debug+
      verboseLogger.step('step message') // Should show (debug level)
      expect(mockConsole.log).toHaveBeenCalled()
      
      // Debug logger should show debug+
      debugLogger.debug('debug message') // Should show
      expect(mockConsole.debug).toHaveBeenCalled()
    })
  })

  describe('Log Level Filtering', () => {
    it('should filter logs based on global log level', () => {
      setGlobalLogLevel('warn')
      const logger = createScopedLogger('TestComponent')
      
      logger.trace('trace message') // Should not show
      logger.debug('debug message') // Should not show
      logger.info('info message') // Should not show
      logger.warn('warning message') // Should show
      logger.error('error message') // Should show
      
      expect(mockConsole.trace).not.toHaveBeenCalled()
      expect(mockConsole.debug).not.toHaveBeenCalled()
      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('should filter logs based on instance log level', () => {
      setGlobalLogLevel('info')
      const logger = createScopedLogger('TestComponent', 'warn')
      
      logger.info('info message') // Should not show (instance level is warn)
      logger.warn('warning message') // Should show
      logger.error('error message') // Should show
      
      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('should allow instance log level override', () => {
      setGlobalLogLevel('warn')
      const logger = createScopedLogger('TestComponent', 'info')
      
      // Initially should show info+
      logger.info('initial info message')
      expect(mockConsole.info).toHaveBeenCalled()
      
      // Change instance level
      logger.setLogLevel('error')
      
      // Now should only show error+
      logger.info('after change info message')
      logger.warn('after change warning message')
      logger.error('after change error message')
      
      expect(mockConsole.info).toHaveBeenCalledTimes(1) // Only the first one
      expect(mockConsole.warn).not.toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })
  })

  describe('Logging Methods', () => {
    let logger: ReturnType<typeof createScopedLogger>

    beforeEach(() => {
      setGlobalLogLevel('trace') // Show everything for testing
      logger = createScopedLogger('TestComponent')
    })

    it('should format basic log messages correctly', () => {
      logger.log('test message')
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{2}:\d{2}:\d{2}\.\d{3} ℹ️ \[TestComponent\] test message$/)
      )
    })

    it('should format messages with structured data', () => {
      logger.log('user action', { userId: 123, action: 'login' })
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{2}:\d{2}:\d{2}\.\d{3} ℹ️ \[TestComponent\] user action$/),
        { userId: 123, action: 'login' }
      )
    })

    it('should handle error objects in fail method', () => {
      const error = new Error('Test error')
      logger.fail('operation failed', error)
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/❌ \d{2}:\d{2}:\d{2}\.\d{3} ❌ \[TestComponent\] operation failed/),
        error
      )
    })

    it('should handle success messages with fields', () => {
      logger.success('operation completed', { duration: '100ms', records: 50 })
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/✅ \d{2}:\d{2}:\d{2}\.\d{3} ℹ️ \[TestComponent\] operation completed/),
        { duration: '100ms', records: 50 }
      )
    })
  })

  describe('Operation Lifecycle Methods', () => {
    let logger: ReturnType<typeof createScopedLogger>

    beforeEach(() => {
      setGlobalLogLevel('info') // Show operations but not steps
      logger = createScopedLogger('TestComponent')
    })

    it('should create operation groups', () => {
      logger.start('test operation')
      logger.end('test operation')
      
      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringMatching(/🚀 \d{2}:\d{2}:\d{2}\.\d{3} ℹ️ \[TestComponent\] Starting: test operation/)
      )
      expect(mockConsole.groupEnd).toHaveBeenCalled()
    })

    it('should show steps only at debug level', () => {
      logger.start('test operation')
      logger.step('step 1') // Should not show at info level
      logger.milestone('milestone reached') // Should show at info level
      logger.end('test operation')
      
      expect(mockConsole.log).toHaveBeenCalledTimes(2) // milestone + end, not step
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/🎯 milestone reached/)
      )
    })

    it('should show steps at debug level', () => {
      setGlobalLogLevel('debug')
      const debugLogger = createScopedLogger('TestComponent')
      
      debugLogger.start('test operation')
      debugLogger.step('step 1') // Should show at debug level
      debugLogger.end('test operation')
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/  📍 step 1/)
      )
    })

    it('should handle operation results', () => {
      logger.start('test operation')
      logger.end('test operation', { success: true, duration: '100ms' })
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/✅ \d{2}:\d{2}:\d{2}\.\d{3} ℹ️ \[TestComponent\] Completed: test operation/),
        { success: true, duration: '100ms' }
      )
    })
  })

  describe('Console Utility Methods', () => {
    let logger: ReturnType<typeof createScopedLogger>

    beforeEach(() => {
      logger = createScopedLogger('TestComponent')
    })

    it('should delegate time methods to console', () => {
      logger.time('test timer')
      logger.timeEnd('test timer')
      
      expect(mockConsole.time).toHaveBeenCalledWith('[test timer]')
      expect(mockConsole.timeEnd).toHaveBeenCalledWith('[test timer]')
    })

    it('should delegate group methods to console', () => {
      logger.group('test group')
      logger.groupEnd()
      
      expect(mockConsole.group).toHaveBeenCalledWith('[test group]')
      expect(mockConsole.groupEnd).toHaveBeenCalled()
    })

    it('should delegate other utility methods to console', () => {
      logger.table([{ id: 1, name: 'test' }])
      logger.count('test counter')
      logger.countReset('test counter')
      logger.clear()
      
      expect(mockConsole.table).toHaveBeenCalled()
      expect(mockConsole.count).toHaveBeenCalledWith('[test counter]')
      expect(mockConsole.countReset).toHaveBeenCalledWith('[test counter]')
      expect(mockConsole.clear).toHaveBeenCalled()
    })
  })

  describe('Configuration Management', () => {
    it('should get current logging configuration', () => {
      setGlobalLogLevel('debug')
      const config = getLoggingConfig()
      
      expect(config).toEqual({ logLevel: 'debug' })
    })

    it('should update logging configuration', () => {
      setGlobalLogLevel('info')
      updateLoggingConfig({ logLevel: 'warn' })
      
      expect(getGlobalLogLevel()).toBe('warn')
    })

    it('should log configuration changes', () => {
      setGlobalLogLevel('info') // Need to be at info level to see the log
      updateLoggingConfig({ logLevel: 'warn' })
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/🔧 Logging configuration updated:/),
        { logLevel: 'warn' }
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined data gracefully', () => {
      setGlobalLogLevel('info')
      const logger = createScopedLogger('TestComponent')
      
      logger.log('message with null', null)
      logger.log('message with undefined', undefined)
      
      expect(mockConsole.log).toHaveBeenCalledTimes(2)
    })

    it('should handle complex objects in structured data', () => {
      setGlobalLogLevel('info')
      const logger = createScopedLogger('TestComponent')
      
      const complexObj = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        func: () => 'test'
      }
      
      logger.log('complex data', complexObj)
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/complex data/),
        complexObj
      )
    })

    it('should handle silent log level correctly', () => {
      setGlobalLogLevel('silent')
      const logger = createScopedLogger('TestComponent')
      
      logger.log('should not show')
      logger.warn('should not show')
      logger.error('should not show')
      
      expect(mockConsole.log).not.toHaveBeenCalled()
      expect(mockConsole.warn).not.toHaveBeenCalled()
      expect(mockConsole.error).not.toHaveBeenCalled()
    })
  })

  describe('Main Logger Instance', () => {
    it('should create main logger with default settings', () => {
      expect(mainLogger).toBeDefined()
      expect(typeof mainLogger.log).toBe('function')
      expect(typeof mainLogger.setLogLevel).toBe('function')
    })

    it('should allow main logger to change its own log level', () => {
      setGlobalLogLevel('warn')
      mainLogger.setLogLevel('debug')
      
      // Should now be able to log debug messages
      mainLogger.debug('debug message')
      expect(mockConsole.debug).toHaveBeenCalled()
    })
  })

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic usage', () => {
      setGlobalLogLevel('info')
      const logger = createScopedLogger('DataProcessor')
      
      // Start operation
      logger.start('processing data')
      
      // Log milestones
      logger.milestone('data loaded', { records: 1000 })
      logger.milestone('validation completed', { valid: 950, invalid: 50 })
      
      // Log steps (should not show at info level)
      logger.step('parsing records')
      logger.step('applying filters')
      
      // End operation
      logger.end('processing data', { 
        processed: 950, 
        duration: '2.5s',
        success: true 
      })
      
      // Verify output
      expect(mockConsole.group).toHaveBeenCalled() // start
      expect(mockConsole.log).toHaveBeenCalledTimes(3) // 2 milestones + end
      expect(mockConsole.groupEnd).toHaveBeenCalled() // end
      
      // Steps should not be logged at info level
      const stepLogs = mockConsole.log.mock.calls.filter(call => 
        call[0].includes('📍')
      )
      expect(stepLogs).toHaveLength(0)
    })

    it('should show steps when log level is debug', () => {
      setGlobalLogLevel('debug')
      const logger = createScopedLogger('DataProcessor')
      
      logger.start('processing data')
      logger.step('parsing records') // Should show at debug level
      logger.milestone('data loaded') // Should show at info level
      logger.step('applying filters') // Should show at debug level
      logger.end('processing data')
      
      // Should have logged steps
      const stepLogs = mockConsole.log.mock.calls.filter(call => 
        call[0].includes('📍')
      )
      expect(stepLogs).toHaveLength(2)
    })
  })
})

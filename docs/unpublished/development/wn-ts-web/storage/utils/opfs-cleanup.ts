/**
 * OPFS Cleanup Utilities
 * 
 * Manual utilities for clearing OPFS access handles when automatic cleanup fails
 */

import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('OpfsCleanup');

export interface OpfsCleanupResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Manual OPFS cleanup utility
 * Use this when automatic cleanup fails and you need to manually clear OPFS access handles
 */
export async function manualOpfsCleanup(databaseName: string = 'wordnet.sqlite3'): Promise<OpfsCleanupResult> {
  try {
    if (!navigator.storage || !('getDirectory' in navigator.storage)) {
      return {
        success: false,
        message: 'OPFS not available in this browser'
      };
    }

    logger.info('Starting manual OPFS cleanup...');

    const opfsRoot = await navigator.storage.getDirectory();
    
    // Try to get the file handle
    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await opfsRoot.getFileHandle(databaseName, { create: false });
    } catch (error) {
      return {
        success: true,
        message: 'OPFS file does not exist, nothing to clean up'
      };
    }

    // Strategy 1: Try to create and immediately close a writable stream
    try {
      logger.info('Strategy 1: Trying writable stream approach');
      const writable = await fileHandle.createWritable();
      await writable.close();
      logger.info('Strategy 1: Successfully cleared via writable stream');
      return {
        success: true,
        message: 'OPFS access handle cleared via writable stream'
      };
    } catch (error) {
      logger.warn('Strategy 1 failed:', error);
    }

    // Strategy 2: Try to access the file in read-only mode
    try {
      logger.info('Strategy 2: Trying read-only file access');
      const file = await fileHandle.getFile();
      const content = await file.text();
      logger.info('Strategy 2: Successfully accessed file in read-only mode');
      return {
        success: true,
        message: 'OPFS access handle cleared via read-only access'
      };
    } catch (error) {
      logger.warn('Strategy 2 failed:', error);
    }

    // Strategy 3: Force garbage collection and wait
    try {
      logger.info('Strategy 3: Force GC and wait');
      if (window.gc) {
        window.gc();
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to create a test database
      const { OpfsStorageAdapter } = await import('../adapters/opfs-storage-adapter.js');
      const testAdapter = new OpfsStorageAdapter({ databaseName });
      // This will fail if there's still a handle, but it might trigger cleanup
      return {
        success: true,
        message: 'OPFS cleanup attempted via GC and test database creation'
      };
    } catch (error) {
      logger.warn('Strategy 3 failed:', error);
    }

    return {
      success: false,
      message: 'All manual cleanup strategies failed',
      details: 'OPFS may still be locked by another process or browser tab'
    };

  } catch (error) {
    logger.error('Manual OPFS cleanup failed:', error);
    return {
      success: false,
      message: 'Manual OPFS cleanup failed',
      details: error
    };
  }
}

/**
 * Nuclear OPFS cleanup - removes all files from OPFS
 * Use with caution as this will delete all OPFS data
 */
export async function nuclearOpfsCleanup(): Promise<OpfsCleanupResult> {
  try {
    if (!navigator.storage || !('getDirectory' in navigator.storage)) {
      return {
        success: false,
        message: 'OPFS not available in this browser'
      };
    }

    logger.warn('Starting nuclear OPFS cleanup - this will delete ALL OPFS files!');

    const opfsRoot = await navigator.storage.getDirectory();
    const entries = (opfsRoot as any).entries();
    
    let deletedCount = 0;
    const errors: any[] = [];

    for await (const [name, handle] of entries) {
      try {
        if (handle.kind === 'file') {
          await opfsRoot.removeEntry(name);
          deletedCount++;
          logger.info(`Deleted OPFS file: ${name}`);
        }
      } catch (error) {
        errors.push({ file: name, error });
        logger.warn(`Could not delete OPFS file ${name}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      message: `Nuclear cleanup completed. Deleted ${deletedCount} files.`,
      details: errors.length > 0 ? { errors } : undefined
    };

  } catch (error) {
    logger.error('Nuclear OPFS cleanup failed:', error);
    return {
      success: false,
      message: 'Nuclear OPFS cleanup failed',
      details: error
    };
  }
}

/**
 * Check OPFS status and provide recommendations
 */
export async function checkOpfsStatus(databaseName: string = 'wordnet.sqlite3'): Promise<{
  available: boolean;
  fileExists: boolean;
  canAccess: boolean;
  recommendations: string[];
}> {
  const recommendations: string[] = [];
  
  try {
    if (!navigator.storage || !('getDirectory' in navigator.storage)) {
      recommendations.push('OPFS is not available in this browser. Consider using IndexedDB or Memory storage.');
      return {
        available: false,
        fileExists: false,
        canAccess: false,
        recommendations
      };
    }

    const opfsRoot = await navigator.storage.getDirectory();
    
    // Check if file exists
    let fileExists = false;
    try {
      await opfsRoot.getFileHandle(databaseName, { create: false });
      fileExists = true;
    } catch (error) {
      recommendations.push('OPFS file does not exist yet. This is normal for first-time usage.');
    }

    // Check if we can access the file
    let canAccess = false;
    if (fileExists) {
      try {
        const fileHandle = await opfsRoot.getFileHandle(databaseName, { create: false });
        const file = await fileHandle.getFile();
        await file.text();
        canAccess = true;
      } catch (error) {
        recommendations.push('Cannot access OPFS file. This may indicate a lingering access handle. Try manual cleanup.');
      }
    }

    if (fileExists && !canAccess) {
      recommendations.push('OPFS file exists but cannot be accessed. This suggests a lingering access handle.');
      recommendations.push('Try calling manualOpfsCleanup() or refresh the page.');
    }

    if (canAccess) {
      recommendations.push('OPFS is working correctly. No action needed.');
    }

    return {
      available: true,
      fileExists,
      canAccess,
      recommendations
    };

  } catch (error) {
    recommendations.push('Error checking OPFS status. OPFS may not be available.');
    return {
      available: false,
      fileExists: false,
      canAccess: false,
      recommendations
    };
  }
}

/**
 * Browser console utility for manual OPFS cleanup
 * This function is designed to be called from the browser console
 */
export function setupConsoleUtilities(): void {
  if (typeof window !== 'undefined') {
    (window as any).opfsCleanup = {
      manual: manualOpfsCleanup,
      nuclear: nuclearOpfsCleanup,
      status: checkOpfsStatus,
      resetFailures: () => {
        const { OpfsStorageAdapter } = require('../adapters/opfs-storage-adapter.js');
        OpfsStorageAdapter.resetOpfsFailureCounter();
      },
      getFailures: () => {
        const { OpfsStorageAdapter } = require('../adapters/opfs-storage-adapter.js');
        return OpfsStorageAdapter.getOpfsFailureCount();
      },
      resetSession: () => {
        const { OpfsStorageAdapter } = require('../adapters/opfs-storage-adapter.js');
        OpfsStorageAdapter.resetOpfsSessionAvailability();
      }
    };
    
    console.log('OPFS cleanup utilities available at window.opfsCleanup:');
    console.log('- window.opfsCleanup.manual() - Try manual cleanup');
    console.log('- window.opfsCleanup.nuclear() - Nuclear cleanup (deletes all files)');
    console.log('- window.opfsCleanup.status() - Check OPFS status');
    console.log('- window.opfsCleanup.resetFailures() - Reset OPFS failure counter');
    console.log('- window.opfsCleanup.getFailures() - Get current failure count');
    console.log('- window.opfsCleanup.resetSession() - Reset session availability flag');
  }
}

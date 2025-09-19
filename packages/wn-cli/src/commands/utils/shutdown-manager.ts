// This module manages the shutdown state to prevent race conditions,
// especially with the database connection on Windows.

let dbManuallyClosed = false;

/**
 * Marks the database as having been closed manually.
 * This signals to the global exit hook that it should not attempt
 * to close the connection again, preventing a "double-close" error.
 */
export function setDbManuallyClosed() {
  dbManuallyClosed = true;
}

/**
 * Checks if the database has been marked as manually closed.
 * @returns {boolean} True if the database was manually closed.
 */
export function isDbManuallyClosed(): boolean {
  return dbManuallyClosed;
}

/**
 * Resets the manual close flag. This is essential for test environments
 * where multiple commands run in the same process.
 */
export function resetDbManuallyClosedFlag() {
  dbManuallyClosed = false;
}


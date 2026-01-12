#!/usr/bin/env node

/**
 * Cross-platform script to make the CLI executable
 * Works on both Windows and Unix systems
 */

const fs = require('fs');
const path = require('path');

const cliPath = path.join(__dirname, '..', 'dist', 'cli', 'index.js');

try {
  // Make executable (Unix: chmod +x, Windows: no-op but doesn't fail)
  fs.chmodSync(cliPath, 0o755);
  console.log('✓ Made CLI executable');
} catch (error) {
  // On Windows, this might fail silently, which is fine
  // The shebang is enough for cross-platform CLI usage
  if (error.code !== 'EPERM') {
    console.warn('⚠ Could not set executable permissions (this is OK on Windows)');
  }
}

#!/usr/bin/env node

/**
 * Script to download WordNet projects with a timeout using Node.js.
 * Equivalent to:
 *   timeout 60 pnpm cli data download cili:1.0 --progress
 *   timeout 120 pnpm cli data download oewn:2024 --progress
 */

const { spawn } = require('child_process');

/**
 * Run a command with a timeout.
 * @param {string[]} cmdArr - Command and arguments as array.
 * @param {number} timeoutSeconds - Timeout in seconds.
 * @returns {Promise<void>}
 */
function runWithTimeout(cmdArr, timeoutSeconds) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmdArr[0], cmdArr.slice(1), { stdio: 'inherit' });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeoutSeconds} seconds: ${cmdArr.join(' ')}`));
    }, timeoutSeconds * 1000);

    proc.on('exit', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed: ${cmdArr.join(' ')} (exit code: ${code}, signal: ${signal})`
          )
        );
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Downloading cili:1.0 (timeout 60s)...');
    await runWithTimeout([process.execPath, 'dist/cli.js', 'data', 'download', 'cili:1.0', '--progress'], 60);

    console.log('Downloading oewn:2024 (timeout 120s)...');
    await runWithTimeout([process.execPath, 'dist/cli.js', 'data', 'download', 'oewn:2024', '--progress'], 120);

    console.log('✅ Downloads completed.');
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

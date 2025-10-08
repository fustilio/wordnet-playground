/**
 * Performance E2E Tests for Node.js WordNet Demo
 * 
 * Tests performance characteristics of the demo scripts.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

async function runScript(scriptPath, timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeout
    });

    let stdout = '';
    let stderr = '';
    let hasError = false;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      hasError = true;
      stderr += error.message;
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        success: code === 0 && !hasError,
        exitCode: code,
        duration,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    // Handle timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: -1,
          duration,
          stdout: stdout.trim(),
          stderr: stderr.trim() + '\nTest timed out'
        });
      }
    }, timeout);
  });
}

describe('Performance E2E Tests', () => {
  it('should run basic database statistics within performance limits', async () => {
    const result = await runScript('src/examples/basic/database-statistics.js', 30000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.duration).toBeLessThan(15000); // Should complete within 15 seconds
  }, 35000);

  it('should run python style wordnet within performance limits', async () => {
    const result = await runScript('src/examples/basic/python-style-wordnet.js', 30000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
  }, 35000);

  it('should run advanced database statistics within performance limits', async () => {
    const result = await runScript('src/examples/advanced/database-statistics.js', 60000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.duration).toBeLessThan(30000); // Should complete within 30 seconds
  }, 65000);
});

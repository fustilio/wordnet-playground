/**
 * Live E2E Tests for Node.js WordNet Demo
 * 
 * Tests the live demo functionality including data download and setup.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

async function runScript(scriptPath, timeout = 300000) {
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
      resolve({
        success: code === 0 && !hasError,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    // Handle timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
        resolve({
          success: false,
          exitCode: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim() + '\nTest timed out'
        });
      }
    }, timeout);
  });
}

describe('Live E2E Tests', () => {
  it('should run live demo - complete workflow', async () => {
    const result = await runScript('src/examples/advanced/live-demo.js', 300000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Live Demo|Downloading|Processing|Querying/);
  }, 310000);
});

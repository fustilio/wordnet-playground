/**
 * Basic E2E Tests for Node.js WordNet Demo
 * 
 * Tests the basic functionality demos to ensure they work correctly.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

async function runScript(scriptPath, timeout = 60000) {
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

describe('Basic E2E Tests', () => {
  it('should run basic database statistics', async () => {
    const result = await runScript('src/examples/basic/database-statistics.js', 60000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Total words:|Total synsets:|Total senses:/);
  }, 70000);

  it('should run basic multilingual definitions', async () => {
    const result = await runScript('src/examples/basic/multilingual-definitions.js', 120000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/English:|French:|Definition:/);
  }, 130000);

  it('should run basic python style wordnet', async () => {
    const result = await runScript('src/examples/basic/python-style-wordnet.js', 60000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Found|synsets|definitions/);
  }, 70000);

  it('should run basic word sense disambiguation', async () => {
    const result = await runScript('src/examples/basic/word-sense-disambiguation.js', 60000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Sense|Definition:|Examples:/);
  }, 70000);
});

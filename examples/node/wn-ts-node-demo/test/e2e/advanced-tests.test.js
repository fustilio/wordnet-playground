/**
 * Advanced E2E Tests for Node.js WordNet Demo
 * 
 * Tests the advanced functionality demos to ensure they work correctly.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

async function runScript(scriptPath, timeout = 120000) {
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

describe('Advanced E2E Tests', () => {
  it('should run advanced crossword demo', async () => {
    const result = await runScript('src/examples/advanced/crossword-demo.js', 180000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Crossword|Hints:|Words:/);
  }, 190000);

  it('should run advanced database statistics', async () => {
    const result = await runScript('src/examples/advanced/database-statistics.js', 120000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Statistics:|Quality metrics:|Coverage:/);
  }, 130000);

  it('should run advanced french crossword demo', async () => {
    const result = await runScript('src/examples/advanced/french-crossword-demo.js', 180000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/French|Crossword|Mots:/);
  }, 190000);

  it('should run advanced kitchen sink demo', async () => {
    const result = await runScript('src/examples/advanced/kitchen-sink-demo.js', 300000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Kitchen Sink|Features:|Demonstrations:/);
  }, 310000);

  it('should run advanced lexical database exploration', async () => {
    const result = await runScript('src/examples/advanced/lexical-database-exploration.js', 120000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Exploration|Relationships:|Hierarchy:/);
  }, 130000);

  it('should run advanced multilingual linking', async () => {
    const result = await runScript('src/examples/advanced/multilingual-linking.js', 180000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Multilingual|Linking:|Languages:/);
  }, 190000);

  it('should run advanced word sense disambiguation', async () => {
    const result = await runScript('src/examples/advanced/word-sense-disambiguation.js', 120000);
    
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Disambiguation|Context:|Senses:/);
  }, 130000);
});

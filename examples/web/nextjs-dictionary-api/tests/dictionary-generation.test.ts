import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Performance tests for dictionary generation
 * These tests verify that dictionary generation completes within reasonable time bounds
 * and shows progress indicators
 */

const CLI_PATH = join(process.cwd(), '../../../packages/wn-serverless-dict/dist/cli/index.js');

interface GenerationResult {
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

async function runGeneration(
  preset: string,
  outputName: string,
  timeout: number = 300000 // 5 minutes default
): Promise<GenerationResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const output: string[] = [];
    const errors: string[] = [];
    
    const child = spawn('node', [CLI_PATH, preset, outputName, '--force'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let lastProgressTime = Date.now();
    let hasProgress = false;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output.push(text);
      
      // Check for progress indicators
      if (text.includes('[Generator]') || text.includes('Processing') || text.includes('Processed')) {
        hasProgress = true;
        lastProgressTime = Date.now();
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errors.push(text);
      output.push(text);
    });

    // Monitor for progress - if no progress for 2 minutes, consider it hung
    const progressMonitor = setInterval(() => {
      const timeSinceLastProgress = Date.now() - lastProgressTime;
      if (timeSinceLastProgress > 120000) { // 2 minutes without progress
        child.kill();
        clearInterval(progressMonitor);
        resolve({
          success: false,
          duration: Date.now() - startTime,
          output: output.join(''),
          error: 'Generation appears to be hung - no progress for 2 minutes'
        });
      }
    }, 10000); // Check every 10 seconds

    child.on('close', (code) => {
      clearInterval(progressMonitor);
      const duration = Date.now() - startTime;
      
      resolve({
        success: code === 0,
        duration,
        output: output.join(''),
        error: errors.length > 0 ? errors.join('') : undefined
      });
    });

    // Timeout
    setTimeout(() => {
      child.kill();
      clearInterval(progressMonitor);
      resolve({
        success: false,
        duration: Date.now() - startTime,
        output: output.join(''),
        error: `Generation timed out after ${timeout}ms`
      });
    }, timeout);
  });
}

// Skip generation performance tests by default - they're slow and require full WordNet setup
// Run with: pnpm test tests/dictionary-generation.test.ts
describe.skip('Dictionary Generation Performance', () => {
  describe('Small dictionary (500 synsets)', () => {
    const testOutput = 'test-dict-small';
    
    it('should generate within reasonable time (max 10 minutes)', async () => {
      const result = await runGeneration('small', testOutput, 600000); // 10 minutes
      
      // Log diagnostic info if failed
      if (!result.success) {
        console.log('\n=== Generation Failed ===');
        console.log(`Error: ${result.error || 'Unknown error'}`);
        console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
        console.log(`Output (last 500 chars):\n${result.output.slice(-500)}`);
      }
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(600000); // 10 minutes
      
      // Verify output file exists
      expect(existsSync(`${testOutput}.json`)).toBe(true);
      
      // Clean up
      if (existsSync(`${testOutput}.json`)) {
        unlinkSync(`${testOutput}.json`);
      }
      if (existsSync(`${testOutput}.js`)) {
        unlinkSync(`${testOutput}.js`);
      }
    }, 600000); // 10 minute timeout

    it('should show progress indicators', async () => {
      const result = await runGeneration('small', testOutput, 600000);
      
      // Check for progress indicators in output
      const hasProgress = result.output.includes('[Generator]') || 
                         result.output.includes('Processing') ||
                         result.output.includes('Processed');
      
      expect(hasProgress).toBe(true);
      
      // Clean up
      if (existsSync(`${testOutput}.json`)) {
        unlinkSync(`${testOutput}.json`);
      }
      if (existsSync(`${testOutput}.js`)) {
        unlinkSync(`${testOutput}.js`);
      }
    }, 600000);
  });

  describe('English-Thai dictionary (1000 synsets)', () => {
    const testOutput = 'test-dict-en-th';
    
    it('should generate within reasonable time (max 15 minutes)', async () => {
      const result = await runGeneration('en-th', testOutput, 900000); // 15 minutes
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(900000); // 15 minutes
      
      // Verify output file exists
      expect(existsSync(`${testOutput}.json`)).toBe(true);
      
      // Clean up
      if (existsSync(`${testOutput}.json`)) {
        unlinkSync(`${testOutput}.json`);
      }
      if (existsSync(`${testOutput}.js`)) {
        unlinkSync(`${testOutput}.js`);
      }
    }, 900000); // 15 minute timeout

    it('should show progress indicators throughout generation', async () => {
      const result = await runGeneration('en-th', testOutput, 900000);
      
      // Check for multiple progress indicators (not just one)
      const progressMatches = result.output.match(/\[Generator\]|Processing|Processed/g);
      const progressCount = progressMatches ? progressMatches.length : 0;
      
      // Should have multiple progress updates
      expect(progressCount).toBeGreaterThan(5);
      
      // Clean up
      if (existsSync(`${testOutput}.json`)) {
        unlinkSync(`${testOutput}.json`);
      }
      if (existsSync(`${testOutput}.js`)) {
        unlinkSync(`${testOutput}.js`);
      }
    }, 900000);
  });

  describe('Generation output validation', () => {
    const testOutput = 'test-dict-validation';
    
    it('should produce valid dictionary structure', async () => {
      const result = await runGeneration('small', testOutput, 600000);
      
      expect(result.success).toBe(true);
      
      if (existsSync(`${testOutput}.json`)) {
        const { readFileSync } = await import('fs');
        const data = JSON.parse(readFileSync(`${testOutput}.json`, 'utf-8'));
        
        // Validate structure
        expect(data).toHaveProperty('v');
        expect(data).toHaveProperty('m');
        expect(data).toHaveProperty('w');
        expect(data).toHaveProperty('s');
        expect(data.m).toHaveProperty('c'); // synset count
        expect(data.m).toHaveProperty('w'); // word count
        expect(data.m.c).toBeGreaterThan(0);
        expect(data.m.w).toBeGreaterThan(0);
        
        // Clean up
        unlinkSync(`${testOutput}.json`);
        if (existsSync(`${testOutput}.js`)) {
          unlinkSync(`${testOutput}.js`);
        }
      }
    }, 600000);
  });
});

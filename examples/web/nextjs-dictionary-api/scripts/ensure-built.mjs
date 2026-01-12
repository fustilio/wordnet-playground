#!/usr/bin/env node

/**
 * Ensures that wn-serverless-dict is built before generating dictionaries
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');
const WN_SERVERLESS_DICT_PATH = resolve(PROJECT_ROOT, 'packages', 'wn-serverless-dict');
const CLI_PATH = resolve(WN_SERVERLESS_DICT_PATH, 'dist', 'cli', 'index.js');

console.log('Checking if wn-serverless-dict is built...');

if (!existsSync(CLI_PATH)) {
    console.log('wn-serverless-dict not built. Building now...');
    try {
        execSync('pnpm build', {
            cwd: WN_SERVERLESS_DICT_PATH,
            stdio: 'inherit'
        });
        console.log('✓ wn-serverless-dict built successfully');
    } catch (error) {
        console.error('Failed to build wn-serverless-dict');
        process.exit(1);
    }
} else {
    console.log('✓ wn-serverless-dict already built');
}


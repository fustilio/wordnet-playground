#!/usr/bin/env node

/**
 * Build script to convert index.toml to JSON for browser environments
 * This ensures we have a single source of truth and efficient parsing
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_TOML_PATH = path.join(__dirname, '../../wn-ts-core/src/index.toml');
const INDEX_JSON_PATH = path.join(__dirname, '../src/index.json');

function buildIndex() {
  try {
    console.log('🔄 Converting index.toml to index.json...');
    
    // Read the TOML file from wn-ts-core
    const tomlContent = fs.readFileSync(INDEX_TOML_PATH, 'utf8');
    
    // Parse TOML to object
    const parsed = parse(tomlContent);
    
    // Convert to JSON with proper formatting
    const jsonContent = JSON.stringify(parsed, null, 2);
    
    // Write the JSON file to wn-ts-web
    fs.writeFileSync(INDEX_JSON_PATH, jsonContent, 'utf8');
    
    console.log('✅ Successfully converted index.toml to index.json');
    console.log(`📁 Output: ${INDEX_JSON_PATH}`);
    
    // Log some stats
    const projectCount = Object.keys(parsed).length;
    console.log(`📊 Found ${projectCount} projects in index`);
    
    // List some example projects
    const exampleProjects = Object.keys(parsed).slice(0, 5);
    console.log(`📋 Example projects: ${exampleProjects.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to convert index.toml:', error);
    process.exit(1);
  }
}

// Run the build
buildIndex(); 
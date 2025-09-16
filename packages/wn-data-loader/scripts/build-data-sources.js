#!/usr/bin/env node

/**
 * Build script to generate data-sources.ts from index.toml
 * This ensures we have a single source of truth for WordNet data sources
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_TOML_PATH = path.join(__dirname, '../../../wn-ts-core/src/index.toml');
const DATA_SOURCES_JSON_PATH = path.join(__dirname, '../src/data-sources.json');
const INDEX_JSON_PATH = path.join(__dirname, '../../../wn-ts-web/src/index.json');

function buildDataSources() {
  try {
    console.log('🔄 Converting index.toml to data-sources.json and index.json...');
    
    // Read the TOML file from wn-ts-core
    const tomlContent = fs.readFileSync(INDEX_TOML_PATH, 'utf8');
    
    // Parse TOML to object
    const parsed = parse(tomlContent);
    
    // Generate index.json for wn-ts-web (raw TOML data)
    console.log('🔄 Generating index.json for wn-ts-web...');
    const indexJsonContent = JSON.stringify(parsed, null, 2);
    fs.writeFileSync(INDEX_JSON_PATH, indexJsonContent, 'utf8');
    console.log('✅ Successfully generated index.json');
    console.log(`📁 Output: ${INDEX_JSON_PATH}`);
    
    // Convert to WordNetDataSource format
    const dataSources = convertToDataSources(parsed);
    
    // Generate data-sources.json for wn-data-loader
    const dataSourcesJsonContent = JSON.stringify(dataSources, null, 2);
    fs.writeFileSync(DATA_SOURCES_JSON_PATH, dataSourcesJsonContent, 'utf8');
    
    console.log('✅ Successfully converted index.toml to data-sources.json');
    console.log(`📁 Output: ${DATA_SOURCES_JSON_PATH}`);
    
    // Log some stats
    const projectCount = Object.keys(parsed).length;
    const dataSourceCount = Object.keys(dataSources).length;
    console.log(`📊 Found ${projectCount} projects in index, ${dataSourceCount} data sources generated`);
    
    // List some example projects
    const exampleProjects = Object.keys(parsed).slice(0, 5);
    console.log(`📋 Example projects: ${exampleProjects.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to convert index.toml:', error);
    process.exit(1);
  }
}

function convertToDataSources(indexData) {
  const dataSources = {};

  for (const [projectId, projectData] of Object.entries(indexData)) {
    if (typeof projectData !== 'object' || projectData === null) continue;
    
    const project = projectData;
    
    // Skip projects with errors
    if (project.error) continue;
    
    // Process versions
    if (project.versions && typeof project.versions === 'object') {
      for (const [version, versionData] of Object.entries(project.versions)) {
        if (typeof versionData !== 'object' || versionData === null) continue;
        
        const versionInfo = versionData;
        
        // Skip versions with errors
        if (versionInfo.error) continue;
        
        const fullProjectId = `${projectId}:${version}`;
        
        // Handle single URL or multiple URLs
        let urls = [];
        if (typeof versionInfo.url === 'string') {
          // Handle malformed URLs with newlines and whitespace
          const urlString = versionInfo.url.trim();
          if (urlString.includes('\n')) {
            // Split by newlines and clean up each URL
            urls = urlString.split('\n')
              .map(url => url.trim())
              .filter(url => url.length > 0 && url.startsWith('http'));
          } else {
            urls = [urlString];
          }
        } else if (Array.isArray(versionInfo.url)) {
          urls = versionInfo.url;
        }
        
        // Use the first URL as the primary URL
        if (urls.length > 0) {
          const primaryUrl = urls[0];
          
          // Determine format based on URL extension
          let format = 'xml';
          if (primaryUrl.includes('.tar.gz') || primaryUrl.includes('.tgz')) {
            format = 'tar.gz';
          } else if (primaryUrl.includes('.tar.xz')) {
            format = 'tar.xz';
          } else if (primaryUrl.includes('.xml.gz')) {
            format = 'tar.gz'; // Treat xml.gz as tar.gz for consistency
          } else if (primaryUrl.includes('.gz')) {
            format = 'tar.gz';
          } else if (primaryUrl.includes('.xz')) {
            format = 'tar.xz';
          }
          
          dataSources[fullProjectId] = {
            id: fullProjectId,
            name: `${project.label || projectId} ${version}`,
            language: project.language || 'unknown',
            version: version,
            url: primaryUrl,
            format: format,
            description: project.label || `WordNet data for ${projectId} version ${version}`,
            size: 'Unknown',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
      }
    }
  }
  
  return dataSources;
}


// Run the build
buildDataSources();

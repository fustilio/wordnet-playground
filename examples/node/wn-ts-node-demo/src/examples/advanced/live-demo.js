#!/usr/bin/env node

/**
 * Live Demo: Multi-step demonstration with setup, download, and querying
 * 
 * Problem: You need to demonstrate the complete workflow from setup to querying.
 * Solution: Show download, setup, and query capabilities in sequence.
 * 
 * Real-world application: System setup, data management, workflow demonstration
 */

import { config, download, add, Wordnet, words, synsets, projects } from 'wn-ts-node';
import { join } from 'path';
import { homedir } from 'os';
import { safeClose, runDemo } from '../shared/helpers.js';

console.log(`
🌐 wn-ts Live Demo
==================

Problem: You need to demonstrate the complete workflow from setup to querying.
Solution: Show download, setup, and query capabilities in sequence.

Real-world application: System setup, data management, workflow demonstration
`);

async function setupDataDirectory() {
  const demoDataDir = join(homedir(), '.wn_demo');
  
  try {
    const fs = await import('fs');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(demoDataDir)) {
      fs.mkdirSync(demoDataDir, { recursive: true });
    }
    
    return demoDataDir;
  } catch (error) {
    console.error(`❌ Failed to setup data directory: ${error.message}`);
    process.exit(1);
  }
}

async function runLiveDemo() {
  let wordnet = null;
  let availableProjects = [];
  let infoSynsets = [];

  try {
    console.log('🔧 Setting up demo...');
    
    // Set up demo data directory
    const demoDataDir = await setupDataDirectory();
    console.log(`📁 Using data directory: ${demoDataDir}\n`);
    
    console.log('🔧 Setting config data directory...');
    // Set config data directory AFTER creating the directory
    config.dataDirectory = demoDataDir;
    console.log('✅ Config data directory set successfully');

    console.log('🔧 Getting available projects...');
    // Show available projects
    console.log('📋 Available WordNet Projects:');
    try {
      availableProjects = await projects();
      
      if (availableProjects.length > 0) {
        const projectList = availableProjects.slice(0, 5); // Show first 5
        projectList.forEach(project => {
          // Use the actual properties from the project structure
          const version = project.version || 'latest';
          const language = project.language || project.lang || 'en';
          const name = project.label || project.name || project.id || 'Unknown';
          console.log(`  • ${project.id}:${version} - ${name} (${language})`);
        });
        console.log(`  ... and ${availableProjects.length - 5} more projects\n`);
      } else {
        console.log('  No projects found or projects() returned empty array\n');
      }
    } catch (error) {
      console.log(`⚠️  Error getting projects: ${error.message}\n`);
    }

    // Demo 1: Download and add CILI (Collaborative Interlingual Index)
    console.log('🔄 Demo 1: Downloading and processing CILI (Collaborative Interlingual Index)...');
    try {
      const ciliPath = await download('cili:1.0', { force: true });
      console.log('✅ CILI downloaded successfully!');
      
      // Add the downloaded file to the database using the returned path
      await add(ciliPath, { force: true });
      console.log('✅ CILI added to database!\n');
    } catch (error) {
      console.log(`⚠️  CILI processing failed: ${error.message}\n`);
    }

    // Demo 2: Download and add Open English WordNet
    console.log('🔄 Demo 2: Downloading and processing Open English WordNet (2024)...');
    try {
      const oewnPath = await download('oewn:2024', { force: true });
      console.log('✅ Open English WordNet downloaded successfully!');
      
      // Add the downloaded file to the database using the returned path
      await add(oewnPath, { force: true });
      console.log('✅ Open English WordNet added to database!\n');
    } catch (error) {
      console.log(`⚠️  Open English WordNet processing failed: ${error.message}\n`);
    }

    // Demo 3: Query downloaded data
    console.log('🔍 Demo 3: Querying downloaded data...');
    
    try {
      // Create Wordnet instance
      wordnet = new Wordnet('oewn:2024');
      
      // Search for words
      console.log('\n📝 Searching for words containing "information":');
      const infoWords = await wordnet.words('information');
      if (infoWords.length > 0) {
        infoWords.slice(0, 3).forEach(word => {
          console.log(`  • ${word.lemma} (${word.partOfSpeech})`);
        });
        console.log(`  ... and ${infoWords.length - 3} more words`);
      } else {
        console.log('  No words found containing "information"');
      }

      // Get synsets
      console.log('\n📚 Getting synsets for "information":');
      infoSynsets = await wordnet.synsets('information');
      if (infoSynsets.length > 0) {
        infoSynsets.slice(0, 2).forEach(synset => {
          console.log(`  • ${synset.id} - ${synset.definitions[0]?.text || 'No definition'}`);
        });
        console.log(`  ... and ${infoSynsets.length - 2} more synsets`);
      } else {
        console.log('  No synsets found for "information"');
      }

      // Search for another word
      console.log('\n📝 Searching for words containing "computer":');
      const computerWords = await wordnet.words('computer');
      if (computerWords.length > 0) {
        computerWords.slice(0, 3).forEach(word => {
          console.log(`  • ${word.lemma} (${word.partOfSpeech})`);
        });
        console.log(`  ... and ${computerWords.length - 3} more words`);
      } else {
        console.log('  No words found containing "computer"');
      }

    } catch (error) {
      console.log(`⚠️  Query failed: ${error.message}\n`);
    }

    // Demo 4: Show project info
    console.log('\n📊 Demo 4: Project Information:');
    try {
      const oewnInfo = config.getProjectInfo('oewn:2024');
      console.log(`  • Project: ${oewnInfo.label}`);
      console.log(`  • Language: ${oewnInfo.language}`);
      console.log(`  • License: ${oewnInfo.license}`);
      console.log(`  • Download URLs: ${oewnInfo.resource_urls.length} available`);
    } catch (error) {
      console.log(`⚠️  Could not get project info: ${error.message}`);
    }

    console.log(`
🎉 Live Demo Completed!

💡 Key Insights:
   • Complete workflow from setup to querying demonstrated
   • Download and data management capabilities shown
   • Real-time project discovery and configuration
   • Practical data loading and querying examples

🚀 Practical Applications:
   • System setup and configuration
   • Data management workflows
   • Project discovery and selection
   • Real-time demonstration capabilities
   • Educational and training scenarios

📊 Final Statistics:
   • Projects discovered: ${availableProjects?.length || 0}
   • Data sources downloaded: 2 (CILI + OEWN)
   • Words queried: 2 (information, computer)
   • Synsets retrieved: ${infoSynsets?.length || 0}
`);

    console.log('\n💡 Try running this demo again to see cached downloads in action.');
    console.log('💡 You can also try other projects like:');
    console.log('   • omw-en:1.4 (OMW English WordNet)');
    console.log('   • odenet:1.4 (Open German WordNet)');
    console.log('   • omw-fr:1.4 (French WordNet)');

    // Close the database using consistent pattern
    if (wordnet) {
      await safeClose(wordnet, '✅ Database closed gracefully.');
    }

  } catch (error) {
    console.error('❌ Live demo failed:', error.message);
    if (wordnet) {
      await safeClose(wordnet, '✅ Database closed gracefully (after error).');
    }
    throw error;
  }
}

// Run the live demo
runDemo(runLiveDemo, 'Live Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 

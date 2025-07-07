#!/usr/bin/env node

import { config, download, add, Wordnet, words, synsets, projects } from 'wn-ts';
import { join } from 'path';
import { homedir } from 'os';

console.log('🌐 wn-ts Live Demo');
console.log('==================\n');

async function setupDataDirectory() {
  const demoDataDir = join(homedir(), '.wn_demo');
  
  try {
    const fs = await import('fs');
    
    // Remove anything at the path (file or directory)
    if (fs.existsSync(demoDataDir)) {
      const stats = fs.statSync(demoDataDir);
      if (stats.isDirectory()) {
        // Remove directory and all contents
        fs.rmSync(demoDataDir, { recursive: true, force: true });
      } else {
        // Remove file
        fs.unlinkSync(demoDataDir);
      }
    }
    
    // Create fresh directory
    fs.mkdirSync(demoDataDir, { recursive: true });
    
    return demoDataDir;
  } catch (error) {
    console.error(`❌ Failed to setup data directory: ${error.message}`);
    process.exit(1);
  }
}

async function runDemo() {
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
    const availableProjects = await projects();
    const projectList = availableProjects.slice(0, 5); // Show first 5
    projectList.forEach(project => {
      console.log(`  • ${project.id}:${project.version} - ${project.label} (${project.language})`);
    });
    console.log(`  ... and ${availableProjects.length - 5} more projects\n`);

    // Demo 1: Download and add CILI (Collaborative Interlingual Index)
    console.log('🔄 Demo 1: Downloading and processing CILI (Collaborative Interlingual Index)...');
    try {
      await download('cili:1.0', { force: true });
      console.log('✅ CILI downloaded successfully!');
      
      // Add the downloaded file to the database
      const ciliPath = join(config.downloadDirectory, 'cili-1.0.xml.gz');
      await add(ciliPath, { force: true });
      console.log('✅ CILI added to database!\n');
    } catch (error) {
      console.log(`⚠️  CILI processing failed: ${error.message}\n`);
    }

    // Demo 2: Download and add Open English WordNet
    console.log('🔄 Demo 2: Downloading and processing Open English WordNet (2024)...');
    try {
      await download('oewn:2024', { force: true });
      console.log('✅ Open English WordNet downloaded successfully!');
      
      // Add the downloaded file to the database
      const oewnPath = join(config.downloadDirectory, 'oewn-2024.xml.gz');
      await add(oewnPath, { force: true });
      console.log('✅ Open English WordNet added to database!\n');
    } catch (error) {
      console.log(`⚠️  Open English WordNet processing failed: ${error.message}\n`);
    }

    // Demo 3: Query downloaded data
    console.log('🔍 Demo 3: Querying downloaded data...');
    
    try {
      // Create Wordnet instance
      const wordnet = new Wordnet('oewn:2024');
      
      // Search for words
      console.log('\n📝 Searching for words containing "information":');
      const infoWords = await words('information');
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
      const infoSynsets = await synsets('information');
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
      const computerWords = await words('computer');
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

    console.log('\n🎉 Demo completed!');
    console.log('\n💡 Try running this demo again to see cached downloads in action.');
    console.log('💡 You can also try other projects like:');
    console.log('   • omw-en:1.4 (OMW English WordNet)');
    console.log('   • odenet:1.4 (Open German WordNet)');
    console.log('   • omw-fr:1.4 (French WordNet)');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo(); 
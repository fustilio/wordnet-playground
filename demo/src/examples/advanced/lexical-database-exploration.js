#!/usr/bin/env node

/**
 * Use Case 3: Lexical Database Exploration
 * 
 * Problem: You want to understand what linguistic resources are available in the database.
 * Solution: Explore lexicons and their metadata.
 * 
 * Real-world application: Research, data analysis, resource discovery
 */

import { 
  Wordnet, 
  lexicons,
  words,
  synsets
} from 'wn-ts';
import { join } from 'path';
import { homedir } from 'os';

console.log(`
📖 Use Case 3: Lexical Database Exploration
===========================================

Problem: You want to understand what linguistic resources are available in the database.
Solution: Explore lexicons and their metadata.

Real-world application: Research, data analysis, resource discovery
`);

// Use a dedicated data directory for this demo
const dataDirectory = join(homedir(), '.wn_exploration_demo');
console.log(`📁 Using data directory: ${dataDirectory}`);

// Initialize Wordnet
let wordnet;
try {
  wordnet = new Wordnet('*', {
    dataDirectory,
    downloadDirectory: join(dataDirectory, 'downloads'),
    extractDirectory: join(dataDirectory, 'extracted'),
    databasePath: join(dataDirectory, 'wordnet.db')
  });
  console.log('✅ Wordnet initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Wordnet:', error.message);
  process.exit(1);
}

async function demonstrateLexicalDatabaseExploration() {
  try {
    console.log(`
🔍 Example 1: Discovering Available Lexicons
===========================================`);

    // Get available lexicons
    console.log('\n📖 Exploring available lexicons...');
    const allLexicons = await lexicons();
    console.log(`Found ${allLexicons.length} lexicons:`);
    
    allLexicons.forEach((lexicon, index) => {
      console.log(`\n📚 Lexicon ${index + 1}:`);
      console.log(`  ID: ${lexicon.id}`);
      console.log(`  Label: ${lexicon.label}`);
      console.log(`  Language: ${lexicon.language}`);
      console.log(`  Version: ${lexicon.version}`);
      console.log(`  License: ${lexicon.license}`);
      console.log(`  URL: ${lexicon.url}`);
    });

    console.log(`
🔍 Example 2: Lexicon Analysis by Language
==========================================`);

    // Group lexicons by language
    const lexiconsByLanguage = {};
    allLexicons.forEach(lexicon => {
      const lang = lexicon.language;
      if (!lexiconsByLanguage[lang]) {
        lexiconsByLanguage[lang] = [];
      }
      lexiconsByLanguage[lang].push(lexicon);
    });

    console.log('\n🌐 Lexicons by Language:');
    Object.entries(lexiconsByLanguage).forEach(([language, lexicons]) => {
      console.log(`\n  ${language.toUpperCase()}: ${lexicons.length} lexicons`);
      lexicons.forEach(lexicon => {
        console.log(`    • ${lexicon.id}: ${lexicon.label} (v${lexicon.version})`);
      });
    });

    console.log(`
🔍 Example 3: Word Coverage Analysis
===================================`);

    // Analyze word coverage across lexicons
    const testWords = ['computer', 'information', 'happy', 'run'];
    
    for (const word of testWords) {
      console.log(`\n🔍 "${word}" coverage analysis:`);
      
      const allWords = await words(word);
      console.log(`  📝 Total word forms: ${allWords.length}`);
      
      if (allWords.length > 0) {
        // Group by lexicon
        const byLexicon = {};
        allWords.forEach(wordObj => {
          const lexicon = wordObj.lexicon;
          if (!byLexicon[lexicon]) {
            byLexicon[lexicon] = [];
          }
          byLexicon[lexicon].push(wordObj);
        });
        
        Object.entries(byLexicon).forEach(([lexicon, words]) => {
          console.log(`    📚 ${lexicon}: ${words.length} entries`);
          words.slice(0, 2).forEach(wordObj => {
            console.log(`      - ${wordObj.lemma} (${wordObj.partOfSpeech})`);
          });
        });
      } else {
        console.log(`  ❌ No entries found`);
      }
    }

    console.log(`
🔍 Example 4: Synset Coverage Analysis
=====================================`);

    // Analyze synset coverage for a specific word
    console.log('\n📚 Synset coverage analysis for "computer":');
    
    const computerSynsets = await synsets('computer');
    console.log(`📚 Total synsets: ${computerSynsets.length}`);
    
    if (computerSynsets.length > 0) {
      // Group by lexicon
      const synsetsByLexicon = {};
      computerSynsets.forEach(synset => {
        const lexicon = synset.lexicon;
        if (!synsetsByLexicon[lexicon]) {
          synsetsByLexicon[lexicon] = [];
        }
        synsetsByLexicon[lexicon].push(synset);
      });
      
      Object.entries(synsetsByLexicon).forEach(([lexicon, synsets]) => {
        console.log(`\n📚 ${lexicon}: ${synsets.length} synsets`);
        synsets.slice(0, 2).forEach((synset, index) => {
          console.log(`  ${index + 1}. ${synset.id} (${synset.members.length} members)`);
          console.log(`     ILI: ${synset.ili}`);
          
          // Display definition
          if (synset.definitions && synset.definitions.length > 0) {
            console.log(`     Definition: ${synset.definitions[0].text}`);
          }
          
          // Display examples
          if (synset.examples && synset.examples.length > 0) {
            console.log(`     Examples:`);
            synset.examples.forEach((example, exIndex) => {
              console.log(`       ${exIndex + 1}. "${example.text}"`);
            });
          }
        });
      });
    }

    console.log(`
🔍 Example 5: Database Statistics and Metadata
=============================================`);

    // Get overall statistics using Wordnet instance methods
    console.log('\n📊 Database Statistics:');
    
    const stats = await wordnet.getStatistics();
    const lexiconStats = await wordnet.getLexiconStatistics();
    
    console.log('\n📊 Lexicon Statistics:');
    lexiconStats.forEach((lexiconStat) => {
      console.log(`\n📚 ${lexiconStat.lexiconId}:`);
      console.log(`  Label: ${lexiconStat.label}`);
      console.log(`  Language: ${lexiconStat.language}`);
      console.log(`  Version: ${lexiconStat.version}`);
      console.log(`  Word coverage: ${lexiconStat.wordCount}`);
      console.log(`  Synset coverage: ${lexiconStat.synsetCount}`);
    });

    console.log(`
🔍 Example 6: Resource Discovery for Research
============================================`);

    // Demonstrate how researchers might explore the database
    console.log('\n🔬 Research use cases:');
    
    const researchScenarios = [
      {
        title: 'Cross-linguistic comparison',
        description: 'Compare word coverage across languages',
        example: 'Analyzing "computer" across English lexicons'
      },
      {
        title: 'Lexicon quality assessment',
        description: 'Evaluate lexicon completeness and accuracy',
        example: 'Checking synset coverage and ILI mapping'
      },
      {
        title: 'Resource selection',
        description: 'Choose appropriate lexicons for specific tasks',
        example: 'Selecting lexicons based on language and version'
      }
    ];
    
    researchScenarios.forEach((scenario, index) => {
      console.log(`\n${index + 1}. ${scenario.title}:`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Example: ${scenario.example}`);
    });

    console.log(`
🔍 Example 7: Detailed Synset Exploration
========================================`);

    // Show detailed synset information for research purposes
    console.log('\n🔍 Detailed synset exploration for "information":');
    
    const informationSynsets = await synsets('information');
    console.log(`📚 Found ${informationSynsets.length} synsets for "information"`);
    
    // Group by part of speech
    const infoByPOS = {};
    informationSynsets.forEach(synset => {
      const pos = synset.partOfSpeech;
      if (!infoByPOS[pos]) infoByPOS[pos] = [];
      infoByPOS[pos].push(synset);
    });
    
    Object.entries(infoByPOS).forEach(([pos, synsets]) => {
      console.log(`\n📚 ${pos.toUpperCase()} senses:`);
      synsets.forEach((synset, index) => {
        console.log(`\n  ${index + 1}. ${synset.id}`);
        console.log(`     Members: ${synset.members.join(", ")}`);
        console.log(`     ILI: ${synset.ili || 'None'}`);
        
        // Display definition
        if (synset.definitions && synset.definitions.length > 0) {
          console.log(`     Definition: ${synset.definitions[0].text}`);
        }
        
        // Display examples
        if (synset.examples && synset.examples.length > 0) {
          console.log(`     Examples:`);
          synset.examples.forEach((example, exIndex) => {
            console.log(`       ${exIndex + 1}. "${example.text}"`);
          });
        }
        
        // Display relations
        if (synset.relations && synset.relations.length > 0) {
          const relationTypes = {};
          synset.relations.forEach(rel => {
            relationTypes[rel.type] = (relationTypes[rel.type] || 0) + 1;
          });
          const relationSummary = Object.entries(relationTypes)
            .map(([type, count]) => `${type}(${count})`)
            .join(", ");
          console.log(`     Relations: ${relationSummary}`);
        }
      });
    });

    console.log(`
🎉 Lexical Database Exploration Demo Completed!

💡 Key Insights:
   • Multiple lexicons provide diverse linguistic resources
   • Different languages and versions offer various coverage
   • Lexicon metadata helps with resource selection
   • Word and synset coverage varies across lexicons
   • Detailed synset information enables comprehensive research

🚀 Practical Applications:
   • Research and academic studies
   • Data quality assessment
   • Resource discovery and selection
   • Cross-linguistic analysis
   • Lexical database development

📊 Statistics:
   • Total lexicons: ${allLexicons.length}
   • Languages covered: ${Object.keys(lexiconsByLanguage).length}
   • Words analyzed: ${testWords.length}
   • Total words in database: ${stats.totalWords}
   • Total synsets in database: ${stats.totalSynsets}
   • Lexicons by language: ${Object.entries(lexiconsByLanguage).map(([lang, lexicons]) => `${lang}(${lexicons.length})`).join(', ')}
`);

    // Close the database using Wordnet instance method
    await wordnet.close();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Lexical database exploration demo failed:', error.message);
    try { 
      await wordnet.close(); 
      console.log('✅ Database connection closed after error');
    } catch (closeError) {
      console.error('⚠️  Error closing database:', closeError.message);
    }
  }
}

// Run the lexical database exploration demo
demonstrateLexicalDatabaseExploration().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 

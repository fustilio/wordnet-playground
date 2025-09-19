#!/usr/bin/env node

/**
 * Use Case 3: Lexical Database Exploration
 * 
 * Problem: You want to understand what linguistic resources are available in the database.
 * Solution: Explore lexicons and their metadata.
 * 
 * Real-world application: Research, data analysis, resource discovery
 */

// No direct imports needed from wn-ts, using wordnet instance
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
📖 Use Case: Lexical Database Exploration
======================================

Problem: You want to understand what linguistic resources are available in the database.
Solution: Explore lexicons, their metadata, and coverage.

Real-world application: Research, data analysis, resource discovery
`);

async function demonstrateLexicalDatabaseExploration() {
  const wordnet = await createWordnet('exploration');
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Example 1: Discovering Available Lexicons
===========================================`);

    // Get available lexicons
    console.log('\n📖 Exploring available lexicons...');
    const allLexicons = await wordnet.lexicons();
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
      
      const allWords = await wordnet.words(word);
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
    
    const computerSynsets = await wordnet.synsets('computer');
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
        synsets.slice(0, 2).forEach(async (synset, index) => {
          await displaySynset(synset, index + 1);
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
    
    const informationSynsets = await wordnet.synsets('information');
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
      synsets.forEach(async (synset, index) => {
        await displaySynset(synset, index + 1);
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

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Lexical database exploration demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the lexical database exploration demo
runDemo(demonstrateLexicalDatabaseExploration, 'Lexical Database Exploration Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 

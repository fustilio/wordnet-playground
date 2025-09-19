#!/usr/bin/env node

/**
 * Use Case: Database Statistics
 *
 * Showcases how to analyze the scope and quality of the WordNet database with key statistics and sample content.
 * Focus: Short, clear demonstration of database statistics functionality.
 */

import { ilis } from 'wn-ts-node';
import { createWordnet, displaySynset, safeClose, runDemo } from '../shared/helpers.js';

console.log(`
📊 Use Case: Database Statistics (Basic)
=======================================

Problem: You need a quick overview of the scope and quality of the WordNet database.
Solution: Analyze key statistics.

Real-world application: Quick data quality assessment
`);

async function demonstrateDatabaseStatistics() {
  const wordnet = await createWordnet('statistics_short');
  console.log('✅ Wordnet initialized successfully');

  try {
    console.log(`
🔍 Example 1: Overall Database Statistics
========================================`);

    const allLexicons = await wordnet.lexicons();
    const allILIs = await ilis();
    const stats = await wordnet.getStatistics();
    const qualityMetrics = await wordnet.getDataQualityMetrics();

    console.log(`📊 Database Statistics:`);
    console.log(`  📝 Total words: ${stats.totalWords}`);
    console.log(`  📚 Total synsets: ${stats.totalSynsets}`);
    console.log(`  🎯 Total senses: ${stats.totalSenses}`);
    console.log(`  🌍 Total ILI entries: ${stats.totalILIs}`);
    console.log(`  📖 Total lexicons: ${stats.totalLexicons}`);
    console.log(`  📊 ILI coverage: ${qualityMetrics.iliCoveragePercentage.toFixed(2)}%`);

    console.log(`
🔍 Example 2: Lexicon Overview
==============================`);

    console.log(`📖 Available lexicons: ${allLexicons.length}`);
    allLexicons.slice(0, 5).forEach(lexicon => {
      console.log(`  • ${lexicon.id}: ${lexicon.label} (${lexicon.language})`);
    });

    console.log(`
🔍 Example 3: Sample Synset Analysis
===================================`);

    const bankSynsets = await wordnet.synsets('bank');
    console.log(`📚 Sample: "bank" has ${bankSynsets.length} synsets`);
    
    if (bankSynsets.length > 0) {
      const firstSynset = bankSynsets[0];
      displaySynset(firstSynset, 1);
    }

    console.log(`
🔍 Example 4: ILI Database Overview
==================================`);

    console.log(`🌍 ILI entries: ${allILIs.length}`);
    const entriesWithDefs = allILIs.filter(entry => entry.definition);
    console.log(`📝 Entries with definitions: ${entriesWithDefs.length} (${((entriesWithDefs.length / allILIs.length) * 100).toFixed(2)}%)`);

    console.log(`
🎉 Database Statistics Demo Completed!

💡 Key Insights:
   • Database contains extensive lexical data across multiple languages
   • ILI provides comprehensive cross-language concept mapping
   • Data quality metrics help assess resource suitability
   • Detailed synset content enables comprehensive analysis

🚀 Practical Applications:
   • Data quality assessment for research projects
   • System design and capacity planning
   • Resource selection for specific applications
   • Academic research and analysis
   • Lexical database development

📊 Final Statistics:
   • Total words: ${stats.totalWords}
   • Total synsets: ${stats.totalSynsets}
   • Total ILI entries: ${stats.totalILIs}
   • Total lexicons: ${stats.totalLexicons}
   • ILI coverage: ${qualityMetrics.iliCoveragePercentage.toFixed(2)}%
`);

    await safeClose(wordnet);
  } catch (error) {
    console.error('❌ Database statistics demo failed:', error.message);
    await safeClose(wordnet);
    throw error;
  }
}

// Run the database statistics demo
runDemo(demonstrateDatabaseStatistics, 'Database Statistics Demo').catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
}); 

import { Wordnet, config } from 'wn-ts-node';

async function frenchCrosswordDemo() {
  const dataDirectory = 'C:\\\\Users\\\\Francis\\\\.wn_crossword_demo_demo';
  
  console.log('🇫🇷 French Crossword Demo');
  console.log('========================');
  
  try {
    config.dataDirectory = dataDirectory;
    const wn = new Wordnet();
    
    // Step 1: Requirement Verification - Check what's available in the lexicons
    console.log('\\n🔍 Requirement Verification:');
    console.log('==============================');
    
    const requirements = {
      frenchData: false,
      englishData: false,
      crossLingualConnections: false,
      availableLanguages: [],
      totalWords: 0,
      totalSynsets: 0
    };
    
    // Check available languages
    try {
      const languages = await wn.languages();
      requirements.availableLanguages = languages;
      console.log('📋 Available languages:', languages.join(', '));
    } catch (error) {
      console.log('❌ Could not retrieve language list:', error.message);
    }
    
    // Check French data availability
    try {
      const frenchWords = await wn.words({ language: 'fr', limit: 1 });
      requirements.frenchData = frenchWords.length > 0;
      console.log('🇫🇷 French data:', requirements.frenchData ? '✅ Available' : '❌ Not available');
    } catch (error) {
      console.log('🇫🇷 French data: ❌ Error -', error.message);
    }
    
    // Check English data availability
    try {
      const englishWords = await wn.words({ language: 'en', limit: 1 });
      requirements.englishData = englishWords.length > 0;
      console.log('🇺🇸 English data:', requirements.englishData ? '✅ Available' : '❌ Not available');
    } catch (error) {
      console.log('🇺🇸 English data: ❌ Error -', error.message);
    }
    
    // Check cross-lingual connections (if both languages available)
    if (requirements.frenchData && requirements.englishData) {
      try {
        // Test if we can find cross-lingual synset connections
        const frenchSynsets = await wn.synsets({ language: 'fr', limit: 1 });
        if (frenchSynsets.length > 0) {
          // Try to find related English synsets
          const relatedSynsets = await wn.synsets({ 
            synset: frenchSynsets[0].synset, 
            language: 'en' 
          });
          requirements.crossLingualConnections = relatedSynsets.length > 0;
        }
        console.log('🔗 Cross-lingual connections:', requirements.crossLingualConnections ? '✅ Available' : '❌ Not available');
      } catch (error) {
        console.log('🔗 Cross-lingual connections: ❌ Error -', error.message);
      }
    } else {
      console.log('🔗 Cross-lingual connections: ❌ Requires both French and English data');
    }
    
    // Get basic statistics
    try {
      const wordCount = await wn.words({ limit: 1000000 }); // Large limit to get count
      requirements.totalWords = wordCount.length;
      console.log('📊 Total words available:', requirements.totalWords);
    } catch (error) {
      console.log('📊 Word count: ❌ Error -', error.message);
    }
    
    try {
      const synsetCount = await wn.synsets({ limit: 1000000 }); // Large limit to get count
      requirements.totalSynsets = synsetCount.length;
      console.log('📚 Total synsets available:', requirements.totalSynsets);
    } catch (error) {
      console.log('📚 Synset count: ❌ Error -', error.message);
    }
    
    // Step 2: Load data based on verified requirements
    console.log('\\n📦 Data Loading Strategy:');
    console.log('==========================');
    
    if (!requirements.frenchData) {
      console.log('❌ Cannot proceed: French data is required but not available');
      return;
    }
    
    console.log('✅ Proceeding with French crossword demo');
    if (requirements.englishData) {
      console.log('✅ English data available - cross-lingual features enabled');
    } else {
      console.log('⚠️  English data not available - limited to French-only features');
    }
    
    // Known French words that work well for crosswords
    const frenchWords = [
      'ordinateur', 'maison', 'chien', 'chat', 'livre', 'eau', 'soleil', 'lune',
      'voiture', 'arbre', 'fleur', 'oiseau', 'poisson', 'pain', 'fromage', 'vin',
      'café', 'thé', 'sucre', 'sel', 'poivre', 'huile', 'beurre', 'lait',
      'œuf', 'viande', 'poulet', 'bœuf', 'porc', 'agneau', 'saumon', 'thon',
      'pomme', 'banane', 'orange', 'fraise', 'cerise', 'raisin', 'pêche', 'poire',
      'tomate', 'carotte', 'pomme de terre', 'oignon', 'ail', 'persil', 'basilic', 'thym',
      'table', 'chaise', 'lit', 'armoire', 'bureau', 'lampe', 'télévision', 'radio',
      'téléphone', 'ordinateur', 'internet', 'courrier', 'lettre', 'carte', 'photo', 'cadeau',
      'famille', 'père', 'mère', 'fils', 'fille', 'frère', 'sœur', 'grand-père', 'grand-mère',
      'ami', 'amie', 'voisin', 'voisine', 'professeur', 'élève', 'étudiant', 'étudiante',
      'travail', 'bureau', 'usine', 'magasin', 'restaurant', 'hôtel', 'banque', 'poste',
      'école', 'université', 'hôpital', 'pharmacie', 'police', 'pompiers', 'ambulance', 'taxi',
      'avion', 'train', 'bus', 'métro', 'vélo', 'moto', 'bateau', 'hélicoptère',
      'vacances', 'voyage', 'tourisme', 'plage', 'montagne', 'campagne', 'ville', 'village',
      'pays', 'région', 'département', 'province', 'capitale', 'frontière', 'mer', 'océan',
      'rivière', 'lac', 'étang', 'forêt', 'jardin', 'parc', 'stade', 'théâtre',
      'cinéma', 'musée', 'bibliothèque', 'église', 'cathédrale', 'château', 'palais', 'monument'
    ];
    
    console.log('\\n🎯 Testing French words for crossword potential:');
    console.log('================================================');
    
    const workingWords = [];
    const maxWordsToShow = requirements.englishData ? 15 : 10; // Show more if we have English data
    
    for (const word of frenchWords) {
      try {
        const words = await wn.words({ form: word, language: 'fr' });
        if (words.length > 0) {
          const wordData = words[0];
          console.log('✅ ' + word + ' (' + wordData.pos + ') - ' + wordData.lemma);
          
          // Get synsets for this word
          const synsets = await wn.synsets({ form: word, language: 'fr' });
          console.log('   📚 Synsets: ' + synsets.length);
          
          // Get senses for this word
          const senses = await wn.senses({ form: word, language: 'fr' });
          console.log('   🔍 Senses: ' + senses.length);
          
          // If English data is available, try to find cross-lingual connections
          let crossLingualInfo = '';
          if (requirements.englishData && requirements.crossLingualConnections) {
            try {
              const englishSynsets = await wn.synsets({ 
                synset: synsets[0]?.synset, 
                language: 'en' 
              });
              if (englishSynsets.length > 0) {
                crossLingualInfo = ' | 🌍 Cross-lingual: ' + englishSynsets.length + ' EN synsets';
              }
            } catch (error) {
              // Cross-lingual lookup failed, continue without it
            }
          }
          console.log('   ' + crossLingualInfo);
          
          workingWords.push({
            word: word,
            lemma: wordData.lemma,
            pos: wordData.pos,
            synsets: synsets.length,
            senses: senses.length,
            hasCrossLingual: crossLingualInfo.includes('Cross-lingual')
          });
          
          // Show more words if we have English data
          if (workingWords.length >= maxWordsToShow) {
            console.log('\\n... (showing first ' + maxWordsToShow + ' words)');
            break;
          }
        } else {
          console.log('❌ ' + word + ': Not found');
        }
      } catch (error) {
        console.log('❌ ' + word + ': Error - ' + error.message);
      }
    }
    
    console.log('\\n📊 Summary:');
    console.log('============');
    console.log('Total words tested: ' + frenchWords.length);
    console.log('Working words found: ' + workingWords.length);
    console.log('Available languages: ' + requirements.availableLanguages.join(', '));
    console.log('Total lexicon words: ' + requirements.totalWords);
    console.log('Total lexicon synsets: ' + requirements.totalSynsets);
    
    if (workingWords.length > 0) {
      console.log('\\n🎲 Sample crossword words:');
      workingWords.slice(0, 5).forEach((w, i) => {
        const crossLingualNote = w.hasCrossLingual ? ' 🌍' : '';
        console.log((i + 1) + '. ' + w.word + ' (' + w.pos + ') - ' + w.synsets + ' synsets, ' + w.senses + ' senses' + crossLingualNote);
      });
      
      console.log('\\n💡 Crossword Demo Features (Based on Available Data):');
      console.log('- ✅ French words can be queried');
      console.log('- ✅ Multiple synsets per word (semantic clusters)');
      console.log('- ✅ Rich sense data for hints');
      console.log('- ❌ No French definitions (expected for WOLF)');
      
      if (requirements.englishData && requirements.crossLingualConnections) {
        console.log('- ✅ Cross-lingual connections available');
        console.log('- ✅ English definitions accessible via synset mapping');
      } else if (requirements.englishData) {
        console.log('- ⚠️  English data available but cross-lingual connections not working');
      } else {
        console.log('- ❌ No English data available');
      }
      
      console.log('\\n🚀 Next Steps (Based on Current Capabilities):');
      if (requirements.englishData && requirements.crossLingualConnections) {
        console.log('1. ✅ Create hint generation using synset relationships');
        console.log('2. ✅ Implement crossword puzzle generation with French words');
        console.log('3. ✅ Add English definitions for French words via synset mapping');
        console.log('4. ✅ Build bilingual crossword puzzles');
      } else if (requirements.englishData) {
        console.log('1. 🔧 Fix cross-lingual connection issues');
        console.log('2. Create hint generation using synset relationships');
        console.log('3. Implement crossword puzzle generation with French words');
        console.log('4. Add English definitions for French words via synset mapping');
      } else {
        console.log('1. 📥 Load English WordNet data for cross-lingual connections');
        console.log('2. Create hint generation using synset relationships');
        console.log('3. Implement crossword puzzle generation with French words');
        console.log('4. Add English definitions for French words via synset mapping');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in French crossword demo:', error);
  }
}

frenchCrosswordDemo();

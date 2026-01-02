#!/usr/bin/env node

/**
 * Mock Dictionary Generator for Testing
 *
 * This creates sample dictionary files to demonstrate the language-pair functionality
 * without requiring network access to download WordNet lexicons.
 */

import { writeFileSync } from 'fs';

console.log('\n🧪 Creating Mock Dictionaries for Testing\n');
console.log('='.repeat(60));

// Mock dictionary data structure matching the real format
const createMockDict = (lang1, lang2, entries) => {
  const dictData = {
    v: 1,
    m: {
      v: 1,
      t: Date.now(),
      c: entries.length,
      w: 0,
      langs: [lang1, lang2]
    },
    w: {},  // word index: "word:lang" -> [ili_refs]
    s: {}   // synsets: ili -> [pos, definition, translations]
  };

  entries.forEach(({ ili, pos, def, words }) => {
    // Store synset
    dictData.s[ili] = [pos, def, words];

    // Build word index
    Object.entries(words).forEach(([lang, wordList]) => {
      wordList.forEach(word => {
        const key = `${word.toLowerCase()}:${lang}`;
        if (!dictData.w[key]) {
          dictData.w[key] = [];
        }
        dictData.w[key].push(ili);
        dictData.m.w++;
      });
    });
  });

  return dictData;
};

// Create EN-TH dictionary
const enThEntries = [
  {
    ili: 'i00001740',
    pos: 'n',
    def: 'a human being',
    words: { en: ['person', 'individual', 'someone'], th: ['คน', 'บุคคล'] }
  },
  {
    ili: 'i00046516',
    pos: 'n',
    def: 'a machine for performing calculations automatically',
    words: { en: ['computer', 'computing machine'], th: ['คอมพิวเตอร์', 'เครื่องคอมพิวเตอร์'] }
  },
  {
    ili: 'i00014887',
    pos: 'n',
    def: 'binary compound that occurs at room temperature as a clear colorless odorless tasteless liquid',
    words: { en: ['water', 'H2O'], th: ['น้ำ'] }
  },
  {
    ili: 'i00037256',
    pos: 'n',
    def: 'a period of time considered as a resource',
    words: { en: ['time'], th: ['เวลา', 'ช่วงเวลา'] }
  },
  {
    ili: 'i01709985',
    pos: 'v',
    def: 'engage in',
    words: { en: ['make', 'create'], th: ['ทำ', 'สร้าง'] }
  }
];

const enThDict = createMockDict('en', 'th', enThEntries);

// Create EN-FR dictionary
const enFrEntries = [
  {
    ili: 'i00001740',
    pos: 'n',
    def: 'a human being',
    words: { en: ['person', 'individual'], fr: ['personne', 'individu'] }
  },
  {
    ili: 'i00046516',
    pos: 'n',
    def: 'a machine for performing calculations automatically',
    words: { en: ['computer'], fr: ['ordinateur', 'calculateur'] }
  },
  {
    ili: 'i00014887',
    pos: 'n',
    def: 'binary compound that occurs at room temperature',
    words: { en: ['water'], fr: ['eau'] }
  },
  {
    ili: 'i00037256',
    pos: 'n',
    def: 'a period of time considered as a resource',
    words: { en: ['time'], fr: ['temps', 'heure'] }
  }
];

const enFrDict = createMockDict('en', 'fr', enFrEntries);

// Create TH-FR dictionary
const thFrEntries = [
  {
    ili: 'i00001740',
    pos: 'n',
    def: 'a human being',
    words: { th: ['คน'], fr: ['personne'] }
  },
  {
    ili: 'i00046516',
    pos: 'n',
    def: 'a machine for performing calculations automatically',
    words: { th: ['คอมพิวเตอร์'], fr: ['ordinateur'] }
  },
  {
    ili: 'i00014887',
    pos: 'n',
    def: 'binary compound that occurs at room temperature',
    words: { th: ['น้ำ'], fr: ['eau'] }
  }
];

const thFrDict = createMockDict('th', 'fr', thFrEntries);

// Helper to create ES module
const createESModule = (data, moduleName, langs) => {
  return `/**
 * Mock Serverless Dictionary Module: ${langs[0]}-${langs[1]}
 * Generated: ${new Date().toISOString()}
 * Languages: ${langs.join(', ')}
 * Synsets: ${data.m.c}
 * Words: ${data.m.w}
 */

const data = ${JSON.stringify(data, null, 0)};

export function lookup(word, lang = '${langs[0]}') {
  const key = \`\${word.toLowerCase()}:\${lang}\`;
  const ilis = data.w[key];
  if (!ilis) return [];

  return ilis.map(ili => {
    const [pos, def, words] = data.s[ili];
    return { ili, pos, definition: def, translations: words };
  });
}

export function translate(word, fromLang, toLang) {
  const synsets = lookup(word, fromLang);
  const translations = new Set();

  synsets.forEach(synset => {
    const targetWords = synset.translations[toLang] || [];
    targetWords.forEach(w => translations.add(w));
  });

  return Array.from(translations);
}

export function define(word, lang = '${langs[0]}') {
  return lookup(word, lang).map(s => s.definition);
}

export const meta = data.m;
export const languages = ${JSON.stringify(langs)};
export default { lookup, translate, define, meta, languages };
`;
};

// Write dictionaries
console.log('\n📝 Writing mock dictionaries...\n');

writeFileSync('dict-en-th.js', createESModule(enThDict, 'dict-en-th', ['en', 'th']));
console.log('✅ Created dict-en-th.js');
console.log(`   - ${enThDict.m.c} synsets`);
console.log(`   - ${enThDict.m.w} words`);

writeFileSync('dict-en-fr.js', createESModule(enFrDict, 'dict-en-fr', ['en', 'fr']));
console.log('✅ Created dict-en-fr.js');
console.log(`   - ${enFrDict.m.c} synsets`);
console.log(`   - ${enFrDict.m.w} words`);

writeFileSync('dict-th-fr.js', createESModule(thFrDict, 'dict-th-fr', ['th', 'fr']));
console.log('✅ Created dict-th-fr.js');
console.log(`   - ${thFrDict.m.c} synsets`);
console.log(`   - ${thFrDict.m.w} words`);

// Also create a small general dictionary
const generalDict = createMockDict('en', 'en', [
  {
    ili: 'i00001740',
    pos: 'n',
    def: 'a human being',
    words: { en: ['person', 'individual', 'someone', 'somebody', 'mortal', 'soul'] }
  },
  {
    ili: 'i00046516',
    pos: 'n',
    def: 'a machine for performing calculations automatically',
    words: { en: ['computer', 'computing machine', 'data processor', 'electronic computer'] }
  }
]);

writeFileSync('serverless-dict.json', JSON.stringify(generalDict, null, 2));
console.log('✅ Created serverless-dict.json');
console.log(`   - ${generalDict.m.c} synsets`);
console.log(`   - ${generalDict.m.w} words`);

console.log('\n' + '='.repeat(60));
console.log('\n✨ Mock dictionaries created successfully!');
console.log('\n📋 Test these words:');
console.log('   • person, computer, water, time (EN)');
console.log('   • คน, คอมพิวเตอร์, น้ำ, เวลา (TH)');
console.log('   • personne, ordinateur, eau, temps (FR)');
console.log('\n🧪 Run: node test-dict.js\n');

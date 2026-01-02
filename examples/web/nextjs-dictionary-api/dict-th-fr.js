/**
 * Mock Serverless Dictionary Module: th-fr
 * Generated: 2026-01-02T06:20:39.495Z
 * Languages: th, fr
 * Synsets: 3
 * Words: 6
 */

const data = {"v":1,"m":{"v":1,"t":1767334839493,"c":3,"w":6,"langs":["th","fr"]},"w":{"คน:th":["i00001740"],"personne:fr":["i00001740"],"คอมพิวเตอร์:th":["i00046516"],"ordinateur:fr":["i00046516"],"น้ำ:th":["i00014887"],"eau:fr":["i00014887"]},"s":{"i00001740":["n","a human being",{"th":["คน"],"fr":["personne"]}],"i00046516":["n","a machine for performing calculations automatically",{"th":["คอมพิวเตอร์"],"fr":["ordinateur"]}],"i00014887":["n","binary compound that occurs at room temperature",{"th":["น้ำ"],"fr":["eau"]}]}};

export function lookup(word, lang = 'th') {
  const key = `${word.toLowerCase()}:${lang}`;
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

export function define(word, lang = 'th') {
  return lookup(word, lang).map(s => s.definition);
}

export const meta = data.m;
export const languages = ["th","fr"];
export default { lookup, translate, define, meta, languages };

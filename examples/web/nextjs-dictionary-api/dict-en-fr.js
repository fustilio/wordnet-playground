/**
 * Mock Serverless Dictionary Module: en-fr
 * Generated: 2026-01-02T06:20:39.494Z
 * Languages: en, fr
 * Synsets: 4
 * Words: 12
 */

const data = {"v":1,"m":{"v":1,"t":1767334839493,"c":4,"w":12,"langs":["en","fr"]},"w":{"person:en":["i00001740"],"individual:en":["i00001740"],"personne:fr":["i00001740"],"individu:fr":["i00001740"],"computer:en":["i00046516"],"ordinateur:fr":["i00046516"],"calculateur:fr":["i00046516"],"water:en":["i00014887"],"eau:fr":["i00014887"],"time:en":["i00037256"],"temps:fr":["i00037256"],"heure:fr":["i00037256"]},"s":{"i00001740":["n","a human being",{"en":["person","individual"],"fr":["personne","individu"]}],"i00046516":["n","a machine for performing calculations automatically",{"en":["computer"],"fr":["ordinateur","calculateur"]}],"i00014887":["n","binary compound that occurs at room temperature",{"en":["water"],"fr":["eau"]}],"i00037256":["n","a period of time considered as a resource",{"en":["time"],"fr":["temps","heure"]}]}};

export function lookup(word, lang = 'en') {
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

export function define(word, lang = 'en') {
  return lookup(word, lang).map(s => s.definition);
}

export const meta = data.m;
export const languages = ["en","fr"];
export default { lookup, translate, define, meta, languages };

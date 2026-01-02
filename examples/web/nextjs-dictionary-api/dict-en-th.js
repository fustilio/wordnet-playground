/**
 * Mock Serverless Dictionary Module: en-th
 * Generated: 2026-01-02T06:20:39.493Z
 * Languages: en, th
 * Synsets: 5
 * Words: 19
 */

const data = {"v":1,"m":{"v":1,"t":1767334839493,"c":5,"w":19,"langs":["en","th"]},"w":{"person:en":["i00001740"],"individual:en":["i00001740"],"someone:en":["i00001740"],"คน:th":["i00001740"],"บุคคล:th":["i00001740"],"computer:en":["i00046516"],"computing machine:en":["i00046516"],"คอมพิวเตอร์:th":["i00046516"],"เครื่องคอมพิวเตอร์:th":["i00046516"],"water:en":["i00014887"],"h2o:en":["i00014887"],"น้ำ:th":["i00014887"],"time:en":["i00037256"],"เวลา:th":["i00037256"],"ช่วงเวลา:th":["i00037256"],"make:en":["i01709985"],"create:en":["i01709985"],"ทำ:th":["i01709985"],"สร้าง:th":["i01709985"]},"s":{"i00001740":["n","a human being",{"en":["person","individual","someone"],"th":["คน","บุคคล"]}],"i00046516":["n","a machine for performing calculations automatically",{"en":["computer","computing machine"],"th":["คอมพิวเตอร์","เครื่องคอมพิวเตอร์"]}],"i00014887":["n","binary compound that occurs at room temperature as a clear colorless odorless tasteless liquid",{"en":["water","H2O"],"th":["น้ำ"]}],"i00037256":["n","a period of time considered as a resource",{"en":["time"],"th":["เวลา","ช่วงเวลา"]}],"i01709985":["v","engage in",{"en":["make","create"],"th":["ทำ","สร้าง"]}]}};

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
export const languages = ["en","th"];
export default { lookup, translate, define, meta, languages };

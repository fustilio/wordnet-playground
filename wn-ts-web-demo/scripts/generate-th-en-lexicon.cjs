#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const thaiWords = [
  'น้ำ', 'ไฟ', 'ดิน', 'ลม', 'รัก', 'กิน', 'เดิน', 'บ้าน', 'หนังสือ', 'ภาษา',
  'แมว', 'สุนัข', 'ต้นไม้', 'ทะเล', 'ภูเขา', 'รถยนต์', 'อาหาร', 'เพลง', 'ภาพ', 'เวลา'
]
const englishWords = [
  'water', 'fire', 'earth', 'wind', 'love', 'eat', 'walk', 'house', 'book', 'language',
  'cat', 'dog', 'tree', 'sea', 'mountain', 'car', 'food', 'song', 'picture', 'time'
]

function buildLMFXML(entries) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<LexicalResource>`
  const footer = `</LexicalResource>`

  const thLexiconHeader = `\n  <Lexicon id="th-en-lexicon-th" label="Thai Lexicon" language="th" version="1.0" license="https://creativecommons.org/licenses/by/4.0/">`
  const enLexiconHeader = `\n  <Lexicon id="th-en-lexicon-en" label="English Lexicon" language="en" version="1.0" license="https://creativecommons.org/licenses/by/4.0/">`
  const lexiconClose = `\n  </Lexicon>`

  let thEntries = []
  let enEntries = []
  let thSynsets = []
  let enSynsets = []

  for (let i = 0; i < entries; i++) {
    const th = thaiWords[i % thaiWords.length]
    const en = englishWords[i % englishWords.length]
    const pos = ['n','v','a','r'][i % 4]

    const thWordId = `th-${i.toString().padStart(6,'0')}-${pos}`
    const enWordId = `en-${i.toString().padStart(6,'0')}-${pos}`
    const thSynsetId = `th-syn-${i.toString().padStart(6,'0')}-${pos}`
    const enSynsetId = `en-syn-${i.toString().padStart(6,'0')}-${pos}`
    const ili = ''

    thEntries.push(`
    <LexicalEntry id="${thWordId}">
      <Lemma partOfSpeech="${pos}" writtenForm="${th}" />
      <Sense id="${thWordId}-01" synset="${thSynsetId}" />
    </LexicalEntry>`)

    enEntries.push(`
    <LexicalEntry id="${enWordId}">
      <Lemma partOfSpeech="${pos}" writtenForm="${en}" />
      <Sense id="${enWordId}-01" synset="${enSynsetId}" />
    </LexicalEntry>`)

    thSynsets.push(`
    <Synset id="${thSynsetId}" partOfSpeech="${pos}" ili="${ili}">
      <Definition language="th">คำนิยามของ \"${th}\" (${pos})</Definition>
      <Definition language="en">Definition for Thai word \"${th}\" aligned with \"${en}\"</Definition>
    </Synset>`)

    enSynsets.push(`
    <Synset id="${enSynsetId}" partOfSpeech="${pos}" ili="${ili}">
      <Definition language="en">Definition for \"${en}\" (${pos})</Definition>
      <Definition language="th">คำนิยามภาษาไทยสอดคล้องกับ \"${en}\"</Definition>
    </Synset>`)
  }

  const thLexicon = `${thLexiconHeader}
${thEntries.join('\n')}
${thSynsets.join('\n')}
${lexiconClose}`
  const enLexicon = `${enLexiconHeader}
${enEntries.join('\n')}
${enSynsets.join('\n')}
${lexiconClose}`

  return `${header}
${thLexicon}
${enLexicon}
${footer}\n`
}

function main() {
  const outDir = path.join(process.cwd(), 'public', 'lexicons')
  fs.mkdirSync(outDir, { recursive: true })

  const numEntries = parseInt(process.env.TH_EN_ENTRIES || '2000', 10)
  console.log(`Generating Thai–English sample lexicon with ${numEntries} entries...`)
  const xml = buildLMFXML(numEntries)

  const outXml = path.join(outDir, 'th-en-sample.xml')
  const outGz = path.join(outDir, 'th-en-sample.xml.gz')
  fs.writeFileSync(outXml, xml, 'utf8')
  fs.writeFileSync(outGz, zlib.gzipSync(Buffer.from(xml, 'utf8')))
  console.log(`Wrote ${outXml} and ${outGz}`)
}

main()
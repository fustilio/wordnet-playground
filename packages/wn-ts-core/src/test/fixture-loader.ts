import { readFile } from 'fs/promises';
import { join } from 'path';
import type { 
  NewLexicon, 
  NewWord, 
  NewSynset, 
  NewSense, 
  NewForm, 
  NewDefinition, 
  NewExample, 
  NewRelation, 
  NewILI
} from '../types/database.js';
import type { PartOfSpeech } from '../core/types.js';

export interface TestFixture {
  lexicons: NewLexicon[];
  words: NewWord[];
  synsets: NewSynset[];
  senses: NewSense[];
  forms: NewForm[];
  definitions: NewDefinition[];
  examples: NewExample[];
  relations: NewRelation[];
  ilis: NewILI[];
}

/**
 * Load a test fixture from the test-data directory
 */
export async function loadTestFixture(fixtureName: string): Promise<TestFixture> {
  const fixturePath = join(process.cwd(), 'test-data', 'xsd-samples', fixtureName, 'sample.xml');
  
  try {
    const xmlContent = await readFile(fixturePath, 'utf-8');
    return parseXMLToFixture(xmlContent, fixtureName);
  } catch (error) {
    console.warn(`Failed to load fixture ${fixtureName}, using fallback data:`, error);
    return createFallbackFixture(fixtureName);
  }
}

/**
 * Parse XML content to create a test fixture
 * This is a simplified parser for the sample XMLs
 */
function parseXMLToFixture(xmlContent: string, fixtureName: string): TestFixture {
  // Extract lexicon information from XML
  const lexiconMatch = xmlContent.match(/<Lexicon[^>]*id="([^"]*)"[^>]*label="([^"]*)"[^>]*language="([^"]*)"[^>]*email="([^"]*)"[^>]*license="([^"]*)"[^>]*version="([^"]*)"[^>]*>/);
  
  const lexicon: NewLexicon = {
    id: lexiconMatch?.[1] || `${fixtureName}-lexicon`,
    label: lexiconMatch?.[2] || `${fixtureName} Lexicon`,
    language: lexiconMatch?.[3] || 'en',
    email: lexiconMatch?.[4] || 'test@example.com',
    license: lexiconMatch?.[5] || 'MIT',
    version: lexiconMatch?.[6] || '1.0',
    url: null,
    citation: null,
    logo: null,
    metadata: null
  };

  // Extract synsets from XML
  const synsetMatches = xmlContent.matchAll(/<Synset[^>]*id="([^"]*)"[^>]*ili="([^"]*)"[^>]*partOfSpeech="([^"]*)"[^>]*>/g);
  const synsets: NewSynset[] = Array.from(synsetMatches).map((match, index) => ({
    id: match[1] || `synset-${index}`,
    ili: match[2] || null,
    pos: (match[3] || 'n') as PartOfSpeech,
    language: 'en',
    lexicon: lexicon.id
  }));

  // Extract lexical entries from XML
  const lexicalEntryMatches = xmlContent.matchAll(/<LexicalEntry[^>]*id="([^"]*)"[^>]*>/g);
  const words: NewWord[] = [];
  const senses: NewSense[] = [];
  const forms: NewForm[] = [];

  for (const match of Array.from(lexicalEntryMatches)) {
    const wordId = match[1] || `word-${words.length}`;
    
    // Extract lemma information - look for Lemma tag within this LexicalEntry
    const lexicalEntryContent = xmlContent.match(new RegExp(`<LexicalEntry[^>]*id="${wordId}"[^>]*>([\\s\\S]*?)</LexicalEntry>`));
    if (lexicalEntryContent && lexicalEntryContent[1]) {
      const entryContent = lexicalEntryContent[1];
      const lemmaMatch = entryContent.match(/<Lemma[^>]*writtenForm="([^"]*)"[^>]*partOfSpeech="([^"]*)"[^>]*>/);
      
      if (lemmaMatch) {
        const word: NewWord = {
          id: wordId,
          lemma: lemmaMatch[1] || `lemma-${words.length}`,
          pos: (lemmaMatch[2] || 'n') as PartOfSpeech,
          language: 'en',
          lexicon: lexicon.id
        };
        words.push(word);

        // Extract forms from this entry
        const formMatches = entryContent.matchAll(/<Form[^>]*writtenForm="([^"]*)"[^>]*>/g);
        for (const formMatch of formMatches) {
          forms.push({
            id: `${wordId}-form-${forms.length + 1}`,
            word_id: wordId,
            written_form: formMatch[1] || '',
            script: null,
            tag: null
          });
        }

        // Extract senses from this entry
        const senseMatches = entryContent.matchAll(/<Sense[^>]*id="([^"]*)"[^>]*synset="([^"]*)"[^>]*>/g);
        for (const senseMatch of senseMatches) {
          senses.push({
            id: senseMatch[1] || `sense-${senses.length}`,
            word_id: wordId,
            synset_id: senseMatch[2] || `synset-${senses.length}`,
            source: 'test',
            sensekey: null,
            adjposition: null,
            subcategory: null,
            domain: null,
            register: null
          });
        }
      }
    }
  }

  // Extract definitions from XML
  const definitionMatches = xmlContent.matchAll(/<Definition[^>]*>([^<]*)<\/Definition>/g);
  const definitions: NewDefinition[] = Array.from(definitionMatches).map((match, index) => ({
    id: `def-${index + 1}`,
    synset_id: synsets[index % synsets.length]?.id || `synset-${index + 1}`,
    language: 'en',
    text: (match[1] || `definition-${index + 1}`).trim(),
    source: 'test'
  }));

  // Extract examples from XML
  const exampleMatches = xmlContent.matchAll(/<Example[^>]*>([^<]*)<\/Example>/g);
  const examples: NewExample[] = Array.from(exampleMatches).map((match, index) => ({
    id: `ex-${index + 1}`,
    synset_id: synsets[index % synsets.length]?.id || `synset-${index + 1}`,
    sense_id: null,
    language: 'en',
    text: (match[1] || `example-${index + 1}`).trim(),
    source: 'test'
  }));

  // Create ILIs from synsets
  const ilis: NewILI[] = synsets.map(synset => ({
    id: synset.ili || `i${Math.random().toString(36).substr(2, 9)}`,
    definition: definitions.find(d => d.synset_id === synset.id)?.text || 'Sample definition',
    status: 'standard' as const,
    superseded_by: null,
    note: null,
    meta: null
  }));

  // Create some basic relations
  const relations: NewRelation[] = [];
  for (let i = 0; i < Math.min(synsets.length - 1, 3); i++) {
    if (synsets[i] && synsets[i + 1]) {
      relations.push({
        id: `rel-${i + 1}`,
        source_id: synsets[i]!.id,
        target_id: synsets[i + 1]!.id,
        type: 'related_to',
        source: 'test'
      });
    }
  }

  // If no forms were found, create some sample forms for testing
  if (forms.length === 0 && words.length > 0) {
    for (const word of words) {
      // Create some sample forms based on the word's part of speech
      const baseForm = word.lemma;
      const sampleForms: string[] = [];
      
      if (word.pos === 'n') {
        // Noun forms
        sampleForms.push(`${baseForm}s`, `${baseForm}'s`);
      } else if (word.pos === 'v') {
        // Verb forms
        sampleForms.push(`${baseForm}s`, `${baseForm}ing`, `${baseForm}ed`);
      } else if (word.pos === 'a') {
        // Adjective forms
        sampleForms.push(`${baseForm}er`, `${baseForm}est`);
      } else {
        // Default forms
        sampleForms.push(`${baseForm}s`);
      }
      
      for (let i = 0; i < sampleForms.length; i++) {
        forms.push({
          id: `${word.id}-form-${i + 1}`,
          word_id: word.id,
          written_form: sampleForms[i] || `form-${i + 1}`,
          script: null,
          tag: null
        });
      }
    }
  }

  return {
    lexicons: [lexicon],
    words,
    synsets,
    senses,
    forms,
    definitions,
    examples,
    relations,
    ilis
  };
}

/**
 * Create a fallback fixture when XML parsing fails
 */
function createFallbackFixture(fixtureName: string): TestFixture {
  const lexicon: NewLexicon = {
    id: `${fixtureName}-lexicon`,
    label: `${fixtureName} Lexicon`,
    language: 'en',
    email: 'test@example.com',
    license: 'MIT',
    version: '1.0',
    url: null,
    citation: null,
    logo: null,
    metadata: null
  };

  const words: NewWord[] = [
    {
      id: 'test-word-1',
      lemma: 'computer',
      pos: 'n' as PartOfSpeech,
      language: 'en',
      lexicon: lexicon.id
    },
    {
      id: 'test-word-2',
      lemma: 'run',
      pos: 'v' as PartOfSpeech,
      language: 'en',
      lexicon: lexicon.id
    }
  ];

  const synsets: NewSynset[] = [
    {
      id: 'test-synset-1',
      ili: 'i12345',
      pos: 'n' as PartOfSpeech,
      language: 'en',
      lexicon: lexicon.id
    },
    {
      id: 'test-synset-2',
      ili: 'i12346',
      pos: 'v' as PartOfSpeech,
      language: 'en',
      lexicon: lexicon.id
    }
  ];

  const senses: NewSense[] = [
    {
      id: 'test-sense-1',
      word_id: 'test-word-1',
      synset_id: 'test-synset-1',
      source: 'test',
      sensekey: null,
      adjposition: null,
      subcategory: null,
      domain: null,
      register: null
    },
    {
      id: 'test-sense-2',
      word_id: 'test-word-2',
      synset_id: 'test-synset-2',
      source: 'test',
      sensekey: null,
      adjposition: null,
      subcategory: null,
      domain: null,
      register: null
    }
  ];

  const forms: NewForm[] = [
    {
      id: 'test-form-1',
      word_id: 'test-word-1',
      written_form: 'computers',
      script: null,
      tag: null
    },
    {
      id: 'test-form-2',
      word_id: 'test-word-2',
      written_form: 'running',
      script: null,
      tag: null
    }
  ];

  const definitions: NewDefinition[] = [
    {
      id: 'test-def-1',
      synset_id: 'test-synset-1',
      language: 'en',
      text: 'a machine for performing calculations automatically',
      source: 'test'
    },
    {
      id: 'test-def-2',
      synset_id: 'test-synset-2',
      language: 'en',
      text: 'move fast by using one\'s feet',
      source: 'test'
    }
  ];

  const examples: NewExample[] = [
    {
      id: 'test-ex-1',
      synset_id: 'test-synset-1',
      sense_id: null,
      language: 'en',
      text: 'The computer processed the data quickly',
      source: 'test'
    },
    {
      id: 'test-ex-2',
      synset_id: 'test-synset-2',
      sense_id: null,
      language: 'en',
      text: 'She can run very fast',
      source: 'test'
    }
  ];

  const relations: NewRelation[] = [
    {
      id: 'test-rel-1',
      source_id: 'test-synset-1',
      target_id: 'test-synset-2',
      type: 'related_to',
      source: 'test'
    }
  ];

  const ilis: NewILI[] = [
    {
      id: 'i12345',
      definition: 'a machine for performing calculations automatically',
      status: 'standard' as const,
      superseded_by: null,
      note: null,
      meta: null
    },
    {
      id: 'i12346',
      definition: 'move fast by using one\'s feet',
      status: 'standard' as const,
      superseded_by: null,
      note: null,
      meta: null
    }
  ];

  return {
    lexicons: [lexicon],
    words,
    synsets,
    senses,
    forms,
    definitions,
    examples,
    relations,
    ilis
  };
}

/**
 * Available test fixtures
 */
export const AVAILABLE_FIXTURES = [
  'cili-1.0',
  'oewn-2024',
  'omw-fr-1.4',
  'omw-th-1.4'
] as const;

export type FixtureName = typeof AVAILABLE_FIXTURES[number];

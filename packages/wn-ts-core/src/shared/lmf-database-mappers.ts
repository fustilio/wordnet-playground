/**
 * Shared LMF Database Mappers
 * 
 * This module provides standardized mapping functions for converting LMF data
 * structures to database records. These functions can be used by both
 * wn-ts-web and wn-ts-node implementations to ensure consistency.
 */

import type { 
  LexiconTable,
  WordTable,
  SynsetTable,
  SenseTable,
  FormTable,
  DefinitionTable,
  ExampleTable,
  RelationTable
} from './database-types.js';

/**
 * Map LMF lexicons to database records
 */
export function mapLexiconsToDatabase(lexicons: any[]): LexiconTable[] {
  return lexicons.map(lexicon => ({
    id: lexicon.id,
    label: lexicon.label,
    language: lexicon.language,
    ...(lexicon.email && { email: lexicon.email }),
    ...(lexicon.license && { license: lexicon.license }),
    ...(lexicon.version && { version: lexicon.version }),
    ...(lexicon.url && { url: lexicon.url }),
    ...(lexicon.citation && { citation: lexicon.citation }),
    ...(lexicon.logo && { logo: lexicon.logo }),
    ...(lexicon.metadata && { metadata: JSON.stringify(lexicon.metadata) }),
  }));
}

/**
 * Map LMF words to database records
 */
export function mapWordsToDatabase(words: any[]): WordTable[] {
  return words.map(word => ({
    id: word.id,
    lemma: word.lemma,
    pos: word.pos,
    language: word.language,
    lexicon: word.lexicon,
  }));
}

/**
 * Map LMF synsets to database records
 */
export function mapSynsetsToDatabase(synsets: any[]): SynsetTable[] {
  return synsets.map(synset => ({
    id: synset.id,
    pos: synset.pos,
    language: synset.language,
    lexicon: synset.lexicon,
    ...(synset.ili && { ili: synset.ili }),
  }));
}

/**
 * Map LMF senses to database records
 */
export function mapSensesToDatabase(senses: any[]): SenseTable[] {
  return senses.map(sense => ({
    id: sense.id,
    word_id: sense.wordId,
    synset_id: sense.synsetId,
    ...(sense.source && { source: sense.source }),
    ...(sense.sensekey && { sensekey: sense.sensekey }),
    ...(sense.adjposition && { adjposition: sense.adjposition }),
    ...(sense.subcategory && { subcategory: sense.subcategory }),
    ...(sense.domain && { domain: sense.domain }),
    ...(sense.register && { register: sense.register }),
  }));
}

/**
 * Map LMF forms to database records
 */
export function mapFormsToDatabase(words: any[]): FormTable[] {
  const formRecords: FormTable[] = [];
  for (const word of words) {
    if (word.forms && word.forms.length > 0) {
      for (const form of word.forms) {
        formRecords.push({
          id: form.id,
          word_id: word.id,
          written_form: form.writtenForm,
          ...(form.script && { script: form.script }),
          ...(form.tag && { tag: form.tag }),
        });
      }
    }
  }
  return formRecords;
}

/**
 * Map LMF definitions to database records
 */
export function mapDefinitionsToDatabase(synsets: any[]): DefinitionTable[] {
  const definitionRecords: DefinitionTable[] = [];
  for (const synset of synsets) {
    if (synset.definitions && synset.definitions.length > 0) {
      for (const def of synset.definitions) {
        definitionRecords.push({
          id: def.id,
          synset_id: synset.id,
          language: def.language,
          text: def.text,
          ...(def.source && { source: def.source }),
        });
      }
    }
  }
  return definitionRecords;
}

/**
 * Map LMF examples to database records
 */
export function mapExamplesToDatabase(synsets: any[]): ExampleTable[] {
  const exampleRecords: ExampleTable[] = [];
  for (const synset of synsets) {
    if (synset.examples && synset.examples.length > 0) {
      for (const ex of synset.examples) {
        exampleRecords.push({
          id: ex.id,
          synset_id: synset.id,
          language: ex.language,
          text: ex.text,
          // TODO: Add sense-level examples if needed
          ...(ex.source && { source: ex.source }),
        });
      }
    }
  }
  return exampleRecords;
}

/**
 * Map LMF relations to database records
 */
export function mapRelationsToDatabase(synsets: any[]): RelationTable[] {
  const relationRecords: RelationTable[] = [];
  for (const synset of synsets) {
    if (synset.relations && synset.relations.length > 0) {
      for (const rel of synset.relations) {
        relationRecords.push({
          id: rel.id,
          source_id: synset.id,
          target_id: rel.target,
          type: rel.type,
          ...(rel.source && { source: rel.source }),
        });
      }
    }
  }
  return relationRecords;
}

/**
 * Map LMF ILI records to database format
 */
export function mapILIToDatabase(iliData: any[]): Array<{ id: string; status: string; definition?: string }> {
  return iliData.map((record: any) => {
    const iliRecord: { id: string; status: string; definition?: string } = {
      id: record.id,
      status: record.status,
    };
    if (record.definition) iliRecord.definition = record.definition;
    return iliRecord;
  });
}


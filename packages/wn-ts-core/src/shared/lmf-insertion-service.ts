/**
 * Shared LMF Insertion Service
 * 
 * This service provides standardized database insertion logic for LMF data
 * that can be used by both wn-ts-web and wn-ts-node implementations.
 * 
 * It handles the mapping from LMF document structures to database records
 * and ensures consistent insertion order to respect foreign key constraints.
 */

import type { Kysely } from 'kysely';
import type { 
  LMFDocument,
  LexiconTable,
  WordTable,
  SynsetTable,
  SenseTable,
  FormTable,
  DefinitionTable,
  ExampleTable,
  RelationTable
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface LMFInsertionOptions {
  progress?: (progress: number) => void;
  dryRun?: boolean;
}

export interface LMFInsertionResult {
  success: boolean;
  inserted: {
    lexicons: number;
    words: number;
    synsets: number;
    senses: number;
    forms: number;
    definitions: number;
    examples: number;
    relations: number;
  };
  errors?: string[];
}

/**
 * Shared LMF insertion service that can be used by both web and node implementations
 */
export class LMFInsertionService {
  constructor(private db: Kysely<any>) {}

  /**
   * Insert LMF data into the database in the correct order to respect foreign key constraints
   */
  async insertLMFData(
    lmfDocument: LMFDocument,
    options: LMFInsertionOptions = {}
  ): Promise<LMFInsertionResult> {
    const { progress, dryRun = false } = options;
    const result: LMFInsertionResult = {
      success: false,
      inserted: {
        lexicons: 0,
        words: 0,
        synsets: 0,
        senses: 0,
        forms: 0,
        definitions: 0,
        examples: 0,
        relations: 0,
      },
      errors: []
    };

    try {
      logger.info('Starting LMF data insertion...', {
        lexicons: lmfDocument.lexicons?.length || 0,
        words: lmfDocument.words?.length || 0,
        synsets: lmfDocument.synsets?.length || 0,
        senses: lmfDocument.senses?.length || 0,
      });

      if (dryRun) {
        logger.info('[DRY RUN] This is a dry run. No data will be written.');
        result.success = true;
        return result;
      }

      // Step 1: Insert lexicons first (required for foreign key constraints)
      if (lmfDocument.lexicons && lmfDocument.lexicons.length > 0) {
        const lexiconRecords = this.mapLexiconsToDatabase(lmfDocument.lexicons);
        await this.batchInsert('lexicons', lexiconRecords);
        result.inserted.lexicons = lexiconRecords.length;
        logger.success(`Inserted ${lexiconRecords.length} lexicons`);
        if (progress) progress(0.1);
      }

      // Step 2: Insert words (they reference lexicons)
      if (lmfDocument.words && lmfDocument.words.length > 0) {
        const wordRecords = this.mapWordsToDatabase(lmfDocument.words);
        await this.batchInsert('words', wordRecords);
        result.inserted.words = wordRecords.length;
        logger.success(`Inserted ${wordRecords.length} words`);
        if (progress) progress(0.2);
      }

      // Step 3: Insert synsets (they also reference lexicons)
      if (lmfDocument.synsets && lmfDocument.synsets.length > 0) {
        const synsetRecords = this.mapSynsetsToDatabase(lmfDocument.synsets);
        await this.batchInsert('synsets', synsetRecords);
        result.inserted.synsets = synsetRecords.length;
        logger.success(`Inserted ${synsetRecords.length} synsets`);
        if (progress) progress(0.3);
      }

      // Step 4: Insert senses (they reference words and synsets)
      if (lmfDocument.senses && lmfDocument.senses.length > 0) {
        const senseRecords = this.mapSensesToDatabase(lmfDocument.senses);
        await this.batchInsert('senses', senseRecords);
        result.inserted.senses = senseRecords.length;
        logger.success(`Inserted ${senseRecords.length} senses`);
        if (progress) progress(0.4);
      }

      // Step 5: Insert forms (if any)
      if (lmfDocument.words) {
        const formRecords = this.mapFormsToDatabase(lmfDocument.words);
        if (formRecords.length > 0) {
          await this.batchInsert('forms', formRecords);
          result.inserted.forms = formRecords.length;
          logger.success(`Inserted ${formRecords.length} forms`);
        }
        if (progress) progress(0.5);
      }

      // Step 6: Insert definitions (if any)
      if (lmfDocument.synsets) {
        const definitionRecords = this.mapDefinitionsToDatabase(lmfDocument.synsets);
        if (definitionRecords.length > 0) {
          await this.batchInsert('definitions', definitionRecords);
          result.inserted.definitions = definitionRecords.length;
          logger.success(`Inserted ${definitionRecords.length} definitions`);
        }
        if (progress) progress(0.6);
      }

      // Step 7: Insert examples (if any)
      if (lmfDocument.synsets) {
        const exampleRecords = this.mapExamplesToDatabase(lmfDocument.synsets);
        if (exampleRecords.length > 0) {
          await this.batchInsert('examples', exampleRecords);
          result.inserted.examples = exampleRecords.length;
          logger.success(`Inserted ${exampleRecords.length} examples`);
        }
        if (progress) progress(0.7);
      }

      // Step 8: Insert relations (if any)
      if (lmfDocument.synsets) {
        const relationRecords = this.mapRelationsToDatabase(lmfDocument.synsets);
        if (relationRecords.length > 0) {
          await this.batchInsert('relations', relationRecords);
          result.inserted.relations = relationRecords.length;
          logger.success(`Inserted ${relationRecords.length} relations`);
        }
        if (progress) progress(0.8);
      }

      result.success = true;
      logger.success('LMF data insertion completed successfully!');
      if (progress) progress(1.0);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to insert LMF data:', error);
      result.errors?.push(errorMessage);
      result.success = false;
    }

    return result;
  }

  /**
   * Map LMF lexicons to database records
   */
  private mapLexiconsToDatabase(lexicons: any[]): LexiconTable[] {
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
  private mapWordsToDatabase(words: any[]): WordTable[] {
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
  private mapSynsetsToDatabase(synsets: any[]): SynsetTable[] {
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
  private mapSensesToDatabase(senses: any[]): SenseTable[] {
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
  private mapFormsToDatabase(words: any[]): FormTable[] {
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
  private mapDefinitionsToDatabase(synsets: any[]): DefinitionTable[] {
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
  private mapExamplesToDatabase(synsets: any[]): ExampleTable[] {
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
  private mapRelationsToDatabase(synsets: any[]): RelationTable[] {
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
   * Batch insert records into a table
   */
  private async batchInsert<T extends keyof any>(
    tableName: T,
    records: any[]
  ): Promise<void> {
    if (records.length === 0) return;

    // Use batch insert for performance
    await this.db.insertInto(tableName as any).values(records).execute();
  }
}

/**
 * Factory function to create an LMF insertion service
 */
export function createLMFInsertionService(db: Kysely<any>): LMFInsertionService {
  return new LMFInsertionService(db);
}


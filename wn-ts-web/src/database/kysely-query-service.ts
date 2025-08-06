import { Kysely, sql, type ExpressionBuilder } from 'kysely';
import type { Database } from '../types/database.js';
import type { PartOfSpeech, Lexicon, Word, Synset, Sense, Definition, ILI } from 'wn-ts-core';

export class KyselyQueryService {
  constructor(private db: Kysely<Database>) {}

  // Lexicon queries
  async getLexicons(options: {
    ids?: string[];
    id?: string;
    language?: string;
    version?: string;
  } = {}): Promise<Lexicon[]> {
    let query = this.db.selectFrom('lexicons').selectAll();

    if (options.id && options.id !== '*') {
      query = query.where('id', '=', options.id);
    }
    if (options.ids && options.ids.length > 0) {
      query = query.where('id', 'in', options.ids);
    }
    if (options.language) {
      query = query.where('language', '=', options.language);
    }
    if (options.version) {
      query = query.where('version', '=', options.version);
    }

    const results = await query.execute();
    return results.map(this.transformLexiconRecord.bind(this));
  }

  async getLexiconById(id: string): Promise<Lexicon | undefined> {
    const result = await this.db
      .selectFrom('lexicons')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformLexiconRecord(result) : undefined;
  }

  // Word queries
  async getWords(options: {
    form?: string;
    pos?: PartOfSpeech;
    lexicon?: string;
    language?: string;
    searchAllForms?: boolean;
  } = {}): Promise<Word[]> {
    let query = this.db.selectFrom('words').distinct().selectAll('words');

    if (options.form) {
      if (options.searchAllForms) {
        query = query
          .leftJoin('forms', 'words.id', 'forms.word_id')
          .where((eb) =>
            eb.or([
              eb(sql`lower(words.lemma)`, 'like', `%${options.form?.toLowerCase()}%`),
              eb(sql`lower(forms.written_form)`, 'like', `%${options.form?.toLowerCase()}%`),
            ]),
          );
      } else {
        query = query.where(sql`lower(words.lemma)`, 'like', `%${options.form?.toLowerCase()}%`);
      }
    }

    if (options.pos) {
      query = query.where('words.part_of_speech', '=', options.pos);
    }
    if (options.lexicon && options.lexicon !== '*') {
      query = query.where('words.lexicon', '=', options.lexicon);
    }
    if (options.language) {
      query = query.where('words.language', '=', options.language);
    }

    const results = await query
      .orderBy('words.lemma')
      .orderBy('words.part_of_speech')
      .execute();

    return results.map(this.transformWordRecord.bind(this));
  }

  async getWordById(id: string): Promise<Word | undefined> {
    const result = await this.db
      .selectFrom('words')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformWordRecord(result) : undefined;
  }

  /**
   * Search for words by lemma
   */
  async searchWords(searchTerm: string, options: {
    language?: string;
    lexicon?: string;
    limit?: number;
    offset?: number;
    partOfSpeech?: PartOfSpeech;
    exact?: boolean;
    caseSensitive?: boolean;
  } = {}): Promise<any[]> {
    const { 
      language = 'en', 
      lexicon, 
      limit = 50, 
      offset = 0, 
      partOfSpeech,
      exact = false,
      caseSensitive = false 
    } = options;

    let query = this.db.selectFrom('words').selectAll().where('language', '=', language);

    // Build search condition
    if (exact) {
      if (caseSensitive) {
        query = query.where('lemma', '=', searchTerm);
      } else {
        // Kysely doesn't have a built-in `lower`, so we use `sql` helper.
        query = query.where(sql`lower(lemma)`, '=', searchTerm.toLowerCase());
      }
    } else {
      if (caseSensitive) {
        query = query.where('lemma', 'like', `%${searchTerm}%`);
      } else {
        query = query.where(sql`lower(lemma)`, 'like', `%${searchTerm.toLowerCase()}%`);
      }
    }

    if (lexicon) {
      query = query.where('lexicon', '=', lexicon);
    }

    if (partOfSpeech) {
      query = query.where('part_of_speech', '=', partOfSpeech);
    }

    const results = await query
      .orderBy('lemma')
      .limit(limit)
      .offset(offset)
      .execute();

    return results.map(this.transformWordRecord.bind(this));
  }

  // Synset queries
  async getSynsets(options: {
    form?: string;
    pos?: PartOfSpeech;
    lexicon?: string;
    language?: string;
    searchAllForms?: boolean;
  } = {}): Promise<Synset[]> {
    let query: any = this.db
      .selectFrom('synsets')
      .distinct()
      .selectAll('synsets')
      .innerJoin('senses', 'synsets.id', 'senses.synset_id')
      .innerJoin('words', 'senses.word_id', 'words.id');

    if (options.form) {
      if (options.searchAllForms) {
        query = query
          .leftJoin('forms', 'words.id', 'forms.word_id')
          .where((eb: ExpressionBuilder<Database, 'synsets' | 'senses' | 'words' | 'forms'>) =>
            eb.or([
              eb('words.lemma', 'like', `%${options.form}%`),
              eb('forms.written_form', 'like', `%${options.form}%`),
            ]),
          );
      } else {
        query = query.where('words.lemma', 'like', `%${options.form}%`);
      }
    }

    if (options.pos) {
      query = query.where('synsets.part_of_speech', '=', options.pos);
    }
    if (options.lexicon && options.lexicon !== '*') {
      query = query.where('synsets.lexicon', '=', options.lexicon);
    }
    if (options.language) {
      query = query.where('synsets.language', '=', options.language);
    }

    const results = await query.orderBy('synsets.id').execute();
    return (results || []).map(this.transformSynsetRecord.bind(this));
  }

  async getSynsetById(id: string): Promise<Synset | undefined> {
    const result = await this.db
      .selectFrom('synsets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformSynsetRecord(result) : undefined;
  }

  // Sense queries
  async getSenses(options: {
    wordIdOrForm: string;
    pos?: PartOfSpeech;
    lexicon?: string;
  }): Promise<Sense[]> {
    let query = this.db
      .selectFrom('senses')
      .selectAll('senses')
      .innerJoin('words', 'senses.word_id', 'words.id');

    // Check if wordIdOrForm is a word ID or a form
    if (options.wordIdOrForm.includes('-')) {
      // Assume it's a word ID
      query = query.where('senses.word_id', '=', options.wordIdOrForm);
    } else {
      // Assume it's a form
      query = query.where(sql`lower(words.lemma)`, 'like', `%${options.wordIdOrForm.toLowerCase()}%`);
    }

    if (options.pos) {
      query = query.where('words.part_of_speech', '=', options.pos);
    }
    if (options.lexicon && options.lexicon !== '*') {
      query = query.where('words.lexicon', '=', options.lexicon);
    }

    const results = await query.execute();
    return results.map(this.transformSenseRecord.bind(this));
  }

  async getSenseById(id: string): Promise<Sense | undefined> {
    const result = await this.db
      .selectFrom('senses')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformSenseRecord(result) : undefined;
  }

  // Definition queries
  async getDefinitionsBySynsetId(synsetId: string): Promise<Definition[]> {
    const results = await this.db
      .selectFrom('definitions')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
    return results.map(this.transformDefinitionRecord.bind(this));
  }

  // ILI queries
  async getIliById(id: string): Promise<ILI | undefined> {
    const result = await this.db
      .selectFrom('ilis')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return result ? this.transformIliRecord(result) : undefined;
  }

  async getIlis(options: { status?: string } = {}): Promise<ILI[]> {
    let query = this.db.selectFrom('ilis').selectAll();

    if (options.status) {
      query = query.where('status', '=', options.status);
    }

    const results = await query.execute();
    return results.map(this.transformIliRecord.bind(this));
  }

  // Statistics queries
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    const results = await Promise.all([
      this.db.selectFrom('words').select(this.db.fn.countAll().as('count')).execute(),
      this.db.selectFrom('synsets').select(this.db.fn.countAll().as('count')).execute(),
      this.db.selectFrom('senses').select(this.db.fn.countAll().as('count')).execute(),
      this.db.selectFrom('ilis').select(this.db.fn.countAll().as('count')).execute(),
      this.db.selectFrom('lexicons').select(this.db.fn.countAll().as('count')).execute(),
    ]);

    const getCount = (result: any) => Number(result?.[0]?.count ?? 0);

    return {
      totalWords: getCount(results[0]),
      totalSynsets: getCount(results[1]),
      totalSenses: getCount(results[2]),
      totalILIs: getCount(results[3]),
      totalLexicons: getCount(results[4]),
    };
  }

  async getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
  }[]> {
    let query = this.db
      .selectFrom('lexicons')
      .leftJoin('words', 'lexicons.id', 'words.lexicon')
      .leftJoin('synsets', 'lexicons.id', 'synsets.lexicon')
      .select([
        'lexicons.id',
        'lexicons.label',
        'lexicons.language',
        'lexicons.version',
        (eb: ExpressionBuilder<Database, 'lexicons' | 'words' | 'synsets'>) => eb.fn.count('words.id').distinct().as('word_count'),
        (eb: ExpressionBuilder<Database, 'lexicons' | 'words' | 'synsets'>) => eb.fn.count('synsets.id').distinct().as('synset_count'),
      ]);

    if (lexiconId) {
      query = query.where('lexicons.id', '=', lexiconId);
    }

    const results = await query
      .groupBy(['lexicons.id', 'lexicons.label', 'lexicons.language', 'lexicons.version'])
      .execute();
      
    return results.map(row => ({
      lexiconId: row.id,
      label: row.label,
      language: row.language,
      version: row.version ?? '',
      wordCount: Number(row.word_count),
      synsetCount: Number(row.synset_count),
    }));
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
  }> {
    const totalSynsetsResult = await this.db.selectFrom('synsets').select(this.db.fn.countAll().as('count')).executeTakeFirst();
    const synsetsWithILIResult = await this.db.selectFrom('synsets').where('ili', 'is not', null).select(this.db.fn.countAll().as('count')).executeTakeFirst();
    const synsetsWithSensesResult = await this.db.selectFrom('senses').select(this.db.fn.count('synset_id').distinct().as('count')).executeTakeFirst();
    const synsetsWithDefinitionsResult = await this.db.selectFrom('definitions').select(this.db.fn.count('synset_id').distinct().as('count')).executeTakeFirst();
    
    const total = Number(totalSynsetsResult?.count ?? 0);
    const withILI = Number(synsetsWithILIResult?.count ?? 0);
    const withDefinitions = Number(synsetsWithDefinitionsResult?.count ?? 0);
    const withSenses = Number(synsetsWithSensesResult?.count ?? 0);

    return {
      synsetsWithILI: withILI,
      synsetsWithoutILI: total - withILI,
      iliCoveragePercentage: total > 0 ? (withILI / total) * 100 : 0,
      emptySynsets: total - withSenses,
      synsetsWithDefinitions: withDefinitions,
    };
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    const results = await this.db
      .selectFrom('words')
      .select(['part_of_speech', (eb) => eb.fn.countAll().as('count')])
      .groupBy('part_of_speech')
      .execute();

    const distribution: Record<string, number> = {};
    results.forEach(row => {
      distribution[row.part_of_speech] = Number(row.count);
    });

    return distribution;
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    const results = await this.db
      .selectFrom('synsets')
      .leftJoin('senses', 'synsets.id', 'senses.synset_id')
      .select(['synsets.id', (eb) => eb.fn.count('senses.id').as('size')])
      .groupBy('synsets.id')
      .execute();

    if (results.length === 0) {
      return {
        averageSize: 0,
        maxSize: 0,
        minSize: 0,
        sizeDistribution: {},
      };
    }

    const sizes = results.map(row => Number(row.size));
    const averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);

    const sizeDistribution: Record<number, number> = {};
    sizes.forEach(size => {
      sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
    });

    return {
      averageSize,
      maxSize,
      minSize,
      sizeDistribution,
    };
  }

  // Insert operations
  async insertLexicon(lexicon: Database['lexicons']): Promise<void> {
    await this.db.insertInto('lexicons').values(lexicon).execute();
  }

  async insertWord(word: Database['words']): Promise<void> {
    await this.db.insertInto('words').values(word).execute();
  }

  async insertSynset(synset: Database['synsets']): Promise<void> {
    await this.db.insertInto('synsets').values(synset).execute();
  }

  async insertSense(sense: Database['senses']): Promise<void> {
    await this.db.insertInto('senses').values(sense).execute();
  }

  async insertDefinition(definition: Database['definitions']): Promise<void> {
    await this.db.insertInto('definitions').values(definition).execute();
  }

  async insertForm(form: Database['forms']): Promise<void> {
    await this.db.insertInto('forms').values(form).execute();
  }

  // Clear operations
  async clearAllData(): Promise<void> {
    const tables: (keyof Database)[] = ['words', 'synsets', 'senses', 'definitions', 'relations', 'examples', 'ilis', 'lexicons', 'forms'];
    
    for (const table of tables) {
      try {
        await this.db.deleteFrom(table).execute();
      } catch (error) {
        // Table might not exist, ignore
      }
    }
  }

  // Transformation methods to convert database records to wn-ts-core types
  private transformLexiconRecord(record: Database['lexicons']): Lexicon {
    return {
      id: record.id,
      label: record.label,
      language: record.language,
      email: record.email,
      license: record.license,
      version: record.version,
      url: record.url,
      citation: record.citation,
      logo: record.logo,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    };
  }

  private transformWordRecord(record: Database['words']): Word {
    return {
      id: record.id,
      lemma: record.lemma,
      partOfSpeech: record.part_of_speech as PartOfSpeech,
      forms: [], // Will be populated separately if needed
      pronunciations: [],
      tags: [],
      counts: [],
      language: record.language,
      lexicon: record.lexicon,
    };
  }

  private transformSynsetRecord(record: Database['synsets']): Synset {
    return {
      id: record.id,
      ili: record.ili,
      partOfSpeech: record.part_of_speech as PartOfSpeech,
      language: record.language,
      lexicon: record.lexicon,
      definitions: [], // Will be populated separately
      examples: [],
      relations: [],
      members: [],
      senses: [],
    };
  }

  private transformSenseRecord(record: Database['senses']): Sense {
    return {
      id: record.id,
      word: record.word_id,
      synset: record.synset_id,
      examples: [], // Missing property
      counts: [], // Missing property
      tags: [], // Missing property
      source: record.source,
      sensekey: record.sensekey,
      adjposition: record.adjposition,
      subcategory: record.subcategory,
      domain: record.domain,
      register: record.register,
    };
  }

  private transformDefinitionRecord(record: Database['definitions']): Definition {
    return {
      id: record.id,
      language: record.language,
      text: record.text,
      source: record.source,
    };
  }

  private transformIliRecord(record: Database['ilis']): ILI {
    return {
      id: record.id,
      definition: record.definition,
      status: record.status as "standard" | "proposed" | "deprecated",
      supersededBy: record.superseded_by,
      note: record.note,
    };
  }
} 

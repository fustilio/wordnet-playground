import { Kysely, sql, type ExpressionBuilder } from 'kysely';
import type { Database } from '../types/database.js';
import type { PartOfSpeech, Lexicon, Word, Synset, Sense, Definition, ILI } from 'wn-ts-core';
import { batchInsert as batchInsertWithKysely } from './batch-insert.js';

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
              eb(sql`lower(words.lemma)`, '=', options.form?.toLowerCase()),
              eb(sql`lower(forms.written_form)`, '=', options.form?.toLowerCase()),
            ]),
          );
      } else {
        query = query.where(sql`lower(words.lemma)`, '=', options.form?.toLowerCase());
      }
    }

    if (options.pos) {
      query = query.where('words.pos', '=', options.pos);
    }
    if (options.lexicon && options.lexicon !== '*') {
      query = query.where('words.lexicon', '=', options.lexicon);
    }
    if (options.language) {
      query = query.where('words.language', '=', options.language);
    }

    const started = performance.now();
    const results = await query
      .orderBy('words.lemma')
      .orderBy('words.pos')
      .execute();
    const transformed = results.map(this.transformWordRecord.bind(this));
    const ms = performance.now() - started;
    console.log(`🗃️ getWords(${JSON.stringify({
      form: options.form,
      pos: options.pos,
      lexicon: options.lexicon,
      language: options.language,
      searchAllForms: options.searchAllForms
    })}) → ${transformed.length} in ${ms.toFixed(1)}ms`);
    return transformed;
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
    pos?: PartOfSpeech;
    exact?: boolean;
    caseSensitive?: boolean;
  } = {}): Promise<any[]> {
    const { 
      language = 'en', 
      lexicon, 
      limit = 50, 
      offset = 0, 
      pos,
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

    if (pos) {
      query = query.where('pos', '=', pos);
    }

    const started = performance.now();
    const results = await query
      .orderBy('lemma')
      .limit(limit)
      .offset(offset)
      .execute();
    const transformed = results.map(this.transformWordRecord.bind(this));
    const ms = performance.now() - started;
    console.log(`🗃️ searchWords(${JSON.stringify({ searchTerm, language, lexicon, limit, offset, pos, exact, caseSensitive })}) → ${transformed.length} in ${ms.toFixed(1)}ms`);
    return transformed;
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
              eb(sql`lower(words.lemma)`, '=', options.form?.toLowerCase()),
              eb(sql`lower(forms.written_form)`, '=', options.form?.toLowerCase()),
            ]),
          );
      } else {
        query = query.where(sql`lower(words.lemma)`, '=', options.form?.toLowerCase());
      }
    }

    if (options.pos) {
      query = query.where('words.pos', '=', options.pos);
    }
    if (options.lexicon && options.lexicon !== '*') {
      query = query.where('words.lexicon', '=', options.lexicon);
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
      query = query.where(sql`lower(words.lemma)`, '=', options.wordIdOrForm.toLowerCase());
    }

    if (options.pos) {
      query = query.where('words.pos', '=', options.pos);
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
      .select(['pos', (eb) => eb.fn.countAll().as('count')])
      .groupBy('pos')
      .execute();

    const distribution: Record<string, number> = {};
    results.forEach(row => {
      distribution[row.pos] = Number(row.count);
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

  // Schema creation
  async createTables(): Promise<void> {
    const schema = this.db.schema;

    await schema.createTable('lexicons').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('label', 'text', c => c.notNull())
      .addColumn('language', 'text', c => c.notNull())
      .addColumn('email', 'text')
      .addColumn('license', 'text')
      .addColumn('version', 'text')
      .addColumn('url', 'text')
      .addColumn('citation', 'text')
      .addColumn('logo', 'text')
      .addColumn('metadata', 'text')
      .execute();

    await schema.createTable('words').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('lemma', 'text', c => c.notNull())
      .addColumn('pos', 'text', c => c.notNull())
      .addColumn('language', 'text', c => c.notNull())
      .addColumn('lexicon', 'text', c => c.notNull().references('lexicons.id').onDelete('cascade'))
      .execute();

    await schema.createTable('forms').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('word_id', 'text', c => c.notNull().references('words.id').onDelete('cascade'))
      .addColumn('written_form', 'text', c => c.notNull())
      .addColumn('script', 'text')
      .addColumn('tag', 'text')
      .execute();

    await schema.createTable('synsets').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('ili', 'text')
      .addColumn('pos', 'text', c => c.notNull())
      .addColumn('language', 'text', c => c.notNull())
      .addColumn('lexicon', 'text', c => c.notNull().references('lexicons.id').onDelete('cascade'))
      .execute();

    await schema.createTable('senses').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('word_id', 'text', c => c.notNull().references('words.id').onDelete('cascade'))
      .addColumn('synset_id', 'text', c => c.notNull().references('synsets.id').onDelete('cascade'))
      .addColumn('source', 'text')
      .addColumn('sensekey', 'text')
      .addColumn('adjposition', 'text')
      .addColumn('subcategory', 'text')
      .addColumn('domain', 'text')
      .addColumn('register', 'text')
      .execute();

    await schema.createTable('definitions').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('synset_id', 'text', c => c.notNull().references('synsets.id').onDelete('cascade'))
      .addColumn('language', 'text', c => c.notNull())
      .addColumn('text', 'text', c => c.notNull())
      .addColumn('source', 'text')
      .execute();

    await schema.createTable('relations').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('source_id', 'text', c => c.notNull())
      .addColumn('target_id', 'text', c => c.notNull())
      .addColumn('type', 'text', c => c.notNull())
      .addColumn('source', 'text')
      .execute();

    await schema.createTable('examples').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('synset_id', 'text', c => c.references('synsets.id').onDelete('cascade'))
      .addColumn('sense_id', 'text', c => c.references('senses.id').onDelete('cascade'))
      .addColumn('language', 'text', c => c.notNull())
      .addColumn('text', 'text', c => c.notNull())
      .addColumn('source', 'text')
      .execute();

    await schema.createTable('ilis').ifNotExists()
      .addColumn('id', 'text', c => c.primaryKey())
      .addColumn('definition', 'text')
      .addColumn('status', 'text', c => c.notNull())
      .addColumn('superseded_by', 'text')
      .addColumn('note', 'text')
      .addColumn('meta', 'text')
      .execute();
      
    // Create indexes
    await schema.createIndex('idx_words_lemma').ifNotExists().on('words').column('lemma').execute();
    await schema.createIndex('idx_words_language').ifNotExists().on('words').column('language').execute();
    await schema.createIndex('idx_words_lexicon').ifNotExists().on('words').column('lexicon').execute();
    await schema.createIndex('idx_synsets_language').ifNotExists().on('synsets').column('language').execute();
    await schema.createIndex('idx_synsets_lexicon').ifNotExists().on('synsets').column('lexicon').execute();
    await schema.createIndex('idx_senses_word_id').ifNotExists().on('senses').column('word_id').execute();
    await schema.createIndex('idx_senses_synset_id').ifNotExists().on('senses').column('synset_id').execute();
    await schema.createIndex('idx_examples_synset_id').ifNotExists().on('examples').column('synset_id').execute();
    await schema.createIndex('idx_examples_sense_id').ifNotExists().on('examples').column('sense_id').execute();
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

  /**
   * Batch insert data into a table.
   * @param tableName The name of the table.
   * @param data The data to insert.
   */
  async batchInsert<T extends keyof Database>(tableName: T, data: any[]): Promise<void> {
    return batchInsertWithKysely(this.db, tableName, data);
  }

  // Clear operations
  async clearAllData(): Promise<void> {
    // We must delete in an order that respects foreign key constraints,
    // as relying on `ON DELETE CASCADE` can be fragile in some environments.
    const tables: (keyof Database)[] = [
      "forms",
      "definitions",
      "relations",
      "examples",
      "senses",
      "words",
      "synsets",
      "lexicons",
      "ilis",
    ];

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
      pos: record.pos as PartOfSpeech,
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
      pos: record.pos as PartOfSpeech,
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

  // Additional methods for export functionality
  async getWordsByLexicon(lexiconId: string): Promise<Database['words'][]> {
    return this.db
      .selectFrom('words')
      .selectAll()
      .where('lexicon', '=', lexiconId)
      .execute();
  }

  async getSensesByWordId(wordId: string): Promise<Database['senses'][]> {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('word_id', '=', wordId)
      .execute();
  }

  async getSynsetsByLexicon(lexiconId: string): Promise<Database['synsets'][]> {
    return this.db
      .selectFrom('synsets')
      .selectAll()
      .where('lexicon', '=', lexiconId)
      .execute();
  }

  async getExamplesBySynsetId(synsetId: string): Promise<Database['examples'][]> {
    return this.db
      .selectFrom('examples')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  async getSensesBySynsetId(synsetId: string): Promise<Database['senses'][]> {
    return this.db
      .selectFrom('senses')
      .selectAll()
      .where('synset_id', '=', synsetId)
      .execute();
  }

  async getWordsByIds(wordIds: string[]): Promise<Word[]> {
    if (!wordIds || wordIds.length === 0) return [];
    const rows = await this.db
      .selectFrom('words')
      .selectAll()
      .where('id', 'in', wordIds)
      .execute();
    return rows.map(this.transformWordRecord.bind(this));
  }

  async getWordsBySynsetAndLanguage(synsetId: string, language?: string): Promise<Word[]> {
    let query = this.db
      .selectFrom('senses')
      .innerJoin('words', 'senses.word_id', 'words.id')
      .selectAll('words')
      .where('senses.synset_id', '=', synsetId);
    if (language) {
      query = query.where('words.language', '=', language);
    }
    const rows = await query.execute();
    // Deduplicate words
    const seen = new Set<string>();
    const out: Word[] = [];
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        out.push(this.transformWordRecord(row as any));
      }
    }
    return out;
  }

  async getRelationsBySynsetId(synsetId: string): Promise<Database['relations'][]> {
    return this.db
      .selectFrom('relations')
      .selectAll()
      .where('source_id', '=', synsetId)
      .execute();
  }
} 

import { db } from './db/database.js';
import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  Definition,
  Relation,
  Form,
  ILI,
  Example,
  Project,
  WordQuery,
  SynsetQuery,
  SenseQuery
} from 'wn-ts-core';
import { BaseWordnet } from 'wn-ts-core';

export class Wordnet extends BaseWordnet {
  private _expand: string[];
  private _defaultNormalizer: (form: string) => string;
  private _defaultLemmatizer: (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>;
  private _searchAllForms: boolean;
  private _lang?: string;

  constructor(
    lexicon: string = '*',
    options: WordnetOptions = {}
  ) {
    // Create options object with lexicon property
    const baseOptions = {
      ...options,
      lexicon
    };
    super(baseOptions);

    this._expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    
    // Set default normalizer and lemmatizer
    this._defaultNormalizer = options.normalizer || this._createDefaultNormalizer();
    this._defaultLemmatizer = options.lemmatizer || this._createDefaultLemmatizer();
    
    this._searchAllForms = options.searchAllForms ?? true;

    if (options.lang) {
      this._lang = options.lang;
    }
  }

  /**
   * Create a default normalizer function
   */
  private _createDefaultNormalizer(): (form: string) => string {
    return (form: string) => form.toLowerCase().trim();
  }

  /**
   * Create a default lemmatizer function
   */
  private _createDefaultLemmatizer(): (form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>> {
    return (form: string, pos?: PartOfSpeech) => {
      const result: Record<PartOfSpeech, Set<string>> = {
        'n': new Set(),
        'v': new Set(),
        'a': new Set(),
        'r': new Set(),
        's': new Set(),
        'c': new Set(),
        'p': new Set(),
        'x': new Set(),
        'u': new Set(),
        'i': new Set()
      };
      
      // Always include the original form
      if (pos) {
        result[pos] = new Set([form]);
      } else {
        // Add to all POS
        Object.keys(result).forEach(posKey => {
          result[posKey as PartOfSpeech] = new Set([form]);
        });
      }
      
      return result;
    };
  }

  async lexicons(): Promise<Lexicon[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, label, language, email, license, version, url, citation, logo, metadata
      FROM lexicons
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Handle multiple lexicons
    if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
      conditions.push('id = ?');
      params.push(this.lexiconIds[0]);
    } else if (this.lexiconIds.length > 1) {
      const placeholders = this.lexiconIds.map(() => '?').join(',');
      conditions.push(`id IN (${placeholders})`);
      params.push(...this.lexiconIds);
    }
    
    if (this._lang) {
      conditions.push('language = ?');
      params.push(this._lang);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const lexicons = await db.all<Lexicon>(sql, params);
    
    // Enrich with additional statistics
    const enrichedLexicons = [];
    for (const lexicon of lexicons) {
      const stats = await this.getLexiconStatistics(lexicon.id);
      if (stats.length > 0) {
        enrichedLexicons.push({
          ...lexicon,
          ...stats[0]
        });
      }
    }
    
    return enrichedLexicons;
  }

  async expandedLexicons(): Promise<Lexicon[]> {
    await db.initialize();
    
    if (this._expand.length === 0) {
      return [];
    }

    const placeholders = this._expand.map(() => '?').join(',');
    const sql = `
      SELECT id, label, language, email, license, version, url, citation, logo, metadata
      FROM lexicons
      WHERE id IN (${placeholders})
    `;
    
    return await db.all<Lexicon>(sql, this._expand);
  }

  async words(query?: WordQuery): Promise<Word[]> {
    await db.initialize();

    const { form, pos, lexicon, lang: _lang } = query || {};

    const lang = _lang || this._lang;
    
    if (!form) {
      // If no form specified, return all words (with filters)
      let sql = `
        SELECT DISTINCT w.id, w.lemma, w.pos, w.language, w.lexicon
        FROM words w
        WHERE 1=1
      `;
      
      const params: unknown[] = [];

      if (pos) {
        sql += ' AND w.pos = ?';
        params.push(pos);
      }

      if (lexicon && lexicon !== '*') {
        sql += ' AND w.lexicon = ?';
        params.push(lexicon);
      } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
        sql += ' AND w.lexicon = ?';
        params.push(this.lexiconIds[0]);
      } else if (this.lexiconIds.length > 1) {
        const placeholders = this.lexiconIds.map(() => '?').join(',');
        sql += ` AND w.lexicon IN (${placeholders})`;
        params.push(...this.lexiconIds);
      }

      if (lang || this._lang) {
        sql += ' AND w.language = ?';
        params.push(lang || this._lang);
      }

      return await db.all<Word>(sql, params);
    }

    let normalizedForm = form;
    normalizedForm = this._defaultNormalizer(form);

    // Use UNION to include words that match by lemma OR by form
    let sql = `
      SELECT DISTINCT w.id, w.lemma, w.pos, w.language, w.lexicon
      FROM words w
      WHERE w.lemma = ?
    `;
    
    const params: unknown[] = [normalizedForm];

    if (pos) {
      sql += ' AND w.pos = ?';
      params.push(pos);
    }

    if (lexicon && lexicon !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(lexicon);
    } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this.lexiconIds[0]);
    } else if (this.lexiconIds.length > 1) {
      const placeholders = this.lexiconIds.map(() => '?').join(',');
      sql += ` AND w.lexicon IN (${placeholders})`;
      params.push(...this.lexiconIds);
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    sql += `
      UNION
      SELECT DISTINCT w.id, w.lemma, w.pos, w.language, w.lexicon
      FROM words w
      JOIN forms f ON w.id = f.word_id
      WHERE f.written_form = ?
    `;
    
    params.push(normalizedForm);

    if (pos) {
      sql += ' AND w.pos = ?';
      params.push(pos);
    }

    if (lexicon && lexicon !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(lexicon);
    } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this.lexiconIds[0]);
    } else if (this.lexiconIds.length > 1) {
      const placeholders = this.lexiconIds.map(() => '?').join(',');
      sql += ` AND w.lexicon IN (${placeholders})`;
      params.push(...this.lexiconIds);
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    const words = await db.all<Word>(sql, params);

    // If no results and searchAllForms is enabled, try lemmatization
    if (words.length === 0 && this._searchAllForms) {
      const lemmatizedForms = this._defaultLemmatizer(normalizedForm, pos);
      const allForms = new Set<string>();
      
      for (const forms of Object.values(lemmatizedForms)) {
        for (const form of forms) {
          allForms.add(form);
        }
      }

      if (allForms.size > 0) {
        const formPlaceholders = Array.from(allForms).map(() => '?').join(',');
        let lemmatizedSql = `
          SELECT DISTINCT w.id, w.lemma, w.pos, w.language, w.lexicon
          FROM words w
          WHERE w.lemma IN (${formPlaceholders})
          UNION
          SELECT DISTINCT w.id, w.lemma, w.pos, w.language, w.lexicon
          FROM words w
          JOIN forms f ON w.id = f.word_id
          WHERE f.written_form IN (${formPlaceholders})
        `;
        
        const lemmatizedParams = [...Array.from(allForms), ...Array.from(allForms)];
        
        if (pos) {
          lemmatizedSql += ' AND w.pos = ?';
          lemmatizedParams.push(pos);
        }

        if (lexicon && lexicon !== '*') {
          if (Array.isArray(lexicon)) {
            // Handle array of lexicons
            const placeholders = lexicon.map(() => '?').join(',');
            lemmatizedSql += ` AND w.lexicon IN (${placeholders})`;
            lemmatizedParams.push(...lexicon);
          } else {
            // Handle single lexicon
            lemmatizedSql += ' AND w.lexicon = ?';
            lemmatizedParams.push(lexicon);
          }
        } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
          lemmatizedSql += ' AND w.lexicon = ?';
          const firstLexicon = this.lexiconIds[0];
          if (firstLexicon) {
            lemmatizedParams.push(firstLexicon);
          }
        } else if (this.lexiconIds.length > 1) {
          const placeholders = this.lexiconIds.map(() => '?').join(',');
          lemmatizedSql += ` AND w.lexicon IN (${placeholders})`;
          lemmatizedParams.push(...this.lexiconIds);
        }

        if (lang) {
          lemmatizedSql += ' AND w.language = ?';
          lemmatizedParams.push(lang);
        }

        const lemmatizedWords = await db.all<Word>(lemmatizedSql, lemmatizedParams);
        words.push(...lemmatizedWords);
      }
    }

    return words;
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    await db.initialize();

    const { form, pos, ili, lexicon, lang: _lang } = query || {};
    
    const lang = _lang || this._lang;

    if (!form) {
      // If no form specified, return all synsets (with filters)
      let sql = `
        SELECT DISTINCT s.id, s.ili, s.pos, s.language, s.lexicon
        FROM synsets s
        WHERE 1=1
      `;
      
      const params: unknown[] = [];

      if (pos) {
        sql += ' AND s.pos = ?';
        params.push(pos);
      }

      if (ili) {
        const iliId = typeof ili === 'string' ? ili : ili.id;
        sql += ' AND s.ili = ?';
        params.push(iliId);
      }

      if (lexicon && lexicon !== '*') {
        sql += ' AND s.lexicon = ?';
        params.push(lexicon);
      } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
        sql += ' AND s.lexicon = ?';
        params.push(this.lexiconIds[0]);
      }

      if (lang) {
        sql += ' AND s.language = ?';
        params.push(lang);
      }

      const synsets = await db.all<Synset>(sql, params);
      
      // Load full synset data for each
      const fullSynsets: Synset[] = [];
      for (const synset of synsets) {
        const fullSynset = await this.getSynsetOrUndefined(synset.id);
        if (fullSynset) {
          fullSynsets.push(fullSynset);
        }
      }
      
      return fullSynsets;
    }

    const words = await this.words(query);
    const synsetIds = new Set<string>();

    for (const word of words) {
      const senses = await this.senses({ wordIdOrForm: word.id });
      for (const sense of senses) {
        synsetIds.add(sense.synset);
      }
    }

    const synsets: Synset[] = [];
    for (const synsetId of synsetIds) {
      const synset = await this.getSynsetOrUndefined(synsetId);
      if (synset) {
        synsets.push(synset);
      }
    }

    return synsets;
  }

  // Method overloads for senses
  async senses(query?: SenseQuery): Promise<Sense[]> {
    await db.initialize();
    
    const { form, pos, lexicon, lang, wordIdOrForm } = query || {};
    
    // If wordIdOrForm is provided, this is a word ID query
    if (wordIdOrForm && !form) {
      let sql = `
        SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
               s.adjposition, s.subcategory, s.domain, s.register
        FROM senses s
        WHERE s.word_id = ?
      `;
      
      const params: unknown[] = [wordIdOrForm];

      if (lexicon && lexicon !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(lexicon);
      } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(this.lexiconIds[0]);
      }

      return await db.all<Sense>(sql, params);
    }
    
    // If form is provided, this is a form-based query with pos filter
            if (form) {
          let normalizedForm = form;
          normalizedForm = this._defaultNormalizer(form);
      let sql = `
        SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
               s.adjposition, s.subcategory, s.domain, s.register
        FROM senses s
        JOIN words w ON s.word_id = w.id
        WHERE w.lemma = ?
      `;
      
      const params: unknown[] = [normalizedForm];

      if (pos) {
        sql += ' AND w.pos = ?';
        params.push(pos);
      }

      if (lexicon && lexicon !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(lexicon);
      } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(this.lexiconIds[0]);
      }

      if (lang || this._lang) {
        sql += ' AND w.language = ?';
        params.push(lang || this._lang);
      }

      let senses = await db.all<Sense>(sql, params);

      // If no results and searchAllForms is enabled, try lemmatization
      if (senses.length === 0 && this._searchAllForms && this._defaultLemmatizer) {
        const lemmatizedForms = this._defaultLemmatizer(normalizedForm, pos);
        const allForms = new Set<string>();
        
        for (const forms of Object.values(lemmatizedForms)) {
          for (const form of forms) {
            allForms.add(form);
          }
        }

        if (allForms.size > 0) {
          const formPlaceholders = Array.from(allForms).map(() => '?').join(',');
          let lemmatizedSql = `
            SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
                   s.adjposition, s.subcategory, s.domain, s.register
            FROM senses s
            JOIN words w ON s.word_id = w.id
            WHERE w.lemma IN (${formPlaceholders})
          `;
          
          const lemmatizedParams = Array.from(allForms);
          
          if (pos) {
            lemmatizedSql += ' AND w.pos = ?';
            lemmatizedParams.push(pos);
          }

          if (lexicon && lexicon !== '*') {
            if (Array.isArray(lexicon)) {
              // Handle array of lexicons
              const placeholders = lexicon.map(() => '?').join(',');
              lemmatizedSql += ` AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon IN (${placeholders}))`;
              lemmatizedParams.push(...lexicon);
            } else {
              // Handle single lexicon
              lemmatizedSql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
              lemmatizedParams.push(lexicon);
            }
          } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
            lemmatizedSql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
            const firstLexicon = this.lexiconIds[0];
            if (firstLexicon) {
              lemmatizedParams.push(firstLexicon);
            }
          }

          if (lang || this._lang) {
            lemmatizedSql += ' AND w.language = ?';
            const langParam = lang || this._lang;
            if (langParam) {
              lemmatizedParams.push(langParam);
            }
          }

          const lemmatizedSenses = await db.all<Sense>(lemmatizedSql, lemmatizedParams);
          senses.push(...lemmatizedSenses);
        }
      }

      return senses;
    }
    
    // If no form or wordIdOrForm, return all senses (with filters)
    let sql = `
      SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
             s.adjposition, s.subcategory, s.domain, s.register
      FROM senses s
      JOIN words w ON s.word_id = w.id
      JOIN synsets sy ON s.synset_id = sy.id
      WHERE 1=1
    `;
    
    const params: unknown[] = [];

    if (pos) {
      sql += ' AND w.pos = ?';
      params.push(pos);
    }

    if (lexicon && lexicon !== '*') {
      if (Array.isArray(lexicon)) {
        // Handle array of lexicons
        const placeholders = lexicon.map(() => '?').join(',');
        sql += ` AND sy.lexicon IN (${placeholders})`;
        params.push(...lexicon);
      } else {
        // Handle single lexicon
        sql += ' AND sy.lexicon = ?';
        params.push(lexicon);
      }
    } else if (this.lexiconIds.length === 1 && this.lexiconIds[0] !== '*') {
      sql += ' AND sy.lexicon = ?';
      const firstLexicon = this.lexiconIds[0];
      if (firstLexicon) {
        params.push(firstLexicon);
      }
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    return await db.all<Sense>(sql, params);
  }

  async getWord(wordId: string): Promise<Word | undefined> {
    await db.initialize();

    const sql = `
      SELECT id, lemma, pos, language, lexicon
      FROM words
      WHERE id = ?
    `;
    
    const result = await db.get<Word>(sql, [wordId]);
    if (!result) {
      return undefined;
    }

    // Get forms
    const forms = await db.all(`
      SELECT id, written_form, script, tag
      FROM forms
      WHERE word_id = ?
    `, [wordId]) as Form[];

    return {
      ...result,
      forms,
      pronunciations: [],
      tags: [],
      counts: [],
    };
  }

  async getSense(senseId: string): Promise<Sense | undefined> {
    await db.initialize();
    
    const sql = `
      SELECT id, word_id as word, synset_id as synset, source, sensekey,
             adjposition, subcategory, domain, register
      FROM senses
      WHERE id = ?
    `;
    
    const result = await db.get<Sense>(sql, [senseId]);
    if (!result) {
      return undefined;
    }

    // Get examples
    const examples = await db.all(`
      SELECT id, language, text, source
      FROM examples
      WHERE sense_id = ?
    `, [senseId]) as Example[];

    return {
      ...result,
      examples: examples,
      counts: [],
      tags: [],
    };
  }

  async getIli(iliId: string): Promise<ILI | undefined> {
    await db.initialize();
    
    const sql = `
      SELECT id, definition, status, meta
      FROM ilis
      WHERE id = ?
    `;
    
    const result = await db.get<ILI>(sql, [iliId]);
    if (!result) {
      return undefined;
    }
    
    return result;
  }

  // Implement abstract methods from BaseWordnet
  async word(id: string): Promise<Word> {
    const result = await this.getWordOrUndefined(id);
    if (!result) {
      throw new Error(`no such lexical entry: ${id}`);
    }
    return result;
  }

  async synset(id: string): Promise<Synset> {
    const result = await this.getSynsetOrUndefined(id);
    if (!result) {
      throw new Error(`no such synset: ${id}`);
    }
    return result;
  }

  async sense(id: string): Promise<Sense> {
    const result = await this.getSenseOrUndefined(id);
    if (!result) {
      throw new Error(`no such sense: ${id}`);
    }
    return result;
  }

  async ili(id: string): Promise<ILI> {
    const result = await this.getIli(id);
    if (!result) {
      throw new Error(`no such ILI: ${id}`);
    }
    return result;
  }

  // Methods that return undefined for non-existent items (for testing)
  async getWordOrUndefined(wordId: string): Promise<Word | undefined> {
    return this.getWord(wordId);
  }

  async getSynsetOrUndefined(synsetId: string): Promise<Synset | undefined> {
    await db.initialize();

    const sql = `
      SELECT id, ili, pos, language, lexicon
      FROM synsets
      WHERE id = ?
    `;
    
    const result = await db.get<Synset>(sql, [synsetId]);
    if (!result) {
      return undefined;
    }

    // Get definitions
    const definitions = await db.all(`
      SELECT id, language, text, source
      FROM definitions
      WHERE synset_id = ?
    `, [synsetId]);

    // Get relations
    const relations = await db.all(`
      SELECT id, type, target_id as target, source
      FROM relations
      WHERE source_id = ?
    `, [synsetId]);

    // Get members and senses
    const senses = await this.senses({ wordIdOrForm: synsetId });
    const members = senses.map(s => s.word);

    // Get examples
    const examples = await db.all(`
      SELECT id, language, text, source
      FROM examples
      WHERE synset_id = ?
    `, [synsetId]) as Example[];

    return {
      ...result,
      definitions: definitions as Definition[],
      relations: relations as Relation[],
      members: members as string[],
      senses: senses.map(s => s.id) as string[],
      examples: examples,
    };
  }

  async getSenseOrUndefined(senseId: string): Promise<Sense | undefined> {
    return this.getSense(senseId);
  }

  async ilis(status?: string): Promise<ILI[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, definition, status, meta
      FROM ilis
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY id';
    
    return await db.all<ILI>(sql, params);
  }

  async getProjects(): Promise<Project[]> {
    // Use the Node.js config to load projects
    const { getProjects } = await import('./project.js');
    return getProjects();
  }

  // Statistics methods for use cases
  async getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }> {
    await db.initialize();
    
    const wordCount = await db.get('SELECT COUNT(*) as count FROM words') as { count: number } | undefined;
    const totalSynsetsResult = await db.get('SELECT COUNT(*) as count FROM synsets') as { count: number } | undefined;
    const senseCount = await db.get('SELECT COUNT(*) as count FROM senses') as { count: number } | undefined;
    const iliCount = await db.get('SELECT COUNT(*) as count FROM ilis') as { count: number } | undefined;
    const lexiconCount = await db.get('SELECT COUNT(*) as count FROM lexicons') as { count: number } | undefined;
    
    const totalSynsets = totalSynsetsResult?.count ?? 0;
    const totalWords = wordCount?.count || 0;
    const totalSenses = senseCount?.count || 0;
    const totalILIs = iliCount?.count || 0;
    const totalLexicons = lexiconCount?.count || 0;
    
    return {
      totalWords,
      totalSynsets,
      totalSenses,
      totalILIs,
      totalLexicons,
    };
  }

  async getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
  }[]> {
    await db.initialize();
    
    const lexicons = await this.lexicons();
    const stats = [];
    
    for (const lexicon of lexicons) {
      if (lexiconId && lexicon.id !== lexiconId) continue;
      
      const wordCount = await db.get('SELECT COUNT(*) as count FROM words WHERE lexicon = ?', [lexicon.id]) as { count: number } | undefined;
      const synsetCount = await db.get('SELECT COUNT(*) as count FROM synsets WHERE lexicon = ?', [lexicon.id]) as { count: number } | undefined;
      const senseCount = await db.get('SELECT COUNT(*) as count FROM senses se JOIN synsets s ON se.synset_id = s.id WHERE s.lexicon = ?', [lexicon.id]) as { count: number } | undefined;
      const iliCount = await db.get('SELECT COUNT(*) as count FROM synsets WHERE lexicon = ? AND ili IS NOT NULL', [lexicon.id]) as { count: number } | undefined;
      
      stats.push({
        lexiconId: lexicon.id,
        label: lexicon.label,
        language: lexicon.language,
        version: lexicon.version || 'unknown',
        wordCount: wordCount?.count || 0,
        synsetCount: synsetCount?.count || 0,
        senseCount: senseCount?.count || 0,
        iliCount: iliCount?.count || 0,
      });
    }
    
    return stats;
  }

  async getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
    synsetsWithExamples: number;
    averageSynsetSize: number;
  }> {
    await db.initialize();
    
    const totalSynsetsResult = await db.get('SELECT COUNT(*) as count FROM synsets') as { count: number } | undefined;
    const synsetsWithILI = await db.get('SELECT COUNT(*) as count FROM synsets WHERE ili IS NOT NULL') as { count: number } | undefined;
    const synsetsWithMembersResult = await db.get('SELECT COUNT(DISTINCT synset_id) as count FROM senses') as { count: number } | undefined;
    
    const totalSynsets = totalSynsetsResult?.count ?? 0;
    const synsetsWithILICount = synsetsWithILI?.count || 0;
    const synsetsWithMembers = synsetsWithMembersResult?.count ?? 0;
    
    return {
      synsetsWithILI: synsetsWithILICount,
      synsetsWithoutILI: totalSynsets - synsetsWithILICount,
      iliCoveragePercentage: totalSynsets > 0 ? (synsetsWithILICount / totalSynsets) * 100 : 0,
      emptySynsets: totalSynsets - synsetsWithMembers,
      synsetsWithDefinitions: synsetsWithILICount, // ILI records contain definitions
      synsetsWithExamples: 0, // TODO: implement when examples table is available
      averageSynsetSize: 0, // TODO: implement calculation
    };
  }

  async getPartOfSpeechDistribution(): Promise<Record<string, number>> {
    await db.initialize();
    
    const synsets = await db.all('SELECT pos FROM synsets') as { pos: string }[];
    const posCounts: Record<string, number> = {};
    
    for (const synset of synsets) {
      const pos = synset.pos || 'undefined';
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    }
    
    return posCounts;
  }

  async getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }> {
    await db.initialize();
    
    // Get statistics using SQL aggregation
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_synsets,
        SUM(size) as total_members,
        MAX(size) as max_size,
        MIN(size) as min_size
      FROM (
        SELECT synset_id, COUNT(*) as size 
        FROM senses 
        GROUP BY synset_id
      )
    `) as { total_synsets: number; total_members: number; max_size: number; min_size: number } | undefined;
    
    // Get size distribution (limit to most common sizes to avoid memory issues)
    const sizeDistribution = await db.all(`
      SELECT size, COUNT(*) as count
      FROM (
        SELECT synset_id, COUNT(*) as size 
        FROM senses 
        GROUP BY synset_id
      )
      GROUP BY size
      ORDER BY count DESC
      LIMIT 20
    `) as { size: number; count: number }[];
    
    // Convert to Record format
    const distribution: Record<number, number> = {};
    sizeDistribution.forEach(row => {
      distribution[row.size] = row.count;
    });
    
    const totalSynsets = stats?.total_synsets ?? 0;
    const totalMembers = stats?.total_members ?? 0;
    const maxSize = stats?.max_size ?? 0;
    const minSize = stats?.min_size ?? 0;
    
    return {
      averageSize: totalSynsets > 0 ? totalMembers / totalSynsets : 0,
      maxSize,
      minSize,
      sizeDistribution: distribution,
    };
  }

  /**
   * Close the database connection.
   * Call this when you're done using the Wordnet instance.
   */
  async close(): Promise<void> {
    await db.close();
  }

  // ============================================================================
  // NEW METHODS FROM ENHANCED BASEWORDNET INTERFACE
  // ============================================================================

  // Interlingual Queries
  async synsetsByILI(iliId: string): Promise<Synset[]> {
    await db.initialize();
    
    const sql = `
      SELECT DISTINCT s.id, s.ili, s.pos, s.language, s.lexicon
      FROM synsets s
      WHERE s.ili = ?
    `;
    
    const synsets = await db.all<Synset>(sql, [iliId]);
    
    // Enrich synsets with full data
    const enrichedSynsets: Synset[] = [];
    for (const synset of synsets) {
      const enriched = await this.getSynsetOrUndefined(synset.id);
      if (enriched) {
        enrichedSynsets.push(enriched);
      }
    }
    
    return enrichedSynsets;
  }

  // Enhanced Query Methods
  async searchWords(query: WordQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeForms?: boolean;
  }): Promise<Word[]> {
    // For now, implement as a wrapper around words() with maxResults
    const words = await this.words(query);
    
    if (query.maxResults && words.length > query.maxResults) {
      return words.slice(0, query.maxResults);
    }
    
    return words;
  }

  async searchSynsets(query: SynsetQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeDefinitions?: boolean;
    includeExamples?: boolean;
  }): Promise<Synset[]> {
    // For now, implement as a wrapper around synsets() with maxResults
    const synsets = await this.synsets(query);
    
    if (query.maxResults && synsets.length > query.maxResults) {
      return synsets.slice(0, query.maxResults);
    }
    
    return synsets;
  }

  async wordsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    lang?: string;
    includeInflected?: boolean;
  }): Promise<Word[]> {
    const query: WordQuery = { form };
    if (options?.pos) query.pos = options.pos;
    if (options?.lexicon) query.lexicon = options.lexicon;
    if (options?.lang) query.lang = options.lang;
    return this.words(query);
  }

  async synsetsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    lang?: string;
  }): Promise<Synset[]> {
    const query: SynsetQuery = { form };
    if (options?.pos) query.pos = options.pos;
    if (options?.lexicon) query.lexicon = options.lexicon;
    if (options?.lang) query.lang = options.lang;
    return this.synsets(query);
  }

  // Lemmatization and Normalization
  async getWordForms(wordId: string): Promise<string[]> {
    await db.initialize();
    
    const sql = `
      SELECT f.written_form
      FROM forms f
      WHERE f.word_id = ?
    `;
    
    const forms = await db.all<{ written_form: string }>(sql, [wordId]);
    return forms.map(f => f.written_form);
  }

  async getWordLemma(wordId: string): Promise<string> {
    const word = await this.word(wordId);
    return word.lemma;
  }

  async morphy(form: string, pos?: PartOfSpeech): Promise<Record<PartOfSpeech, Set<string>>> {
    return this._defaultLemmatizer(form, pos);
  }

  async getDerivedWords(wordId: string): Promise<Word[]> {
    // This would require implementing morphological derivation logic
    // For now, return empty array
    return [];
  }

  async normalizeForm(form: string): Promise<string> {
    return this._defaultNormalizer(form);
  }

  // Relationship Queries
  async getHypernyms(synsetId: string): Promise<Synset[]> {
    await db.initialize();
    
    const sql = `
      SELECT target_id
      FROM relations
      WHERE source_id = ? AND type = 'hypernym'
    `;
    
    const relations = await db.all<{ target_id: string }>(sql, [synsetId]);
    const hypernyms: Synset[] = [];
    
    for (const relation of relations) {
      const synset = await this.getSynsetOrUndefined(relation.target_id);
      if (synset) {
        hypernyms.push(synset);
      }
    }
    
    return hypernyms;
  }

  async getHyponyms(synsetId: string): Promise<Synset[]> {
    await db.initialize();
    
    const sql = `
      SELECT source_id
      FROM relations
      WHERE target_id = ? AND type = 'hypernym'
    `;
    
    const relations = await db.all<{ source_id: string }>(sql, [synsetId]);
    const hyponyms: Synset[] = [];
    
    for (const relation of relations) {
      const synset = await this.getSynsetOrUndefined(relation.source_id);
      if (synset) {
        hyponyms.push(synset);
      }
    }
    
    return hyponyms;
  }

  async getRelatedSynsets(synsetId: string, relationType: string): Promise<Synset[]> {
    await db.initialize();
    
    const sql = `
      SELECT target_id
      FROM relations
      WHERE source_id = ? AND type = ?
    `;
    
    const relations = await db.all<{ target_id: string }>(sql, [synsetId, relationType]);
    const related: Synset[] = [];
    
    for (const relation of relations) {
      const synset = await this.getSynsetOrUndefined(relation.target_id);
      if (synset) {
        related.push(synset);
      }
    }
    
    return related;
  }

  async getRelatedSenses(senseId: string, relationType: string): Promise<Sense[]> {
    // This would require implementing sense-level relations
    // For now, return empty array
    return [];
  }

  async getShortestPath(synsetId1: string, synsetId2: string): Promise<Synset[]> {
    // This is a complex graph traversal - implement basic version
    // For now, return empty array
    return [];
  }

  async getSynsetDepth(synsetId: string): Promise<number> {
    // Calculate depth by traversing up the hypernym hierarchy
    let depth = 0;
    let currentId = synsetId;
    
    while (true) {
      const hypernyms = await this.getHypernyms(currentId);
      if (hypernyms.length === 0) {
        break;
      }
      depth++;
      currentId = hypernyms[0]?.id || '';
      
      // Prevent infinite loops
      if (depth > 100) {
        break;
      }
    }
    
    return depth;
  }

  // Translation and Cross-Lingual Queries
  async translateWord(wordId: string, targetLang: string): Promise<Record<string, Word[]>> {
    // This would require implementing cross-lingual mappings
    // For now, return empty result
    return {};
  }

  async translateSynset(synsetId: string, targetLang: string): Promise<Synset[]> {
    const synset = await this.synset(synsetId);
    if (synset.ili) {
      return this.synsetsByILI(synset.ili);
    }
    return [];
  }

  async translateSense(senseId: string, targetLang: string): Promise<Sense[]> {
    // This would require implementing sense-level translations
    // For now, return empty array
    return [];
  }

  async getCrossLingualSynsets(iliId: string, targetLangs?: string[]): Promise<Record<string, Synset[]>> {
    const synsets = await this.synsetsByILI(iliId);
    const result: Record<string, Synset[]> = {};
    
    for (const synset of synsets) {
      const lang = synset.language;
      if (!targetLangs || targetLangs.includes(lang)) {
        if (!result[lang]) {
          result[lang] = [];
        }
        result[lang].push(synset);
      }
    }
    
    return result;
  }

  // Content and Metadata Queries
  async getDefinitions(synsetId: string): Promise<string[]> {
    const synset = await this.synset(synsetId);
    return synset.definitions.map(d => d.text);
  }

  async getExamples(synsetId: string): Promise<string[]> {
    const synset = await this.synset(synsetId);
    return synset.examples.map(e => e.text);
  }

  async getSenseExamples(senseId: string): Promise<string[]> {
    await db.initialize();
    
    const sql = `
      SELECT text
      FROM examples
      WHERE sense_id = ?
    `;
    
    const examples = await db.all<{ text: string }>(sql, [senseId]);
    return examples.map(e => e.text);
  }

  async getSynsetWords(synsetId: string): Promise<Word[]> {
    const synset = await this.synset(synsetId);
    const words: Word[] = [];
    
    for (const memberId of synset.members) {
      try {
        const word = await this.word(memberId);
        words.push(word);
      } catch (error) {
        // Skip invalid word IDs
      }
    }
    
    return words;
  }

  async getSynsetLemmas(synsetId: string): Promise<string[]> {
    const words = await this.getSynsetWords(synsetId);
    return words.map(w => w.lemma);
  }

  async getSynsetSenses(synsetId: string): Promise<Sense[]> {
    const synset = await this.synset(synsetId);
    const senses: Sense[] = [];
    
    for (const senseId of synset.senses) {
      try {
        const sense = await this.sense(senseId);
        senses.push(sense);
      } catch (error) {
        // Skip invalid sense IDs
      }
    }
    
    return senses;
  }

  // Utility and Configuration Methods
  async hasLexicon(lexiconId: string): Promise<boolean> {
    const lexicons = await this.lexicons();
    return lexicons.some(l => l.id === lexiconId);
  }

  async getSupportedLanguages(): Promise<string[]> {
    const lexicons = await this.lexicons();
    const languages = new Set<string>();
    
    for (const lexicon of lexicons) {
      if (lexicon.language) {
        languages.add(lexicon.language);
      }
    }
    
    return Array.from(languages);
  }

  async getLexiconDependencies(lexiconId: string): Promise<string[]> {
    // This would require implementing dependency tracking
    // For now, return empty array
    return [];
  }

  // Enhanced Statistics Methods
  async getEnhancedLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
    averageSynsetSize: number;
    iliCoveragePercentage: number;
  }[]> {
    const basicStats = await this.getLexiconStatistics(lexiconId);
    const enhancedStats = [];
    
    for (const stat of basicStats) {
      const synsetSizeAnalysis = await this.getSynsetSizeAnalysis();
      const dataQuality = await this.getDataQualityMetrics();
      
      enhancedStats.push({
        ...stat,
        averageSynsetSize: synsetSizeAnalysis.averageSize,
        iliCoveragePercentage: dataQuality.iliCoveragePercentage,
      });
    }
    
    return enhancedStats;
  }

  async getEnhancedDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
    synsetsWithExamples: number;
    averageSynsetSize: number;
    totalRelations: number;
    averageRelationsPerSynset: number;
    synsetsWithMembers: number;
  }> {
    const basicMetrics = await this.getDataQualityMetrics();
    const synsetSizeAnalysis = await this.getSynsetSizeAnalysis();
    
    // Get additional metrics
    await db.initialize();
    const totalRelationsResult = await db.get('SELECT COUNT(*) as count FROM relations') as { count: number } | undefined;
    const totalRelations = totalRelationsResult?.count || 0;
    
    const totalSynsetsResult = await db.get('SELECT COUNT(*) as count FROM synsets') as { count: number } | undefined;
    const totalSynsets = totalSynsetsResult?.count || 0;
    
    return {
      ...basicMetrics,
      totalRelations,
      averageRelationsPerSynset: totalSynsets > 0 ? totalRelations / totalSynsets : 0,
      synsetsWithMembers: basicMetrics.synsetsWithDefinitions, // Using as proxy for now
    };
  }

  // Missing methods from enhanced interface
  // Note: getWordOrUndefined, getSynsetOrUndefined, and getSenseOrUndefined 
  // are already implemented above in the class

  // Additional utility methods
  async getLexiconById(lexiconId: string): Promise<Lexicon | undefined> {
    const lexicons = await this.lexicons();
    return lexicons.find(l => l.id === lexiconId);
  }

  async getLexiconByLanguage(language: string): Promise<Lexicon[]> {
    const lexicons = await this.lexicons();
    return lexicons.filter(l => l.language === language);
  }

  async getLexiconByVersion(version: string): Promise<Lexicon[]> {
    const lexicons = await this.lexicons();
    return lexicons.filter(l => l.version === version);
  }

  // Performance optimization methods
  async getWordsByLexicon(lexiconId: string, limit?: number): Promise<Word[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, lemma, pos, language, lexicon
      FROM words
      WHERE lexicon = ?
    `;
    
    const params: unknown[] = [lexiconId];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    return await db.all<Word>(sql, params);
  }

  async getSynsetsByLexicon(lexiconId: string, limit?: number): Promise<Synset[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, ili, pos, language, lexicon
      FROM synsets
      WHERE lexicon = ?
    `;
    
    const params: unknown[] = [lexiconId];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const synsets = await db.all<Synset>(sql, params);
    
    // Enrich with full data
    const enrichedSynsets: Synset[] = [];
    for (const synset of synsets) {
      const enriched = await this.getSynsetOrUndefined(synset.id);
      if (enriched) {
        enrichedSynsets.push(enriched);
      }
    }
    
    return enrichedSynsets;
  }

  async getSensesByWordId(wordId: string): Promise<Sense[]> {
    return this.senses({ wordIdOrForm: wordId });
  }

  async getSensesBySynsetId(synsetId: string): Promise<Sense[]> {
    await db.initialize();
    
    const sql = `
      SELECT id, word_id as word, synset_id as synset, source, sensekey,
             adjposition, subcategory, domain, register
      FROM senses
      WHERE synset_id = ?
    `;
    
    return await db.all<Sense>(sql, [synsetId]);
  }

  async getDefinitionsBySynsetId(synsetId: string): Promise<Definition[]> {
    await db.initialize();
    
    const sql = `
      SELECT id, language, text, source
      FROM definitions
      WHERE synset_id = ?
    `;
    
    return await db.all<Definition>(sql, [synsetId]);
  }

  async getExamplesBySynsetId(synsetId: string): Promise<Example[]> {
    await db.initialize();
    
    const sql = `
      SELECT id, language, text, source
      FROM examples
      WHERE synset_id = ?
    `;
    
    return await db.all<Example>(sql, [synsetId]);
  }

  async getRelationsBySynsetId(synsetId: string): Promise<Relation[]> {
    await db.initialize();
    
    const sql = `
      SELECT id, type, target_id as target, source
      FROM relations
      WHERE source_id = ?
    `;
    
    return await db.all<Relation>(sql, [synsetId]);
  }
} 

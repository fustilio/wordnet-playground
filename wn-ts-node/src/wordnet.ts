import { db } from './db/database.js';
import { config } from './config.js';
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
import { BaseWordnet } from 'wn-ts-core'

export class Wordnet extends BaseWordnet {
  private _lexiconId: string;
  private _lexiconVersion?: string;
  private _expand: string[];
  private _normalizer?: ((form: string) => string) | undefined;
  private _lemmatizer?: ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>) | undefined;
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

    const [id, version] = config.splitLexiconSpecifier(lexicon);
    this._lexiconId = id;
    this._lexiconVersion = version;
    this._expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    this._normalizer = options.normalizer;
    this._lemmatizer = options.lemmatizer;
    this._searchAllForms = options.searchAllForms ?? true;

    if (options.lang) {
      this._lang = options.lang;
    }
  }

  async lexicons(): Promise<Lexicon[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, label, language, email, license, version, url, citation, logo, metadata
      FROM lexicons
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (this._lexiconId !== '*') {
      conditions.push('id = ?');
      params.push(this._lexiconId);
    }
    if (this._lexiconVersion && this._lexiconVersion !== '*') {
      conditions.push('version = ?');
      params.push(this._lexiconVersion);
    }
    
    if (this._lang) {
      conditions.push('language = ?');
      params.push(this._lang);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    return await db.all<Lexicon>(sql, params);
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
      } else if (this._lexiconId !== '*') {
        sql += ' AND w.lexicon = ?';
        params.push(this._lexiconId);
      }

      if (lang || this._lang) {
        sql += ' AND w.language = ?';
        params.push(lang || this._lang);
      }

      if (this._lexiconVersion && this._lexiconVersion !== '*') {
        sql += ' AND w.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
        params.push(this._lexiconId, this._lexiconVersion);
      }

      return await db.all<Word>(sql, params);
    }

    let normalizedForm = form;
    if (this._normalizer) {
      normalizedForm = this._normalizer(form);
    }

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
    } else if (this._lexiconId !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this._lexiconId);
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    if (this._lexiconVersion && this._lexiconVersion !== '*') {
      sql += ' AND w.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
      params.push(this._lexiconId, this._lexiconVersion);
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
    } else if (this._lexiconId !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this._lexiconId);
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    if (this._lexiconVersion && this._lexiconVersion !== '*') {
      sql += ' AND w.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
      params.push(this._lexiconId, this._lexiconVersion);
    }

    const words = await db.all<Word>(sql, params);

    // If no results and searchAllForms is enabled, try lemmatization
    if (words.length === 0 && this._searchAllForms && this._lemmatizer) {
      const lemmatizedForms = this._lemmatizer(normalizedForm, pos);
      const allForms = new Set<string>();
      
      for (const forms of Object.values(lemmatizedForms)) {
        for (const form of forms) {
          allForms.add(form);
        }
      }

      if (allForms.size > 0) {
        const formPlaceholders = Array.from(allForms).map(() => '?').join(',');
        sql = `
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
          sql += ' AND w.pos = ?';
          lemmatizedParams.push(pos);
        }

        if (lexicon && lexicon !== '*') {
          sql += ' AND w.lexicon = ?';
          lemmatizedParams.push(lexicon);
        } else if (this._lexiconId !== '*') {
          sql += ' AND w.lexicon = ?';
          lemmatizedParams.push(this._lexiconId);
        }

        if (lang ) {
          sql += ' AND w.language = ?';
          lemmatizedParams.push(lang);
        }

        if (this._lexiconVersion && this._lexiconVersion !== '*') {
          sql += ' AND w.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
          lemmatizedParams.push(this._lexiconId, this._lexiconVersion);
        }

        const lemmatizedWords = await db.all<Word>(sql, lemmatizedParams);
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
      } else if (this._lexiconId !== '*') {
        sql += ' AND s.lexicon = ?';
        params.push(this._lexiconId);
      }

      if (lang) {
        sql += ' AND s.language = ?';
        params.push(lang);
      }

      if (this._lexiconVersion && this._lexiconVersion !== '*') {
        sql += ' AND s.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
        params.push(this._lexiconId, this._lexiconVersion);
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
      } else if (this._lexiconId !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(this._lexiconId);
      }

      return await db.all<Sense>(sql, params);
    }
    
    // If form is provided, this is a form-based query with pos filter
    if (form) {
      let normalizedForm = form;
      if (this._normalizer) {
        normalizedForm = this._normalizer(form);
      }
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
      } else if (this._lexiconId !== '*') {
        sql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
        params.push(this._lexiconId);
      }

      if (lang || this._lang) {
        sql += ' AND w.language = ?';
        params.push(lang || this._lang);
      }

      let senses = await db.all<Sense>(sql, params);

      // If no results and searchAllForms is enabled, try lemmatization
      if (senses.length === 0 && this._searchAllForms && this._lemmatizer) {
        const lemmatizedForms = this._lemmatizer(normalizedForm, pos);
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
            lemmatizedSql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
            lemmatizedParams.push(lexicon);
          } else if (this._lexiconId !== '*') {
            lemmatizedSql += ' AND s.synset_id IN (SELECT id FROM synsets WHERE lexicon = ?)';
            lemmatizedParams.push(this._lexiconId);
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
      sql += ' AND sy.lexicon = ?';
      params.push(lexicon);
    } else if (this._lexiconId !== '*') {
      sql += ' AND sy.lexicon = ?';
      params.push(this._lexiconId);
    }

    if (lang || this._lang) {
      sql += ' AND w.language = ?';
      params.push(lang || this._lang);
    }

    if (this._lexiconVersion && this._lexiconVersion !== '*') {
      sql += ' AND sy.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
      params.push(this._lexiconId, this._lexiconVersion);
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
  }[]> {
    await db.initialize();
    
    const lexicons = await this.lexicons();
    const stats = [];
    
    for (const lexicon of lexicons) {
      if (lexiconId && lexicon.id !== lexiconId) continue;
      
      const wordCount = await db.get('SELECT COUNT(*) as count FROM words WHERE lexicon = ?', [lexicon.id]) as { count: number } | undefined;
      const synsetCount = await db.get('SELECT COUNT(*) as count FROM synsets WHERE lexicon = ?', [lexicon.id]) as { count: number } | undefined;
      
      stats.push({
        lexiconId: lexicon.id,
        label: lexicon.label,
        language: lexicon.language,
        version: lexicon.version || 'unknown',
        wordCount: wordCount?.count || 0,
        synsetCount: synsetCount?.count || 0,
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
} 

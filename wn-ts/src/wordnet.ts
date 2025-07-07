import { db } from './database.js';
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
  Example
} from './types.js';

export class Wordnet {
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

  async words(
    form: string,
    pos?: PartOfSpeech
  ): Promise<Word[]> {
    await db.initialize();

    let normalizedForm = form;
    if (this._normalizer) {
      normalizedForm = this._normalizer(form);
    }

    // Use UNION to include words that match by lemma OR by form
    let sql = `
      SELECT DISTINCT w.id, w.lemma, w.part_of_speech as partOfSpeech, w.language, w.lexicon
      FROM words w
      WHERE w.lemma = ?
    `;
    
    const params: unknown[] = [normalizedForm];

    if (pos) {
      sql += ' AND w.part_of_speech = ?';
      params.push(pos);
    }

    if (this._lexiconId !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this._lexiconId);
    }

    if (this._lang) {
      sql += ' AND w.language = ?';
      params.push(this._lang);
    }

    if (this._lexiconVersion && this._lexiconVersion !== '*') {
      sql += ' AND w.lexicon IN (SELECT id FROM lexicons WHERE id = ? AND version = ?)';
      params.push(this._lexiconId, this._lexiconVersion);
    }

    sql += `
      UNION
      SELECT DISTINCT w.id, w.lemma, w.part_of_speech as partOfSpeech, w.language, w.lexicon
      FROM words w
      JOIN forms f ON w.id = f.word_id
      WHERE f.written_form = ?
    `;
    
    params.push(normalizedForm);

    if (pos) {
      sql += ' AND w.part_of_speech = ?';
      params.push(pos);
    }

    if (this._lexiconId !== '*') {
      sql += ' AND w.lexicon = ?';
      params.push(this._lexiconId);
    }

    if (this._lang) {
      sql += ' AND w.language = ?';
      params.push(this._lang);
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
          SELECT DISTINCT w.id, w.lemma, w.part_of_speech as partOfSpeech, w.language, w.lexicon
          FROM words w
          WHERE w.lemma IN (${formPlaceholders})
          UNION
          SELECT DISTINCT w.id, w.lemma, w.part_of_speech as partOfSpeech, w.language, w.lexicon
          FROM words w
          JOIN forms f ON w.id = f.word_id
          WHERE f.written_form IN (${formPlaceholders})
        `;
        
        const formParams = [...Array.from(allForms), ...Array.from(allForms)];
          
        if (pos) {
          sql += ' AND w.part_of_speech = ?';
          formParams.push(pos);
        }

        if (this._lexiconId !== '*') {
          sql += ' AND w.lexicon = ?';
          formParams.push(this._lexiconId);
        }

        if (this._lang) {
          sql += ' AND w.language = ?';
          formParams.push(this._lang);
        }

        const lemmatizedWords = await db.all<Word>(sql, formParams);
        words.push(...lemmatizedWords);
      }
    }

    return words;
  }

  async synsets(
    form: string,
    pos?: PartOfSpeech,
    _ili?: string | ILI
  ): Promise<Synset[]> {
    await db.initialize();

    const words = await this.words(form, pos);
    const synsetIds = new Set<string>();

    for (const word of words) {
      const senses = await this.senses(word.id);
      for (const sense of senses) {
        synsetIds.add(sense.synset);
      }
    }

    const synsets: Synset[] = [];
    for (const synsetId of synsetIds) {
      const synset = await this.synset(synsetId);
      if (synset) {
        synsets.push(synset);
      }
    }

    return synsets;
  }

  async synset(synsetId: string): Promise<Synset | undefined> {
    await db.initialize();

    const sql = `
      SELECT id, ili, part_of_speech as partOfSpeech, language, lexicon
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
    const senses = await this.sensesBySynset(synsetId);
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

  // Method overloads for senses
  async senses(wordId: string): Promise<Sense[]>;
  async senses(form: string, pos?: PartOfSpeech): Promise<Sense[]>;
  async senses(wordIdOrForm: string, pos?: PartOfSpeech): Promise<Sense[]> {
    await db.initialize();
    // If pos is provided, this is a form-based query with pos filter
    if (pos !== undefined) {
      const form = wordIdOrForm;
      let normalizedForm = form;
      if (this._normalizer) {
        normalizedForm = this._normalizer(form);
      }
      let sql = `
        SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
               s.adjposition, s.subcategory, s.domain, s.register
        FROM senses s
        JOIN words w ON s.word_id = w.id
        LEFT JOIN forms f ON w.id = f.word_id
        WHERE (f.written_form = ? OR w.lemma = ?)
      `;
      const params: unknown[] = [normalizedForm, normalizedForm];
      sql += ' AND w.part_of_speech = ?';
      params.push(pos);
      if (this._lexiconId !== '*') {
        sql += ' AND w.lexicon = ?';
        params.push(this._lexiconId);
      }
      if (this._lang) {
        sql += ' AND w.language = ?';
        params.push(this._lang);
      }
      const senses = await db.all<Sense>(sql, params);
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
          sql = `
            SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
                   s.adjposition, s.subcategory, s.domain, s.register
            FROM senses s
            JOIN words w ON s.word_id = w.id
            LEFT JOIN forms f ON w.id = f.word_id
            WHERE (f.written_form IN (${formPlaceholders}) OR w.lemma IN (${formPlaceholders}))
          `;
          const formParams = [...Array.from(allForms), ...Array.from(allForms)];
          sql += ' AND w.part_of_speech = ?';
          formParams.push(pos);
          if (this._lexiconId !== '*') {
            sql += ' AND w.lexicon = ?';
            formParams.push(this._lexiconId);
          }
          if (this._lang) {
            sql += ' AND w.language = ?';
            formParams.push(this._lang);
          }
          const lemmatizedSenses = await db.all<Sense>(sql, formParams);
          senses.push(...lemmatizedSenses);
        }
      }
      return senses;
    } else {
      // Check if this looks like a wordId (contains hyphens and is not a simple word)
      const wordId = wordIdOrForm;
      if (wordId.includes('-')) {
        // This is a wordId-based query
        const sql = `
          SELECT id, word_id as word, synset_id as synset, source, sensekey,
                 adjposition, subcategory, domain, register
          FROM senses
          WHERE word_id = ?
        `;
        return await db.all<Sense>(sql, [wordId]);
      } else {
        // This is a form-based query without pos filter
        const form = wordIdOrForm;
        let normalizedForm = form;
        if (this._normalizer) {
          normalizedForm = this._normalizer(form);
        }
        let sql = `
          SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
                 s.adjposition, s.subcategory, s.domain, s.register
          FROM senses s
          JOIN words w ON s.word_id = w.id
          LEFT JOIN forms f ON w.id = f.word_id
          WHERE (f.written_form = ? OR w.lemma = ?)
        `;
        const params: unknown[] = [normalizedForm, normalizedForm];
        if (this._lexiconId !== '*') {
          sql += ' AND w.lexicon = ?';
          params.push(this._lexiconId);
        }
        if (this._lang) {
          sql += ' AND w.language = ?';
          params.push(this._lang);
        }
        const senses = await db.all<Sense>(sql, params);
        // If no results and searchAllForms is enabled, try lemmatization
        if (senses.length === 0 && this._searchAllForms && this._lemmatizer) {
          const lemmatizedForms = this._lemmatizer(normalizedForm);
          const allForms = new Set<string>();
          for (const forms of Object.values(lemmatizedForms)) {
            for (const form of forms) {
              allForms.add(form);
            }
          }
          if (allForms.size > 0) {
            const formPlaceholders = Array.from(allForms).map(() => '?').join(',');
            sql = `
              SELECT DISTINCT s.id, s.word_id as word, s.synset_id as synset, s.source, s.sensekey,
                     s.adjposition, s.subcategory, s.domain, s.register
              FROM senses s
              JOIN words w ON s.word_id = w.id
              LEFT JOIN forms f ON w.id = f.word_id
              WHERE (f.written_form IN (${formPlaceholders}) OR w.lemma IN (${formPlaceholders}))
            `;
            const formParams = [...Array.from(allForms), ...Array.from(allForms)];
            if (this._lexiconId !== '*') {
              sql += ' AND w.lexicon = ?';
              formParams.push(this._lexiconId);
            }
            if (this._lang) {
              sql += ' AND w.language = ?';
              formParams.push(this._lang);
            }
            const lemmatizedSenses = await db.all<Sense>(sql, formParams);
            senses.push(...lemmatizedSenses);
          }
        }
        return senses;
      }
    }
  }

  private async sensesBySynset(synsetId: string): Promise<Sense[]> {
    await db.initialize();
    
    const sql = `
      SELECT id, word_id as word, synset_id as synset, source, sensekey,
             adjposition, subcategory, domain, register
      FROM senses
      WHERE synset_id = ?
    `;
    
    return await db.all<Sense>(sql, [synsetId]);
  }

  async word(wordId: string): Promise<Word | undefined> {
    await db.initialize();

    const sql = `
      SELECT id, lemma, part_of_speech as partOfSpeech, language, lexicon
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

  async sense(senseId: string): Promise<Sense | undefined> {
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

  async ili(iliId: string): Promise<ILI | undefined> {
    await db.initialize();
    
    const sql = `
      SELECT id, definition, status, meta
      FROM ilis
      WHERE id = ?
    `;
    
    return await db.get<ILI>(sql, [iliId]);
  }

  async ilis(status?: string): Promise<ILI[]> {
    await db.initialize();
    
    let sql = `
      SELECT id, definition, status, meta
      FROM ilis
    `;
    
    const params: unknown[] = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY id';
    
    return await db.all<ILI>(sql, params);
  }
} 

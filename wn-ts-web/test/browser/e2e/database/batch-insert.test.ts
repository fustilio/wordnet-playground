import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Kysely } from 'kysely';
import { createSqliteWasmDialect } from '../../../../src/database/sqlite-wasm-dialect.js';
import { KyselyQueryService } from '../../../../src/database/kysely-query-service.js';
import type { Database } from '../../../../src/types/database.js';
import { WebDatabase } from '../../../../src/web-database.js';
import { batchInsert } from '../../../../src/database/batch-insert.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('batchInsert E2E', () => {
  let webDb: WebDatabase;
  let kyselyDb: Kysely<Database>;
  let queryService: KyselyQueryService;

  beforeAll(async () => {
    const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
    const sqlModule = await sqlite3({
      locateFile: (file: string) => `/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/${file}`
    });
    
    webDb = new WebDatabase();
    await webDb.initializeWithModule(sqlModule);
    await webDb.createDatabase();
    
    const dialect = createSqliteWasmDialect(webDb.getDatabase());
    kyselyDb = new Kysely<Database>({ dialect });
    queryService = new KyselyQueryService(kyselyDb);
    
    await queryService.createTables();
  }, 30000);

  beforeEach(async () => {
    await queryService.clearAllData();
    await queryService.insertLexicon({
      id: 'test-lexicon',
      label: 'Test',
      language: 'en',
      version: '1.0'
    });
  });

  afterAll(async () => {
    if (webDb) {
      webDb.close();
    }
  });

  it('should insert all rows in a single chunk if smaller than chunkSize', async () => {
    const testData = Array.from({ length: 10 }, (_, i) => ({
      id: `word-${i}`,
      lemma: `lemma-${i}`,
      pos: 'n',
      language: 'en',
      lexicon: 'test-lexicon'
    }));

    await batchInsert(kyselyDb, 'words', testData, 20);

    const countResult = await kyselyDb.selectFrom('words').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(10);
  });

  it('should insert all rows in multiple chunks', async () => {
    const testData = Array.from({ length: 25 }, (_, i) => ({
      id: `word-${i}`,
      lemma: `lemma-${i}`,
      pos: 'n',
      language: 'en',
      lexicon: 'test-lexicon'
    }));

    await batchInsert(kyselyDb, 'words', testData, 10); // 3 chunks: 10, 10, 5

    const countResult = await kyselyDb.selectFrom('words').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(25);
  });

  it('should handle empty data array gracefully', async () => {
    await batchInsert(kyselyDb, 'words', [], 10);
    const countResult = await kyselyDb.selectFrom('words').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(0);
  });
  
  it('should handle conflicts using onConflict...doNothing', async () => {
    const initialData = [{
      id: `word-1`,
      lemma: `lemma-1`,
      pos: 'n',
      language: 'en',
      lexicon: 'test-lexicon'
    }];

    // Insert initial data
    await batchInsert(kyselyDb, 'words', initialData, 10);
    let countResult = await kyselyDb.selectFrom('words').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(1);

    const conflictData = [
        { id: `word-1`, lemma: `lemma-1-conflict`, pos: 'v', language: 'en', lexicon: 'test-lexicon' },
        { id: `word-2`, lemma: `lemma-2`, pos: 'n', language: 'en', lexicon: 'test-lexicon' }
    ];

    // Attempt to insert data with a conflict
    await batchInsert(kyselyDb, 'words', conflictData, 10);

    // Check total count
    countResult = await kyselyDb.selectFrom('words').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(2);

    // Check that the conflicted row was not updated
    const word1 = await kyselyDb.selectFrom('words').selectAll().where('id', '=', 'word-1').executeTakeFirst();
    expect(word1?.lemma).toBe('lemma-1');
    expect(word1?.pos).toBe('n');
  });
});

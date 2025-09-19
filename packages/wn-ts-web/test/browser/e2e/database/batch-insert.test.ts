import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Kysely } from 'kysely';
import { createSqliteWasmDialect } from '../../../../src/database/sqlite-wasm-dialect.js';
import type { Database as SharedDatabase } from 'wn-ts-core';
import { WebDatabase } from '../../../../src/client/submodules/web-database.js';
import { batchInsert } from 'wn-ts-core';

// Extend the shared Database interface to include our test table
interface TestDatabase extends SharedDatabase {
  temp_batch: {
    id: string;
    value: string;
  };
}

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('batchInsert E2E', () => {
  let webDb: WebDatabase;
  let kyselyDb: Kysely<TestDatabase>;

  beforeAll(async () => {
    const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
    const sqlModule = await sqlite3({
      locateFile: (file: string) => `/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/${file}`
    });
    
    webDb = new WebDatabase();
    await webDb.initializeWithModule(sqlModule);
  }, 30000);

  beforeEach(async () => {
    await webDb.createDatabase();
    
    const dialect = createSqliteWasmDialect({ database: webDb.getDatabase(), sqlModule: (webDb as any).sqlModule });
    kyselyDb = new Kysely<TestDatabase>({ dialect });
    
    // Create test table using Kysely schema
    await kyselyDb.schema
      .createTable('temp_batch')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('value', 'text')
      .execute();
  });

  afterAll(async () => {
    if (webDb) {
      webDb.close();
    }
  });

  it('should insert all rows in a single chunk if smaller than chunkSize', async () => {
    const testData = Array.from({ length: 10 }, (_, i) => ({
      id: `word-${i}`,
      value: `val-${i}`
    }));

    // Cast to shared Database type for batchInsert, then back to TestDatabase for queries
    await batchInsert(kyselyDb as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, testData, 20);

    const countResult = await kyselyDb.selectFrom('temp_batch').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(10);
  });

  it('should insert all rows in multiple chunks', async () => {
    const testData = Array.from({ length: 25 }, (_, i) => ({
      id: `word-${i}`,
      value: `val-${i}`
    }));

    await batchInsert(kyselyDb as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, testData, 10); // 3 chunks: 10, 10, 5

    const countResult = await kyselyDb.selectFrom('temp_batch').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(25);
  });

  it('should handle empty data array gracefully', async () => {
    await batchInsert(kyselyDb as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, [], 10);
    const countResult = await kyselyDb.selectFrom('temp_batch').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(0);
  });
  
  it('should handle conflicts using onConflict...doNothing', async () => {
    const initialData = [{
      id: `word-1`,
      value: `val-1`
    }];

    // Insert initial data
    await batchInsert(kyselyDb as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, initialData, 10);
    let countResult = await kyselyDb.selectFrom('temp_batch').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(1);

    const conflictData = [
        { id: `word-1`, value: `val-1-conflict` },
        { id: `word-2`, value: `val-2` }
    ];

    // Attempt to insert data with a conflict
    await batchInsert(kyselyDb as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, conflictData, 10);

    // Check total count
    countResult = await kyselyDb.selectFrom('temp_batch').select(kyselyDb.fn.countAll().as('count')).executeTakeFirst();
    expect(Number(countResult?.count)).toBe(2);

    // Check that the conflicted row was not updated
    const word1 = await kyselyDb.selectFrom('temp_batch').selectAll().where('id', '=', 'word-1').executeTakeFirst();
    expect(word1?.value).toBe('val-1');
  });
});

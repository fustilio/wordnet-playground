import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Kysely } from 'kysely';
import { SqliteDialect } from 'kysely';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlinkSync } from 'fs';
import Database from 'better-sqlite3';
import { batchInsert } from 'wn-ts-core';
import type { Database as SharedDatabase } from 'wn-ts-core';

// Extend the shared Database interface to include our test table
interface TestDatabase extends SharedDatabase {
  temp_batch: {
    id: string;
    value: string;
  };
}

describe('Kysely Batch Insert', () => {
  let db: Kysely<TestDatabase>;
  let tempDbPath: string;

  function setupTable() {
    // Create a temporary database for testing
    tempDbPath = join(tmpdir(), `test-batch-${Date.now()}.db`);
    
    // Create a simple SQLite database for testing
    const sqliteDb = new Database(tempDbPath);
    
    // Create the test table
    sqliteDb.exec('DROP TABLE IF EXISTS temp_batch');
    sqliteDb.exec('CREATE TABLE temp_batch (id TEXT PRIMARY KEY, value TEXT)');
    
    // Create Kysely instance
    const dialect = new SqliteDialect({ database: sqliteDb });
    db = new Kysely<TestDatabase>({ dialect });
  }

  function teardownTable() {
    try {
      db?.destroy();
    } catch (error) {
      // Ignore cleanup errors
    }
    try {
      unlinkSync(tempDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  beforeEach(() => {
    setupTable();
  });

  afterEach(() => {
    teardownTable();
  });

  it('should insert all rows using default chunk size', async () => {
    const testRows = Array.from({ length: 10 }, (_, i) => ({ id: `test-${i}`, value: `val${i}` }));

    // Cast to shared Database type for batchInsert, then back to TestDatabase for queries
    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, testRows);
    const count = await db.selectFrom('temp_batch').select(db.fn.count<number>('id').as('cnt')).executeTakeFirst();
    expect(count?.cnt).toBe(10);
    
    // Verify actual data was inserted correctly
    const rows = await db.selectFrom('temp_batch').selectAll().orderBy('id').execute();
    expect(rows).toHaveLength(10);
    expect(rows[0]).toEqual({ id: 'test-0', value: 'val0' });
    expect(rows[9]).toEqual({ id: 'test-9', value: 'val9' });
  });

  it('should handle large batches efficiently', async () => {
    const largeBatch = Array.from({ length: 1000 }, (_, i) => ({ 
      id: `large-${i}`, 
      value: `large-val-${i}` 
    }));
    
    const startTime = performance.now();
    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, largeBatch);
    const endTime = performance.now();
    
    const count = await db.selectFrom('temp_batch').select(db.fn.count<number>('id').as('cnt')).executeTakeFirst();
    expect(count?.cnt).toBe(1000);
    
    // Should complete reasonably quickly (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should handle empty arrays gracefully', async () => {
    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, []);
    const count = await db.selectFrom('temp_batch').select(db.fn.count<number>('id').as('cnt')).executeTakeFirst();
    expect(count?.cnt).toBe(0);
  });

  it('should handle conflicts with onConflict strategy', async () => {
    // Insert initial data
    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, [{ id: 'test-1', value: 'original' }]);
    
    // Try to insert conflicting data - should be ignored due to onConflict doNothing
    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, [{ id: 'test-1', value: 'updated' }]);
    
    const row = await db.selectFrom('temp_batch').selectAll().where('id', '=', 'test-1').executeTakeFirst();
    expect(row?.value).toBe('original'); // Should keep original value
  });

  it('should respect custom chunk size', async () => {
    const testData = Array.from({ length: 25 }, (_, i) => ({ 
      id: `chunk-${i}`, 
      value: `chunk-val-${i}` 
    }));

    await batchInsert(db as unknown as Kysely<SharedDatabase>, 'temp_batch' as keyof SharedDatabase, testData, 10); // 3 chunks: 10, 10, 5

    const count = await db.selectFrom('temp_batch').select(db.fn.count<number>('id').as('cnt')).executeTakeFirst();
    expect(count?.cnt).toBe(25);
  });
});

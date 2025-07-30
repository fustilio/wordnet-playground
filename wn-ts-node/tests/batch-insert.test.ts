import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { batchInsert } from '../src/db/batch-insert';

function setupTable() {
  db.initialize();
  db.run('DROP TABLE IF EXISTS temp_batch');
  db.run('CREATE TABLE temp_batch (id INTEGER PRIMARY KEY, value TEXT)');
}

function teardownTable() {
  db.run('DROP TABLE IF EXISTS temp_batch');
  db.close();
}

describe('batchInsert correctness', () => {
  const testRows = Array.from({ length: 10 }, (_, i) => [i, `val${i}`]);

  beforeEach(() => {
    setupTable();
  });

  afterEach(() => {
    teardownTable();
  });

  it('batchInsert inserts all rows (default options)', () => {
    batchInsert('temp_batch', ['id', 'value'], testRows);
    const count = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM temp_batch');
    expect(count?.cnt).toBe(10);
  });

  it('batchInsertV5 inserts all rows (transactionChunkSize=5)', () => {
    batchInsert('temp_batch', ['id', 'value'], testRows, undefined, {
      transactionChunkSize: 5,
    });
    const count = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM temp_batch');
    expect(count?.cnt).toBe(10);
  });
});

import { bench, describe } from 'vitest';
import { db } from '../src/db/database';
import { batchInsert } from '../src/db/batch-insert';

const rowCount = 1000000;
const testData = Array.from({ length: rowCount }, (_, i) => [i, `val${i}`]);

function setupTable() {
  db.initialize();
  db.run('DROP TABLE IF EXISTS temp_batch');
  db.run('CREATE TABLE temp_batch (id INTEGER PRIMARY KEY, value TEXT)');
}

function teardownTable() {
  db.run('DROP TABLE IF EXISTS temp_batch');
  db.close();
}

const BENCH_OPTIONS = {
  iterations: 3,
  setup: setupTable,
  teardown: teardownTable,
};

describe('batchInsert fast transaction-based benchmarks', () => {
  bench(
    'batchInsert (default options)',
    () => {
      batchInsert('temp_batch', ['id', 'value'], testData);
    },
    BENCH_OPTIONS
  );

  bench(
    'batchInsert (transactionChunkSize=10000)',
    () => {
      batchInsert('temp_batch', ['id', 'value'], testData, undefined, {
        transactionChunkSize: 10000,
      });
    },
    BENCH_OPTIONS
  );
});

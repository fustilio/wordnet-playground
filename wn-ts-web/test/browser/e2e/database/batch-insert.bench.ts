import { bench, describe } from "vitest";
import { Kysely } from "kysely";
import { batchInsert } from "../../../../src/database/batch-insert.js";
import { KyselyQueryService } from "../../../../src/database/kysely-query-service.js";
import { createSqliteWasmDialect } from "../../../../src/database/sqlite-wasm-dialect.js";
import { WebDatabase } from "../../../../src/client/submodules/web-database.js";
import type { Database } from '../../../../src/types/database.js';

// A smaller row count for browser benchmarks to avoid timeouts
const rowCount = 10000;
const testData = Array.from({ length: rowCount }, (_, i) => ({
  id: `word-${i}`,
  lemma: `lemma-${i}`,
  part_of_speech: "n",
  language: "en",
  lexicon: "test-lexicon",
}));

let webDb: WebDatabase;
let kyselyDb: Kysely<Database>;
let queryService: KyselyQueryService;

async function setup() {
  const sqlite3 = (await import("@sqlite.org/sqlite-wasm")).default;
  const sqlModule = await sqlite3({
    locateFile: (file: string) =>
      `/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/${file}`,
  });

  webDb = new WebDatabase();
  await webDb.initializeWithModule(sqlModule);
  await webDb.createDatabase();

  const dialect = createSqliteWasmDialect(webDb.getDatabase());
  kyselyDb = new Kysely<Database>({ dialect });
  queryService = new KyselyQueryService(kyselyDb);

  await queryService.createTables();
  await queryService.clearAllData();
  await queryService.insertLexicon({
    id: "test-lexicon",
    label: "Test",
    language: "en",
    version: "1.0",
  });
}

function teardown() {
  if (webDb) {
    webDb.close();
  }
}

const BENCH_OPTIONS = {
  // A lower iteration count for slower browser operations
  iterations: 3, 
  setup,
  teardown,
  warmupIterations: 1,
  time: 0,
};

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("batchInsert benchmarks", () => {
  bench(
    `batchInsert (${rowCount.toLocaleString()} rows, default chunk size)`,
    async () => {
      await batchInsert(kyselyDb, "words", testData);
    },
    BENCH_OPTIONS
  );

  bench(
    `batchInsert (${rowCount.toLocaleString()} rows, chunk size = 500)`,
    async () => {
      await batchInsert(kyselyDb, "words", testData, 500);
    },
    BENCH_OPTIONS
  );
});

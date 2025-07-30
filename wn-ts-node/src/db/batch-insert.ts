import { db } from './database.js';

/**
 * batchInsert: Chunked transaction batching with optional PRAGMA optimizations.
 * - Accepts transactionChunkSize (default 10,000 rows) and usePragmas (default false).
 * - Each chunk of up to transactionChunkSize rows is inserted in a transaction, using V3 batching logic.
 */
export function batchInsert(
  tableName: string,
  columns: string[],
  data: any[][] = [],
  onProgress?: (progress: number) => void,
  options?: { transactionChunkSize?: number }
): void {
  if (!Array.isArray(data)) {
    throw new TypeError('batchInsert: data must be an array of arrays');
  }
  if (data.length === 0) return;
  const MAX_VARS = 900;
  const defaultBatchSize = Math.floor(MAX_VARS / columns.length);
  const colNames = columns.join(', ');
  const batchSize = defaultBatchSize;
  const transactionChunkSize = options?.transactionChunkSize || 10000;
 
  let lastProgress = 0;

  const insertChunk = (chunk: any[][], offset: number) => {
    db.transaction(() => {
      for (let i = 0; i < chunk.length; i += batchSize) {
        const batch = chunk.slice(i, i + batchSize);
        if (batch.length === 0) continue;
        const placeholders = batch
          .map(() => `(${columns.map(() => '?').join(', ')})`)
          .join(', ');
        const params: any[] = [];
        for (const row of batch) {
          if (Array.isArray(row)) {
            params.push(...row);
          } else {
            params.push(row);
          }
        }
        const sql = `INSERT OR REPLACE INTO ${tableName} (${colNames}) VALUES ${placeholders}`;
        db.run(sql, params);
        if (onProgress) {
          const progress = Math.min((offset + i + batch.length) / data.length, 1);
          if (progress >= lastProgress + 0.05 || progress === 1) {
            onProgress(progress);
            lastProgress = progress;
          }
        }
      }
    });
  };

  for (let i = 0; i < data.length; i += transactionChunkSize) {
    const chunk = data.slice(i, i + transactionChunkSize);
    insertChunk(chunk, i);
  }
}

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { batchInsert } from '../../src/shared/batch-insert.js';

// Simple in-memory mock that simulates Kysely's behavior
class MockKysely {
  private tables = new Map<string, any[]>();

  schema = {
    createTable: (tableName: string) => ({
      addColumn: (_name: string, _type: string) => ({
        addColumn: (_name2: string, _type2: string) => ({
          execute: async () => {
            if (!this.tables.has(tableName)) {
              this.tables.set(tableName, []);
            }
          }
        }),
        execute: async () => {
          if (!this.tables.has(tableName)) {
            this.tables.set(tableName, []);
          }
        }
      })
    }),
    dropTable: (tableName: string) => ({
      execute: async () => {
        this.tables.delete(tableName);
      }
    })
  };

  transaction() {
    return {
      execute: async (callback: any) => {
        const mockTrx = {
          insertInto: (tableName: string) => ({
            values: (data: any[]) => ({
              onConflict: (ocCallback: any) => {
                const mockOc = {
                  column: () => ({
                    doNothing: () => ({
                      execute: async () => {
                        const tableData = this.tables.get(tableName) || [];
                        // Simulate conflict handling - only insert if ID doesn't exist
                        const newRecords = data.filter(record => 
                          !tableData.some(existing => existing.id === record.id)
                        );
                        tableData.push(...newRecords);
                        this.tables.set(tableName, tableData);
                      }
                    })
                  })
                };
                return ocCallback(mockOc);
              }
            })
          })
        };
        return await callback(mockTrx);
      }
    };
  }

  getTableData(tableName: string) {
    return this.tables.get(tableName) || [];
  }
}

describe('Shared Batch Insert', () => {
  let db: MockKysely;

  beforeEach(async () => {
    db = new MockKysely();
    
    // Create test table
    await db.schema
      .createTable('temp_batch')
      .addColumn('id', 'text')
      .addColumn('value', 'text')
      .execute();
  });

  afterEach(async () => {
    await db.schema.dropTable('temp_batch').execute();
  });

  it('should insert all rows using default chunk size', async () => {
    const testRows = Array.from({ length: 10 }, (_, i) => ({ 
      id: `test-${i}`, 
      value: `val${i}` 
    }));

    await batchInsert(db as any, 'temp_batch' as any, testRows);
    
    const rows = db.getTableData('temp_batch');
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
    await batchInsert(db as any, 'temp_batch' as any, largeBatch);
    const endTime = performance.now();
    
    const rows = db.getTableData('temp_batch');
    expect(rows).toHaveLength(1000);
    
    // Should complete reasonably quickly (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should handle empty arrays gracefully', async () => {
    await batchInsert(db as any, 'temp_batch' as any, []);
    const rows = db.getTableData('temp_batch');
    expect(rows).toHaveLength(0);
  });

  it('should handle conflicts with onConflict strategy', async () => {
    // Insert initial data
    await batchInsert(db as any, 'temp_batch' as any, [{ 
      id: 'test-1', 
      value: 'original' 
    }]);
    
    // Try to insert conflicting data - should be ignored due to onConflict doNothing
    await batchInsert(db as any, 'temp_batch' as any, [{ 
      id: 'test-1', 
      value: 'updated' 
    }]);
    
    const rows = db.getTableData('temp_batch');
    const row = rows.find(r => r.id === 'test-1');
    expect(row?.value).toBe('original'); // Should keep original value
  });

  it('should respect custom chunk size', async () => {
    const testData = Array.from({ length: 25 }, (_, i) => ({ 
      id: `chunk-${i}`, 
      value: `chunk-val-${i}` 
    }));

    await batchInsert(db as any, 'temp_batch' as any, testData, 10); // 3 chunks: 10, 10, 5

    const rows = db.getTableData('temp_batch');
    expect(rows).toHaveLength(25);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebDatabase } from '../src/web-database';
import { mockSqliteWasm } from './setup';

vi.mock('@sqlite.org/sqlite-wasm', () => ({
  default: vi.fn().mockResolvedValue(mockSqliteWasm)
}));

describe('WebDatabase', () => {
  let database: WebDatabase;

  beforeEach(() => {
    database = new WebDatabase();
    vi.clearAllMocks();
  });

  it('should initialize with SQLite WASM module', async () => {
    await database.initializeWithModule(mockSqliteWasm);
    expect((database as any).sqlModule).toBe(mockSqliteWasm);
  });

  it('should create a database connection', async () => {
    await database.initializeWithModule(mockSqliteWasm);
    await database.createDatabase();
    
    const dbInstance = database.getDatabase();
    expect(dbInstance).toBeDefined();

    // Table creation is now handled by KyselyQueryService.
    // This test verifies that the database object is created and initialized.
    // The PRAGMA calls are a sign of initialization.
    expect(dbInstance.exec).toHaveBeenCalledWith('PRAGMA trace = 0');
    expect(dbInstance.exec).toHaveBeenCalledWith('PRAGMA vdbe_trace = 0');
  });

  it('should close the database', async () => {
    await database.initializeWithModule(mockSqliteWasm);
    await database.createDatabase();
    
    const dbInstance = database.getDatabase();
    database.close();
    
    expect(dbInstance.close).toHaveBeenCalled();
    expect(() => database.getDatabase()).toThrow('Database not initialized');
  });

  it('getDatabase should throw if not initialized', () => {
    expect(() => database.getDatabase()).toThrow('Database not initialized');
  });
});

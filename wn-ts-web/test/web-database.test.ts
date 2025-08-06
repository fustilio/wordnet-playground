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

  it('should create database and tables', async () => {
    await database.initializeWithModule(mockSqliteWasm);
    await database.createDatabase();
    
    const dbInstance = database.getDatabase();
    expect(dbInstance).toBeDefined();
    expect(dbInstance.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS lexicons'));
    expect(dbInstance.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS words'));
    expect(dbInstance.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS synsets'));
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

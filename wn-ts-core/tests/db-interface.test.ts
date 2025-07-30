import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DatabaseInterface, 
  DatabaseManagerInterface, 
  DatabaseRunResult, 
  DatabaseRow 
} from '../src/db/interface.js';
import { 
  PlaceholderDatabase, 
  PlaceholderDatabaseManager,
  db 
} from '../src/db/database.js';
import { DatabaseError } from '../src/types.js';

describe('Database Interface', () => {
  describe('DatabaseInterface', () => {
    it('should define the correct interface structure', () => {
      // This test ensures the interface is properly defined
      const dbInterface: DatabaseInterface = {
        initialize: () => {},
        isInitialized: () => false,
        close: () => {},
        run: () => ({ changes: 0, lastInsertRowid: 0 }),
        get: () => undefined,
        all: () => [],
        transaction: () => {},
        clearConnections: () => {},
        reset: () => {},
        isLocked: () => false,
      };
      
      expect(dbInterface.initialize).toBeDefined();
      expect(dbInterface.isInitialized).toBeDefined();
      expect(dbInterface.close).toBeDefined();
      expect(dbInterface.run).toBeDefined();
      expect(dbInterface.get).toBeDefined();
      expect(dbInterface.all).toBeDefined();
      expect(dbInterface.transaction).toBeDefined();
      expect(dbInterface.clearConnections).toBeDefined();
      expect(dbInterface.reset).toBeDefined();
      expect(dbInterface.isLocked).toBeDefined();
    });
  });

  describe('DatabaseManagerInterface', () => {
    it('should define the correct manager interface structure', () => {
      // This test ensures the manager interface is properly defined
      const manager: DatabaseManagerInterface = {
        getDatabase: () => ({
          initialize: () => {},
          isInitialized: () => false,
          close: () => {},
          run: () => ({ changes: 0, lastInsertRowid: 0 }),
          get: () => undefined,
          all: () => [],
          transaction: () => {},
          clearConnections: () => {},
          reset: () => {},
          isLocked: () => false,
        }),
        createDatabase: () => ({
          initialize: () => {},
          isInitialized: () => false,
          close: () => {},
          run: () => ({ changes: 0, lastInsertRowid: 0 }),
          get: () => undefined,
          all: () => [],
          transaction: () => {},
          clearConnections: () => {},
          reset: () => {},
          isLocked: () => false,
        }),
        isAvailable: () => false,
      };
      
      expect(manager.getDatabase).toBeDefined();
      expect(manager.createDatabase).toBeDefined();
      expect(manager.isAvailable).toBeDefined();
    });
  });

  describe('PlaceholderDatabase', () => {
    let db: PlaceholderDatabase;

    beforeEach(() => {
      db = new PlaceholderDatabase();
    });

    it('should implement DatabaseInterface', () => {
      expect(db).toBeInstanceOf(PlaceholderDatabase);
      expect(db.initialize).toBeDefined();
      expect(db.isInitialized).toBeDefined();
      expect(db.close).toBeDefined();
      expect(db.run).toBeDefined();
      expect(db.get).toBeDefined();
      expect(db.all).toBeDefined();
      expect(db.transaction).toBeDefined();
      expect(db.clearConnections).toBeDefined();
      expect(db.reset).toBeDefined();
      expect(db.isLocked).toBeDefined();
    });

    it('should start as not initialized', () => {
      expect(db.isInitialized()).toBe(false);
    });

    it('should throw DatabaseError when initialize is called', () => {
      expect(() => db.initialize()).toThrow(DatabaseError);
      expect(() => db.initialize()).toThrow('Database not available in wn-ts-core');
    });

    it('should throw DatabaseError when run is called', () => {
      expect(() => db.run('SELECT 1')).toThrow(DatabaseError);
      expect(() => db.run('SELECT 1')).toThrow('Database not available in wn-ts-core');
    });

    it('should throw DatabaseError when get is called', () => {
      expect(() => db.get('SELECT 1')).toThrow(DatabaseError);
      expect(() => db.get('SELECT 1')).toThrow('Database not available in wn-ts-core');
    });

    it('should throw DatabaseError when all is called', () => {
      expect(() => db.all('SELECT 1')).toThrow(DatabaseError);
      expect(() => db.all('SELECT 1')).toThrow('Database not available in wn-ts-core');
    });

    it('should throw DatabaseError when transaction is called', () => {
      expect(() => db.transaction(() => {})).toThrow(DatabaseError);
      expect(() => db.transaction(() => {})).toThrow('Database not available in wn-ts-core');
    });

    it('should not throw when close is called', () => {
      expect(() => db.close()).not.toThrow();
    });

    it('should not throw when clearConnections is called', () => {
      expect(() => db.clearConnections()).not.toThrow();
    });

    it('should not throw when reset is called', () => {
      expect(() => db.reset()).not.toThrow();
    });

    it('should return false for isLocked', () => {
      expect(db.isLocked()).toBe(false);
    });

    it('should track initialization state', () => {
      expect(db.isInitialized()).toBe(false);
      
      // Call initialize (will throw but should set state)
      expect(() => db.initialize()).toThrow();
      expect(db.isInitialized()).toBe(true);
      
      // Call close
      db.close();
      expect(db.isInitialized()).toBe(false);
    });
  });

  describe('PlaceholderDatabaseManager', () => {
    let manager: PlaceholderDatabaseManager;

    beforeEach(() => {
      manager = new PlaceholderDatabaseManager();
    });

    it('should implement DatabaseManagerInterface', () => {
      expect(manager).toBeInstanceOf(PlaceholderDatabaseManager);
      expect(manager.getDatabase).toBeDefined();
      expect(manager.createDatabase).toBeDefined();
      expect(manager.isAvailable).toBeDefined();
    });

    it('should return false for isAvailable', () => {
      expect(manager.isAvailable()).toBe(false);
    });

    it('should create database instances', () => {
      const db1 = manager.createDatabase();
      const db2 = manager.createDatabase();
      
      expect(db1).toBeInstanceOf(PlaceholderDatabase);
      expect(db2).toBeInstanceOf(PlaceholderDatabase);
      expect(db1).not.toBe(db2); // Should be different instances
    });

    it('should return the same database instance on multiple calls', () => {
      const db1 = manager.getDatabase();
      const db2 = manager.getDatabase();
      
      expect(db1).toBeInstanceOf(PlaceholderDatabase);
      expect(db2).toBeInstanceOf(PlaceholderDatabase);
      expect(db1).toBe(db2); // Should be the same instance
    });

    it('should close database when manager is closed', () => {
      const database = manager.getDatabase();
      expect(database.isInitialized()).toBe(false);
      
      // Initialize (will throw but set state)
      expect(() => database.initialize()).toThrow();
      expect(database.isInitialized()).toBe(true);
      
      // Close manager
      manager.close();
      expect(database.isInitialized()).toBe(false);
    });
  });

  describe('Default database export', () => {
    it('should export a placeholder database manager', () => {
      expect(db).toBeInstanceOf(PlaceholderDatabaseManager);
      expect(db.isAvailable()).toBe(false);
    });

    it('should provide a database instance', () => {
      const database = db.getDatabase();
      expect(database).toBeInstanceOf(PlaceholderDatabase);
    });
  });
}); 
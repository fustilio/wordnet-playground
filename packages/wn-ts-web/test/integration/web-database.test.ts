import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { WebDatabase } from "../../src/client/submodules/web-database.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

const isNode = typeof process !== "undefined";

describe.skipIf(isNode)("WebDatabase with Real Browser DB", () => {
  let database: WebDatabase;
  let sqlModule: Sqlite3Static | undefined;

  beforeAll(async () => {
    try {
      const sqlite3 = (await import("@sqlite.org/sqlite-wasm")).default;
      sqlModule = await sqlite3();
    } catch (e) {
      console.warn("Could not load sqlite-wasm, skipping tests");
    }
  });

  beforeEach(() => {
    if (!sqlModule) return;
    database = new WebDatabase();
  });

  it.skipIf(!sqlModule)(
    "should initialize with SQLite WASM module",
    async () => {
      if (!sqlModule) {
        throw new Error("SQLite WASM module not loaded");
      }
      await database.initializeWithModule(sqlModule);
      expect((database as any).sqlModule).toBe(sqlModule);
    }
  );

  it.skipIf(!sqlModule)("should create a database connection", async () => {
    if (!sqlModule) {
      throw new Error("SQLite WASM module not loaded");
    }
    await database.initializeWithModule(sqlModule);
    await database.createDatabase();

    const dbInstance = database.getDatabase();
    expect(dbInstance).toBeDefined();

    // Test that we can execute a simple query
    const result = dbInstance.exec("SELECT 1");
    expect(result).toBeDefined();
  });

  it.skipIf(!sqlModule)("should close the database", async () => {
    if (!sqlModule) {
      throw new Error("SQLite WASM module not loaded");
    }
    await database.initializeWithModule(sqlModule);
    await database.createDatabase();

    const dbInstance = database.getDatabase();
    const closeSpy = vi.spyOn(dbInstance, "close");

    database.close();

    expect(closeSpy).toHaveBeenCalled();
    expect(() => database.getDatabase()).toThrow("Database not initialized");
  });

  it.skipIf(!sqlModule)("getDatabase should throw if not initialized", () => {
    expect(() => database.getDatabase()).toThrow("Database not initialized");
  });
});

import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { WebDatabase } from "../../src/client/submodules/web-database.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

const isNode = typeof process !== "undefined";

console.log("Environment check:", { 
  isNode, 
  hasProcess: typeof process !== "undefined",
  hasWindow: typeof window !== "undefined",
  hasSelf: typeof self !== "undefined",
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "undefined"
});

describe("WebDatabase with Real Browser DB", () => {
  let database: WebDatabase;
  let sqlModule: Sqlite3Static | undefined;

  beforeAll(async () => {
    try {
      console.log("Attempting to load SQLite WASM module...");
      const sqlite3 = (await import("@sqlite.org/sqlite-wasm")).default;
      console.log("SQLite WASM module imported successfully");
      sqlModule = await sqlite3();
      console.log("SQLite WASM module initialized successfully");
    } catch (e) {
      console.error("Could not load sqlite-wasm:", e);
      console.warn("Could not load sqlite-wasm, skipping tests");
    }
  });

  beforeEach(() => {
    if (!sqlModule) {
      throw new Error("SQLite WASM module not loaded");
    }
    database = new WebDatabase();
  });

  it("should initialize with SQLite WASM module", async () => {
    if (!sqlModule) {
      throw new Error("SQLite WASM module not loaded");
    }
    await database.initializeWithModule(sqlModule);
    expect((database as any).sqlModule).toBe(sqlModule);
  });

  it("should create a database connection", async () => {
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

  it("should close the database", async () => {
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

  it("getDatabase should throw if not initialized", () => {
    expect(() => database.getDatabase()).toThrow("Database not initialized");
  });
});

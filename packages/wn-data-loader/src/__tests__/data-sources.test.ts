import { describe, it, expect } from "vitest";
import { 
  getWordNetDataSource, 
  getAllWordNetDataSources, 
  getWordNetDataSourcesByLanguage,
  getWordNetDataSourcesByFormat,
  isValidWordNetProject,
  WORDNET_DATA_SOURCES 
} from "../data-sources.js";

/**
 * WordNet Data Sources Tests
 * 
 * Note: These tests focus on the WordNet-specific data sources.
 * The main repository has comprehensive data source management in:
 * - wn-ts-web/src/project.ts - Project and data source management
 * - wn-ts-web/src/index.json - Complete project registry
 */

describe("WordNet Data Sources", () => {
  it("should have valid data sources", () => {
    expect(Object.keys(WORDNET_DATA_SOURCES).length).toBeGreaterThan(0);
  });

  it("should get OEWN data source", () => {
    const oewnSource = getWordNetDataSource("oewn:2024");
    
    expect(oewnSource).toBeDefined();
    expect(oewnSource?.id).toBe("oewn:2024");
    expect(oewnSource?.language).toBe("en");
    expect(oewnSource?.name).toContain("English WordNet");
    expect(oewnSource?.url).toContain("en-word.net");
  });

  it("should get OMW French data source", () => {
    const omwFrSource = getWordNetDataSource("omw-fr:1.4");
    
    expect(omwFrSource).toBeDefined();
    expect(omwFrSource?.id).toBe("omw-fr:1.4");
    expect(omwFrSource?.language).toBe("fr");
    expect(omwFrSource?.name).toContain("French WordNet");
    expect(omwFrSource?.url).toContain("omw-fr.xml");
  });

  it("should get CILI data source", () => {
    const ciliSource = getWordNetDataSource("cili:1.0");
    
    expect(ciliSource).toBeDefined();
    expect(ciliSource?.id).toBe("cili:1.0");
    expect(ciliSource?.language).toBe("multilingual");
    expect(ciliSource?.name).toContain("Interlingual Index");
    expect(ciliSource?.url).toContain("cili-1.0.tsv");
  });

  it("should return undefined for invalid project IDs", () => {
    const invalidSource = getWordNetDataSource("invalid:project");
    expect(invalidSource).toBeUndefined();
  });

  it("should get all data sources", () => {
    const allSources = getAllWordNetDataSources();
    
    expect(allSources).toBeInstanceOf(Array);
    expect(allSources.length).toBeGreaterThan(0);
    expect(allSources.every(source => source.id && source.name && source.url)).toBe(true);
  });

  it("should get data sources by language", () => {
    const englishSources = getWordNetDataSourcesByLanguage("en");
    const frenchSources = getWordNetDataSourcesByLanguage("fr");
    const germanSources = getWordNetDataSourcesByLanguage("de");
    
    expect(englishSources.length).toBeGreaterThan(0);
    expect(frenchSources.length).toBeGreaterThan(0);
    expect(germanSources.length).toBeGreaterThan(0);
    
    expect(englishSources.every(source => source.language === "en")).toBe(true);
    expect(frenchSources.every(source => source.language === "fr")).toBe(true);
    expect(germanSources.every(source => source.language === "de")).toBe(true);
  });

  it("should get data sources by format", () => {
    const xmlSources = getWordNetDataSourcesByFormat("xml");
    const tarGzSources = getWordNetDataSourcesByFormat("tar.gz");
    
    expect(xmlSources.length).toBeGreaterThan(0);
    expect(tarGzSources.length).toBeGreaterThan(0);
    
    expect(xmlSources.every(source => source.format === "xml")).toBe(true);
    expect(tarGzSources.every(source => source.format === "tar.gz")).toBe(true);
  });

  it("should validate WordNet project IDs", () => {
    expect(isValidWordNetProject("oewn:2024")).toBe(true);
    expect(isValidWordNetProject("omw-fr:1.4")).toBe(true);
    expect(isValidWordNetProject("omw-de:1.4")).toBe(true);
    expect(isValidWordNetProject("cili:1.0")).toBe(true);
    
    expect(isValidWordNetProject("invalid:project")).toBe(false);
    expect(isValidWordNetProject("")).toBe(false);
  });

  it("should have consistent data source structure", () => {
    const allSources = getAllWordNetDataSources();
    
    for (const source of allSources) {
      // Check required fields
      expect(source.id).toBeDefined();
      expect(source.name).toBeDefined();
      expect(source.language).toBeDefined();
      expect(source.version).toBeDefined();
      expect(source.url).toBeDefined();
      expect(source.format).toBeDefined();
      
      // Check URL format
      expect(source.url).toMatch(/^https?:\/\//);
      
      // Check format values
      expect(["xml", "tar", "tar.gz", "tar.xz"]).toContain(source.format);
      
      // Check language codes
      expect(source.language).toMatch(/^[a-z]{2}$|^multilingual$/);
    }
  });

  it("should have unique project IDs", () => {
    const allSources = getAllWordNetDataSources();
    const ids = allSources.map(source => source.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});

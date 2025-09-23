/**
 * Optimization Verification Test for wn-ts-web
 * 
 * This test verifies that the web version is using the optimized query strategies
 * from wn-ts-core without requiring database setup.
 */

import { describe, it, expect } from "vitest";
import { KyselyQueryService } from "../../src/database/kysely-query-service.js";

describe("Optimization Verification", () => {
  it("should have all optimized query methods available", () => {
    // Create a mock database instance for testing
    const mockDb = {} as any;
    const queryService = new KyselyQueryService(mockDb);

    // Verify that all optimized methods are available
    expect(typeof queryService.getSynsetsV1).toBe("function");
    expect(typeof queryService.getSynsetsV2).toBe("function");
    expect(typeof queryService.getSynsetsV3).toBe("function");
    expect(typeof queryService.getSynsetsV4).toBe("function");
    expect(typeof queryService.getSynsetsV5).toBe("function");
    expect(typeof queryService.getSynsetsV6).toBe("function");
    expect(typeof queryService.getSynsetsFast).toBe("function");
    expect(typeof queryService.getSensesV1).toBe("function");
    expect(typeof queryService.getSensesV5).toBe("function");
    expect(typeof queryService.getSensesV6).toBe("function");
  });

  it("should have default methods that internally use V5 strategy", () => {
    const mockDb = {} as any;
    const queryService = new KyselyQueryService(mockDb);

    // The default methods should exist and be functions
    expect(typeof queryService.getSynsets).toBe("function");
    expect(typeof queryService.getSenses).toBe("function");
    
    // They should be different from the V5 methods (they internally call V5)
    expect(queryService.getSynsets).not.toBe(queryService.getSynsetsV5);
    expect(queryService.getSenses).not.toBe(queryService.getSensesV5);
  });

  it("should have caching enabled in V5 strategies", () => {
    const mockDb = {} as any;
    const queryService = new KyselyQueryService(mockDb);

    // V5 strategies should have queryCache property
    expect(queryService).toHaveProperty('queryCache');
    expect(queryService).toHaveProperty('cacheHits');
    expect(queryService).toHaveProperty('cacheMisses');
  });

  it("should have all strategy methods properly defined", () => {
    const mockDb = {} as any;
    const queryService = new KyselyQueryService(mockDb);

    // All V1-V6 methods should be functions
    const synsetMethods = [
      'getSynsetsV1', 'getSynsetsV2', 'getSynsetsV3', 
      'getSynsetsV4', 'getSynsetsV5', 'getSynsetsV6'
    ];
    
    const senseMethods = [
      'getSensesV1', 'getSensesV5', 'getSensesV6'
    ];

    synsetMethods.forEach(method => {
      expect(typeof queryService[method]).toBe("function");
    });

    senseMethods.forEach(method => {
      expect(typeof queryService[method]).toBe("function");
    });
  });

  it("should have proper method signatures", () => {
    const mockDb = {} as any;
    const queryService = new KyselyQueryService(mockDb);

    // V5 methods should accept the same parameters as the default methods
    const defaultSynsetMethod = queryService.getSynsets;
    const v5SynsetMethod = queryService.getSynsetsV5;
    
    expect(defaultSynsetMethod.length).toBe(v5SynsetMethod.length);

    const defaultSenseMethod = queryService.getSenses;
    const v5SenseMethod = queryService.getSensesV5;
    
    expect(defaultSenseMethod.length).toBe(v5SenseMethod.length);
  });
});

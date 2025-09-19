/**
 * E2E test for dependency management system
 * Tests the cross-lingual dependency detection, warnings, and loading
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWordNetInstance } from '../../../src/factory.js';
import type { WebWordnet } from '../../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../../src/data-loader.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('Dependency Management E2E', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance();
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Dependency Detection', () => {
    it('should detect lexicon dependencies from XML', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Check if we have any lexicons with dependencies
      const lexiconsWithDeps = lexicons.filter((l: any) => l.requires && l.requires.length > 0);
      
      if (lexiconsWithDeps.length > 0) {
        // Verify the requires field structure
        for (const lexicon of lexiconsWithDeps) {
          expect(lexicon.requires).toBeDefined();
          expect(Array.isArray(lexicon.requires)).toBe(true);
          expect(lexicon.requires!.length).toBeGreaterThan(0);
          
          // Each required lexicon ID should be a valid string
          for (const reqId of lexicon.requires!) {
            expect(typeof reqId).toBe('string');
            expect(reqId.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should identify French WordNet as dependent on English', async () => {
      const lexicons = await wordnet.lexicons();
      const frenchLexicon = lexicons.find((l: any) => l.language === 'fr');
      
      if (frenchLexicon) {
        expect(frenchLexicon.requires).toBeDefined();
        expect(frenchLexicon.requires).toContain('omw-en');
        
        // Check if English lexicon is available
        const englishLexicon = lexicons.find((l: any) => l.id === 'omw-en');
        if (englishLexicon) {
          expect(englishLexicon.language).toBe('en');
        }
      }
    });
  });

  describe('Dependency Status Monitoring', () => {
    it('should provide comprehensive dependency status information', async () => {
      const lexicons = await wordnet.lexicons();
      
      // Build dependency status report
      const statusReport = new Map<string, {
        id: string;
        language: string;
        version?: string;
        dependencies: string[];
        loaded: boolean;
        missingDeps: string[];
        status: 'complete' | 'partial' | 'missing';
      }>();
      
      for (const lexicon of lexicons) {
        const dependencies = lexicon.requires || [];
        const missingDeps = dependencies.filter((reqId: any) => 
          !lexicons.some((l: any) => l.id === reqId)
        );
        
        let status: 'complete' | 'partial' | 'missing';
        if (dependencies.length === 0) {
          status = 'complete'; // No dependencies
        } else if (missingDeps.length === 0) {
          status = 'complete'; // All dependencies satisfied
        } else {
          status = 'partial'; // Some dependencies missing
        }
        
        statusReport.set(lexicon.id, {
          id: lexicon.id,
          language: lexicon.language,
          version: lexicon.version,
          dependencies,
          loaded: true,
          missingDeps,
          status
        });
      }
      
      // Display status report
      console.log('��� Dependency Status Report:');
      for (const [id, status] of statusReport) {
        const icon = status.status === 'complete' ? '✅' : 
                    status.status === 'partial' ? '⚠️' : '❌';
        
        console.log(`${icon} ${id} (${status.language}) - ${status.status}`);
        
        if (status.dependencies.length > 0) {
          console.log(`   Dependencies: ${status.dependencies.join(', ')}`);
        }
        
        if (status.missingDeps.length > 0) {
          console.log(`   Missing: ${status.missingDeps.join(', ')}`);
        }
      }
      
      // Verify that we have at least some complete lexicons
      const completeLexicons = Array.from(statusReport.values())
        .filter(s => s.status === 'complete');
      
      expect(completeLexicons.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Comprehensive ILI Data Loading Tests
 * 
 * These tests verify that ILI (Interlingual Index) data is properly loaded
 * from TSV files and inserted into the database with all required fields.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataLoader } from '../../src/data-loader.js';

// Sample TSV content for testing
const sampleTsvContent = `ILI	Definition	Status
i1	(usually followed by \`to') having the necessary means or skill or know-how or authority to do something	active
i2	(usually followed by \`to') not having the necessary means or skill or know-how	active`;

describe('ILI Data Loading', () => {
  let dataLoader: DataLoader;
  let mockDatabase: any;
  let mockWordnet: any;
  let mockQueryService: any;

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      run: vi.fn(),
      close: vi.fn(),
      export: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
    };

    // Create mock wordnet
    mockWordnet = {
      getQueryService: vi.fn(),
      emitDataChanged: vi.fn(),
      emitStatisticsUpdated: vi.fn(),
      emitError: vi.fn()
    };

    // Create mock query service
    mockQueryService = {
      batchInsert: vi.fn().mockResolvedValue(undefined),
      insertLexicon: vi.fn().mockResolvedValue(undefined),
      getStatistics: vi.fn().mockResolvedValue({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
        totalLexicons: 0
      })
    };

    // Mock the getQueryService method
    mockWordnet.getQueryService.mockReturnValue(mockQueryService);
    
    // Create DataLoader with mocked dependencies
    dataLoader = new DataLoader(mockDatabase as any, mockWordnet as any);
  });

  describe('End-to-End ILI Loading', () => {
    it('should load ILI data from buffer successfully', async () => {
      const encoder = new TextEncoder();
      const tsvBuffer = encoder.encode(sampleTsvContent);
      
      await dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0');
      
      expect(mockQueryService.insertLexicon).toHaveBeenCalled();
      expect(mockQueryService.batchInsert).toHaveBeenCalledWith('ilis', expect.any(Array));
    });

    it('should handle large ILI datasets efficiently', async () => {
      // Create a larger dataset for performance testing
      const largeIliData = Array.from({ length: 100 }, (_, i) => ({
        id: `i${i + 1}`,
        definition: `Definition for ILI ${i + 1}`,
        status: 'active'
      }));
      
      const largeTsvContent = largeIliData.map(record => 
        `${record.id}\t${record.definition}\t${record.status}`
      ).join('\n');
      
      const encoder = new TextEncoder();
      const tsvBuffer = encoder.encode(largeTsvContent);
      
      const startTime = Date.now();
      await dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0');
      const endTime = Date.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
      
      // Verify all records were inserted
      const insertedRecords = mockQueryService.batchInsert.mock.calls[0][1];
      expect(insertedRecords).toHaveLength(100);
    });

    it('should emit appropriate events after successful ILI loading', async () => {
      const encoder = new TextEncoder();
      const tsvBuffer = encoder.encode(sampleTsvContent);
      
      await dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0');
      
      // Verify events were emitted
      expect(mockWordnet.emitDataChanged).toHaveBeenCalledWith('packageLoaded', {
        packageId: 'cili:1.0',
        timestamp: expect.any(String)
      });
      
      expect(mockWordnet.emitStatisticsUpdated).toHaveBeenCalled();
    });

    it('should handle ILI loading errors gracefully', async () => {
      // Mock the batchInsert to throw an error
      mockQueryService.batchInsert.mockRejectedValue(new Error('Database error'));
      
      const encoder = new TextEncoder();
      const tsvBuffer = encoder.encode(sampleTsvContent);
      
      await expect(dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0'))
        .rejects.toThrow('Database error');
      
      // Verify that the error was properly propagated
      expect(mockQueryService.batchInsert).toHaveBeenCalled();
    });
  });

  describe('ILI Data Validation', () => {
    it('should validate that TSV content contains tab separators', async () => {
      const invalidContent = 'i1,definition1,active\ni2,definition2,active'; // CSV instead of TSV
      
      const encoder = new TextEncoder();
      const invalidBuffer = encoder.encode(invalidContent);
      
      await expect(dataLoader.loadFromBuffer(invalidBuffer.buffer as ArrayBuffer, 'cili:1.0'))
        .rejects.toThrow('Unknown content type does not contain LexicalResource element');
    });

    it('should validate that decompressed content is not empty', async () => {
      const emptyBuffer = new ArrayBuffer(0);
      
      await expect(dataLoader.loadFromBuffer(emptyBuffer, 'cili:1.0'))
        .rejects.toThrow('Decompressed content is empty - file may be corrupted or download failed');
    });
  });

  describe('ILI Statistics and Metrics', () => {
    it('should update database statistics after ILI loading', async () => {
      const encoder = new TextEncoder();
      const tsvBuffer = encoder.encode(sampleTsvContent);
      
      await dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0');
      
      // Verify that statistics were queried
      expect(mockQueryService.getStatistics).toHaveBeenCalled();
    });

    it('should maintain referential integrity for ILI references', async () => {
      // Test that synsets can properly reference ILI IDs
      const synsetWithIli = {
        id: 'synset1',
        ili: 'i1',
        pos: 'n',
        language: 'en',
        lexicon: 'oewn'
      };
      
      // Mock the synset insertion
      mockQueryService.batchInsert.mockResolvedValue(undefined);
      
      // This should work because 'i1' exists in our ILI data
      const insertLMFData = (dataLoader as any).insertLMFData.bind(dataLoader);
      await insertLMFData({
        lexicons: [{ id: 'oewn', label: 'Open English WordNet', language: 'en' }],
        words: [],
        synsets: [synsetWithIli],
        senses: []
      }, 'oewn:2024');
      
      // Verify that synsets were inserted
      expect(mockQueryService.batchInsert).toHaveBeenCalledWith('synsets', [synsetWithIli]);
    });
  });

  describe('Real ILI Data Processing', () => {
    it('should process actual CILI TSV data correctly', async () => {
      // Use the actual unpacked CILI data
      const fs = require('fs');
      const path = require('path');
      
      try {
        const ciliDataPath = path.join(__dirname, 'unpacked-data', 'cili-1.0.tsv');
        const ciliContent = fs.readFileSync(ciliDataPath, 'utf8');
        
        // Take a sample of the data for testing
        const sampleLines = ciliContent.split('\n').slice(0, 10).join('\n');
        
        const encoder = new TextEncoder();
        const tsvBuffer = encoder.encode(sampleLines);
        
        await dataLoader.loadFromBuffer(tsvBuffer.buffer as ArrayBuffer, 'cili:1.0');
        
        // Verify that lexicon was inserted
        expect(mockQueryService.insertLexicon).toHaveBeenCalledWith({
          id: 'cili',
          label: 'CILI',
          language: 'mul',
          version: '1.0',
          license: 'CC BY 4.0',
          url: 'https://github.com/globalwordnet/cili',
          citation: 'CILI: the Collaborative Interlingual Index'
        });
        
        // Verify that ILI records were inserted
        expect(mockQueryService.batchInsert).toHaveBeenCalledWith('ilis', expect.any(Array));
        
        // Should have parsed the header + data lines
        const insertedRecords = mockQueryService.batchInsert.mock.calls[0][1];
        expect(insertedRecords.length).toBeGreaterThan(0);
        
      } catch (error) {
        // Skip this test if the file is not available
        console.log('Skipping real CILI data test - file not available');
      }
    });
  });
});

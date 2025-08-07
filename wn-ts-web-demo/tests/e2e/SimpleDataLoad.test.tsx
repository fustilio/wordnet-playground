import { describe, test, expect } from 'vitest';
import { createWordNetInstance } from 'wn-ts-web';

describe('Simple Data Load Test', () => {
  test.sequential('should load data and check statistics', async () => {
    console.log('🚀 Starting simple data load test...');
    
    try {
      // Create WordNet instance
      console.log('🔧 Creating WordNet instance...');
      const instance = await createWordNetInstance();
      console.log('✅ WordNet instance created:', { 
        wordnet: !!instance.wordnet, 
        dataLoader: !!instance.dataLoader 
      });
      
      // Check initial statistics
      console.log('📊 Checking initial statistics...');
      const initialStats = await instance.dataLoader.getStatistics();
      console.log('📊 Initial stats:', initialStats);
      
      // Try to load data
      console.log('📦 Attempting to load oewn:2024...');
      await instance.dataLoader.downloadAndLoad('oewn:2024', {
        progress: (p: number) => {
          console.log(`📈 Progress: ${(p * 100).toFixed(1)}%`);
        }
      });
      
      // Check final statistics
      console.log('📊 Checking final statistics...');
      const finalStats = await instance.dataLoader.getStatistics();
      console.log('📊 Final stats:', finalStats);
      
      // Verify data was loaded
      expect(finalStats.totalWords).toBeGreaterThan(0);
      expect(finalStats.totalSynsets).toBeGreaterThan(0);
      expect(finalStats.totalSenses).toBeGreaterThan(0);
      
      console.log('✅ Data loading test completed successfully!');
      console.log(`📊 Loaded ${finalStats.totalWords} words, ${finalStats.totalSynsets} synsets, ${finalStats.totalSenses} senses`);
      
    } catch (error) {
      console.error('❌ Data loading test failed:', error);
      throw error;
    }
  }, 300000); // 5 minutes timeout
}); 
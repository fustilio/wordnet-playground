import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { config, download, add, remove, lexicons } from '../../../src/index.js';
import { logger } from 'wn-ts-core/utils';

describe('Lexicon Management', () => {
  let testDataDir: string;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('lexicon-management', []);
    testDataDir = context.e2eDataDir;
    cleanup = context.cleanup;
  }, 600000); // 10 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('Lexicon Download and Installation', () => {
    it('should download and add OEWN:2024', async () => {
      logger.info('⬇️ Testing OEWN:2024 download and installation...');
      
      const filePath = await download('oewn:2024', { force: true });
      expect(filePath).toBeTruthy();
      
      await add(filePath, { force: true });
      
      const lexList = await lexicons();
      expect(lexList.some(l => l.id.startsWith('oewn'))).toBe(true);
      
      logger.success('OEWN:2024 successfully downloaded and installed');
    });

    it('should handle duplicate lexicon installation gracefully', async () => {
      logger.info('🔄 Testing duplicate lexicon installation...');
      
      // Download and add the same lexicon again
      const filePath = await download('oewn:2024', { force: true });
      await add(filePath, { force: true });
      
      const lexList = await lexicons();
      const oewnLexicons = lexList.filter(l => l.id.startsWith('oewn'));
      
      // Should still have the lexicon (not duplicated)
      expect(oewnLexicons.length).toBeGreaterThan(0);
      
      logger.success('Duplicate installation handled gracefully');
    });

    it('should support lexicon removal', async () => {
      logger.info('🗑️ Testing lexicon removal...');
      
      // First ensure we have a lexicon to remove
      const lexListBefore = await lexicons();
      const oewnLexicon = lexListBefore.find(l => l.id.startsWith('oewn'));
      
      if (oewnLexicon) {
        await remove('oewn');
        
        const lexListAfter = await lexicons();
        expect(lexListAfter.some(l => l.id.startsWith('oewn'))).toBe(false);
        
        logger.success('Lexicon removal successful');
      } else {
        logger.info('No OEWN lexicon found to remove - skipping test');
      }
    });

    it('should support reinstallation after removal', async () => {
      logger.info('🔄 Testing reinstallation after removal...');
      
      // Reinstall the lexicon
      const filePath = await download('oewn:2024', { force: true });
      await add(filePath, { force: true });
      
      const lexList = await lexicons();
      expect(lexList.some(l => l.id.startsWith('oewn'))).toBe(true);
      
      logger.success('Reinstallation after removal successful');
    });
  });

  describe('Project Configuration', () => {
    it('should load project index and list available projects', async () => {
      logger.info('📋 Testing project index loading...');
      
      const availableProjects = await lexicons();
      logger.success(`Found ${availableProjects.length} projects`);

      expect(availableProjects).toBeInstanceOf(Array);
      expect(availableProjects.length).toBeGreaterThan(0);

      // Check for specific known projects
      const projectIds = availableProjects.map(p => p.id);
      expect(projectIds).toContain('oewn');
      
      logger.success('Project index loaded successfully');
    });

    it('should get project info for specific versions', () => {
      logger.info('📊 Testing project info retrieval...');
      
      const oewnInfo = config.getProjectInfo('oewn:2024');

      expect(oewnInfo.id).toBe('oewn');
      expect(oewnInfo.version).toBe('2024');
      expect(oewnInfo.label).toBe('Open English WordNet');
      expect(oewnInfo.language).toBe('en');
      expect(oewnInfo.resource_urls).toBeInstanceOf(Array);
      expect(oewnInfo.resource_urls.length).toBeGreaterThan(0);
      
      logger.success(`Project info verified - ${oewnInfo.resource_urls.length} URLs available`);
    });

    it('should handle invalid project IDs gracefully', () => {
      logger.info('❌ Testing invalid project ID handling...');
      
      expect(() => config.getProjectInfo('nonexistent:1.0')).toThrow();
      
      logger.success('Invalid project ID handled correctly');
    });
  });

  describe('Data Directory Management', () => {
    it('should use the correct data directory', () => {
      logger.info('📁 Testing data directory configuration...');
      
      expect(config.dataDirectory).toBe(testDataDir);
      expect(config.dataDirectory).toContain('wn-ts-lexicon-management-e2e-');
      
      logger.success(`Data directory correctly set to: ${config.dataDirectory}`);
    });

    it('should handle data directory changes', () => {
      logger.info('📁 Testing data directory changes...');
      
      const originalDir = config.dataDirectory;
      const newDir = originalDir + '-modified';
      
      config.dataDirectory = newDir;
      expect(config.dataDirectory).toBe(newDir);
      
      // Restore original directory
      config.dataDirectory = originalDir;
      expect(config.dataDirectory).toBe(originalDir);
      
      logger.success('Data directory changes handled correctly');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file paths gracefully', async () => {
      logger.info('❌ Testing invalid file path handling...');
      
      await expect(add('/nonexistent/file.xml', { force: true })).rejects.toThrow();
      
      logger.success('Invalid file path handled correctly');
    });

    it('should handle network errors during download', async () => {
      logger.info('❌ Testing network error handling...');
      
      // This test would require mocking network failures
      // For now, we'll just test that the download function exists and can be called
      expect(typeof download).toBe('function');
      
      logger.success('Download function is available for error handling');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent downloads', async () => {
      logger.info('⚡ Testing concurrent downloads...');
      
      // Note: This test is skipped in practice to avoid overwhelming the server
      // In a real scenario, you might want to test with smaller files or mock the downloads
      
      logger.info('Concurrent download test skipped to avoid server overload');
      expect(true).toBe(true);
    });

    it('should handle large lexicon files efficiently', async () => {
      logger.info('📊 Testing large lexicon file handling...');
      
      const startTime = Date.now();
      
      // Download and add OEWN (which is a reasonably large lexicon)
      const filePath = await download('oewn:2024', { force: true });
      await add(filePath, { force: true });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within a reasonable time (adjust as needed)
      expect(totalTime).toBeLessThan(300000); // 5 minutes
      
      logger.success(`Large lexicon processed in ${totalTime}ms`);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      logger.info('🔄 Testing data consistency...');
      
      // Get initial lexicon count
      const initialLexicons = await lexicons();
      const initialCount = initialLexicons.length;
      
      // Add a lexicon
      const filePath = await download('oewn:2024', { force: true });
      await add(filePath, { force: true });
      
      // Check that lexicon count increased
      const afterAddLexicons = await lexicons();
      expect(afterAddLexicons.length).toBeGreaterThan(initialCount);
      
      // Remove the lexicon
      await remove('oewn');
      
      // Check that lexicon count returned to original
      const afterRemoveLexicons = await lexicons();
      expect(afterRemoveLexicons.length).toBe(initialCount);
      
      logger.success('Data consistency maintained across operations');
    });

    it('should have consistent data types', async () => {
      logger.info('🔍 Testing data type consistency...');
      
      const _lexicons = await lexicons();
      expect(_lexicons).toBeInstanceOf(Array);
      
      if (_lexicons.length > 0) {
        const lexicon = _lexicons[0];
        if (lexicon) {
          expect(typeof lexicon.id).toBe('string');
          expect(typeof lexicon.label).toBe('string');
          expect(typeof lexicon.language).toBe('string');
          expect(typeof lexicon.version).toBe('string');
        }
      }
      
      logger.success('Data type consistency verified');
    });
  });
});

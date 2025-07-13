import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LexiconHelper } from '../../src/utils/lexicon-helpers.js';

describe('LexiconHelper', () => {
	describe('getProjectIds', () => {
		it('should return project IDs from index', () => {
			const projects = LexiconHelper.getProjectIds();
			
			// Should include main projects
			expect(projects).toContain('oewn');
			expect(projects).toContain('omw');
			expect(projects).toContain('odenet');
			
			// Should not include specific language lexicons from projects (omw-*)
			expect(projects).not.toContain('omw-en');
			expect(projects).not.toContain('omw-fr');
			
			// Should not include cili
			expect(projects).not.toContain('cili');
			
			// Should be an array of strings
			expect(Array.isArray(projects)).toBe(true);
			expect(projects.every(id => typeof id === 'string')).toBe(true);
		});

		it('should return consistent results on multiple calls', () => {
			const first = LexiconHelper.getProjectIds();
			const second = LexiconHelper.getProjectIds();
			
			expect(first).toEqual(second);
		});
	});

	describe('getAllLexiconIds', () => {
		it('should return all lexicon IDs from index', () => {
			const allIds = LexiconHelper.getAllLexiconIds();
			
			// Should include projects
			expect(allIds).toContain('oewn');
			expect(allIds).toContain('omw');
			
			// Should also include sub-lexicons
			expect(allIds).toContain('omw-fr');
			expect(allIds).toContain('cili');

			expect(Array.isArray(allIds)).toBe(true);
			expect(allIds.every(id => typeof id === 'string')).toBe(true);
		});
	});

	describe('getAllAvailableLexicons', () => {
		it('should return both all index and installed lexicons', async () => {
			const allLexicons = await LexiconHelper.getAllAvailableLexicons();
			
			// Should include all lexicons from index
			expect(allLexicons).toContain('oewn');
			expect(allLexicons).toContain('omw');
			expect(allLexicons).toContain('omw-fr'); // sub-lexicon
			
			// Should be an array of strings
			expect(Array.isArray(allLexicons)).toBe(true);
			expect(allLexicons.every(id => typeof id === 'string')).toBe(true);
		});

		it('should handle case when no lexicons are installed', async () => {
			// This test verifies the function doesn't crash when no lexicons are installed
			const allLexicons = await LexiconHelper.getAllAvailableLexicons();
			
			// Should still return downloadable lexicons
			expect(Array.isArray(allLexicons)).toBe(true);
			expect(allLexicons.length).toBeGreaterThan(0);
		});

		it('should return unique lexicons (no duplicates)', async () => {
			const allLexicons = await LexiconHelper.getAllAvailableLexicons();
			
			// Should have no duplicates
			const uniqueLexicons = new Set(allLexicons);
			expect(allLexicons.length).toBe(uniqueLexicons.size);
		});
	});

	describe('getLexiconName', () => {
		it('should return lexicon name for known lexicon', () => {
			const name = LexiconHelper.getLexiconName('oewn');
			expect(name).toBe('Open English WordNet');
		});

		it('should return code for unknown lexicon', () => {
			const name = LexiconHelper.getLexiconName('unknown-lexicon');
			expect(name).toBe('unknown-lexicon');
		});
	});

	describe('getLanguageName', () => {
		it('should return language name for known language', () => {
			const name = LexiconHelper.getLanguageName('en');
			expect(name).toBe('English');
		});

		it('should return code for unknown language', () => {
			const name = LexiconHelper.getLanguageName('unknown-lang');
			expect(name).toBe('unknown-lang');
		});
	});

	describe('getLexiconInfo', () => {
		it('should return lexicon info for known lexicon', () => {
			const info = LexiconHelper.getLexiconInfo('oewn');
			expect(info).toEqual({
				label: 'Open English WordNet',
				language: 'en',
				license: undefined
			});
		});

		it('should return null for unknown lexicon', () => {
			const info = LexiconHelper.getLexiconInfo('unknown-lexicon');
			expect(info).toBeNull();
		});
	});
}); 

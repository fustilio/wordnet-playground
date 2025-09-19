import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'node:module';
import { getProjects, lexicons as getInstalledLexicons } from 'wn-ts';

interface LexiconInfo {
	label: string;
	language: string;
	license?: string;
}

interface IndexData {
	[key: string]: {
		label: string;
		language: string;
		license?: string;
		versions?: Record<string, any>;
	};
}

export class LexiconHelper {
	private static indexData: IndexData | null = null;

	public static loadIndexData(): IndexData {
		if (this.indexData) return this.indexData;
		const require = createRequire(import.meta.url);

		try {
			// Read from the wn-ts package's built assets
			const wnTsPackageJsonPath = require.resolve('wn-ts/package.json');
      const wnTsDir = dirname(wnTsPackageJsonPath);
      // Path for built package
      let indexPath = join(wnTsDir, 'dist', 'index.json');
      if (!existsSync(indexPath)) {
        // Fallback for development/test environment
        indexPath = join(wnTsDir, 'assets', 'index.json');
      }
			const content = readFileSync(indexPath, 'utf-8');
			
			this.indexData = JSON.parse(content);
			return this.indexData as IndexData;
		} catch (error) {
			// Fallback for safety, though it may have incomplete data.
			const projects = getProjects();
			const indexData: IndexData = {};
			for (const project of projects) {
				indexData[project.id] = {
					label: project.label,
					language: project.metadata?.['language'] as string,
					license: project.license,
					versions: (project as any).versions || {}
				};
			}
			
			this.indexData = indexData;
			return this.indexData;
		}
	}

	static getLexiconName(code: string): string {
		const data = this.loadIndexData();
		return data[code]?.label || code;
	}

	static getLanguageName(code: string): string {
		const languageNames: Record<string, string> = {
			'en': 'English',
			'es': 'Spanish',
			'fr': 'French',
			'de': 'German',
			'it': 'Italian',
			'ja': 'Japanese',
			'pt': 'Portuguese',
			'nl': 'Dutch',
			'pl': 'Polish',
			'ru': 'Russian',
			'zh': 'Chinese',
			'ko': 'Korean',
			'ar': 'Arabic',
			'hi': 'Hindi',
			'mul': 'Multilingual',
		};
		return languageNames[code] || code;
	}

	static getProjectIds(): string[] {
		const data = this.loadIndexData();
		return Object.keys(data).filter(key => !key.startsWith('omw-') && key !== 'cili');
	}

	static getAllLexiconIds(): string[] {
		const data = this.loadIndexData();
		return Object.keys(data);
	}

	static async getAllAvailableLexicons(): Promise<string[]> {
		const downloadable = this.getAllLexiconIds();
		try {
			const installed = await getInstalledLexicons();
			const installedIds = installed.map(l => l.id);
			// Return unique list of both downloadable and installed
			const allIds = new Set([...downloadable, ...installedIds]);
			return Array.from(allIds);
		} catch (error) {
			// If no lexicons are installed, just return downloadable
			return downloadable;
		}
	}

	static getLexiconInfo(code: string): LexiconInfo | null {
		const data = this.loadIndexData();
		const info = data[code];
		if (!info) return null;
		
		return {
			label: info.label,
			language: info.language,
			license: info.license,
		};
	}
} 

// Map of common language tags/aliases to canonical language codes
const languageAliases: Record<string, string> = {
  'fr': 'fr', 'fra': 'fr', 'fr-fr': 'fr',
  'en': 'en', 'eng': 'en', 'en-us': 'en', 'en-gb': 'en',
  'th': 'th', 'tha': 'th', 'th-th': 'th',
  'ja': 'ja', 'jpn': 'ja', 'ja-jp': 'ja',
  'de': 'de', 'ger': 'de', 'de-de': 'de',
  'es': 'es', 'spa': 'es', 'es-es': 'es',
  // Add more as needed
};

/**
 * Resolves a user-supplied lexicon or language tag to the best available installed lexicon.
 * Returns {lexicon, suggestions[]}.
 */
export async function resolveLexicon(userInput: string): Promise<{ lexicon: string | null, suggestions: string[] }> {
  try {
    const installed = await getInstalledLexicons();
    const available = installed.map(l => l.id);
    const data = LexiconHelper.loadIndexData(); // Still needed for language info from index
    const input = userInput.toLowerCase().replace(/_/g, '-');

    // 1. Exact match on installed lexicons
    if (available.includes(input)) {
      return { lexicon: input, suggestions: [] };
    }

    // 2. Try language alias on installed lexicons
    const lang = languageAliases[input] || input.split('-')[0];
    const matches = available.filter(
      l => l.toLowerCase().includes(lang) ||
        (data[l]?.language && data[l].language.toLowerCase() === lang)
    );
    if (matches.length === 1) {
      return { lexicon: matches[0], suggestions: [] };
    }
    if (matches.length > 1) {
      return { lexicon: null, suggestions: matches };
    }

    // 3. Try partial match on installed lexicons
    const partial = available.filter(l => l.toLowerCase().includes(input));
    if (partial.length === 1) {
      return { lexicon: partial[0], suggestions: [] };
    }
    if (partial.length > 1) {
      return { lexicon: null, suggestions: partial };
    }

    // 4. No match, suggest from installed
    return { lexicon: null, suggestions: available };
  } catch (error) {
    // If DB isn't initialized or has other issues, we'll get an error.
    // In this case, we can assume there are no installed lexicons.
    return { lexicon: null, suggestions: [] };
  }
} 

/** @format */

import { useState, useEffect, useCallback } from "react";
import { useWordNetContext } from "wn-ts-web/react";

export interface WordnetConfig {
	lang?: string;
	autoLoad?: boolean;
}

export interface WordDefinition {
	text: string;
	example?: string;
}

export interface WordResult {
	word: string;
	partOfSpeech: string;
	definitions: WordDefinition[];
}

export interface UseWordnetReturn {
	// State
	loading: boolean;
	error: string | null;
	ready: boolean;

	// Basic operations
	getDefinitions: (word: string) => Promise<any[]>;
	searchWords: (term: string) => Promise<WordResult[]>;
	getSynsetWords: (synsetId: string) => Promise<any[]>;
	getIliWords: (iliId: string) => Promise<any[]>;

	// Utility
	isReady: () => boolean;
}

/**
 * Simplified WordNet hook for basic operations
 *
 * Usage:
 * ```tsx
 * const { getDefinitions, loading, ready } = useWordnet({ lang: 'en-US' });
 *
 * const definitions = await getDefinitions('water');
 * ```
 */
export function useWordnet(config: WordnetConfig = {}): UseWordnetReturn {
	const { lang = "en-US", autoLoad = true } = config;

	// Use the full WordNet context
	const {
		loading,
		error,
		isInitializing,
		loadedPackages,
		loadPackageData,
		querySynsets,
		getWordsBySynsetAndLanguage,
		getWordsByIliAndLanguage,
	} = useWordNetContext();

	const [ready, setReady] = useState(false);
	const [initializationError, setInitializationError] = useState<string | null>(
		null
	);

	// Auto-load English WordNet on mount
	useEffect(() => {
		if (
			autoLoad &&
			!loading &&
			!isInitializing &&
			loadedPackages.length === 0
		) {
			loadPackageData("oewn:2024").catch((err) => {
				setInitializationError(err.message || "Failed to load WordNet data");
			});
		}
	}, [
		autoLoad,
		loading,
		isInitializing,
		loadedPackages.length,
		loadPackageData,
	]);

	// Update ready state
	useEffect(() => {
		const isReady =
			!loading && !isInitializing && loadedPackages.length > 0 && !error;
		setReady(isReady);
	}, [loading, isInitializing, loadedPackages.length, error]);

	const isReady = useCallback(() => {
		return ready && !error && !initializationError;
	}, [ready, error, initializationError]);

	const getDefinitions = useCallback(
		async (word: string): Promise<any[]> => {
			if (!isReady()) {
				throw new Error(
					"WordNet is not ready. Please wait for initialization to complete."
				);
			}

			try {
				// Use querySynsets to get definitions and examples
				const synsets = await querySynsets(word);
				return synsets || [];
			} catch (err) {
				throw new Error(
					`Failed to get definitions for "${word}": ${err instanceof Error ? err.message : "Unknown error"}`
				);
			}
		},
		[isReady, querySynsets]
	);

	const getSynsetWords = useCallback(
		async (synsetId: string): Promise<any[]> => {
			if (!isReady()) {
				throw new Error(
					"WordNet is not ready. Please wait for initialization to complete."
				);
			}

			try {
				// Use the language from config
				const words = await getWordsBySynsetAndLanguage(
					synsetId,
					lang.split("-")[0]
				);
				return words || [];
			} catch (err) {
				throw new Error(
					`Failed to get words for synset "${synsetId}": ${err instanceof Error ? err.message : "Unknown error"}`
				);
			}
		},
		[isReady, getWordsBySynsetAndLanguage, lang]
	);

	const getIliWords = useCallback(
		async (iliId: string): Promise<any[]> => {
			if (!isReady()) {
				throw new Error(
					"WordNet is not ready. Please wait for initialization to complete."
				);
			}

			try {
				// Use the language from config  
				const words = await getWordsByIliAndLanguage(
					iliId,
					lang.split("-")[0]
				);
				return words || [];
			} catch (err) {
				throw new Error(
					`Failed to get words for ILI "${iliId}": ${err instanceof Error ? err.message : "Unknown error"}`
				);
			}
		},
		[isReady, getWordsByIliAndLanguage, lang]
	);

	const searchWords = useCallback(
		async (term: string): Promise<WordResult[]> => {
			// This is a placeholder - implement if needed
			return [];
		},
		[]
	);

	return {
		loading: loading || isInitializing,
		error: error || initializationError,
		ready: isReady(),
		getDefinitions,
		searchWords,
		getSynsetWords,
		getIliWords,
		isReady,
	};
}

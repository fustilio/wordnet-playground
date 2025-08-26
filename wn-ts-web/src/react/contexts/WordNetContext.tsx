import React, { createContext, useContext, type ReactNode } from 'react';
import { useWordNet } from '../hooks/useWordNet';
import type { 
	WordNetState,
	WordQueryResult,
	SynsetQueryResult,
	SenseInfo,
	DefinitionInfo,
	WordInfo,
	MemoryQueryTestResult,
	CacheInfo,
	ProgressCallback,
	LexiconIntrospection,
	ResourceTypeInfo,
	CategorizedResources,
	CrossLingualAnalysis,
	MappingCoverage,
	IntegrityReport,
	CompatibilityReport,
	DatabaseStorageInfo
} from '../hooks/useWordNet';
import type { LexiconInfo } from '../../';
import { useWordNetConfig } from './WordNetConfigContext';

interface WordNetContextValue extends WordNetState {
	loadPackageData: (packageId: string, progress?: ProgressCallback) => Promise<void>;
	loadDemoData: (progress?: ProgressCallback) => Promise<void>;
	queryWords: (term: string) => Promise<WordQueryResult[]>;
	querySynsets: (term: string) => Promise<SynsetQueryResult[]>;
	querySenses: (term: string) => Promise<SenseInfo[]>;
	unloadData: () => Promise<void>;
	refreshPackages: () => Promise<void>;
	getLexiconInfo: (id?: string) => LexiconInfo[] | undefined;
	getCurrentLexicons: () => LexiconInfo[];
	testMemoryQueries: () => Promise<MemoryQueryTestResult>;
	// New helpers for bilingual flows
	getSensesByWordIdOrForm: (wordIdOrForm: string) => Promise<SenseInfo[]>;
	getWordsBySynsetAndLanguage: (synsetId: string, language: string) => Promise<WordInfo[]>;
	getDefinitionsBySynsetId: (synsetId: string) => Promise<DefinitionInfo[]>;
	getSynsetById: (synsetId: string) => Promise<SynsetQueryResult | undefined>;
	getWordsByIliAndLanguage: (ili: string, language: string) => Promise<WordInfo[]>;
	getWordsByIliAndLexiconPrefix: (ili: string, lexiconPrefix: string) => Promise<WordInfo[]>;
	getIliForSynset: (synsetId: string) => Promise<string | null>;
	searchWordsInLexicon: (term: string, lexicon: string, language?: string) => Promise<WordQueryResult[]>;
	// Data management
	clearCacheAndUnload: () => Promise<void>;
	getCacheInfo: () => Promise<CacheInfo>;
	// Lexicon introspection and resource analysis
	introspectLexicon: (lexiconId: string) => Promise<LexiconIntrospection>;
	introspectAllResources: () => Promise<LexiconIntrospection[]>;
	detectResourceType: (lexiconId: string) => Promise<ResourceTypeInfo>;
	categorizeResources: () => Promise<CategorizedResources>;
	analyzeCrossLingualCapabilities: () => Promise<CrossLingualAnalysis>;
	getCrossLingualMappingCoverage: () => Promise<MappingCoverage>;
	validateResourceIntegrity: (lexiconId: string) => Promise<IntegrityReport>;
	checkResourceCompatibility: (lexiconIds: string[]) => Promise<CompatibilityReport>;
	// Database persistence methods
	isDatabasePersistent: () => Promise<boolean>;
	getDatabaseStorageInfo: () => Promise<DatabaseStorageInfo>;
}

const WordNetContext = createContext<WordNetContextValue | null>(null);

interface WordNetProviderProps {
	children: ReactNode;
}

export const WordNetProvider: React.FC<WordNetProviderProps> = ({ children }) => {
	const config = useWordNetConfig();
	const wordNetService = useWordNet(config);

	return (
		<WordNetContext.Provider value={wordNetService}>
			{children}
		</WordNetContext.Provider>
	);
};

export const useWordNetContext = (): WordNetContextValue => {
	const context = useContext(WordNetContext);
	if (!context) {
		throw new Error('useWordNetContext must be used within a WordNetProvider');
	}
	return context;
};

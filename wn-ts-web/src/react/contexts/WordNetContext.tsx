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
} from '../types';
import type { LexiconInfo } from '../../';
import { useWordNetConfig } from './WordNetConfigContext';

// Use the same return type as useWordNet hook
type WordNetContextValue = ReturnType<typeof useWordNet>;

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

import { Wordnet } from './wordnet.js';
import {
  projects as coreProjects,
  word as coreWord,
  words as coreWords,
  sense as coreSense,
  senses as coreSenses,
  synset as coreSynset,
  synsets as coreSynsets,
  ili as coreIli,
  ilis as coreIlis,
  lexicons as coreLexicons,
} from 'wn-ts-core';

// Re-export projects (no Wordnet constructor needed)
export const projects = coreProjects;

// Create default client for convenience functions
const defaultClient = new Wordnet();

// Convenience functions that use the default client
export async function word(
  id: string
): Promise<any> {
  return coreWord(defaultClient, id);
}

export async function words(
  form?: string,
  pos?: any,
  options?: { lexicon: string }
): Promise<any[]> {
  return coreWords(defaultClient, form, pos, options);
}

export async function sense(
  id: string
): Promise<any> {
  return coreSense(defaultClient, id);
}

export async function senses(
  form?: string,
  pos?: any,
  options?: { lexicon: string }
): Promise<any[]> {
  return coreSenses(defaultClient, form, pos, options);
}

export async function synset(
  id: string
): Promise<any> {
  return coreSynset(defaultClient, id);
}

export async function synsets(
  form?: string,
  pos?: any,
  options?: { lexicon: string }
): Promise<any[]> {
  return coreSynsets(defaultClient, form, pos, options);
}

export async function ili(
  id: string
): Promise<any> {
  return coreIli(defaultClient, id);
}

export async function ilis(
  status?: string
): Promise<any[]> {
  return coreIlis(defaultClient, status);
}

export async function lexicons(): Promise<any[]> {
  return coreLexicons(defaultClient);
} 

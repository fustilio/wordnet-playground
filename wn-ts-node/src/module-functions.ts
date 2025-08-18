import { Wordnet } from './wordnet.js';
import { projects as coreProjects } from 'wn-ts-core';
import type {
  Word,
  Sense,
  Synset,
  ILI,
  Lexicon,
  PartOfSpeech,
  WordQuery,
  SenseQuery,
  SynsetQuery
} from 'wn-ts-core';

// Re-export projects (no Wordnet constructor needed)
export const projects = coreProjects;

// Create default client for convenience functions
const defaultClient = new Wordnet();

// Convenience functions that use the default client
export async function word(
  id: string
): Promise<Word> {
  return defaultClient.word(id);
}

export async function words(
  form?: string,
  pos?: PartOfSpeech,
  options?: { lexicon?: string }
): Promise<Word[]> {
  if (!form) {
    return [];
  }
  
  const query: WordQuery = { form };
  if (pos) query.pos = pos;
  if (options?.lexicon) query.lexicon = options.lexicon;
  
  return defaultClient.words(query);
}

export async function sense(
  id: string
): Promise<Sense> {
  return defaultClient.sense(id);
}

export async function senses(
  form?: string,
  pos?: PartOfSpeech,
  options?: { lexicon?: string }
): Promise<Sense[]> {
  if (!form) {
    return [];
  }
  
  const query: SenseQuery = { form };
  if (pos) query.pos = pos;
  if (options?.lexicon) query.lexicon = options.lexicon;
  
  return defaultClient.senses(query);
}

export async function synset(
  id: string
): Promise<Synset> {
  return defaultClient.synset(id);
}

export async function synsets(
  form?: string,
  pos?: PartOfSpeech,
  options?: { lexicon?: string }
): Promise<Synset[]> {
  if (!form) {
    return [];
  }
  
  const query: SynsetQuery = { form };
  if (pos) query.pos = pos;
  if (options?.lexicon) query.lexicon = options.lexicon;
  
  return defaultClient.synsets(query);
}

export async function ili(
  id: string
): Promise<ILI> {
  return defaultClient.ili(id);
}

export async function ilis(
  status?: string
): Promise<ILI[]> {
  return defaultClient.ilis(status);
}

export async function lexicons(): Promise<Lexicon[]> {
  return defaultClient.lexicons();
} 

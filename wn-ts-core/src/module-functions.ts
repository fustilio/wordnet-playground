import { BaseWordnet } from './wordnet.js';
import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  Project,
  ILI,
  PartOfSpeech,
} from './types.js';
import { DatabaseError } from './types.js';

/**
 * Get all available projects - matching Python wn.projects()
 */
import { getProjects } from './project.js';

export async function projects(): Promise<Project[]> {
  return getProjects();
}

/**
 * Get lexicons matching language or lexicon specifier - matching Python wn.lexicons()
 */
export async function lexicons(
  client: BaseWordnet
): Promise<Lexicon[]> {
  try {
    return await client.lexicons();
  } catch (error) {
    if (error instanceof DatabaseError) {
      // Database not available in wn-ts-core
      return [];
    }
    throw error;
  }
}

/**
 * Get a word by ID - matching Python wn.word()
 */
export async function word(
  client: BaseWordnet,
  id: string
): Promise<Word> {
  try {
    const result = await client.word(id);
    if (!result) {
      throw new Error(`no such lexical entry: ${id}`);
    }
    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new Error(`no such lexical entry: ${id}`);
    }
    throw error;
  }
}

/**
 * Get words matching form and part of speech - matching Python wn.words()
 */
export async function words(
  client: BaseWordnet,
  form?: string,
  pos?: PartOfSpeech
): Promise<Word[]> {
  try {
    return await client.words(form || '', pos);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return [];
    }
    throw error;
  }
}

/**
 * Get a sense by ID - matching Python wn.sense()
 */
export async function sense(
  client: BaseWordnet,
  id: string
): Promise<Sense> {
  try {
    const result = await client.sense(id);
    if (!result) {
      throw new Error(`no such sense: ${id}`);
    }
    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new Error(`no such sense: ${id}`);
    }
    throw error;
  }
}

/**
 * Get senses matching form and part of speech - matching Python wn.senses()
 */
export async function senses(
  client: BaseWordnet,
  form?: string,
  pos?: PartOfSpeech
): Promise<Sense[]> {
  try {
    return await client.senses(form || '', pos);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return [];
    }
    throw error;
  }
}

/**
 * Get a synset by ID - matching Python wn.synset()
 */
export async function synset(
  client: BaseWordnet,
  id: string
): Promise<Synset> {
  try {
    const result = await client.synset(id);
    if (!result) {
      throw new Error(`no such synset: ${id}`);
    }
    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new Error(`no such synset: ${id}`);
    }
    throw error;
  }
}

/**
 * Get synsets matching form and part of speech - matching Python wn.synsets()
 */
export async function synsets(
  client: BaseWordnet,
  form?: string,
  pos?: PartOfSpeech
): Promise<Synset[]> {
  try {
    return await client.synsets(form || '', pos);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return [];
    }
    throw error;
  }
}

/**
 * Get an ILI by ID - matching Python wn.ili()
 */
export async function ili(
  client: BaseWordnet,
  id: string
): Promise<ILI> {
  try {
    const result = await client.ili(id);
    if (!result) {
      throw new Error(`no such ILI: ${id}`);
    }
    return result;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new Error(`no such ILI: ${id}`);
    }
    throw error;
  }
}

/**
 * Get ILIs matching status - matching Python wn.ilis()
 */
export async function ilis(
  client: BaseWordnet,
  status?: string
): Promise<ILI[]> {
  try {
    return await client.ilis(status);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return [];
    }
    throw error;
  }
} 

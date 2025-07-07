import { Wordnet } from './wordnet.js';
import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  Project,
  ILI,
  PartOfSpeech,
} from './types.js';

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
  options: { lexicon?: string; lang?: string } = {}
): Promise<Lexicon[]> {
  const { lexicon = "*", lang } = options;
  
  try {
    const wordnetOptions: any = {};
    if (lang) wordnetOptions.lang = lang;
    const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
    return await wordnet.lexicons();
  } catch {
    return [];
  }
}

/**
 * Get a word by ID - matching Python wn.word()
 */
export async function word(
  id: string,
  options: { lexicon?: string; lang?: string } = {}
): Promise<Word> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  const result = await wordnet.word(id);
  if (!result) {
    throw new Error(`no such lexical entry: ${id}`);
  }
  return result;
}

/**
 * Get words by form and optional part of speech - matching Python wn.words()
 */
export async function words(
  form?: string,
  pos?: PartOfSpeech,
  options: { lexicon?: string; lang?: string } = {}
): Promise<Word[]> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  return await wordnet.words(form || '', pos);
}

/**
 * Get a sense by ID - matching Python wn.sense()
 */
export async function sense(
  id: string,
  options: { lexicon?: string; lang?: string } = {}
): Promise<Sense> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  const result = await wordnet.sense(id);
  if (!result) {
    throw new Error(`no such sense: ${id}`);
  }
  return result;
}

/**
 * Get senses by form and optional part of speech - matching Python wn.senses()
 */
export async function senses(
  form?: string,
  pos?: PartOfSpeech,
  options: { lexicon?: string; lang?: string } = {}
): Promise<Sense[]> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  // Call the form-based senses method explicitly by casting
  return await (wordnet as any).senses(form || '', pos);
}

/**
 * Get a synset by ID - matching Python wn.synset()
 */
export async function synset(
  id: string,
  options: { lexicon?: string; lang?: string } = {}
): Promise<Synset> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  const result = await wordnet.synset(id);
  if (!result) {
    throw new Error(`no such synset: ${id}`);
  }
  return result;
}

/**
 * Get synsets by form and optional part of speech - matching Python wn.synsets()
 */
export async function synsets(
  form?: string,
  pos?: PartOfSpeech,
  options: { lexicon?: string; lang?: string; ili?: string | ILI } = {}
): Promise<Synset[]> {
  const { lexicon, lang, ili } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  return await wordnet.synsets(form || '', pos, ili);
}

/**
 * Get an ILI by ID - matching Python wn.ili()
 */
export async function ili(
  id: string,
  options: { lexicon?: string; lang?: string } = {}
): Promise<ILI> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  const result = await wordnet.ili(id);
  if (!result) {
    throw new Error(`no such ILI: ${id}`);
  }
  return result;
}

/**
 * Get ILIs with optional status filter - matching Python wn.ilis()
 */
export async function ilis(
  status?: string,
  options: { lexicon?: string; lang?: string } = {}
): Promise<ILI[]> {
  const { lexicon, lang } = options;
  const wordnetOptions: any = {};
  if (lang) wordnetOptions.lang = lang;
  const wordnet = new Wordnet(lexicon || '*', wordnetOptions);
  return await wordnet.ilis(status);
} 

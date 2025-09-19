import { Wordnet } from './wordnet.js';
import { KyselyWordnet } from './kysely-wordnet.js';

import { getDataManagementDb } from './data-management-new.js';
import type {
  Word,
  Sense,
  Synset,
  ILI,
  Lexicon,
  PartOfSpeech,
  WordQuery,

  SynsetQuery
} from 'wn-ts-core';

// Re-export projects (no Wordnet constructor needed)
export const projects = async (client?: Wordnet): Promise<any[]> => {
  try {
    // If a client is provided, use it to query the database
    if (client) {
      console.log('Projects function: client provided, calling client.lexicons()');
      const lexicons = await client.lexicons();
      console.log(`Projects function: client.lexicons() returned ${lexicons.length} lexicons`);
      if (lexicons.length > 0) {
        console.log('Projects function: First lexicon:', JSON.stringify(lexicons[0], null, 2));
      }
      const result = lexicons.map(lexicon => ({
        id: lexicon.id,
        name: lexicon.label,
        version: lexicon.version || 'unknown',
        language: lexicon.language,
        description: lexicon.metadata ? JSON.stringify(lexicon.metadata) : undefined
      }));
      console.log(`Projects function: Returning ${result.length} mapped projects`);
      return result;
    }
    
    // Otherwise, use the data management client
    console.log('Projects function: No client provided, using data management client');
    const dataClient = await getDataManagementClient();
    const lexicons = await dataClient.lexicons();
    console.log(`Projects function: dataClient.lexicons() returned ${lexicons.length} lexicons`);
    const result = lexicons.map(lexicon => ({
      id: lexicon.id,
      name: lexicon.label,
      version: lexicon.version || 'unknown',
      language: lexicon.language,
      description: lexicon.metadata ? JSON.stringify(lexicon.metadata) : undefined
    }));
    console.log(`Projects function: Returning ${result.length} mapped projects from data client`);
    return result;
  } catch (error) {
    console.error('Projects function: Error occurred:', error);
    // Fallback to static data if database query fails
    return [
      { id: 'oewn', name: 'Open English WordNet', version: '2024' },
      { id: 'test-en', name: 'Testing English WordNet', version: '1.0' },
      { id: 'test-es', name: 'Testing Spanish WordNet', version: '1.0' }
    ];
  }
};

// Create default client for convenience functions
let defaultClient: Wordnet | null = null;

function getDefaultClient(): Wordnet {
  if (!defaultClient) {
    defaultClient = new Wordnet();
  }
  return defaultClient;
}

// Allow tests to inject their own database instance
export function setDefaultClient(client: Wordnet): void {
  defaultClient = client;
}

// Get the data management database for module functions
async function getDataManagementClient(): Promise<KyselyWordnet> {
  return await getDataManagementDb();
}

// Convenience functions that use the default client
export async function word(
  id: string
): Promise<Word> {
  return getDefaultClient().word(id);
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
  
  return getDefaultClient().words(query);
}

export async function sense(
  id: string
): Promise<Sense> {
  return getDefaultClient().sense(id);
}

export async function senses(
  form?: string,
  pos?: PartOfSpeech,
  options?: { lexicon?: string }
): Promise<Sense[]> {
  if (!form) {
    return [];
  }
  
  // The query service expects wordIdOrForm, not form
  const query: any = { wordIdOrForm: form };
  if (pos) query.pos = pos;
  if (options?.lexicon) query.lexicon = options.lexicon;
  
  const client = await getDataManagementClient();
  return client.senses(query);
}

export async function synset(
  id: string
): Promise<Synset> {
  return getDefaultClient().synset(id);
}

export async function synsets(
  query: SynsetQuery
): Promise<Synset[]> {
  return getDefaultClient().synsets(query);
}

export async function ili(
  id: string
): Promise<ILI> {
  return getDefaultClient().ili(id);
}

export async function ilis(
  status?: string
): Promise<ILI[]> {
  return getDefaultClient().ilis(status);
}

export async function lexicons(): Promise<Lexicon[]> {
  const client = await getDataManagementClient();
  return client.lexicons();
} 

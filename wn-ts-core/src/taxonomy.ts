/**
 * Taxonomy functions for analyzing Wordnet hierarchies.
 * 
 * This module provides functions for analyzing the taxonomic
 * structure of Wordnet, including finding roots, leaves, paths,
 * and depth calculations.
 */

import type { Synset, PartOfSpeech } from './types.js';
import { WnError } from './types.js';
import { Wordnet } from './wordnet.js';
import { hypernyms, shortestPath, maxDepth } from './synset-utils.js';

/**
 * Find root synsets in a Wordnet.
 * 
 * @param wordnet - The Wordnet instance
 * @param pos - Optional part of speech filter
 * @returns Array of root synsets
 */
export async function roots(
  wordnet: Wordnet,
  pos?: PartOfSpeech
): Promise<Synset[]> {
  const synsets = await wordnet.synsets('', pos);
  const rootSynsets: Synset[] = [];
  
  for (const synset of synsets) {
    const hypers = await hypernyms(synset, wordnet);
    if (hypers.length === 0) {
      rootSynsets.push(synset);
    }
  }
  
  return rootSynsets;
}

/**
 * Find leaf synsets in a Wordnet.
 * 
 * @param wordnet - The Wordnet instance
 * @param pos - Optional part of speech filter
 * @returns Array of leaf synsets
 */
export async function leaves(
  wordnet: Wordnet,
  pos?: PartOfSpeech
): Promise<Synset[]> {
  const synsets = await wordnet.synsets('', pos);
  const leafSynsets: Synset[] = [];
  
  for (const synset of synsets) {
    // Check if this synset has any hyponyms
    const hasHyponyms = synsets.some((other: any) => {
      return other.id !== synset.id && other.relations.some((rel: any) => 
        rel.type === 'hypernym' && rel.target === synset.id
      );
    });
    
    if (!hasHyponyms) {
      leafSynsets.push(synset);
    }
  }
  
  return leafSynsets;
}

/**
 * Calculate the taxonomy depth for a part of speech.
 * 
 * @param wordnet - The Wordnet instance
 * @param pos - Part of speech
 * @returns The maximum depth of the taxonomy
 */
export async function taxonomyDepth(
  wordnet: Wordnet,
  pos: PartOfSpeech
): Promise<number> {
  const synsets = await wordnet.synsets('', pos);
  if (synsets.length === 0) return 0;
  
  let maxDepthValue = 0;
  for (const synset of synsets) {
    const depth = await maxDepth(synset, wordnet);
    maxDepthValue = Math.max(maxDepthValue, depth);
  }
  
  return maxDepthValue;
}

/**
 * Find all hypernym paths for a synset.
 * 
 * @param synset - The synset to find paths for
 * @param wordnet - The Wordnet instance
 * @returns Array of hypernym paths
 */
export async function hypernymPaths(synset: Synset, wordnet: Wordnet, simulateRoot = false): Promise<Synset[][]> {
  const paths: Synset[][] = [];
  
  async function findPaths(current: Synset, currentPath: Synset[]): Promise<void> {
    const hypers = await hypernyms(current, wordnet);
    
    if (hypers.length === 0) {
      // This is a root, add the path
      paths.push([...currentPath, current]);
    } else {
      // Continue with each hypernym
      for (const hyper of hypers) {
        await findPaths(hyper, [...currentPath, current]);
      }
    }
  }
  
  await findPaths(synset, []);

  if (simulateRoot) {
    const fakeRoot: Synset = {
      id: '*ROOT*',
      partOfSpeech: synset.partOfSpeech,
      definitions: [],
      examples: [],
      relations: [],
      language: synset.language,
      lexicon: synset.lexicon,
      members: [],
      senses: [],
    };
    if (paths.length === 0) {
        return [[synset, fakeRoot]];
    }
    return paths.map(p => [...p, fakeRoot]);
  }
  
  return paths;
}

/**
 * Calculate the minimum depth of a synset.
 * 
 * @param synset - The synset to calculate depth for
 * @param wordnet - The Wordnet instance
 * @returns The minimum depth
 */
export async function minDepth(synset: Synset, wordnet: Wordnet): Promise<number> {
  const paths = await hypernymPaths(synset, wordnet);
  if (paths.length === 0) return 0;
  
  return Math.min(...paths.map(path => path.length - 1));
}

/**
 * Find the shortest path between two synsets.
 * 
 * @param synset1 - The first synset
 * @param synset2 - The second synset
 * @param wordnet - The Wordnet instance
 * @param simulateRoot - Whether to simulate a root for disconnected synsets
 * @returns Array of synsets representing the shortest path
 */
export async function taxonomyShortestPath(
  synset1: Synset,
  synset2: Synset,
  wordnet: Wordnet,
  simulateRoot = false
): Promise<Synset[]> {
  if (synset1.id === synset2.id) return [];

  if (simulateRoot) {
    const paths1 = await hypernymPaths(synset1, wordnet, true);
    const paths2 = await hypernymPaths(synset2, wordnet, true);
    
    let bestPath: Synset[] | null = null;

    for (const path1 of paths1) {
      for (const path2 of paths2) {
        for (let i = 0; i < path1.length; i++) {
          const commonAncestor = path1[i];
          if (!commonAncestor) continue;
          const j = path2.findIndex(s => s.id === commonAncestor.id);
          if (j !== -1) {
            const pathUp = path1.slice(0, i);
            const pathDown = path2.slice(0, j).reverse();
            const currentPath = [...pathUp, commonAncestor, ...pathDown];
            if (bestPath === null || currentPath.length < bestPath.length) {
              bestPath = currentPath;
            }
          }
        }
      }
    }

    if (bestPath) {
      return bestPath;
    }
  } else {
    const path = await shortestPath(synset1, synset2, wordnet);
    if (path.length > 0) {
      return path;
    }
  }

  throw new WnError(`No path found between synsets ${synset1.id} and ${synset2.id}`);
} 

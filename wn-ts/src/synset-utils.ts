import type { Synset } from './types.js';
import { Wordnet } from './wordnet.js';

/**
 * Get the direct hypernyms of a synset.
 */
export async function hypernyms(synset: Synset, wordnet: Wordnet): Promise<Synset[]> {
  const hypernymRelations = synset.relations.filter((r: any) => r.type === 'hypernym');
  const results: Synset[] = [];
  for (const rel of hypernymRelations) {
    const target = await wordnet.synset(rel.target);
    if (target) results.push(target);
  }
  return results;
}

/**
 * Find the shortest path between two synsets.
 * Returns the path as an array of synsets, or [] if no path exists.
 */
export async function shortestPath(
  synsetA: Synset,
  synsetB: Synset,
  wordnet: Wordnet
): Promise<Synset[]> {
  if (synsetA.id === synsetB.id) return [];

  const pathsA = await allHypernymPaths(synsetA, wordnet);
  const pathsB = await allHypernymPaths(synsetB, wordnet);

  let bestPath: Synset[] | null = null;

  for (const pathA of pathsA) {
    for (const pathB of pathsB) {
      // Find a common ancestor
      for (let i = 0; i < pathA.length; i++) {
        const commonAncestor = pathA[i];
        if (!commonAncestor) continue;
        const j = pathB.findIndex(s => s.id === commonAncestor.id);

        if (j !== -1) {
          // Found a common ancestor, construct the path
          const pathUp = pathA.slice(0, i);
          const pathDown = pathB.slice(0, j).reverse();
          const currentPath = [...pathUp, commonAncestor, ...pathDown];
          
          if (bestPath === null || currentPath.length < bestPath.length) {
            bestPath = currentPath;
          }
        }
      }
    }
  }

  return bestPath || [];
}

/**
 * Compute the maximum depth of a synset in the taxonomy.
 * Returns the length of the longest hypernym path to a root.
 */
export async function maxDepth(
  synset: Synset,
  wordnet: Wordnet
): Promise<number> {
  // DFS to find the longest path to a root (no hypernyms)
  const stack: { node: Synset; depth: number }[] = [{ node: synset, depth: 0 }];
  let max = 0;
  const visited = new Set<string>();
  while (stack.length > 0) {
    const { node, depth } = stack.pop()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    const hypers = await hypernyms(node, wordnet);
    if (hypers.length === 0) {
      if (depth > max) max = depth;
    } else {
      for (const hyp of hypers) {
        stack.push({ node: hyp, depth: depth + 1 });
      }
    }
  }
  return max;
}

/**
 * Find the lowest common hypernyms (LCS) of two synsets.
 * Returns an array of synsets that are the lowest common ancestors.
 */
export async function lowestCommonHypernyms(
  synsetA: Synset,
  synsetB: Synset,
  wordnet: Wordnet
): Promise<Synset[]> {
  const pathsA = await allHypernymPaths(synsetA, wordnet);
  const pathsB = await allHypernymPaths(synsetB, wordnet);
  const ancestorsA = new Set(pathsA.flat().map(s => s.id));
  const common = pathsB.flat().filter(s => ancestorsA.has(s.id));
  
  if (common.length === 0) {
    return [];
  }

  const commonDepths = await Promise.all(
    common.map(async s => ({ synset: s, depth: await maxDepth(s, wordnet) }))
  );
  
  const maxDepthValue = Math.max(...commonDepths.map(item => item.depth));
  
  return commonDepths
    .filter(item => item.depth === maxDepthValue)
    .map(item => item.synset);
}

/**
 * Helper: Get all hypernym paths from a synset to a root.
 */
async function allHypernymPaths(synset: Synset, wordnet: Wordnet): Promise<Synset[][]> {
  const paths: Synset[][] = [];
  async function dfs(node: Synset, path: Synset[]) {
    const hypers = await hypernyms(node, wordnet);
    if (hypers.length === 0) {
      paths.push([...path, node]);
    } else {
      for (const hyp of hypers) {
        await dfs(hyp, [...path, node]);
      }
    }
  }
  await dfs(synset, []);
  return paths;
}

 

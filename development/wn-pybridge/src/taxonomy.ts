import { python } from 'pythonia';
import { WnBridge } from './index.js';

export class Taxonomy {
  private bridge: WnBridge;
  private pythonTaxonomy: any = null;

  constructor(bridge: WnBridge) {
    this.bridge = bridge;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.pythonTaxonomy) {
      this.pythonTaxonomy = await python('wn.taxonomy');
    }
  }

  /**
   * Get all hypernym paths from a synset to the root(s)
   */
  async hypernymPaths(synsetId: string): Promise<string[][]> {
    await this.ensureInitialized();
    const wn = await this.bridge.getPythonWordNet();
    const synset = await wn.synset(synsetId);
    const paths = await this.pythonTaxonomy.hypernym_paths(synset);
    // Convert Python list of lists of synsets to JS list of lists of synset IDs
    const result: string[][] = [];
    for await (const path of paths) {
      const ids: string[] = [];
      for await (const s of path) {
        ids.push(await s.id);
      }
      result.push(ids);
    }
    return result;
  }

  /**
   * Get the lowest common hypernyms (most specific common ancestor) of two synsets
   */
  async lowestCommonHypernyms(synsetId1: string, synsetId2: string): Promise<string[]> {
    await this.ensureInitialized();
    const wn = await this.bridge.getPythonWordNet();
    const s1 = await wn.synset(synsetId1);
    const s2 = await wn.synset(synsetId2);
    const lchs = await this.pythonTaxonomy.lowest_common_hypernyms(s1, s2);
    const result: string[] = [];
    for await (const s of lchs) {
      result.push(await s.id);
    }
    return result;
  }

  /**
   * Get the minimum depth of a synset
   */
  async minDepth(synsetId: string): Promise<number> {
    await this.ensureInitialized();
    const wn = await this.bridge.getPythonWordNet();
    const synset = await wn.synset(synsetId);
    return await this.pythonTaxonomy.min_depth(synset);
  }

  /**
   * Get the maximum depth of a synset
   */
  async maxDepth(synsetId: string): Promise<number> {
    await this.ensureInitialized();
    const wn = await this.bridge.getPythonWordNet();
    const synset = await wn.synset(synsetId);
    return await this.pythonTaxonomy.max_depth(synset);
  }
} 
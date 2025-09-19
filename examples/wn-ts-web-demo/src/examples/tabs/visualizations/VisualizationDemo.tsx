import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/shared/Card';
import WordRelationshipGraph from '../../../components/visualizations/WordRelationshipGraph';
import SynsetHierarchyTree from '../../../components/visualizations/SynsetHierarchyTree';
import { useWordNetContext } from "wn-ts-web/react";
import { LexiconRequirements } from '../../../components/shared/LexiconRequirements';
import { createScopedLogger } from '../../../../../packages/utils/logger';
import { SearchForm } from '../../../components/shared/SearchForm';

const logger = createScopedLogger('VisualizationDemo');

export const VisualizationDemo: React.FC = () => {
  const { querySynsets, getSynsetById, getWordsBySynsetAndLanguage, loading: contextLoading } = useWordNetContext();
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [treeData, setTreeData] = useState<any>([]);
  const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('tree');
  const [isSearching, setIsSearching] = useState(false);

  const PRESET_QUERIES = ['tree', 'car', 'love', 'run', 'good'];

  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for relationship graphs and hierarchy trees',
      priority: 'high' as const
    }
  ];

  const getSynsetWithLabel = useCallback(async (synsetId: string) => {
    try {
      const [syn, words] = await Promise.all([
        getSynsetById(synsetId),
        getWordsBySynsetAndLanguage(synsetId, 'en')
      ]);
      if (!syn) return null;
      return {
        ...syn,
        label: words.length > 0 ? words[0].lemma : synsetId.split('-')[1],
        wordCount: words.length
      };
    } catch (error) {
      logger.warn('Failed to get synset with label', { synsetId, error });
      return null;
    }
  }, [getSynsetById, getWordsBySynsetAndLanguage]);

  const fetchVisualizationData = useCallback(async (synsetId: string) => {
    logger.start(`fetching visualization data for synset ${synsetId}`);
    
    // --- Graph Data ---
    const nodesMap = new Map();
    const links: any[] = [];
    
    const centralSynset = await getSynsetWithLabel(synsetId);
    if (!centralSynset) {
      logger.warn('Could not fetch central synset', { synsetId });
      setGraphData({ nodes: [], links: [] });
      setTreeData([]);
      logger.end(`fetching visualization data for synset ${synsetId}`);
      return;
    }

    const { relations: centralRelations = [], definitions: centralDefinitions = [], pos: centralPos } = centralSynset;
    nodesMap.set(centralSynset.id, {
      id: centralSynset.id,
      label: centralSynset.label,
      language: 'en',
      group: 1,
      pos: centralPos,
      definition: centralDefinitions[0]?.text
    });

    const relationTargets = await Promise.all(
      centralRelations.map((r: any) => getSynsetWithLabel(r.target))
    );
    
    relationTargets.forEach((targetSynset, index) => {
      if (targetSynset) {
        if (!nodesMap.has(targetSynset.id)) {
          const { definitions: targetDefinitions = [], pos: targetPos } = targetSynset;
          nodesMap.set(targetSynset.id, {
            id: targetSynset.id,
            label: targetSynset.label,
            language: 'en',
            group: 2,
            type: centralRelations[index].type,
            pos: targetPos,
            definition: targetDefinitions[0]?.text
          });
        }
        links.push({
          source: centralSynset.id,
          target: targetSynset.id,
          type: centralRelations[index].type
        });
      }
    });
    const graphData = { nodes: Array.from(nodesMap.values()), links };
    setGraphData(graphData);
    logger.debug('Graph data updated', graphData);

    // --- Tree Data (Hypernym Path with Hyponyms) ---
    const hierarchy: any[] = [];
    let currentId: string | null = synsetId;
    for (let i = 0; i < 15 && currentId; i++) { // Limit depth to avoid infinite loops
      const syn = await getSynsetWithLabel(currentId);
      if (!syn) break;
      hierarchy.unshift(syn);
      const hypernymRel = syn.relations.find((r: any) => r.type === 'hypernym');
      currentId = hypernymRel ? (hypernymRel as any).targetId : null;
    }
    
    // Build nested structure for tree component
    let tree: any[] = [];
    let currentLevelChildren: any[] | undefined;
    let searchedNodeInTree: any;

    for (const [index, syn] of hierarchy.entries()) {
      const node: any = {
        id: syn.id,
        label: syn.label,
        definition: syn.definitions.length > 0 ? syn.definitions[0].text : '',
        pos: syn.pos,
        language: syn.language,
        level: index,
        children: [],
        wordCount: syn.wordCount,
        relationType: 'hyponym'
      };
      
      if (index === 0) {
        delete node.relationType; // Root has no parent relation
        tree.push(node);
      } else if (currentLevelChildren) {
        currentLevelChildren.push(node);
      }
      
      if (syn.id === synsetId) {
        searchedNodeInTree = node;
      }
      currentLevelChildren = node.children;
    }

    // Add hyponyms to the searched synset
    if (searchedNodeInTree) {
        const centralSyn = hierarchy.find(s => s.id === synsetId);
        if (centralSyn) {
            const hyponymRels = centralSyn.relations.filter((r: any) => r.type === 'hyponym');
            const hyponymPromises = hyponymRels.map((r: any) => getSynsetWithLabel(r.target));
            const hyponyms = (await Promise.all(hyponymPromises)).filter(Boolean);
            
            searchedNodeInTree.children.push(...hyponyms.map((hypo: any) => ({
                id: hypo.id,
                label: hypo.label,
                definition: hypo.definitions.length > 0 ? hypo.definitions[0].text : '',
                pos: hypo.pos,
                language: hypo.language,
                level: hierarchy.length,
                children: [],
                wordCount: hypo.wordCount,
                relationType: 'hyponym'
            })));
        }
    }
    
    setTreeData(tree);
    logger.debug('Tree data updated', { tree });

    logger.end(`fetching visualization data for synset ${synsetId}`);
  }, [getSynsetById, getWordsBySynsetAndLanguage, getSynsetWithLabel]);

  const handleSearch = useCallback(async (termToSearch?: string) => {
    const term = (termToSearch || searchTerm).trim();
    if (!term) return;

    setIsSearching(true);
    logger.start(`visualization search for "${term}"`);

    try {
      const synsets = await querySynsets(term);
      if (synsets && synsets.length > 0) {
        const firstSynset = synsets[0] as any;
        logger.debug('Found synset, fetching visualization data', { synsetId: firstSynset.id });
        await fetchVisualizationData(firstSynset.id);
        setSelectedNode(firstSynset.id);
      } else {
        logger.warn('No synsets found for term', { term });
        setGraphData({ nodes: [], links: [] });
        setTreeData([]);
      }
    } catch (error) {
      logger.fail('Search for visualization failed', error);
      setGraphData({ nodes: [], links: [] });
      setTreeData([]);
    } finally {
      setIsSearching(false);
      logger.end(`visualization search for "${term}"`);
    }
  }, [searchTerm, querySynsets, fetchVisualizationData]);

  // Perform an initial search on mount if requirements are met
  useEffect(() => {
    if (lexiconRequirements.every(r => lexiconRequirements.some(req => r.id.startsWith(req.id)))) {
      handleSearch();
    }
  }, []);

  const handleNodeClick = (node: any) => {
    logger.debug('Node clicked', { node });
    setSelectedNode(node.id);
    if (node.id) {
      fetchVisualizationData(node.id);
    }
  };
  
  return (
    <Card title="WordNet Visualizations">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Explore WordNet relationships visually. Enter a word to see its relationship graph and hypernym (is-a-kind-of) hierarchy. Click any node to explore its relationships.
        </p>

        <LexiconRequirements requirements={lexiconRequirements} />

        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={() => handleSearch()}
          isSearching={isSearching || contextLoading}
          loading={isSearching || contextLoading}
        />

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Examples:</span>
          {PRESET_QUERIES.map(query => (
            <button
              key={query}
              onClick={() => {
                setSearchTerm(query);
                handleSearch(query);
              }}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Relationship Graph</h3>
          <WordRelationshipGraph 
            nodes={graphData.nodes}
            links={graphData.links}
            width={700}
            height={400}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Synset Hierarchy Tree</h3>
          <SynsetHierarchyTree
            data={treeData}
            width={700}
            height={400}
            onNodeClick={handleNodeClick}
            selectedNode={selectedNode}
          />
        </div>
      </div>
    </Card>
  );
};

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph';

interface WordNode {
  id: string;
  label: string;
  language: string;
  pos?: string;
  synsetId?: string;
  group?: number;
  size?: number;
  color?: string;
  type?: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'related';
}

interface WordLink {
  source: string;
  target: string;
  type: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'related';
  weight?: number;
  color?: string;
}

interface WordRelationshipGraphProps {
  nodes: WordNode[];
  links: WordLink[];
  width?: number;
  height?: number;
  onNodeClick?: (node: WordNode) => void;
  onLinkClick?: (link: WordLink) => void;
  selectedNode?: string;
  showLabels?: boolean;
  enableZoom?: boolean;
  enableDrag?: boolean;
  theme?: 'light' | 'dark';
}

const WordRelationshipGraph: React.FC<WordRelationshipGraphProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeClick,
  onLinkClick,
  selectedNode,
  showLabels = true,
  enableZoom = true,
  enableDrag = true,
  theme = 'light'
}) => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: WordNode[]; links: WordLink[] }>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Color schemes for different themes
  const colorSchemes = useMemo(() => ({
    light: {
      background: '#ffffff',
      nodeColors: {
        default: '#3b82f6',
        selected: '#ef4444',
        hovered: '#10b981',
        synonym: '#8b5cf6',
        antonym: '#f59e0b',
        hypernym: '#06b6d4',
        hyponym: '#84cc16'
      },
      linkColors: {
        synonym: '#8b5cf6',
        antonym: '#f59e0b',
        hypernym: '#06b6d4',
        hyponym: '#84cc16',
        related: '#6b7280'
      },
      textColor: '#1f2937'
    },
    dark: {
      background: '#1f2937',
      nodeColors: {
        default: '#60a5fa',
        selected: '#f87171',
        hovered: '#34d399',
        synonym: '#a78bfa',
        antonym: '#fbbf24',
        hypernym: '#22d3ee',
        hyponym: '#a3e635'
      },
      linkColors: {
        synonym: '#a78bfa',
        antonym: '#fbbf24',
        hypernym: '#22d3ee',
        hyponym: '#a3e635',
        related: '#9ca3af'
      },
      textColor: '#f9fafb'
    }
  }), []);

  const currentTheme = colorSchemes[theme];

  // Process graph data with colors and sizes
  useEffect(() => {
    const processedNodes = nodes.map(node => ({
      ...node,
      color: node.id === selectedNode 
        ? currentTheme.nodeColors.selected
        : node.id === hoveredNode
        ? currentTheme.nodeColors.hovered
        : currentTheme.nodeColors[node.type as keyof typeof currentTheme.nodeColors] || currentTheme.nodeColors.default,
      size: node.size || 5,
      label: showLabels ? node.label : ''
    }));

    const processedLinks = links.map(link => ({
      ...link,
      color: currentTheme.linkColors[link.type] || currentTheme.linkColors.related,
      width: link.weight || 1
    }));

    setGraphData({ nodes: processedNodes, links: processedLinks });
  }, [nodes, links, selectedNode, hoveredNode, showLabels, currentTheme]);

  // Handle node interactions
  const handleNodeClick = (node: WordNode) => {
    onNodeClick?.(node);
  };

  const handleNodeHover = (node: WordNode | null) => {
    setHoveredNode(node?.id || null);
  };

  const handleLinkClick = (link: WordLink) => {
    onLinkClick?.(link);
  };

  // Zoom to fit all nodes
  const zoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  // Center on selected node
  const centerOnNode = (nodeId: string) => {
    if (graphRef.current) {
      const node = graphRef.current.getGraphBbox().nodes.find((n: WordNode) => n.id === nodeId);
      if (node) {
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2, 1000);
      }
    }
  };

  // Auto-center on selected node when it changes
  useEffect(() => {
    if (selectedNode) {
      centerOnNode(selectedNode);
    }
  }, [selectedNode]);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={zoomToFit}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Fit View
        </button>
        {selectedNode && (
          <button
            onClick={() => centerOnNode(selectedNode)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
          >
            Center Selected
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Relationship Types</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Synonym</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Antonym</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>Hypernym</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-lime-500"></div>
            <span>Hyponym</span>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        style={{ width, height }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="label"
          linkLabel="type"
          nodeColor="color"
          nodeVal="size"
          linkColor="color"
          linkWidth="width"
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkClick={handleLinkClick}
          enableNodeDrag={enableDrag}
          enableZoomInteraction={enableZoom}
          enablePanInteraction={enableZoom}
          backgroundColor={currentTheme.background}
          cooldownTicks={100}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.1}
        />
      </div>

      {/* Node Info Panel */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="text-sm font-semibold mb-1">Node Info</h4>
          <div className="text-xs space-y-1">
            <div><strong>ID:</strong> {hoveredNode}</div>
            <div><strong>Label:</strong> {nodes.find(n => n.id === hoveredNode)?.label}</div>
            <div><strong>Language:</strong> {nodes.find(n => n.id === hoveredNode)?.language}</div>
            {nodes.find(n => n.id === hoveredNode)?.pos && (
              <div><strong>POS:</strong> {nodes.find(n => n.id === hoveredNode)?.pos}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordRelationshipGraph; 
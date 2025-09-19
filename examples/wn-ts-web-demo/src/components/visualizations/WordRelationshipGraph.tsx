import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface WordNode {
  id: string;
  label: string;
  language: string;
  pos?: string;
  definition?: string;
  synsetId?: string;
  group?: number;
  size?: number;
  color?: string;
  type?: 'synonym' | 'antonym' | 'hypernym' | 'hyponym' | 'related';
  x?: number;
  y?: number;
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
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<WordLink>>(new Set());

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
      color: currentTheme.nodeColors[node.type as keyof typeof currentTheme.nodeColors] || currentTheme.nodeColors.default,
      size: node.size || 8
    }));

    const processedLinks = links.map(link => ({
      ...link,
      color: currentTheme.linkColors[link.type] || currentTheme.linkColors.related,
      width: link.weight || 1
    }));

    setGraphData({ nodes: processedNodes, links: processedLinks });
  }, [nodes, links, currentTheme]);

  // Handle node interactions
  const handleNodeClick = (node: WordNode) => {
    onNodeClick?.(node);
  };

  const handleNodeHover = (node: WordNode | null) => {
    setHoveredNode(node?.id || null);

    if (node) {
      const newHighlightNodes = new Set<string>();
      const newHighlightLinks = new Set<WordLink>();
      newHighlightNodes.add(node.id);
      
      links.forEach(link => {
        if (link.source === node.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(link.target);
        } else if (link.target === node.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(link.source);
        }
      });
      
      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
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
      const node = graphData.nodes.find((n: WordNode) => n.id === nodeId);
      if (node && typeof node.x !== 'undefined' && typeof node.y !== 'undefined') {
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
          nodeVal="size"
          linkLabel="type"
          linkWidth={(link: any) => (highlightLinks.has(link) ? 2 : 1)}
          linkColor={(link: any) => (highlightLinks.has(link) ? '#ff8f00' : link.color)}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkClick={handleLinkClick}
          enableNodeDrag={enableDrag}
          enableZoomInteraction={enableZoom}
          enablePanInteraction={enableZoom}
          backgroundColor={currentTheme.background}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.1}
          nodeCanvasObject={(node: WordNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            if (!node.x || !node.y) return;

            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `600 ${fontSize}px Sans-Serif`;

            const r = (node.size || 5) * 1.2;
            
            let color = node.color || currentTheme.nodeColors.default;
            if (highlightNodes.has(node.id)) {
              if (node.id === selectedNode) {
                color = currentTheme.nodeColors.selected;
              } else if (node.id === hoveredNode) {
                color = currentTheme.nodeColors.hovered;
              } else {
                color = '#ffb300';
              }
            }

            // Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            // Label
            if (showLabels && globalScale > 0.5) {
              const textColor = theme === 'dark' ? '#f0f0f0' : '#111';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = textColor;
              ctx.fillText(label, node.x, node.y);
            }
          }}
        />
      </div>

      {/* Node Info Panel */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg max-w-xs transition-opacity duration-200">
          <h4 className="text-sm font-semibold mb-1">Node Info</h4>
          <div className="text-xs space-y-1">
            <div><strong>ID:</strong> {hoveredNode}</div>
            <div><strong>Label:</strong> {nodes.find(n => n.id === hoveredNode)?.label}</div>
            {nodes.find(n => n.id === hoveredNode)?.pos && (
              <div><strong>POS:</strong> {nodes.find(n => n.id === hoveredNode)?.pos}</div>
            )}
            {nodes.find(n => n.id === hoveredNode)?.definition && (
              <div><strong>Definition:</strong> {nodes.find(n => n.id === hoveredNode)?.definition}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordRelationshipGraph; 

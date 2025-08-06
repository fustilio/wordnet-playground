import React, { useState, useMemo } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface SynsetNode {
  id: string;
  label: string;
  definition?: string;
  pos?: string;
  language: string;
  children?: SynsetNode[];
  level: number;
  isExpanded?: boolean;
  isLeaf?: boolean;
  wordCount?: number;
  relationType?: 'hypernym' | 'hyponym' | 'instance_hypernym' | 'instance_hyponym';
}

interface SynsetHierarchyTreeProps {
  data: SynsetNode[];
  onNodeClick?: (node: SynsetNode) => void;
  onNodeToggle?: (nodeId: string, isExpanded: boolean) => void;
  selectedNode?: string;
  maxDepth?: number;
  showDefinitions?: boolean;
  showWordCount?: boolean;
  theme?: 'light' | 'dark';
  width?: number;
  height?: number;
}

const SynsetHierarchyTree: React.FC<SynsetHierarchyTreeProps> = ({
  data,
  onNodeClick,
  onNodeToggle,
  selectedNode,
  maxDepth = 5,
  showDefinitions = true,
  showWordCount = true,
  theme = 'light',
  width = 400,
  height = 600
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const themeClasses = useMemo(() => ({
    light: {
      container: 'bg-white border-gray-200',
      node: 'hover:bg-gray-50',
      selected: 'bg-blue-50 border-blue-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200'
    },
    dark: {
      container: 'bg-gray-800 border-gray-700',
      node: 'hover:bg-gray-700',
      selected: 'bg-blue-900 border-blue-700',
      text: 'text-gray-100',
      textSecondary: 'text-gray-400',
      border: 'border-gray-700'
    }
  }), []);

  const currentTheme = themeClasses[theme];

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
    onNodeToggle?.(nodeId, newExpanded.has(nodeId));
  };

  // Render a single tree node
  const renderNode = (node: SynsetNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = hasChildren && depth < maxDepth;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
            ${currentTheme.node}
            ${isSelected ? currentTheme.selected : ''}
            ${currentTheme.border} border-l-2
            ${isSelected ? 'border-l-blue-500' : 'border-l-transparent'}
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => onNodeClick?.(node)}
        >
          {/* Expand/Collapse Icon */}
          {canExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Node Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              <FolderIcon className="w-4 h-4 text-yellow-500" />
            ) : (
              <DocumentIcon className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${currentTheme.text}`}>
              {node.label}
            </div>
            
            {showDefinitions && node.definition && (
              <div className={`text-xs ${currentTheme.textSecondary} truncate`}>
                {node.definition}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${currentTheme.textSecondary} bg-gray-100 dark:bg-gray-700`}>
                {node.pos || 'unknown'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${currentTheme.textSecondary} bg-gray-100 dark:bg-gray-700`}>
                {node.language}
              </span>
              {showWordCount && node.wordCount && (
                <span className={`text-xs px-2 py-1 rounded ${currentTheme.textSecondary} bg-gray-100 dark:bg-gray-700`}>
                  {node.wordCount} words
                </span>
              )}
              {node.relationType && (
                <span className={`text-xs px-2 py-1 rounded ${currentTheme.textSecondary} bg-gray-100 dark:bg-gray-700`}>
                  {node.relationType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="border-l border-gray-200 dark:border-gray-700 ml-6">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render the entire tree
  const renderTree = () => {
    return (
      <div className="space-y-1">
        {data.map(node => renderNode(node))}
      </div>
    );
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden ${currentTheme.container}`}
      style={{ width, height }}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${currentTheme.border} bg-gray-50 dark:bg-gray-900`}>
        <h3 className={`font-semibold ${currentTheme.text}`}>
          Synset Hierarchy
        </h3>
        <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
          {data.length} root synsets • {expandedNodes.size} expanded
        </p>
      </div>

      {/* Tree Content */}
      <div className="overflow-y-auto" style={{ height: height - 80 }}>
        {data.length > 0 ? (
          renderTree()
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className={`text-center ${currentTheme.textSecondary}`}>
              <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No synset data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with controls */}
      <div className={`px-4 py-2 border-t ${currentTheme.border} bg-gray-50 dark:bg-gray-900`}>
        <div className="flex items-center justify-between text-xs">
          <div className={`${currentTheme.textSecondary}`}>
            Max depth: {maxDepth}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Collapse All
            </button>
            <button
              onClick={() => {
                const allNodeIds = new Set<string>();
                const collectIds = (nodes: SynsetNode[]) => {
                  nodes.forEach(node => {
                    allNodeIds.add(node.id);
                    if (node.children) {
                      collectIds(node.children);
                    }
                  });
                };
                collectIds(data);
                setExpandedNodes(allNodeIds);
              }}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Expand All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynsetHierarchyTree; 
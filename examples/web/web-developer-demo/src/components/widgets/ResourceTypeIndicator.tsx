import React from 'react';
import type { ResourceTypeInfo } from 'wn-ts-web';

interface ResourceTypeIndicatorProps {
  resourceType: ResourceTypeInfo;
  showDetails?: boolean;
  className?: string;
}

export const ResourceTypeIndicator: React.FC<ResourceTypeIndicatorProps> = ({
  resourceType,
  showDetails = false,
  className = ''
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lexicon': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ili': return 'bg-green-100 text-green-800 border-green-200';
      case 'mixed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lexicon': return '📚';
      case 'ili': return '🌐';
      case 'mixed': return '🔗';
      default: return '❓';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm">{getTypeIcon(resourceType.type)}</span>
      <span className={`px-2 py-1 rounded text-xs border font-medium ${getTypeColor(resourceType.type)}`}>
        {resourceType.type.toUpperCase()}
      </span>
      
      {showDetails && (
        <div className="text-xs text-gray-600">
          {resourceType.hasCrossLingualMappings && (
            <span className="inline-flex items-center gap-1">
              🌐 <span>Cross-lingual</span>
            </span>
          )}
          {resourceType.mappingConfidence > 0 && (
            <span className="ml-2">
              ({Math.round(resourceType.mappingConfidence * 100)}% confidence)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Card } from '../shared/Card';
import { useWordNetContext } from "wn-ts-web/react";
import { 
  isRequirementSatisfied, 
  isRequirementAvailable 
} from '../../utils/package-utils';

interface LexiconRequirement {
  id: string;
  label: string;
  description: string;
  requiredFor: string[];
  priority: 'high' | 'medium' | 'low';
}

export const LexiconRequirementsWidget: React.FC = () => {
  const { availablePackages, loadedPackages, loadPackageData, loading } = useWordNetContext();
  
  // Define all lexicon requirements across demos
  const lexiconRequirements: LexiconRequirement[] = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Modern English WordNet with comprehensive coverage',
      requiredFor: ['Basic Demo', 'Bilingual Dictionary (EN)', 'Advanced Features'],
      priority: 'high'
    },
    {
      id: 'cili:1.0',
      label: 'CILI Index 1.0',
      description: 'Cross-lingual index for multilingual features',
      requiredFor: ['Bilingual Dictionary', 'Cross-language Search'],
      priority: 'medium'
    },
    {
      id: 'omw-fr:1.4',
      label: 'French WordNet 1.4',
      description: 'French language WordNet for bilingual features',
      requiredFor: ['Bilingual Dictionary (EN→FR)', 'French Search'],
      priority: 'medium'
    },
    {
      id: 'omw-th:1.4',
      label: 'Thai WordNet 1.4',
      description: 'Thai language WordNet for bilingual features',
      requiredFor: ['Bilingual Dictionary (EN→TH)', 'Thai Search'],
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200';
      case 'medium': return 'border-orange-200';
      case 'low': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  const isLoaded = (id: string) => isRequirementSatisfied(id, loadedPackages);
  const isLoading = (id: string) => loading && !isLoaded(id);

  return (
    <Card title="Lexicon Requirements">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Load the lexicons you need for specific demo features. Required lexicons are marked by priority.
        </p>
        
        <div className="space-y-3">
          {lexiconRequirements.map((req) => {
            const loaded = isLoaded(req.id);
            const loading = isLoading(req.id);
            const available = isRequirementAvailable(req.id, availablePackages);
            
            return (
              <div 
                key={req.id}
                className={`border rounded-lg p-3 ${getPriorityBorder(req.priority)} ${
                  loaded ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{req.label}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                      {loaded && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Loaded
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                    
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Required for:</span> {req.requiredFor.join(', ')}
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {!loaded && available && (
                      <button
                        onClick={() => loadPackageData(req.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Loading...' : 'Load'}
                      </button>
                    )}
                    
                    {!available && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                        Not Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Status:</span> {loadedPackages.length} of {lexiconRequirements.filter(r => isRequirementAvailable(r.id, availablePackages)).length} available lexicons loaded
          </div>
          
          {loadedPackages.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Loaded:</span> {loadedPackages.join(', ')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 

/**
 * Translation Showcase
 * 
 * This component showcases all available translation examples and utilities
 * in a comprehensive demo interface.
 */

import React, { useState } from 'react';
import { Card } from '../../../components/shared/Card';
import { Tabs } from '../../../components/shared/Tabs';
import { UnifiedTranslationDemo } from './UnifiedTranslationDemo';
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('TranslationShowcase');

export const TranslationShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('unified');

  const tabs = [
    { id: 'unified', label: 'Unified Demo', description: 'Comprehensive translation with all methods and features' },
    { id: 'comparison', label: 'Method Comparison', description: 'Compare different translation approaches' }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    logger.debug('Translation showcase tab changed', { from: activeTab, to: tabId });
  };

  return (
    <div className="space-y-6">
      <Card title="🌍 Translation Examples Showcase">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Explore different approaches to bilingual translation using the WordNet database. 
            The unified demo combines all translation methods and features into a single, powerful interface.
          </p>

          <Tabs tabs={tabs.map(tab => tab.id)} activeTab={activeTab} setActiveTab={handleTabChange} />

          <div className="mt-6">
            {activeTab === 'unified' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Unified Translation Demo</h3>
                  <p className="text-sm text-blue-700">
                    This comprehensive demo combines all translation approaches including fuzzy matching, 
                    ILI-based cross-lingual mapping, and automatic method selection. Choose your preferred 
                    method or let the system automatically select the best approach.
                  </p>
                </div>
                <UnifiedTranslationDemo />
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Translation Method Comparison</h3>
                  <p className="text-sm text-purple-700">
                    Compare different translation approaches to understand their strengths and use cases.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Fuzzy Matching</h4>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Method:</strong> Form-based similarity matching using the new translation utilities</p>
                        <p><strong>Strengths:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Faster execution</li>
                          <li>Works with partial matches</li>
                          <li>Simpler API</li>
                          <li>Better error handling</li>
                          <li>More flexible options</li>
                        </ul>
                        <p><strong>Use Cases:</strong> Quick translations, user-friendly applications, approximate matching</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">ILI-based Cross-lingual</h4>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Method:</strong> Uses the Collaborative Interlingual Index (CILI) for semantic mapping</p>
                        <p><strong>Strengths:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Semantically accurate</li>
                          <li>Concept-based mapping</li>
                          <li>Research-grade quality</li>
                          <li>Cross-lingual consistency</li>
                          <li>Academic standard</li>
                        </ul>
                        <p><strong>Use Cases:</strong> Research, academic applications, concept-based translation</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Method Selection Guide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">When to use Fuzzy Matching:</h5>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Quick, user-friendly applications</li>
                        <li>• When you need approximate matches</li>
                        <li>• For real-time translation features</li>
                        <li>• When semantic accuracy is less critical</li>
                        <li>• For exploratory or discovery interfaces</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">When to use ILI-based:</h5>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Research and academic applications</li>
                        <li>• When semantic accuracy is critical</li>
                        <li>• For concept-based translation</li>
                        <li>• When working with specialized domains</li>
                        <li>• For high-quality translation systems</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Pro Tip:</strong> Use the "Auto" method in the unified demo to get the best of both worlds - 
                      it tries ILI first for accuracy, then falls back to fuzzy matching for broader coverage.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TranslationShowcase;

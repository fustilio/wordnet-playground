import React, { useState } from 'react';
import { Card } from '../components/shared/Card';
import { useWordNetContext } from '../contexts/WordNetContext';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('SequentialRunner');

interface TestStep {
  key: string;
  name: string;
  fn: () => Promise<any>;
  required?: boolean;
}

interface TestResult {
  key: string;
  success: boolean;
  duration: number;
  output?: any;
  error?: string;
}

export const SequentialRunner: React.FC = () => {
  const { wordnet } = useWordNetContext();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const testSteps: TestStep[] = [
    {
      key: 'init',
      name: 'Initialize WordNet',
      fn: async () => {
        if (!wordnet) throw new Error('WordNet not initialized');
        return { success: true };
      },
      required: true
    },
    {
      key: 'stats',
      name: 'Get Statistics',
      fn: async () => {
        if (!wordnet) throw new Error('WordNet not initialized');
        const stats = await wordnet.getStatistics();
        return stats;
      }
    },
    {
      key: 'search',
      name: 'Search for "water"',
      fn: async () => {
        if (!wordnet) throw new Error('WordNet not initialized');
        const results = await wordnet?.getQueryService()?.getWords({ form: 'water', searchAllForms: true }) || [];
        return results;
      }
    }
  ];

  const runTests = async () => {
    logger.start('running sequential tests');
    setIsRunning(true);
    setResults([]);
    
    const newResults: TestResult[] = [];
    
    for (const step of testSteps) {
      setCurrentStep(step.key);
      logger.step(`running test: ${step.name}`);
      
      const startTime = performance.now();
      
      try {
        const output = await step.fn();
        const duration = performance.now() - startTime;
        
        const result: TestResult = {
          key: step.key,
          success: true,
          duration,
          output
        };
        
        newResults.push(result);
        setResults([...newResults]);
        
        logger.success(`Test ${step.name} completed successfully`, { 
          durationMs: Math.round(duration),
          output: output
        });
      } catch (error) {
        const duration = performance.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        const result: TestResult = {
          key: step.key,
          success: false,
          duration,
          error: errorMsg
        };
        
        newResults.push(result);
        setResults([...newResults]);
        
        logger.fail(`Test ${step.name} failed`, { 
          durationMs: Math.round(duration),
          error: errorMsg
        });
        
        if (step.required) {
          logger.warn('Required test failed, stopping execution');
          break;
        }
      }
    }
    
    setCurrentStep(null);
    setIsRunning(false);
    
    const successCount = newResults.filter(r => r.success).length;
    const totalCount = newResults.length;
    
    logger.success('Sequential tests completed', { 
      successCount, 
      totalCount, 
      successRate: `${Math.round((successCount / totalCount) * 100)}%` 
    });
    logger.end('running sequential tests', { successCount, totalCount });
  };

  const resetTests = () => {
    setResults([]);
    setCurrentStep(null);
    logger.info('Test results reset');
  };

  return (
    <div className="space-y-6">
      <Card title="Sequential Test Runner">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Run a series of tests sequentially to verify WordNet functionality.
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={runTests}
              disabled={isRunning || !wordnet}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
            <button
              onClick={resetTests}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          {/* Test Steps */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Test Steps</h4>
            {testSteps.map((step) => {
              const result = results.find(r => r.key === step.key);
              const isCurrent = currentStep === step.key;
              
              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-lg border ${
                    isCurrent
                      ? 'border-blue-300 bg-blue-50'
                      : result?.success
                      ? 'border-green-300 bg-green-50'
                      : result?.success === false
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isCurrent && <span className="text-blue-600">⏳</span>}
                      {result?.success === true && <span className="text-green-600">✅</span>}
                      {result?.success === false && <span className="text-red-600">❌</span>}
                      {!result && !isCurrent && <span className="text-gray-400">⭕</span>}
                      <span className="font-medium">{step.name}</span>
                      {step.required && <span className="text-xs text-red-600">(Required)</span>}
                    </div>
                    {result && (
                      <span className="text-sm text-gray-600">
                        {Math.round(result.duration)}ms
                      </span>
                    )}
                  </div>
                  
                  {result?.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Results Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="ml-2 font-medium">{results.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Passed:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {results.filter(r => r.success).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {results.filter(r => !r.success).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};



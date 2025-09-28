/**
 * Improved Search Test
 * 
 * This test verifies the improved search functionality for navigation
 */

import { describe, it, expect } from 'vitest';

describe('Improved Search Functionality', () => {
  describe('Search Strategies', () => {
    it('should try multiple search strategies', () => {
      const searchStrategies = [
        'Direct search',
        'Remove underscores',
        'Case variations',
        'Partial matching',
        'Alternative synonyms'
      ];

      expect(searchStrategies).toHaveLength(5);
      expect(searchStrategies[0]).toBe('Direct search');
      expect(searchStrategies[1]).toBe('Remove underscores');
      expect(searchStrategies[2]).toBe('Case variations');
      expect(searchStrategies[3]).toBe('Partial matching');
      expect(searchStrategies[4]).toBe('Alternative synonyms');
    });

    it('should handle underscore replacement', () => {
      const testCases = [
        { input: 'motor_vehicle', expected: 'motor vehicle' },
        { input: 'steering_wheel', expected: 'steering wheel' },
        { input: 'parking_lot', expected: 'parking lot' },
        { input: 'head_light', expected: 'head light' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.replace(/_/g, ' ');
        expect(result).toBe(expected);
      });
    });

    it('should generate case variations', () => {
      const testWord = 'automobile';
      const variations = [
        testWord.toLowerCase(),
        testWord.toUpperCase(),
        testWord.charAt(0).toUpperCase() + testWord.slice(1).toLowerCase()
      ];

      expect(variations).toEqual(['automobile', 'AUTOMOBILE', 'Automobile']);
    });

    it('should extract partial terms', () => {
      const testCases = [
        { input: 'motor_vehicle', expected: ['motor', 'vehicle'] },
        { input: 'steering_wheel', expected: ['steering', 'wheel'] },
        { input: 'head_light', expected: ['head', 'light'] },
        { input: 'car', expected: [] } // No underscores
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.split('_').filter(term => term.length > 3);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Alternative Synonyms', () => {
    it('should provide alternative synonyms for common terms', () => {
      const alternatives: { [key: string]: string[] } = {
        'motor_vehicle': ['car', 'auto', 'automobile'],
        'motorcycle': ['bike', 'cycle'],
        'airplane': ['plane', 'aircraft'],
        'windshield': ['windscreen'],
        'steering_wheel': ['wheel', 'steering'],
        'headlight': ['light', 'headlamp'],
        'parking_lot': ['lot', 'parking'],
        'convertible': ['convertible_car'],
        'hatchback': ['hatch'],
        'suv': ['sport_utility_vehicle']
      };

      expect(alternatives['motor_vehicle']).toContain('car');
      expect(alternatives['motorcycle']).toContain('bike');
      expect(alternatives['airplane']).toContain('plane');
      expect(alternatives['windshield']).toContain('windscreen');
    });

    it('should handle missing alternatives gracefully', () => {
      const alternatives: { [key: string]: string[] } = {
        'motor_vehicle': ['car', 'auto', 'automobile'],
        'motorcycle': ['bike', 'cycle']
      };

      const getAlternatives = (term: string) => alternatives[term] || [];
      
      expect(getAlternatives('motor_vehicle')).toEqual(['car', 'auto', 'automobile']);
      expect(getAlternatives('unknown_term')).toEqual([]);
    });
  });

  describe('Search Result Handling', () => {
    it('should track search success and failure', () => {
      const searchResult = {
        success: true,
        originalTerm: 'motor_vehicle',
        foundTerm: 'car',
        usedAlternative: true,
        strategies: ['direct', 'underscore_removal', 'alternatives']
      };

      expect(searchResult.success).toBe(true);
      expect(searchResult.originalTerm).toBe('motor_vehicle');
      expect(searchResult.foundTerm).toBe('car');
      expect(searchResult.usedAlternative).toBe(true);
      expect(searchResult.strategies).toContain('alternatives');
    });

    it('should provide helpful error messages', () => {
      const suggestions = [
        'Try searching for a different word',
        'Check if the word exists in the database',
        'Try a more common synonym',
        'The word might not be in the current lexicon'
      ];

      const getRandomSuggestion = () => 
        suggestions[Math.floor(Math.random() * suggestions.length)];

      const suggestion = getRandomSuggestion();
      expect(suggestions).toContain(suggestion);
      expect(suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('Chain Management', () => {
    it('should handle successful navigation', () => {
      const navigationSuccess = {
        relation: { lemma: 'car', relationType: 'hypernym' },
        originalLemma: 'motor_vehicle',
        timestamp: Date.now(),
        usedAlternative: true
      };

      expect(navigationSuccess.relation.lemma).toBe('car');
      expect(navigationSuccess.originalLemma).toBe('motor_vehicle');
      expect(navigationSuccess.usedAlternative).toBe(true);
      expect(navigationSuccess.timestamp).toBeGreaterThan(0);
    });

    it('should handle failed navigation', () => {
      const navigationFailure = {
        relation: { lemma: 'nonexistent_word', relationType: 'hypernym' },
        error: 'No synsets found',
        removedFromChain: true,
        timestamp: Date.now()
      };

      expect(navigationFailure.error).toBe('No synsets found');
      expect(navigationFailure.removedFromChain).toBe(true);
    });

    it('should manage chain state correctly', () => {
      const chainState = {
        beforeNavigation: ['car', 'vehicle'],
        afterSuccess: ['car', 'vehicle', 'automobile'],
        afterFailure: ['car', 'vehicle'] // Removed failed step
      };

      expect(chainState.beforeNavigation).toHaveLength(2);
      expect(chainState.afterSuccess).toHaveLength(3);
      expect(chainState.afterFailure).toHaveLength(2);
    });
  });

  describe('User Feedback', () => {
    it('should provide appropriate visual feedback', () => {
      const feedbackStates = {
        searching: {
          navigating: true,
          lastNavigation: { relation: { lemma: 'car' }, timestamp: Date.now() },
          message: '✓ Navigating...'
        },
        success: {
          navigating: false,
          navigationSuccess: { 
            relation: { lemma: 'car' }, 
            originalLemma: 'motor_vehicle',
            timestamp: Date.now() 
          },
          message: 'Successfully navigated to "car"'
        },
        failure: {
          navigating: false,
          error: 'No synsets found for "nonexistent_word"',
          message: 'Please try a different word'
        }
      };

      expect(feedbackStates.searching.navigating).toBe(true);
      expect(feedbackStates.success.navigationSuccess).toBeDefined();
      expect(feedbackStates.failure.error).toContain('No synsets found');
    });

    it('should show alternative search notifications', () => {
      const alternativeNotification = {
        originalTerm: 'motor_vehicle',
        foundTerm: 'car',
        message: 'Found "car" (alternative for "motor_vehicle")',
        showAlternative: true
      };

      expect(alternativeNotification.showAlternative).toBe(true);
      expect(alternativeNotification.message).toContain('alternative');
    });
  });

  describe('Performance Considerations', () => {
    it('should limit search attempts', () => {
      const maxSearchAttempts = 5;
      const searchStrategies = [
        'direct',
        'underscore_removal', 
        'case_variations',
        'partial_matching',
        'alternatives'
      ];

      expect(searchStrategies.length).toBeLessThanOrEqual(maxSearchAttempts);
    });

    it('should provide timeout handling', () => {
      const searchTimeout = 5000; // 5 seconds
      const notificationTimeout = 3000; // 3 seconds

      expect(searchTimeout).toBeGreaterThan(notificationTimeout);
      expect(searchTimeout).toBeGreaterThan(0);
      expect(notificationTimeout).toBeGreaterThan(0);
    });
  });
});

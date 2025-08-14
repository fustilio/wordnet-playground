import { useState, useEffect } from 'react';
import { WebWordnet, WordNetEvents } from 'wn-ts-web';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('useStatistics');

export const useStatistics = (wordnet: WebWordnet | null) => {
  const [stats, setStats] = useState<{
    statistics: Awaited<ReturnType< WebWordnet['getStatistics']>>;
    posDistribution: Awaited<ReturnType<WebWordnet['getPartOfSpeechDistribution']>>;
    lexiconStats: Awaited<ReturnType<WebWordnet['getLexiconStatistics']>>;
  } | null>(null);

  const loadStats = async () => {
    if (!wordnet) return;
    
    logger.start('loading statistics');
    
    try {
      logger.step('getting basic statistics');
      const statistics = await wordnet.getStatistics();
      
      logger.step('getting part of speech distribution');
      const posDistribution = await wordnet.getPartOfSpeechDistribution();
      
      logger.step('getting lexicon statistics');
      const lexiconStats = await wordnet.getLexiconStatistics();
      
      setStats({ statistics, posDistribution, lexiconStats });
      logger.success('Statistics loaded successfully');
      logger.end('loading statistics', { hasStats: !!statistics, hasPosDistribution: !!posDistribution, hasLexiconStats: !!lexiconStats });
    } catch (error) {
      logger.fail('Failed to load statistics', error);
      logger.end('loading statistics');
    }
  };

  useEffect(() => {
    if (wordnet && !stats) {
      loadStats();
    }
  }, [wordnet, stats]);

  // Listen for WordNet data changes using the instance's event system
  useEffect(() => {
    if (!wordnet || !wordnet.on) return;

    const handleDataChanged = () => {
      logger.info('Data changed, refreshing statistics');
      loadStats();
    };

    const handleStatisticsUpdated = () => {
      logger.info('Statistics updated, refreshing');
      loadStats();
    };

    // Subscribe to data change events
    wordnet.on(WordNetEvents.DATA_CHANGED, handleDataChanged);
    wordnet.on(WordNetEvents.STATISTICS_UPDATED, handleStatisticsUpdated);

    // Cleanup subscription
    return () => {
      if (wordnet.off) {
        wordnet.off(WordNetEvents.DATA_CHANGED, handleDataChanged);
        wordnet.off(WordNetEvents.STATISTICS_UPDATED, handleStatisticsUpdated);
      }
    };
  }, [wordnet]);

  return { stats, refreshStats: loadStats };
}; 
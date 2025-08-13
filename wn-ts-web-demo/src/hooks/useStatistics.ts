import { useState, useEffect } from 'react';
import { WebWordnet, WordNetEvents } from 'wn-ts-web';

export const useStatistics = (wordnet: WebWordnet | null) => {
  const [stats, setStats] = useState<{
    statistics: Awaited<ReturnType< WebWordnet['getStatistics']>>;
    posDistribution: Awaited<ReturnType<WebWordnet['getPartOfSpeechDistribution']>>;
    lexiconStats: Awaited<ReturnType<WebWordnet['getLexiconStatistics']>>;
  } | null>(null);

  const loadStats = async () => {
    if (!wordnet) return;
    try {
      const statistics = await wordnet.getStatistics();
      const posDistribution = await wordnet.getPartOfSpeechDistribution();
      const lexiconStats = await wordnet.getLexiconStatistics();
      setStats({ statistics, posDistribution, lexiconStats });
    } catch (error) {
      console.error('Failed to load statistics:', error);
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
      console.log('📊 Statistics: Data changed, refreshing statistics...');
      loadStats();
    };

    const handleStatisticsUpdated = () => {
      console.log('📊 Statistics: Statistics updated, refreshing...');
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
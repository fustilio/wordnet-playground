import { useState, useEffect } from 'react';

export const useStatistics = (wordnet: any) => {
  const [stats, setStats] = useState<any>(null);

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

  return { stats };
}; 
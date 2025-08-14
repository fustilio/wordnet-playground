import React, { useMemo, useState } from 'react';
import { useWordNetContext } from '../../contexts/WordNetContext';
import { Card } from '../shared/Card';
import { LexiconRequirements } from '../shared/LexiconRequirements';
import { createScopedLogger } from '../../logger';
import { getAvailableProjects } from '../../utils/project-list';

const logger = createScopedLogger('BilingualDictionary');

// Use ISO-2 codes to match DB inserts ('en','fr','th')
const LANG_LABEL: Record<string, string> = { en: 'English', fr: 'French', th: 'Thai' };

type Pair = { from: 'en' | 'fr'; to: 'fr' | 'th' } | { from: 'en'; to: 'th' };

export const BilingualDictionary: React.FC = () => {
  const { wordnet, dataLoader, availablePackages, loadedPackages, loadPackageData, refreshPackages, loading } = useWordNetContext();
  const [pair, setPair] = useState<Pair>({ from: 'en', to: 'fr' });
  const [term, setTerm] = useState('water');
  const [results, setResults] = useState<Array<{ source: string; target: string; synsetId: string; defFrom?: string; defTo?: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: 'oewn:2024',
      label: 'Open English WordNet 2024',
      description: 'Required for English source language support',
      priority: 'high' as const
    },
    {
      id: 'cili:1.0',
      label: 'CILI Index 1.0',
      description: 'Required for cross-lingual mapping',
      priority: 'high' as const
    },
    {
      id: 'omw-fr:1.4',
      label: 'French WordNet 1.4',
      description: 'Required for French target language support',
      priority: 'medium' as const
    },
    {
      id: 'omw-th:1.4',
      label: 'Thai WordNet 1.4',
      description: 'Required for Thai target language support',
      priority: 'low' as const
    }
  ];

  const findLatestByPrefix = (prefix: string, filter?: (v: string) => boolean) => {
    // Use full catalog so we don’t depend on context.availablePackages filtering
    const catalog = getAvailableProjects();
    const proj = catalog.find(p => p.id === prefix);
    if (!proj) return undefined;
    // Prefer explicit versions array; fallback to single version
    const versions = (proj as any).versions && (proj as any).versions.length > 0
      ? (proj as any).versions as string[]
      : (proj as any).version ? [String((proj as any).version)] : [];
    const filtered = versions.filter(v => (filter ? filter(v) : true));
    const toNum = (v: string) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? -Infinity : n;
    };
    filtered.sort((a, b) => toNum(b) - toNum(a));
    const latest = filtered[0];
    return latest ? `${proj.id}:${latest}` : undefined;
  };

  const requiredProjects = useMemo(() => {
    // English: prefer 'oewn:>=2021', else 'ewn:<2021'
    const en = findLatestByPrefix('oewn', v => toInt(v) >= 2021) || findLatestByPrefix('ewn', v => toInt(v) < 2021);
    // French/Thai from OMW where available
    const fr = findLatestByPrefix('omw-fr');
    const th = findLatestByPrefix('omw-th');
    return { en, fr, th };
    function toInt(v: string) {
      const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? -Infinity : n;
    }
  }, [availablePackages]);

  const ensureLoaded = async () => {
    logger.start('ensuring required packages are loaded');
    logger.step('checking package requirements', { pair, requiredProjects });
    
    const need: string[] = [];
    if (pair.from === 'en' && !loadedPackages.some(id => id.startsWith('oewn') || id.startsWith('ewn') || id.startsWith('omw-en'))) {
      if (requiredProjects.en) need.push(requiredProjects.en);
    }
    if ((pair.from === 'fr' || pair.to === 'fr') && !loadedPackages.some(id => id.startsWith('omw-fr') || id.startsWith('wn-fra') || id.startsWith('fra'))) {
      if (requiredProjects.fr) need.push(requiredProjects.fr);
    }
    if (pair.to === 'th' && !loadedPackages.some(id => id.startsWith('omw-th') || id.startsWith('wn-tha') || id.startsWith('th'))) {
      if (requiredProjects.th) need.push(requiredProjects.th);
    }
    
    logger.step('packages to load', { need, alreadyLoaded: loadedPackages });
    
    for (const id of need) {
      try {
        logger.step('loading required package', { packageId: id });
        await loadPackageData(id);
      } catch (error) {
        logger.fail('Failed to load required package', { packageId: id, error });
      }
    }
    
    await refreshPackages();
    logger.success('Package loading completed', { loaded: need });
    logger.end('ensuring required packages are loaded', { loaded: need });
  };

  const runQuery = async () => {
    logger.start(`bilingual query for "${term}"`);
    logger.step('starting bilingual query', { term, pair });
    
    setBusy(true);
    setLastError(null);
    setResults([]);
    
    try {
      if (!wordnet) throw new Error('WordNet not initialized');
      const qs = wordnet.getQueryService?.();
      if (!qs) throw new Error('Query service unavailable');

      const fromLang = pair.from;
      const toLang = pair.to;

      // 1) Find source words in fromLang
      logger.step('finding source words', { term, language: fromLang });
      const srcWords = await qs.getWords({ form: term, language: fromLang, searchAllForms: true });
      logger.step('source words found', { count: srcWords.length });
      
      const out: Array<{ source: string; target: string; synsetId: string; defFrom?: string; defTo?: string }> = [];

      for (const w of srcWords.slice(0, 25)) {
        const senses = await qs.getSenses({ wordIdOrForm: w.id });
        for (const s of senses.slice(0, 25)) {
          // 2) Same synset, other-language words
          const toWords = await qs.getWordsBySynsetAndLanguage(s.synset, toLang);
          if (toWords.length === 0) continue;

          // 3) Definitions from both langs
          const defs = await qs.getDefinitionsBySynsetId(s.synset);
          const defFrom = defs.find(d => d.language === fromLang)?.text;
          const defTo = defs.find(d => d.language === toLang)?.text;

          for (const tw of toWords.slice(0, 10)) {
            out.push({ source: w.lemma, target: tw.lemma, synsetId: s.synset, defFrom, defTo });
          }
        }
      }
      
      logger.success('Bilingual query completed successfully', { 
        term, 
        pair, 
        resultCount: out.length
      });
      
      setResults(out);
      logger.end(`bilingual query for "${term}"`, { resultCount: out.length });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      logger.fail('Bilingual query failed', { term, pair, error: errorMsg });
      setLastError(errorMsg);
      logger.end(`bilingual query for "${term}"`);
    } finally {
      setBusy(false);
    }
  };

  // Removed automatic data loading - user must manually load required lexicons

  const canQuery = !!wordnet && !!dataLoader && !loading && !busy;

  const handlePairChange = (field: 'from' | 'to', value: string) => {
    logger.debug('Language pair changed', { field, from: pair.from, to: pair.to, newValue: value });
    setPair(p => ({ ...p, [field]: value as any }));
  };

  const handleTermChange = (value: string) => {
    setTerm(value);
  };

  return (
    <Card title="Bilingual Dictionary">
      <div className="space-y-4">
        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />
        
        <div className="flex gap-2 items-center">
          <select 
            value={pair.from} 
            onChange={(e) => handlePairChange('from', e.target.value)} 
            className="px-2 py-1 border rounded"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
          <span className="text-gray-600">→</span>
          <select 
            value={pair.to} 
            onChange={(e) => handlePairChange('to', e.target.value)} 
            className="px-2 py-1 border rounded"
          >
            <option value="fr">French</option>
            <option value="th">Thai</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <input 
            value={term} 
            onChange={(e) => handleTermChange(e.target.value)} 
            placeholder={`Enter ${LANG_LABEL[pair.from]} word`} 
            className="flex-1 px-3 py-2 border rounded" 
          />
          <button onClick={runQuery} disabled={!canQuery} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {busy ? 'Searching…' : 'Search'}
          </button>
          <button onClick={ensureLoaded} className="px-3 py-2 bg-gray-200 rounded">Ensure Data</button>
          <button onClick={refreshPackages} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">Loaded:</span>{' '}
          {loadedPackages.length > 0 ? loadedPackages.join(', ') : 'none'}
        </div>

        {lastError && (
          <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{lastError}</div>
        )}

        <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
          {results.length === 0 ? (
            <div className="text-sm text-gray-500">No results</div>
          ) : (
            <ul className="space-y-2">
              {results.slice(0, 200).map((r, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{r.source}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{r.target}</span>
                  <span className="ml-2 text-gray-500">({r.synsetId})</span>
                  {(r.defFrom || r.defTo) && (
                    <div className="text-gray-600">
                      {r.defFrom && <div>def ({pair.from}): {r.defFrom}</div>}
                      {r.defTo && <div>def ({pair.to}): {r.defTo}</div>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
};
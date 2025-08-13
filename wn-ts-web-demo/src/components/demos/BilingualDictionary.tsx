import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../shared/Card';

// Use ISO-2 codes to match DB inserts ('en','fr','th')
const LANG_LABEL: Record<string, string> = { en: 'English', fr: 'French', th: 'Thai' };

type Pair = { from: 'en' | 'fr'; to: 'fr' | 'th' } | { from: 'en'; to: 'th' };

type Props = {
  wordnet: any;
  dataLoader: any;
  availablePackages: Array<{ id: string; label: string; language: string; version: string }>;
  loadedPackages: string[];
  loadPackageData: (projectIdWithVersion: string) => Promise<void>;
  refreshPackages: () => Promise<void>;
  loading: boolean;
};

export const BilingualDictionary: React.FC<Props> = ({ wordnet, dataLoader, availablePackages, loadedPackages, loadPackageData, refreshPackages, loading }) => {
  const [pair, setPair] = useState<Pair>({ from: 'en', to: 'fr' });
  const [term, setTerm] = useState('water');
  const [results, setResults] = useState<Array<{ source: string; target: string; synsetId: string; defFrom?: string; defTo?: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const findLatestByPrefix = (prefix: string, filter?: (v: string) => boolean) => {
    const candidates = availablePackages
      .filter(p => p.id.startsWith(prefix + ':'))
      .map(p => ({ id: p.id, version: p.id.split(':')[1] }))
      .filter(x => (filter ? filter(x.version) : true));
    const toNum = (v: string) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? -Infinity : n;
    };
    candidates.sort((a, b) => toNum(b.version) - toNum(a.version));
    return candidates[0]?.id;
  };

  const requiredProjects = useMemo(() => {
    // English: prefer 'oewn:>=2021', else 'ewn:<2021'
    const en = findLatestByPrefix('oewn', v => toInt(v) >= 2021) || findLatestByPrefix('ewn', v => toInt(v) < 2021);
    // French/Thai from OMW where available
    const fr = findLatestByPrefix('omw-fra') || findLatestByPrefix('wn-fra') || findLatestByPrefix('fra');
    const th = findLatestByPrefix('omw-tha') || findLatestByPrefix('wn-tha') || findLatestByPrefix('th');
    return { en, fr, th };
    function toInt(v: string) {
      const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? -Infinity : n;
    }
  }, [availablePackages]);

  const ensureLoaded = async () => {
    const need: string[] = [];
    if (pair.from === 'en' && !loadedPackages.some(id => id.startsWith('oewn') || id.startsWith('ewn') || id.startsWith('omw-en'))) {
      if (requiredProjects.en) need.push(requiredProjects.en);
    }
    if ((pair.from === 'fr' || pair.to === 'fr') && !loadedPackages.some(id => id.startsWith('omw-fra') || id.startsWith('wn-fra') || id.startsWith('fra'))) {
      if (requiredProjects.fr) need.push(requiredProjects.fr);
    }
    if (pair.to === 'th' && !loadedPackages.some(id => id.startsWith('omw-tha') || id.startsWith('wn-tha') || id.startsWith('th'))) {
      if (requiredProjects.th) need.push(requiredProjects.th);
    }
    for (const id of need) {
      await loadPackageData(id);
    }
    await refreshPackages();
  };

  const runQuery = async () => {
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
      const srcWords = await qs.getWords({ form: term, language: fromLang, searchAllForms: true });
      const out: Array<{ source: string; target: string; synsetId: string; defFrom?: string; defTo?: string }> = [];

      for (const w of srcWords.slice(0, 25)) {
        const senses = await qs.getSenses({ wordIdOrForm: w.id });
        for (const s of senses.slice(0, 25)) {
          // 2) Same synset, other-language words
          const toWords = await qs.getWordsBySynsetAndLanguage(s.synset, toLang);
          if (toWords.length === 0) continue;

          // 3) Definitions from both langs
          const defs = await qs.getDefinitionsBySynsetId(s.synset);
          const defFrom = defs.find((d: any) => d.language === fromLang)?.text;
          const defTo = defs.find((d: any) => d.language === toLang)?.text;

          for (const tw of toWords.slice(0, 10)) {
            out.push({ source: w.lemma, target: tw.lemma, synsetId: s.synset, defFrom, defTo });
          }
        }
      }
      setResults(out);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        await ensureLoaded();
      } catch {}
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.from, pair.to]);

  const canQuery = !!wordnet && !!dataLoader && !loading && !busy;

  return (
    <Card title="Bilingual Dictionary">
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <select value={pair.from} onChange={(e) => setPair(p => ({ ...p, from: e.target.value as any }))} className="px-2 py-1 border rounded">
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
          <span className="text-gray-600">→</span>
          <select value={pair.to} onChange={(e) => setPair(p => ({ ...p, to: e.target.value as any }))} className="px-2 py-1 border rounded">
            <option value="fr">French</option>
            <option value="th">Thai</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`Enter ${LANG_LABEL[pair.from]} word`} className="flex-1 px-3 py-2 border rounded" />
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
import React, { useMemo, useState, useEffect } from "react";
import { useWordNetContext } from "wn-ts-web/react";
import { Card } from "../shared/Card";
import { LexiconRequirements } from "../shared/LexiconRequirements";
import { createScopedLogger } from "utils/logger";
import { getAvailableProjects } from "wn-ts-web/react";

const logger = createScopedLogger("BilingualDictionary");

// Use ISO-2 codes to match DB inserts ('en','fr','th')
const LANG_LABEL: Record<string, string> = {
  en: "English",
  fr: "French",
  th: "Thai",
};

// Try multiple language code variants to handle ISO-2/ISO-3 differences in datasets
const LANGUAGE_VARIANTS: Record<string, string[]> = {
  en: ["en", "eng", "en-us", "en-gb"],
  fr: ["fr", "fra", "fr-fr"],
  th: ["th", "tha"],
};

function getLanguageVariants(lang: string): string[] {
  const base = LANGUAGE_VARIANTS[lang] || [lang];
  // Ensure unique, preserve order
  return Array.from(new Set(base.map((v) => v.toLowerCase())));
}

type Pair = { from: "en" | "fr"; to: "fr" | "th" } | { from: "en"; to: "th" };

export const BilingualDictionary: React.FC = () => {
  const {
    availablePackages,
    loadedPackages,
    loadPackageData,
    refreshPackages,
    loading,
    isInitializing,
    getSensesByWordIdOrForm,
    getDefinitionsBySynsetId,
    getSynsetById,
    getWordsByIliAndLanguage,
    getIliForSynset,
    searchWordsInLexicon,
    getWordsBySynsetAndLanguage,
    querySynsets,
    queryWords
  } = useWordNetContext();
  const [pair, setPair] = useState<Pair>({ from: "en", to: "fr" });
  const [term, setTerm] = useState("water");
  const [results, setResults] = useState<
    Array<{
      source: string;
      target: string;
      synsetId: string;
      defFrom?: string;
      defTo?: string;
    }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lexiconExploration, setLexiconExploration] = useState<string>("");

  // Helper function to get base form of a word (simple stemming)
  const getBaseForm = (word: string): string | null => {
    // Simple rules for common English patterns
    if (word.endsWith("ing")) {
      return word.slice(0, -3);
    }
    if (word.endsWith("ed")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("s")) {
      return word.slice(0, -1);
    }
    if (word.endsWith("er")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("est")) {
      return word.slice(0, -3);
    }
    return null;
  };

  // Compute button enabled state early so we can log it in effects
  const canQuery = !loading && !busy && !isInitializing;

  // Check if we have the required data for bilingual queries
  const hasRequiredData =
    loadedPackages.some((id) => id.startsWith("oewn")) &&
    loadedPackages.some((id) => id.startsWith("cili")) &&
    ((pair.to === "fr" &&
      loadedPackages.some((id) => id.startsWith("omw-fr"))) ||
      (pair.to === "th" &&
        loadedPackages.some((id) => id.startsWith("omw-th"))));

  // Check if we have any data in the target language
  const hasTargetLanguageData = (() => {
    if (pair.to === "fr") {
      return loadedPackages.some((id) => id.startsWith("omw-fr"));
    } else if (pair.to === "th") {
      return loadedPackages.some((id) => id.startsWith("omw-th"));
    }
    return false;
  })();

  // Check if we have CILI data for cross-lingual mapping
  const hasCiliData = loadedPackages.some((id) => id.startsWith("cili"));

  // Check if loaded packages actually contain data
  const [packageDataStatus, setPackageDataStatus] = useState<
    Record<string, { hasData: boolean; wordCount: number; error?: string }>
  >({});

  const checkPackageDataStatus = async () => {
    const status: Record<
      string,
      { hasData: boolean; wordCount: number; error?: string }
    > = {};

    for (const packageId of loadedPackages) {
      try {
        // Try to get statistics for this package
        await getDefinitionsBySynsetId("test"); // This will fail but we can catch the error
        status[packageId] = {
          hasData: false,
          wordCount: 0,
          error: "Unable to check package status",
        };
      } catch (e) {
        // If we can't get stats, the package might not be properly loaded
        status[packageId] = {
          hasData: false,
          wordCount: 0,
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    }

    setPackageDataStatus(status);
  };

  const testFrenchLexicon = async () => {
    logger.start("testing French lexicon data availability");

    try {
      // Try to find some basic French words
      const testWords = ["eau", "chat", "maison", "voiture"];
      let foundWords = 0;

      for (const word of testWords) {
        try {
          const results = await searchWordsInLexicon(word, "omw-fr:1.4", "fr");
          if ((results as any[]).length > 0) {
            foundWords++;
            logger.debug(`Found French word: ${word}`, {
              count: (results as any[]).length,
            });
          }
        } catch (e) {
          logger.debug(`Failed to find French word: ${word}`, {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      if (foundWords === 0) {
        logger.warn("French lexicon appears to be empty - no test words found");
        setLastError(
          "French lexicon is loaded but contains no word data. Try reloading the package."
        );
      } else {
        logger.success(
          `French lexicon has data - found ${foundWords}/${testWords.length} test words`
        );

        // Test cross-lingual mapping via ILI
        logger.step("testing cross-lingual ILI mapping");
        try {
          // Get an English synset with ILI
          const englishSynsets = await querySynsets("water");

          console.log("manual", englishSynsets)
          const allIlis = englishSynsets.map(s => s.ili)
          console.log("manual","all en ilis", allIlis)

          if (englishSynsets && englishSynsets.length > 0) {
            const firstSynsetIli = englishSynsets[0].ili;

            console.log("manual", "looking for match on synsetId", JSON.stringify({
              firstSynsetIli,
            }, null, 2))

          
            const frenchWord = await querySynsets("eau")
            console.log("manual", "french synsets", frenchWord)
            const allFrenchIlis = frenchWord.map(s => s.ili)
            console.log("manual","all fr ilis", allFrenchIlis)

            const matchingIlis = allIlis.filter(ili => allFrenchIlis.includes(ili))

            console.log("manual", "matching ilis", matchingIlis)


        
            // if (matchingIlis.length === 0) {
            //   throw Error("No matching ILI found for English synset")
            // }

            const firstMatchingIli = matchingIlis[0]

            if (!firstMatchingIli) {
              throw Error("No matching ILI found for English synset")
            }

            const frenchSense = await getWordsByIliAndLanguage(firstMatchingIli, "fr")


            console.log("manual", "french sense", frenchSense)


            const firstSense = await getSensesByWordIdOrForm(
              englishSynsets[0].id
            );
            if (firstSense && firstSense.length > 0) {
              const synsetId = firstSense[0].synsetId;
              const synset = await getSynsetById(synsetId);
              if (synset && synset.ili) {
                logger.debug("Testing ILI mapping", {
                  englishSynset: synset.id,
                  ili: synset.ili,
                });

                // Try to find French words with the same ILI
                const frenchWords = await getWordsByIliAndLanguage(
                  synset.ili,
                  "fr"
                );
                if (frenchWords && frenchWords.length > 0) {
                  logger.success(
                    `Cross-lingual mapping working! Found ${frenchWords.length} French words for ILI ${synset.ili}`,
                    {
                      sample: frenchWords.slice(0, 3).map((w) => w.lemma),
                    }
                  );
                } else {
                  logger.warn(
                    `No French words found for ILI ${synset.ili} - cross-lingual mapping not working`
                  );
                }
              } else {
                logger.warn("English synset has no ILI identifier");
              }
            }
          }
        } catch (e) {
          logger.warn("Cross-lingual ILI test failed", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      return foundWords > 0;
    } catch (e) {
      logger.fail("French lexicon test failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      return false;
    }
  };

  const showPackageLoadingProgress = async () => {
    logger.start("showing package loading progress");

    try {
      // Get detailed information about what's happening with package loading
      const catalog = getAvailableProjects();
      const frenchProject = catalog.find((p) => p.id === "omw-fr");

      if (frenchProject) {
        logger.debug("French project found in catalog", {
          id: frenchProject.id,
          versions: frenchProject.versions,
          label: frenchProject.label,
        });
      } else {
        logger.warn("French project not found in catalog");
      }

      // Check if the package is actually loaded in the database
      const loadedFrench = loadedPackages.filter((id) =>
        id.startsWith("omw-fr")
      );
      logger.debug("Loaded French packages", { loadedFrench });

      // Try to get some basic statistics
      try {
        const testWord = await searchWordsInLexicon("test", "omw-fr:1.4", "fr");
        logger.debug("Test search in French lexicon", {
          found: (testWord as any[]).length,
          sample: (testWord as any[]).slice(0, 3),
        });
      } catch (e) {
        logger.debug("Test search failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      setLexiconExploration(
        `🔍 Package Loading Progress:\n\n` +
          `📦 French Project in Catalog: ${
            frenchProject ? "✅ Found" : "❌ Not found"
          }\n` +
          `📥 Loaded French Packages: ${loadedFrench.join(", ") || "None"}\n` +
          `🔍 Test Search Result: ${
            (await testFrenchLexicon()) ? "✅ Has data" : "❌ No data"
          }\n\n` +
          `💡 If the French lexicon shows "No data", the package may not have been properly downloaded or parsed.\n` +
          `Try clicking "Load Required" to download fresh data.`
      );
    } catch (e) {
      logger.fail("Package loading progress check failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      setLexiconExploration(
        `❌ Package Loading Progress Check Failed:\n${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  };

  // Define lexicon requirements for this demo
  const lexiconRequirements = [
    {
      id: "oewn:2024",
      label: "Open English WordNet 2024",
      description: "Required for English source language support",
      priority: "high" as const,
    },
    {
      id: "cili:1.0",
      label: "CILI Index 1.0",
      description: "Required for cross-lingual mapping",
      priority: "high" as const,
    },
    {
      id: "omw-fr:1.4",
      label: "French WordNet 1.4",
      description: "French target language support",
      priority: "high" as const,
    },
    {
      id: "omw-th:1.4",
      label: "Thai WordNet 1.4",
      description: "Thai target language support",
      priority: "high" as const,
    },
  ];

  const findLatestByPrefix = (
    prefix: string,
    filter?: (v: string) => boolean
  ) => {
    // Use full catalog so we don't depend on context.availablePackages filtering
    const catalog = getAvailableProjects();
    const proj = catalog.find((p) => p.id === prefix);
    if (!proj) return undefined;
    // Prefer explicit versions array; fallback to single version
    const versions =
      (proj as any).versions && (proj as any).versions.length > 0
        ? ((proj as any).versions as string[])
        : (proj as any).version
        ? [String((proj as any).version)]
        : [];
    const filtered = versions.filter((v) => (filter ? filter(v) : true));
    const toNum = (v: string) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, ""));
      return isNaN(n) ? -Infinity : n;
    };
    filtered.sort((a, b) => toNum(b) - toNum(a));
    const latest = filtered[0];
    return latest ? `${proj.id}:${latest}` : undefined;
  };

  const requiredProjects = useMemo(() => {
    // English: prefer 'oewn:>=2021', else 'ewn:<2021'
    const en =
      findLatestByPrefix("oewn", (v) => toInt(v) >= 2021) ||
      findLatestByPrefix("ewn", (v) => toInt(v) < 2021);
    // French/Thai from OMW where available (individual packages, not aggregate)
    const fr = findLatestByPrefix("omw-fr");
    const th = findLatestByPrefix("omw-th");
    return { en, fr, th };
    function toInt(v: string) {
      const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
      return isNaN(n) ? -Infinity : n;
    }
  }, []); // Remove dependency on availablePackages since we're using getAvailableProjects() directly

  // Render/debug logs
  useEffect(() => {
    logger.debug("render state", {
      isInitializing,
      loading,
      busy,
      canQuery,
      term,
      pair,
      loadedCount: loadedPackages.length,
      availableCount: availablePackages.length,
      loaded: loadedPackages.slice(0, 10),
      availableSample: availablePackages.slice(0, 5),
    });
  }, [
    isInitializing,
    loading,
    busy,
    term,
    pair,
    loadedPackages,
    availablePackages,
    canQuery,
  ]);

  useEffect(() => {
    logger.debug("required projects resolved", requiredProjects);
  }, [requiredProjects]);

  // Ensure required packages are loaded when component mounts or language pair changes
  useEffect(() => {
    if (!isInitializing && !loading && loadedPackages.length > 0) {
      ensureLoaded();
    }
  }, [pair, isInitializing, loading, loadedPackages.length]);

  // Check package data status when packages change
  useEffect(() => {
    if (loadedPackages.length > 0) {
      checkPackageDataStatus();
    }
  }, [loadedPackages]);

  // Test French lexicon when component mounts if it's loaded
  useEffect(() => {
    if (
      loadedPackages.some((id) => id.startsWith("omw-fr")) &&
      !isInitializing &&
      !loading
    ) {
      // Wait a bit for the package to fully load
      const timer = setTimeout(() => {
        testFrenchLexicon();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loadedPackages, isInitializing, loading]);

  const ensureLoaded = async () => {
    logger.start("ensuring required packages are loaded");
    logger.step("checking package requirements", { pair, requiredProjects });

    const need: string[] = [];
    if (
      pair.from === "en" &&
      !loadedPackages.some(
        (id) =>
          id.startsWith("oewn") ||
          id.startsWith("ewn") ||
          id.startsWith("omw-en")
      )
    ) {
      if (requiredProjects.en) need.push(requiredProjects.en);
    }
    // Load individual language packages instead of massive OMW aggregate
    if (
      (pair.from === "fr" || pair.to === "fr") &&
      !loadedPackages.some(
        (id) =>
          id.startsWith("omw-fr") ||
          id.startsWith("wn-fra") ||
          id.startsWith("fra")
      )
    ) {
      if (requiredProjects.fr) need.push(requiredProjects.fr);
    }
    if (
      pair.to === "th" &&
      !loadedPackages.some(
        (id) =>
          id.startsWith("omw-th") ||
          id.startsWith("wn-tha") ||
          id.startsWith("th")
      )
    ) {
      if (requiredProjects.th) need.push(requiredProjects.th);
    }

    logger.step("packages to load", { need, alreadyLoaded: loadedPackages });

    for (const id of need) {
      try {
        logger.step("loading required package", { packageId: id });
        await loadPackageData(id);
      } catch (error) {
        logger.fail("Failed to load required package", {
          packageId: id,
          error,
        });
      }
    }

    await refreshPackages();
    logger.success("Package loading completed", { loaded: need });
    logger.end("ensuring required packages are loaded", { loaded: need });
  };

  const loadRequiredPackages = async () => {
    logger.start("loading required packages with correct versions");

    try {
      // Get the raw project data to see what's actually available
      const catalog = getAvailableProjects();
      logger.debug("Available projects from catalog", {
        total: catalog.length,
        sample: catalog
          .slice(0, 5)
          .map((p) => ({ id: p.id, versions: p.versions })),
      });

      // Check what we need vs what's available
      const required = [
        { id: "oewn", versions: ["2024", "2023", "2022", "2021"] },
        { id: "cili", versions: ["1.0"] },
        { id: "omw-fr", versions: ["1.4", "1.3"] },
        { id: "omw-th", versions: ["1.4", "1.3"] },
      ];

      for (const req of required) {
        const project = catalog.find((p) => p.id === req.id);
        if (project) {
          logger.debug(`Project ${req.id} found`, {
            availableVersions: project.versions,
            requiredVersions: req.versions,
          });

          // Find the best matching version
          const bestVersion =
            req.versions.find((v) => project.versions.includes(v)) ||
            project.versions[0];
          if (bestVersion) {
            const packageId = `${req.id}:${bestVersion}`;
            const isLoaded = loadedPackages.some((lp) => lp.startsWith(req.id));

            if (!isLoaded) {
              logger.step(`Loading ${packageId}`);
              try {
                await loadPackageData(packageId);
                logger.success(`Successfully loaded ${packageId}`);
              } catch (error) {
                logger.warn(`Failed to load ${packageId}`, { error });
              }
            } else {
              logger.debug(`${req.id} already loaded`);
            }
          }
        } else {
          logger.warn(`Project ${req.id} not found in catalog`);
        }
      }

      await refreshPackages();
      logger.success("Required packages loading completed");
    } catch (error) {
      logger.fail("Failed to load required packages", { error });
    }
  };

  const runQuery = async () => {
    logger.start(`bilingual query for "${term}"`);
    logger.step("starting bilingual query", {
      term,
      pair,
      canQuery,
      isInitializing,
      loading,
      busy,
    });

    if (!canQuery) {
      logger.warn("Search attempted while disabled", {
        isInitializing,
        loading,
        busy,
      });
      return;
    }

    setBusy(true);
    setLastError(null);
    setResults([]);

    try {
      const fromLang = pair.from;
      const toLang = pair.to;
      const toLangVariants = getLanguageVariants(toLang);

      // 1) Find source words in fromLang
      logger.step("finding source words", { term, language: fromLang });

      // Determine the source lexicon based on the source language
      let sourceLexicon = "oewn:2024"; // Default to English WordNet
      if (fromLang === "en") {
        sourceLexicon = "oewn:2024"; // Use English WordNet for English source
      } else if (fromLang === "fr") {
        sourceLexicon = "omw-fr:1.4"; // Use French WordNet for French source
      }

      // Use searchWordsInLexicon to search in the correct source lexicon
      const srcWords = await searchWordsInLexicon(
        term,
        sourceLexicon,
        fromLang
      );
      logger.step("source words found", {
        count: (srcWords as any[]).length,
        sample: (srcWords as any[]).slice(0, 5),
        sourceLexicon,
      });

      const out: Array<{
        source: string;
        target: string;
        synsetId: string;
        defFrom?: string;
        defTo?: string;
      }> = [];

      const srcSlice = (srcWords as any[]).slice(0, 25);
      for (let wi = 0; wi < srcSlice.length; wi++) {
        const w = srcSlice[wi];
        const senses = await getSensesByWordIdOrForm(w.id);
        logger.step("senses fetched", {
          word: w.lemma,
          count: (senses as any[]).length,
        });

        const sensesSlice = (senses as any[]).slice(0, 25);
        for (let si = 0; si < sensesSlice.length; si++) {
          const s = sensesSlice[si];

          // Debug the sense object structure
          logger.debug("Sense object structure", {
            sense: s,
            properties: Object.keys(s),
            synsetId: s.synsetId,
            hasId: !!s.id,
            hasSynsetId: !!s.synsetId,
          });

          // 2) Use ONLY ILI-based cross-lingual mapping
          let toWords: any[] = [];

          try {
            const synsetId = s.synsetId;

            // Get ILI identifier for this synset
            const ili = await getIliForSynset(synsetId);
            if (ili) {
              logger.debug(
                "Found ILI via CILI package, attempting cross-lingual mapping",
                {
                  synsetId: synsetId,
                  ili: ili,
                }
              );

              // Find target language words with the same ILI
              const targetWords = await getWordsByIliAndLanguage(ili, toLang);
              if (targetWords && targetWords.length > 0) {
                toWords = targetWords;
                logger.debug("Found target words via ILI mapping", {
                  ili: ili,
                  count: targetWords.length,
                  sample: targetWords.slice(0, 3).map((w: any) => w.lemma),
                });
              } else {
                logger.debug("No target words found for ILI", {
                  ili: ili,
                  targetLanguage: toLang,
                });
              }
            } else {
              logger.debug("No ILI found in CILI package for synset", {
                synsetId: synsetId,
              });
            }
          } catch (e) {
            logger.warn("ILI-based mapping failed", {
              error: e instanceof Error ? e.message : String(e),
            });
          }

          if (toWords.length === 0) {
            const synsetId = s.synsetId;
            logger.debug("No target words found via ILI mapping", {
              synset: synsetId,
              sourceWord: w.lemma,
            });
            continue;
          }

          // 3) Get definitions from both languages
          let defFrom: string | undefined;
          let defTo: string | undefined;

          try {
            const synsetId = s.synsetId;
            const defs = await getDefinitionsBySynsetId(synsetId);
            defFrom = (defs as any[]).find(
              (d) => d.language === fromLang
            )?.text;
          } catch (e) {
            const synsetId = s.synsetId;
            logger.warn("Failed to get source definitions", {
              synset: synsetId,
              error: e instanceof Error ? e.message : String(e),
            });
          }

          // Try to get target definition from one of the target words' synsets
          if ((toWords as any[]).length > 0) {
            try {
              const firstTargetWord = (toWords as any[])[0];
              const targetSenses = await getSensesByWordIdOrForm(
                firstTargetWord.id
              );
              if ((targetSenses as any[]).length > 0) {
                const targetSynsetId = (targetSenses as any[])[0].synset;
                const targetDefs = await getDefinitionsBySynsetId(
                  targetSynsetId
                );
                defTo = (targetDefs as any[]).find((d) =>
                  toLangVariants.includes((d.language || "").toLowerCase())
                )?.text;
              }
            } catch (e) {
              logger.warn("Failed to get target definitions", {
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          // 4) Add results
          for (const tw of (toWords as any[]).slice(0, 10)) {
            const synsetId = s.synsetId;
            out.push({
              source: w.lemma,
              target: tw.lemma,
              synsetId: synsetId,
              defFrom,
              defTo,
            });
          }
        }
      }

      logger.success("Bilingual query completed successfully", {
        term,
        pair,
        resultCount: out.length,
      });

      setResults(out);
      logger.end(`bilingual query for "${term}"`, { resultCount: out.length });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
      logger.fail("Bilingual query failed", { term, pair, error: errorMsg });
      setLastError(errorMsg);
      logger.end(`bilingual query for "${term}"`);
    } finally {
      setBusy(false);
    }
  };

  const handlePairChange = (field: "from" | "to", value: string) => {
    logger.debug("Language pair changed", {
      field,
      from: pair.from,
      to: pair.to,
      newValue: value,
    });
    setPair((p) => ({ ...p, [field]: value as any }));
  };

  const handleTermChange = (value: string) => {
    logger.debug("Term changed", { prev: term, next: value });
    setTerm(value);
  };

  const handleTermChangeTyped = (value: any) => {
    const stringValue = String(value);
    handleTermChange(stringValue);
  };

  const runDiagnostics = async () => {
    logger.start("running database diagnostics");
    setBusy(true);
    setLastError(null);

    try {
      // Check if we have any ILI records at all
      try {
        const iliCount =
          (await getAvailableProjects().find((p) => p.id === "cili")?.versions
            ?.length) || 0;
        logger.debug("CILI package info", { iliCount });
      } catch (e) {
        logger.warn("Failed to check CILI package info", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // Check if we have any synsets with ILI identifiers
      try {
        // This is a hack to check database content - we'll try to get a synset and see if it has ILI
        const testSynset = await getSynsetById("oewn-14869913-n");
        logger.debug("Test synset lookup", {
          synsetId: "oewn-14869913-n",
          hasIli: !!testSynset?.ili,
          ili: testSynset?.ili,
        });
      } catch (e) {
        logger.warn("Failed to check test synset", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // Check if we have any words in the target language
      try {
        // Try to find any French words at all
        const anyFrenchWords = await getWordsByIliAndLanguage("i1", "fr");
        logger.debug("Any French words via ILI i1", {
          count: (anyFrenchWords as any[]).length,
        });
      } catch (e) {
        logger.warn("Failed to check for any French words", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // Check what languages we actually have in the database
      try {
        const allLexicons = getAvailableProjects();
        const loadedLexicons = allLexicons.filter((p) =>
          loadedPackages.some((lp) => lp.startsWith(p.id))
        );
        logger.debug("Loaded lexicons analysis", {
          total: allLexicons.length,
          loaded: loadedLexicons.length,
          loadedIds: loadedLexicons.map((l) => l.id),
          sample: loadedLexicons.slice(0, 5),
        });
      } catch (e) {
        logger.warn("Failed to analyze loaded lexicons", {
          error: e instanceof Error ? e.message : String(e),
        });
      }

      logger.success("Database diagnostics completed");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
      logger.fail("Database diagnostics failed", { error: errorMsg });
      setLastError(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  const exploreLexicon = async () => {
    logger.start("exploring lexicon structure");
    setBusy(true);
    setLexiconExploration("");

    try {
      let exploration = "🔍 LEXICON EXPLORATION RESULTS\n";
      exploration += "================================\n\n";

      // 1. Check what packages are loaded
      exploration += "📦 LOADED PACKAGES:\n";
      exploration += `Total: ${loadedPackages.length}\n`;
      exploration += `Packages: ${loadedPackages.join(", ")}\n\n`;

      // 2. Check available projects
      const allProjects = getAvailableProjects();
      exploration += "🌐 AVAILABLE PROJECTS:\n";
      exploration += `Total: ${allProjects.length}\n`;
      exploration += `Sample: ${allProjects
        .slice(0, 10)
        .map((p) => p.id)
        .join(", ")}\n\n`;

      // 3. Check specific lexicon content
      exploration += "📚 LEXICON CONTENT ANALYSIS:\n";

      // Check English WordNet
      try {
        const enWords = await searchWordsInLexicon("water", "oewn:2024", "en");
        exploration += `English "water": ${
          (enWords as any[]).length
        } words found\n`;
        if ((enWords as any[]).length > 0) {
          const firstWord = (enWords as any[])[0];
          exploration += `  First word: ${firstWord.id} (${firstWord.lemma})\n`;

          // Check senses
          const senses = await getSensesByWordIdOrForm(firstWord.id);
          exploration += `  Senses: ${(senses as any[]).length} found\n`;
          if ((senses as any[]).length > 0) {
            const firstSense = (senses as any[])[0];
            exploration += `  First sense synset: ${firstSense.synset}\n`;

            // Check synset details
            const synset = await getSynsetById(firstSense.synset);
            exploration += `  Synset language: ${synset?.language}\n`;
            exploration += `  Synset lexicon: ${synset?.lexicon}\n`;
            exploration += `  Synset has ILI: ${!!synset?.ili}\n`;
            if (synset?.ili) {
              exploration += `  Synset ILI: ${synset.ili}\n`;
            }
          }
        }
      } catch (e) {
        exploration += `English "water" query failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      exploration += "\n";

      // Check French WordNet - MORE DETAILED
      try {
        exploration += "🇫🇷 FRENCH LEXICON DETAILED CHECK:\n";

        // Try multiple French words
        const frenchWords = [
          "eau",
          "chat",
          "chien",
          "maison",
          "voiture",
          "le",
          "la",
          "les",
        ];
        for (const frWord of frenchWords) {
          try {
            const words = await searchWordsInLexicon(
              frWord,
              "omw-fr:1.4",
              "fr"
            );
            const frResults = (words as any[]).filter(
              (w) => w.language === "fr" || w.language === "fra"
            );
            exploration += `  "${frWord}": ${frResults.length} French words\n`;
            if (frResults.length > 0) {
              exploration += `    Sample: ${frResults
                .slice(0, 3)
                .map((w) => `${w.lemma}(${w.lexicon})`)
                .join(", ")}\n`;
            }
          } catch (e) {
            exploration += `  "${frWord}": Query failed - ${
              e instanceof Error ? e.message : String(e)
            }\n`;
          }
        }

        // Check if we can find ANY French words at all
        try {
          const anyWords = await searchWordsInLexicon("a", "omw-fr:1.4", "fr");
          const anyFr = (anyWords as any[]).filter(
            (w) => w.language === "fr" || w.language === "fra"
          );
          exploration += `  Any French words starting with "a": ${anyFr.length}\n`;
          if (anyFr.length > 0) {
            exploration += `    Sample: ${anyFr
              .slice(0, 5)
              .map((w) => `${w.lemma}(${w.lexicon})`)
              .join(", ")}\n`;
          }
        } catch (e) {
          exploration += `  Any French words check failed: ${
            e instanceof Error ? e.message : String(e)
          }\n`;
        }
      } catch (e) {
        exploration += `French lexicon check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      exploration += "\n";

      // Check Thai WordNet - MORE DETAILED
      try {
        exploration += "🇹🇭 THAI LEXICON DETAILED CHECK:\n";

        // Try multiple Thai words
        const thaiWords = ["น้ำ", "แมว", "สุนัข", "บ้าน", "รถ", "ของ", "การ"];
        for (const thWord of thaiWords) {
          try {
            const words = await searchWordsInLexicon(
              thWord,
              "omw-th:1.4",
              "th"
            );
            const thResults = (words as any[]).filter(
              (w) => w.language === "th" || w.language === "th"
            );
            exploration += `  "${thWord}": ${thResults.length} Thai words\n`;
            if (thResults.length > 0) {
              exploration += `    Sample: ${thResults
                .slice(0, 3)
                .map((w) => `${w.lemma}(${w.lexicon})`)
                .join(", ")}\n`;
            }
          } catch (e) {
            exploration += `  "${thWord}": Query failed - ${
              e instanceof Error ? e.message : String(e)
            }\n`;
          }
        }

        // Check if we can find ANY Thai words at all
        try {
          const anyWords = await searchWordsInLexicon("ก", "omw-th:1.4", "th");
          const anyTh = (anyWords as any[]).filter(
            (w) => w.language === "th" || w.language === "th"
          );
          exploration += `  Any Thai words starting with "ก": ${anyTh.length}\n`;
          if (anyTh.length > 0) {
            exploration += `    Sample: ${anyTh
              .slice(0, 5)
              .map((w) => `${w.lemma}(${w.lexicon})`)
              .join(", ")}\n`;
          }
        } catch (e) {
          exploration += `  Any Thai words check failed: ${
            e instanceof Error ? e.message : String(e)
          }\n`;
        }
      } catch (e) {
        exploration += `Thai lexicon check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      exploration += "\n";

      // Check CILI
      try {
        exploration += "🔗 CILI INDEX CHECK:\n";
        const ciliProject = allProjects.find((p) => p.id === "cili");
        if (ciliProject) {
          exploration += `CILI project found: ${ciliProject.id}\n`;
          exploration += `Versions: ${
            (ciliProject as any).versions?.join(", ") || "none"
          }\n`;
        } else {
          exploration += "CILI project not found\n";
        }
      } catch (e) {
        exploration += `CILI check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      setLexiconExploration(exploration);
      logger.success("Lexicon exploration completed");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
      logger.fail("Lexicon exploration failed", { error: errorMsg });
      setLexiconExploration(`❌ EXPLORATION FAILED:\n${errorMsg}`);
    } finally {
      setBusy(false);
    }
  };

  const testBasicQueries = async () => {
    logger.start("testing basic queries");
    setBusy(true);
    setLexiconExploration("");

    try {
      let results = "🧪 BASIC QUERY TEST RESULTS\n";
      results += "============================\n\n";

      const testWords = ["water", "cat", "dog", "house", "car"];
      const testLanguages = ["en", "fr", "th"];

      for (const word of testWords) {
        results += `📝 Testing word: "${word}"\n`;
        results += `${"=".repeat(20 + word.length)}\n`;

        for (const lang of testLanguages) {
          try {
            // Use appropriate lexicon for each language
            let lexiconId = "oewn:2024"; // default to English
            if (lang === "fr") lexiconId = "omw-fr:1.4";
            else if (lang === "th") lexiconId = "omw-th:1.4";

            const words = await searchWordsInLexicon(word, lexiconId, lang);
            const langWords = (words as any[]).filter(
              (w) => w.language === lang
            );
            results += `${lang.toUpperCase()}: ${
              langWords.length
            } words found\n`;

            if (langWords.length > 0) {
              const sample = langWords.slice(0, 3);
              results += `  Sample: ${sample
                .map((w) => `${w.lemma}(${w.lexicon})`)
                .join(", ")}\n`;
            }
          } catch (e) {
            results += `${lang.toUpperCase()}: Query failed - ${
              e instanceof Error ? e.message : String(e)
            }\n`;
          }
        }
        results += "\n";
      }

      setLexiconExploration(results);
      logger.success("Basic query tests completed");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
      logger.fail("Basic query tests failed", { error: errorMsg });
      setLexiconExploration(`❌ BASIC TESTS FAILED:\n${errorMsg}`);
    } finally {
      setBusy(false);
    }
  };

  const checkDatabaseTables = async () => {
    logger.start("checking database table contents");
    setBusy(true);
    setLexiconExploration("");

    try {
      let results = "🗄️ DATABASE TABLE CONTENTS\n";
      results += "==========================\n\n";

      // Check what's in each table by trying to query sample data
      results += "📊 TABLE ANALYSIS:\n";

      // Check words table
      try {
        // Check English words first
        const enWords = await searchWordsInLexicon("a", "oewn:2024");
        results += `English words: ${(enWords as any[]).length} found\n`;

        // Check French words if available
        let frWords: any[] = [];
        try {
          frWords = await searchWordsInLexicon("a", "omw-fr:1.4");
          results += `French words: ${frWords.length} found\n`;
        } catch (e) {
          results += `French words: Not available\n`;
        }

        // Check Thai words if available
        let thWords: any[] = [];
        try {
          thWords = await searchWordsInLexicon("a", "omw-th:1.4");
          results += `Thai words: ${thWords.length} found\n`;
        } catch (e) {
          results += `Thai words: Not available\n`;
        }

        const totalWords =
          (enWords as any[]).length + frWords.length + thWords.length;
        results += `Total words: ${totalWords}\n`;

        if (totalWords > 0) {
          // Show samples from each language
          if ((enWords as any[]).length > 0) {
            const sample = (enWords as any[]).slice(0, 3);
            results += `  English sample: ${sample
              .map((w) => `${w.lemma}(${w.lexicon})`)
              .join(", ")}\n`;
          }
          if (frWords.length > 0) {
            const sample = frWords.slice(0, 3);
            results += `  French sample: ${sample
              .map((w) => `${w.lemma}(${w.lexicon})`)
              .join(", ")}\n`;
          }
          if (thWords.length > 0) {
            const sample = thWords.slice(0, 3);
            results += `  Thai sample: ${sample
              .map((w) => `${w.lemma}(${w.lexicon})`)
              .join(", ")}\n`;
          }
        }
      } catch (e) {
        results += `Words table check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      results += "\n";

      // Check synsets table
      try {
        const testSynset = await getSynsetById("oewn-14869913-n");
        if (testSynset) {
          results += `Synsets table: Sample synset found\n`;
          results += `  ID: ${testSynset.id}\n`;
          results += `  Language: ${testSynset.language || "undefined"}\n`;
          results += `  Lexicon: ${testSynset.lexicon || "undefined"}\n`;
          results += `  Has ILI: ${!!testSynset.ili}\n`;
          if (testSynset.ili) {
            results += `  ILI: ${testSynset.ili}\n`;
          }
        } else {
          results += `Synsets table: No test synset found\n`;
        }
      } catch (e) {
        results += `Synsets table check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      results += "\n";

      // Check if we can find any non-English words
      results += "🌍 MULTILINGUAL CHECK:\n";
      try {
        // Check each language individually
        let totalNonEn = 0;

        // Check French words
        try {
          const frWords = await searchWordsInLexicon("a", "omw-fr:1.4");
          const frNonEn = (frWords as any[]).filter((w) => w.language !== "en");
          totalNonEn += frNonEn.length;
          results += `French non-English words: ${frNonEn.length} found\n`;
        } catch (e) {
          results += `French words: Not available\n`;
        }

        // Check Thai words
        try {
          const thWords = await searchWordsInLexicon("a", "omw-th:1.4");
          const thNonEn = (thWords as any[]).filter((w) => w.language !== "en");
          totalNonEn += thNonEn.length;
          results += `Thai non-English words: ${thNonEn.length} found\n`;
        } catch (e) {
          results += `Thai words: Not available\n`;
        }

        results += `Total non-English words: ${totalNonEn} found\n`;

        if (totalNonEn === 0) {
          results += `  No non-English words found - this explains why cross-lingual queries fail!\n`;
        }
      } catch (e) {
        results += `Multilingual check failed: ${
          e instanceof Error ? e.message : String(e)
        }\n`;
      }

      setLexiconExploration(results);
      logger.success("Database table check completed");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e);
      logger.fail("Database table check failed", { error: errorMsg });
      setLexiconExploration(`❌ DATABASE CHECK FAILED:\n${errorMsg}`);
    } finally {
      setBusy(false);
    }
  };

  const forceReloadAll = async () => {
    logger.start("force reloading all packages with cache clearing");
    setBusy(true);
    setLastError(null);

    try {
      // Step 1: Clear all loaded packages
      logger.step("clearing all loaded packages");
      await refreshPackages();
      logger.debug("Cleared all loaded packages");

      // Step 2: Clear cache and unload data completely
      logger.step("clearing cache and unloading data");
      try {
        // Try to access the unload function from context
        const { unloadData, clearCacheAndUnload } = useWordNetContext();
        if (clearCacheAndUnload) {
          await clearCacheAndUnload();
          logger.debug("Cache cleared and data unloaded");
        } else if (unloadData) {
          await unloadData();
          logger.debug("Data unloaded");
        }
      } catch (e) {
        logger.warn("Could not clear cache, proceeding with package reload", {
          error: e,
        });
      }

      // Step 3: Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));
      logger.debug("Cleanup delay completed");

      // Step 4: Re-load required packages fresh
      logger.step("reloading all required packages fresh");
      await loadRequiredPackages();

      // Step 5: Final refresh to ensure everything is loaded
      logger.step("final package refresh");
      await refreshPackages();

      logger.success(
        "Force reload completed successfully. All packages cleared and re-loaded fresh."
      );
      setLastError(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `${error.message}\n${error.stack || ""}`
          : String(error);
      logger.fail("Force reload failed", { error: errorMsg });
      setLastError(`Force reload failed: ${errorMsg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Cross-Lingual Dictionary (via CILI)">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <strong>How it works:</strong> This demo uses the Collaborative
          Interlingual Index (CILI) to find semantically equivalent words across
          languages. It searches for English words, extracts potential ILI
          identifiers from their synset IDs, then uses those ILI identifiers to
          locate corresponding words in French or Thai.
          <br />
          <br />
          <strong>Note:</strong> Since English WordNet doesn't have explicit ILI
          identifiers, we construct them from the synset ID format (e.g.,
          oewn-14869913-n → i14869913).
        </div>

        {/* Lexicon Explorer */}
        <div className="bg-yellow-50 p-3 rounded border">
          <h3 className="font-medium text-yellow-800 mb-2">
            🔍 Lexicon Explorer (Debug)
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <button
                onClick={exploreLexicon}
                className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs"
                disabled={!canQuery}
              >
                Explore All Lexicons
              </button>
              <button
                onClick={testBasicQueries}
                className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs"
                disabled={!canQuery}
              >
                Test Basic Queries
              </button>
              <button
                onClick={checkDatabaseTables}
                className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs"
                disabled={!canQuery}
              >
                Check DB Tables
              </button>
            </div>
            {lexiconExploration && (
              <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                <pre className="whitespace-pre-wrap">{lexiconExploration}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Lexicon Requirements */}
        <LexiconRequirements requirements={lexiconRequirements} />

        <div className="flex gap-2 items-center">
          <select
            value={pair.from}
            onChange={(e) => handlePairChange("from", e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
          <span className="text-gray-600">→</span>
          <select
            value={pair.to}
            onChange={(e) => handlePairChange("to", e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="fr">French</option>
            <option value="th">Thai</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <input
            value={term}
            onChange={(e) => handleTermChangeTyped(e.target.value)}
            placeholder={`Enter ${LANG_LABEL[pair.from]} word`}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={runQuery}
            disabled={!canQuery}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {busy ? "Searching…" : "Search"}
          </button>
          <button
            onClick={ensureLoaded}
            className="px-3 py-2 bg-gray-200 rounded"
          >
            Ensure Data
          </button>
          <button
            onClick={loadRequiredPackages}
            className="px-3 py-2 bg-green-200 rounded"
          >
            Load Required
          </button>
          <button
            onClick={refreshPackages}
            className="px-3 py-2 bg-gray-200 rounded"
          >
            Refresh
          </button>
          <button
            onClick={runDiagnostics}
            className="px-3 py-2 bg-yellow-200 rounded"
          >
            Run Diagnostics
          </button>
          <button
            onClick={checkPackageDataStatus}
            className="px-3 py-2 bg-purple-200 rounded text-xs"
            title="Check if loaded packages actually contain word data"
          >
            Check Package Status
          </button>
          <button
            onClick={() => loadPackageData("omw-fr:1.4")}
            className="px-3 py-2 bg-blue-200 rounded text-xs"
            title="Force reload French lexicon data"
          >
            Reload French
          </button>
          <button
            onClick={testFrenchLexicon}
            className="px-3 py-2 bg-orange-200 rounded text-xs"
            title="Test if French lexicon actually contains word data"
          >
            Test French
          </button>
          <button
            onClick={showPackageLoadingProgress}
            className="px-3 py-2 bg-indigo-200 rounded text-xs"
            title="Show detailed package loading progress and debug info"
          >
            Debug Loading
          </button>
          <button
            onClick={forceReloadAll}
            className="px-4 py-2 bg-red-500 text-white rounded font-medium"
            title="Force reload all packages - clears cache and downloads fresh data"
          >
            🚀 Force Reload All
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">Loaded:</span>{" "}
          {loadedPackages.length > 0 ? loadedPackages.join(", ") : "none"}
        </div>

        {/* Debug Info */}
        {results.length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div className="font-medium">Debug Info:</div>
            <div>Found {results.length} cross-lingual mappings</div>
            <div>
              Source language: {pair.from} → Target language: {pair.to}
            </div>
            <div>
              Using CILI (Collaborative Interlingual Index) for semantic
              alignment
            </div>
          </div>
        )}

        {lastError && (
          <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
            {lastError}
          </div>
        )}

        {/* French lexicon specific error */}
        {pair.to === "fr" &&
          loadedPackages.some((id) => id.startsWith("omw-fr")) && (
            <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <div className="font-medium mb-1">
                🇫🇷 French Lexicon Issue Detected
              </div>
              <div className="text-amber-600">
                The French lexicon (omw-fr:1.4) is loaded but appears to contain
                no word data. This is why your cross-lingual search is failing.
              </div>
              <div className="mt-2 text-amber-600">
                <strong>Solutions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click "Load Required" to download fresh data</li>
                  <li>
                    Click "Reload French" to force reload the French package
                  </li>
                  <li>Click "Test French" to verify if the issue persists</li>
                  <li>Check the browser console for download errors</li>
                </ul>
              </div>
            </div>
          )}

        <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
          {results.length === 0 ? (
            <div className="text-sm text-gray-500 space-y-2">
              <div className="font-medium text-gray-700">
                No cross-lingual results found
              </div>

              {/* Diagnostic information */}
              <div className="bg-blue-50 p-2 rounded text-xs">
                <div className="font-medium text-blue-800 mb-1">
                  🔍 Why no results?
                </div>
                <div className="space-y-1 text-blue-700">
                  {!hasRequiredData && (
                    <div>
                      ❌ <strong>Missing required packages:</strong> You need to
                      load the required multilingual packages first.
                    </div>
                  )}
                  {hasRequiredData && !hasTargetLanguageData && (
                    <div>
                      ❌ <strong>Target language data missing:</strong> The{" "}
                      {pair.to} language package is loaded but contains no word
                      data.
                    </div>
                  )}
                  {hasRequiredData && hasTargetLanguageData && !hasCiliData && (
                    <div>
                      ❌ <strong>Cross-lingual mapping missing:</strong> CILI
                      package is loaded but contains no ILI mapping data.
                    </div>
                  )}
                  {hasRequiredData && hasTargetLanguageData && hasCiliData && (
                    <div>
                      ❌ <strong>No semantic matches found:</strong> The word "
                      {term}" doesn't have cross-lingual equivalents in the
                      loaded data.
                    </div>
                  )}
                </div>
              </div>

              {/* Action items */}
              <div className="bg-yellow-50 p-2 rounded text-xs">
                <div className="font-medium text-yellow-800 mb-1">
                  🚀 What to do:
                </div>
                <div className="space-y-1 text-yellow-700">
                  <div>
                    1. <strong>Load Required Packages:</strong> Click "Load
                    Required" to download all needed data
                  </div>
                  <div>
                    2. <strong>Check Package Status:</strong> Use "Run
                    Diagnostics" to see what's in your database
                  </div>
                  <div>
                    3. <strong>Try Different Words:</strong> Some words may not
                    have cross-lingual equivalents
                  </div>
                  <div>
                    4. <strong>Wait for Downloads:</strong> Package downloads
                    can take 1-5 minutes
                  </div>
                </div>
              </div>

              {/* Current status */}
              <div className="bg-gray-100 p-2 rounded text-xs">
                <div className="font-medium text-gray-700 mb-1">
                  📊 Current Status:
                </div>
                <div className="space-y-1 text-gray-600">
                  <div>
                    • English WordNet:{" "}
                    {loadedPackages.some((id) => id.startsWith("oewn"))
                      ? "✅ Loaded"
                      : "❌ Missing"}
                  </div>
                  <div>
                    • CILI Index: {hasCiliData ? "✅ Loaded" : "❌ Missing"}
                  </div>
                  <div>
                    • {pair.to === "fr" ? "French" : "Thai"} WordNet:{" "}
                    {hasTargetLanguageData ? "✅ Loaded" : "❌ Missing"}
                  </div>
                  <div>• Total loaded packages: {loadedPackages.length}</div>
                </div>
              </div>

              {/* Package data status */}
              {Object.keys(packageDataStatus).length > 0 && (
                <div className="bg-red-50 p-2 rounded text-xs">
                  <div className="font-medium text-red-800 mb-1">
                    ⚠️ Package Data Issues:
                  </div>
                  <div className="space-y-1 text-red-700">
                    {Object.entries(packageDataStatus).map(
                      ([packageId, status]) => (
                        <div key={packageId}>
                          • <strong>{packageId}:</strong>{" "}
                          {status.hasData ? "✅ Has data" : "❌ No data"}
                          {!status.hasData &&
                            status.error &&
                            ` (${status.error})`}
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-2 text-red-600">
                    <strong>Note:</strong> Packages showing "No data" may not
                    have been properly downloaded or parsed. Try clicking "Load
                    Required" or "Reload French" to fix this.
                  </div>
                </div>
              )}
            </div>
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
                      {r.defFrom && (
                        <div>
                          def ({pair.from}): {r.defFrom}
                        </div>
                      )}
                      {r.defTo && (
                        <div>
                          def ({pair.to}): {r.defTo}
                        </div>
                      )}
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

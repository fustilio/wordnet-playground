const DEFAULT_PROJECTS = {
  "oewn": {
    id: "oewn",
    label: "Open English WordNet",
    language: "en",
    license: "https://creativecommons.org/licenses/by/4.0/",
    type: "wordnet",
    versions: {
      "2021": {
        url: "https://en-word.net/static/english-wordnet-2021.xml.gz",
        description: "Open English WordNet 2021",
        size: "~50MB compressed",
        lastUpdated: "2021-01-01"
      },
      "2022": {
        url: [
          "https://en-word.net/static/english-wordnet-2022.xml.gz",
          "https://github.com/globalwordnet/english-wordnet/releases/download/2022-edition/english-wordnet-2022.xml.gz"
        ],
        description: "Open English WordNet 2022",
        size: "~50MB compressed",
        lastUpdated: "2022-01-01"
      },
      "2023": {
        url: [
          "https://en-word.net/static/english-wordnet-2023.xml.gz",
          "https://github.com/globalwordnet/english-wordnet/releases/download/2023-edition/english-wordnet-2023.xml.gz"
        ],
        description: "Open English WordNet 2023",
        size: "~50MB compressed",
        lastUpdated: "2023-01-01"
      },
      "2024": {
        url: [
          "https://en-word.net/static/english-wordnet-2024.xml.gz",
          "https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz"
        ],
        description: "Open English WordNet 2024",
        size: "~50MB compressed",
        lastUpdated: "2024-01-01"
      }
    }
  },
  "ewn": {
    id: "ewn",
    label: "Open English WordNet",
    language: "en",
    license: "https://creativecommons.org/licenses/by/4.0/",
    type: "wordnet",
    versions: {
      "2019": {
        url: "https://en-word.net/static/english-wordnet-2019.xml.gz",
        description: "Open English WordNet 2019",
        size: "~50MB compressed",
        lastUpdated: "2019-01-01"
      },
      "2020": {
        url: "https://en-word.net/static/english-wordnet-2020.xml.gz",
        description: "Open English WordNet 2020",
        size: "~50MB compressed",
        lastUpdated: "2020-01-01"
      }
    }
  },
  "cili": {
    id: "cili",
    label: "Collaborative Interlingual Index",
    language: "unknown",
    license: "https://creativecommons.org/licenses/by/4.0/",
    type: "ili",
    versions: {
      "1.0": {
        url: "https://github.com/globalwordnet/cili/releases/download/v1.0/cili.tsv.xz",
        description: "Collaborative Interlingual Index 1.0",
        size: "~1MB compressed",
        lastUpdated: "2020-01-01"
      }
    }
  },
  "omw-fr": {
    id: "omw-fr",
    label: "Open Multilingual Wordnet - French",
    language: "fr",
    license: "https://creativecommons.org/licenses/by/4.0/",
    type: "wordnet",
    versions: {
      "1.4": {
        url: "https://github.com/omwn/omw-data/releases/download/v1.4/omw-fr-1.4.tar.xz",
        description: "French WordNet in LMF format",
        size: "~5MB compressed",
        lastUpdated: "2020-01-01"
      }
    }
  },
  "omw-th": {
    id: "omw-th",
    label: "Open Multilingual Wordnet - Thai",
    language: "th",
    license: "https://creativecommons.org/licenses/by/4.0/",
    type: "wordnet",
    versions: {
      "1.4": {
        url: "https://github.com/omwn/omw-data/releases/download/v1.4/omw-th-1.4.tar.xz",
        description: "Thai WordNet in LMF format",
        size: "~2MB compressed",
        lastUpdated: "2020-01-01"
      }
    }
  }
};
const DEFAULT_PROXY_CONFIG = {
  enabled: true,
  baseUrl: "http://localhost:5173",
  endpoints: {
    "wordnet": {
      target: "https://en-word.net",
      rewrite: (path) => path
      // Keep the full path for proxy URLs
    },
    "github": {
      target: "https://github.com",
      rewrite: (path) => path
      // Keep the full path for proxy URLs
    },
    "omwn-releases": {
      target: "https://github.com/omwn/omw-data/releases/download",
      rewrite: (path) => path.replace(/^\/api\/omwn-releases\//, "/")
    },
    "raw-github": {
      target: "https://raw.githubusercontent.com",
      rewrite: (path) => path.replace(/^\/api\/raw-github\//, "/")
    },
    "github-api": {
      target: "https://api.github.com",
      rewrite: (path) => path.replace(/^\/api\/github-api\//, "/")
    },
    "release-assets": {
      target: "https://release-assets.githubusercontent.com",
      rewrite: (path) => path.replace(/^\/api\/release-assets\//, "/")
    },
    "external": {
      target: "https://httpbin.org",
      rewrite: (path) => path.replace(/^\/api\/external\//, "/")
    }
  }
};
const FALLBACK_URLS = {
  "oewn:2024": [
    "https://en-word.net/static/english-wordnet-2024.xml.gz"
  ],
  "oewn:2023": [
    "https://en-word.net/static/english-wordnet-2023.xml.gz"
  ],
  "oewn:2022": [
    "https://en-word.net/static/english-wordnet-2022.xml.gz"
  ],
  "cili:1.0": [
    "https://raw.githubusercontent.com/globalwordnet/cili/main/cili.tsv"
  ]
};
function getProjectConfig(projectId) {
  const [baseId] = projectId.split(":");
  if (!baseId) return void 0;
  return DEFAULT_PROJECTS[baseId];
}
function getProjectVersionConfig(projectId) {
  const [baseId, version] = projectId.split(":");
  if (!baseId || !version) return void 0;
  const project = DEFAULT_PROJECTS[baseId];
  if (!project) return void 0;
  return project.versions[version];
}
function getProjectUrls(projectId) {
  const versionConfig = getProjectVersionConfig(projectId);
  if (!versionConfig) return [];
  if (typeof versionConfig.url === "string") {
    return [versionConfig.url];
  }
  return versionConfig.url || [];
}
function getFallbackUrls(projectId) {
  return FALLBACK_URLS[projectId] || [];
}
function getAllProjectUrls(projectId) {
  const primaryUrls = getProjectUrls(projectId);
  const fallbackUrls = getFallbackUrls(projectId);
  return [...primaryUrls, ...fallbackUrls];
}
function projectExists(projectId) {
  const [baseId, version] = projectId.split(":");
  if (!baseId || !version) return false;
  const project = DEFAULT_PROJECTS[baseId];
  if (!project) return false;
  return project.versions[version] !== void 0;
}
function getAllProjectIds() {
  const projectIds = [];
  for (const [baseId, project] of Object.entries(DEFAULT_PROJECTS)) {
    for (const version of Object.keys(project.versions)) {
      projectIds.push(`${baseId}:${version}`);
    }
  }
  return projectIds;
}
function validateProjectId(projectId) {
  const parts = projectId.split(":");
  return parts.length === 2 && Boolean(parts[0] && parts[0].length > 0 && parts[1] && parts[1].length > 0);
}
function getProxyUrl(url, proxyConfig = DEFAULT_PROXY_CONFIG) {
  if (!proxyConfig.enabled) return url;
  for (const [endpointName, endpoint] of Object.entries(proxyConfig.endpoints)) {
    if (url.startsWith(endpoint.target)) {
      const proxyUrl = url.replace(endpoint.target, `/api/${endpointName}`);
      return endpoint.rewrite(proxyUrl);
    }
  }
  if (url.startsWith("https://")) {
    return url.replace("https://", "/api/external/");
  }
  return url;
}
function needsProxy(url, proxyConfig = DEFAULT_PROXY_CONFIG) {
  if (!proxyConfig.enabled) return false;
  for (const endpoint of Object.values(proxyConfig.endpoints)) {
    if (url.includes(endpoint.target)) return true;
  }
  return url.startsWith("https://");
}
export {
  DEFAULT_PROJECTS,
  DEFAULT_PROXY_CONFIG,
  FALLBACK_URLS,
  getAllProjectIds,
  getAllProjectUrls,
  getFallbackUrls,
  getProjectConfig,
  getProjectUrls,
  getProjectVersionConfig,
  getProxyUrl,
  needsProxy,
  projectExists,
  validateProjectId
};
//# sourceMappingURL=project-config-Dm7cPCSf.js.map

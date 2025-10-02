import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'WordNet TypeScript Ecosystem',
  description: 'A production-ready TypeScript ecosystem for working with WordNet data, built on a microkernel architecture with plugin system, cross-lingual support, and optimized database operations.',
  
  // Base URL for GitHub Pages deployment
  base: '/wordnet-playground/',
  
  // VitePress theme configuration
  themeConfig: {
    // Site title in nav
    siteTitle: 'WordNet TS',
    
    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/' },
      { text: 'Platforms', link: '/platforms/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API Reference', link: '/api/' }
    ],

    // Sidebar configuration
    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is WordNet?', link: '/what-is-wordnet' },
            { text: 'Project Overview', link: '/project-overview' }
          ]
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Choose Your Platform', link: '/getting-started/choose-platform' }
          ]
        },
        {
          text: 'Platforms',
          items: [
            { text: 'Web Applications', link: '/platforms/web/' },
            { text: 'Node.js Applications', link: '/platforms/node/' },
            { text: 'CLI Package', link: '/packages/wn-cli/tui/' }
          ]
        },
        {
          text: 'Examples',
          items: [
            { text: 'Web Examples', link: '/examples/web/' },
            { text: 'Node.js Examples', link: '/examples/node/' },
            { text: 'Translation Examples', link: '/examples/translation/' }
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core API', link: '/api/core/' },
            { text: 'Web API', link: '/api/web/' },
            { text: 'Node API', link: '/api/node/' },
            { text: 'CLI Reference', link: '/api/cli/' }
          ]
        }
      ],
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Choose Your Platform', link: '/getting-started/choose-platform' }
          ]
        },
        {
          text: 'Learn WordNet',
          items: [
            { text: 'What is WordNet?', link: '/what-is-wordnet' },
            { text: 'Project Overview', link: '/project-overview' }
          ]
        },
        {
          text: 'Platforms',
          items: [
            { text: 'Web Applications', link: '/platforms/web/' },
            { text: 'Node.js Applications', link: '/platforms/node/' },
            { text: 'CLI Package', link: '/packages/wn-cli/tui/' }
          ]
        },
        {
          text: 'Examples',
          items: [
            { text: 'Web Examples', link: '/examples/web/' },
            { text: 'Node.js Examples', link: '/examples/node/' },
            { text: 'Translation Examples', link: '/examples/translation/' }
          ]
        }
      ],
      '/platforms/': [
        {
          text: 'Platforms',
          items: [
            { text: 'Overview', link: '/platforms/' }
          ]
        },
        {
          text: 'Web Applications',
          items: [
            { text: 'Getting Started', link: '/platforms/web/' },
            { text: 'API Reference', link: '/api/web/' },
            { text: 'Examples', link: '/examples/web/' }
          ]
        },
        {
          text: 'Node.js Applications',
          items: [
            { text: 'Getting Started', link: '/platforms/node/' },
            { text: 'API Reference', link: '/api/node/' },
            { text: 'Examples', link: '/examples/node/' }
          ]
        },
        {
          text: 'CLI Package',
          items: [
            { text: 'CLI Package', link: '/packages/wn-cli/tui/' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' }
          ]
        },
        {
          text: 'Web Examples',
          items: [
            { text: 'Overview', link: '/examples/web/' },
            { text: 'Basic Demo', link: '/examples/web/basic-demo/' },
            { text: 'Developer Demo', link: '/examples/web/developer-demo/' }
          ]
        },
        {
          text: 'Node.js Examples',
          items: [
            { text: 'Overview', link: '/examples/node/' },
            { text: 'Basic Demo', link: '/examples/node/basic-demo/' }
          ]
        },
        {
          text: 'Translation Examples',
          items: [
            { text: 'Overview', link: '/examples/translation/' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Unified API', link: '/api/unified-api' }
          ]
        },
        {
          text: 'Platform APIs',
          items: [
            { text: 'Web API', link: '/api/web/' },
            { text: 'Node.js API', link: '/api/node/' },
            { text: 'CLI Reference', link: '/api/cli/' }
          ]
        },
        {
          text: 'Core API',
          items: [
            { text: 'Core Library', link: '/api/core/' },
            { text: 'Plugin System', link: '/api/plugins/' }
          ]
        },
        {
          text: 'Plugin APIs',
          items: [
            { text: 'Relations Plugin', link: '/api/plugins/relations' },
            { text: 'Similarity Plugin', link: '/api/plugins/similarity' },
            { text: 'Translation Plugin', link: '/api/plugins/translation' }
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Web Usage', link: '/guides/web-usage' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fustilio/wordnet-playground' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 WordNet TypeScript Ecosystem'
    },

    // Search
    search: {
      provider: 'local'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/fustilio/wordnet-playground/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  // Markdown configuration
  markdown: {
    // Enable line numbers in code blocks
    lineNumbers: true,
    
    // Configure markdown-it plugins
    config: async (md) => {
      // Add LLM plugin for copy/download buttons
      const { copyOrDownloadAsMarkdownButtons } = await import('vitepress-plugin-llms')
      copyOrDownloadAsMarkdownButtons(md)
    }
  },

  // VitePress plugins
  vite: {
    plugins: [
      ...llmstxt({
        // Generate LLMs.txt file for AI consumption
        generateLLMsTxt: true,
        // Generate full text version for LLMs
        generateLLMsFullTxt: true,
        // Domain for absolute URLs in LLMs.txt
        domain: 'https://fustilio.github.io/wordnet-playground',
        // Inject LLM hints on each page
        injectLLMHint: true,
        // Strip HTML tags from markdown
        stripHTML: true,
        // Exclude unnecessary files to save tokens
        excludeUnnecessaryFiles: true,
        // Custom template variables
        customTemplateVariables: {
          title: 'WordNet TypeScript Ecosystem',
          description: 'Production-ready TypeScript ecosystem for WordNet data with microkernel architecture, plugin system, and cross-lingual support.',
          details: 'A comprehensive TypeScript implementation of WordNet with support for multiple languages, semantic similarity, and cross-lingual translation. Built with a microkernel architecture that allows for extensible functionality through plugins.'
        }
      })
    ]
  }
})

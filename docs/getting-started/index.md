---
title: Getting Started
description: Quick start guide for the WordNet TypeScript ecosystem
---

# Getting Started

> **New to WordNet?** See [What is WordNet?](../what-is-wordnet) first.

## Prerequisites

- Node.js 18+
- TypeScript 5.0+

## Installation

```bash
# Node.js
npm install wn-ts-node

# Web
npm install wn-ts-web

# CLI
npm install -g wn-cli
```

## Usage

**Node.js**
```typescript
import { NodeWordNetKernel } from 'wn-ts-node';

const wordnet = new NodeWordNetKernel('oewn:2024');
await wordnet.initialize();
const words = await wordnet.words({ form: 'computer' });
await wordnet.close();
```

**Web**
```typescript
import { useWordNet } from 'wn-ts-web';

const MyComponent = () => {
  const { queryWords } = useWordNet();
  // Use queryWords(term)
};
```

**CLI**
```bash
wn-cli search "computer"
wn-cli define "computer"
```

## Next Steps

- [Choose Platform](/getting-started/choose-platform)
- [Examples](/examples/)
- [API Reference](/api/)

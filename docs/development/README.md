---
title: Development Guide
description: Comprehensive guide for contributing to the WordNet TypeScript ecosystem
---

# Development Guide

## Prerequisites

- Node.js 18+
- TypeScript 5.0+

## Setup

```bash
git clone https://github.com/fustilio/wordnet-playground.git
cd wordnet-playground
pnpm install
pnpm build
pnpm test
```

## Commands

```bash
# Development
pnpm dev
pnpm test
pnpm build
pnpm lint

# Testing
pnpm test:coverage
pnpm test:web
pnpm test:node
```

## Standards

- Follow the [Development Conventions](../standards/development-conventions.md)
- Maintain 90%+ test coverage
- Use TypeScript strict mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

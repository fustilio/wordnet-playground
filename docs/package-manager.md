# Package Manager Guide

This project uses **pnpm** for dependency management and monorepo features.

## Why pnpm?

1. **Workspace support** - Manages multiple packages efficiently
2. **Catalog feature** - Centralized version management
3. **Faster installs** - 2-3x faster than npm
4. **Disk space** - Saves storage with content-addressed storage

## Installation

### Install pnpm Globally

```bash
# Using npm (ironic, but works)
npm install -g pnpm

# Using standalone script (recommended)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# On Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Verify installation**:
```bash
pnpm --version
# Should show: 10.x.x or higher
```

## Using pnpm

### Basic Commands

```bash
# Install dependencies
pnpm install

# Add a package
pnpm add package-name

# Remove a package
pnpm remove package-name

# Run scripts
pnpm dev
pnpm build
pnpm test
```

### Workspace Commands

```bash
# Install for all packages
pnpm install

# Run command in specific package
pnpm --filter wn-ts-web build

# Run command in specific example
pnpm --filter docs docs:dev

# Install dependency in specific package
pnpm --filter wn-ts-web add react-query
```

## Understanding "catalog:"

**You'll see this in examples**:

```json
{
  "dependencies": {
    "react": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

**What it means**: Versions are managed centrally in `pnpm-workspace.yaml`.

**Why we use it**: Ensures all examples use compatible versions.

**For your own projects**: Use real version numbers instead:

```json
{
  "dependencies": {
    "react": "^18.3.0",           // Not "catalog:"
    "typescript": "^5.7.0",       // Not "catalog:"
    "vite": "^6.0.0"              // Not "catalog:"
  }
}
```

### Converting catalog: to Versions

**Quick conversion**:

```bash
# From examples directory
pnpm list --depth=0

# Shows actual versions:
# react 18.3.1
# typescript 5.7.2
# vite 6.0.7

# Use these in your package.json
```

## Can I Use npm or Yarn?

### For Examples (This Repo)

**No** - The examples use workspace features that require pnpm:
- Workspace protocol (`workspace:*`)
- Catalog references (`catalog:`)
- Shared dependencies

```bash
# ❌ Won't work
cd examples/hello-world/web
npm install  # Error: unknown protocol workspace:

# ✅ Works
pnpm install
```

### For Your Own Projects

**Yes** - After you copy code out, you can use any package manager:

1. Replace `workspace:*` with actual version (e.g., `^0.7.2`)
2. Replace `catalog:` with actual version (e.g., `^18.3.0`)
3. Use npm/yarn normally

**Example**:

```json
// From example (pnpm only)
{
  "dependencies": {
    "wn-ts-web": "workspace:*",
    "react": "catalog:"
  }
}

// For your project (works with npm/yarn)
{
  "dependencies": {
    "wn-ts-web": "^0.7.2",
    "react": "^18.3.0"
  }
}
```

## Common Issues

### "ERR_PNPM_NO_MATCHING_VERSION"

**Problem**: Using npm instead of pnpm

**Fix**:
```bash
npm install -g pnpm
pnpm install
```

### "Unknown protocol: workspace:"

**Problem**: Trying to use npm in workspace

**Fix**: Use pnpm, or copy example to standalone project with real versions

### "Invalid version: catalog:"

**Problem**: Using npm/yarn in workspace example

**Fix**: Use pnpm, or replace `catalog:` with actual version numbers

## Quick Reference

| Task | npm | pnpm |
|------|-----|------|
| Install | `npm install` | `pnpm install` |
| Add package | `npm install pkg` | `pnpm add pkg` |
| Remove | `npm uninstall pkg` | `pnpm remove pkg` |
| Run script | `npm run dev` | `pnpm dev` |
| Global install | `npm install -g pkg` | `pnpm add -g pkg` |

## Learn More

- [pnpm Documentation](https://pnpm.io/)
- [Workspace Guide](https://pnpm.io/workspaces)
- [Catalog Feature](https://pnpm.io/catalogs)

---

**Bottom line**: Use pnpm for this project. It's required, not optional.


# Hello World - CLI Example

The simplest way to use WordNet from the command line.

## Installation

```bash
npm install -g wn-cli
```

Or use without installing:
```bash
npx wn-cli search "computer"
```

## Basic Commands

### Search for Words

```bash
wn-cli search "computer"
```

Output:
```
Found 3 words:
1. computer (n) - oewn:2024
2. calculator (n) - oewn:2024
3. estimator (n) - oewn:2024
```

### Get Definitions

```bash
wn-cli define "happy"
```

Output:
```
happy (a):
1. enjoying or showing pleasure or contentment
2. marked by good fortune; lucky
3. eagerly disposed to act or be of service
```

### Find Relationships

```bash
wn-cli relations "car" --type hypernym
```

Output:
```
Hypernyms of "car":
- motor vehicle
- vehicle
- wheeled vehicle
```

### Translate Words

```bash
wn-cli translate "water" --from en --to fr
```

Output:
```
English "water" → French:
- eau
- arroser
```

## All Commands

```bash
# Basic search
wn-cli search <word>

# Definitions
wn-cli define <word>

# Relations
wn-cli relations <word> --type <hypernym|hyponym|meronym|holonym>

# Translation
wn-cli translate <word> --from <lang> --to <lang>

# Statistics
wn-cli stats

# List lexicons
wn-cli lexicons

# Help
wn-cli --help
wn-cli <command> --help
```

## Configuration

Set default lexicon:
```bash
wn-cli config set lexicon oewn:2024
```

Set data directory:
```bash
wn-cli config set dataDir ~/.my-wordnet-data
```

View current config:
```bash
wn-cli config list
```

## Next Steps

**Read the full CLI guide**:
- [CLI Documentation](../../../docs/packages/wn-cli/)
- [TUI Interface Guide](../../../docs/packages/wn-cli/tui/)

**Try the Node.js API**:
- [Node.js Examples](../../node/wn-ts-node-demo/)
- [Node.js API Reference](../../../docs/api/node/)


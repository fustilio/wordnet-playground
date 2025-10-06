# Version Management

## Overview

The WordNet TypeScript ecosystem uses **Changesets** for independent package versioning. This allows each package to evolve at its own pace while maintaining compatibility and clear change tracking.

## Current Package Versions

| Package | Version | Status | Description |
|---------|---------|--------|-------------|
| **wn-ts-core** | v0.5.2 | Stable | Foundation library with types and interfaces |
| **wn-ts-web** | v1.0.0 | Latest | Browser implementation with React integration |
| **wn-ts-node** | v1.0.0 | Latest | Node.js implementation with SQLite |
| **wn-react** | v1.0.0 | Latest | React hooks and components |
| **wn-cli** | v0.5.7 | Stable | Command-line interface and TUI |
| **wn-data-loader** | v0.1.0 | Early | Data loading utilities |
| **utils** | v0.5.0 | Stable | Shared utilities and logging |

## Why Independent Versioning?

### Benefits
- **Independent Evolution**: Each package can release when ready
- **Reduced Risk**: Changes to one package don't force updates to others
- **Clear Dependencies**: Explicit version ranges show compatibility
- **Gradual Adoption**: Users can upgrade packages individually

### Example Scenario
```
wn-ts-core: v0.5.2 → v0.6.0 (new plugin API)
wn-ts-web: v1.0.0 → v1.1.0 (uses new plugin API)
wn-ts-node: v1.0.0 (stays stable, no changes needed)
```

## Version Compatibility

### Semantic Versioning
All packages follow [semver](https://semver.org/):
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (x.y.0): New features, backward compatible
- **PATCH** (x.y.z): Bug fixes, backward compatible

### Compatibility Matrix

| Feature | wn-ts-core | wn-ts-web | wn-ts-node | wn-react |
|---------|------------|-----------|------------|----------|
| Basic Search | v0.5.2+ | v1.0.0+ | v1.0.0+ | v1.0.0+ |
| Plugin System | v0.5.2+ | v1.0.0+ | v1.0.0+ | v1.0.0+ |
| Worker Support | N/A | v1.0.0+ | N/A | v1.0.0+ |
| React Hooks | N/A | N/A | N/A | v1.0.0+ |
| CLI Interface | N/A | N/A | N/A | N/A |

## Dependency Management

### Peer Dependencies
Packages declare peer dependencies to ensure compatibility:

```json
{
  "peerDependencies": {
    "wn-ts-core": "^0.5.0",
    "@sqlite.org/sqlite-wasm": "^0.1.0"
  }
}
```

### Workspace Dependencies
Development uses workspace references:

```json
{
  "dependencies": {
    "wn-ts-core": "workspace:*"
  }
}
```

## Upgrading Packages

### Recommended Upgrade Path

1. **Start with Core**: Update `wn-ts-core` first
2. **Update Implementations**: Update `wn-ts-web` and `wn-ts-node`
3. **Update Integrations**: Update `wn-react` and `wn-cli`
4. **Test Compatibility**: Verify all packages work together

### Example Upgrade Commands

```bash
# Update all packages to latest compatible versions
npm update

# Update specific packages
npm install wn-ts-web@latest wn-ts-node@latest

# Check for outdated packages
npm outdated
```

## Breaking Changes

### How We Handle Breaking Changes

1. **Deprecation Warnings**: Old APIs show warnings before removal
2. **Migration Guides**: Clear upgrade instructions
3. **Gradual Phaseout**: Multiple versions supported during transition
4. **Clear Communication**: Changesets document all changes

### Example Breaking Change Process

```
v0.5.x: Old API works, shows deprecation warning
v0.6.x: Old API still works, stronger warnings
v1.0.x: Old API removed, new API required
```

## Changesets Workflow

### For Maintainers

1. **Create Changeset**: Document your changes
2. **Version Packages**: Run `changeset version`
3. **Publish**: Run `changeset publish`
4. **Update Docs**: Update version references

### For Users

1. **Check Compatibility**: Review version matrix
2. **Read Changelog**: Understand what changed
3. **Test Thoroughly**: Verify your use cases work
4. **Update Gradually**: Don't rush major upgrades

## Troubleshooting Version Issues

### Common Problems

**"Module not found" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Version conflicts**
```bash
# Check for conflicting versions
npm ls
# Use npm overrides if needed
```

**API changes**
- Check the migration guide
- Review the changelog
- Test in a separate branch first

### Getting Help

- **GitHub Issues**: Report version-related bugs
- **Discussions**: Ask about compatibility
- **Migration Guide**: Step-by-step upgrade help

## Best Practices

### For Users
- **Pin Major Versions**: Use `^1.0.0` not `*`
- **Test Before Upgrading**: Use staging environments
- **Read Release Notes**: Understand what changed
- **Keep Dependencies Updated**: Regular maintenance

### For Maintainers
- **Clear Changelogs**: Document all changes
- **Backward Compatibility**: Minimize breaking changes
- **Deprecation Periods**: Give users time to migrate
- **Version Coordination**: Consider cross-package impacts

---

**Remember**: Independent versioning is a feature, not a bug. It allows the ecosystem to evolve naturally while maintaining stability for users.

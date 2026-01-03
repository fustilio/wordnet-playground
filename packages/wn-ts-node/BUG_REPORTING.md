# How to Submit Bug Report for wn-ts-node

## Repository Information

✅ **Found!** The `wn-ts-node` package is located in:
- **Repository**: `fustilio/wordnet-playground`
- **URL**: https://github.com/fustilio/wordnet-playground
- **Directory**: `wn-ts` (monorepo)
- **npm package**: https://www.npmjs.com/package/wn-ts-node

The package is part of a monorepo, so issues should be filed in the main repository.

## Submission Steps

### 1. Create GitHub Issue

1. Go to: **https://github.com/fustilio/wordnet-playground/issues/new**
2. Click "New Issue"
3. Choose "Bug Report" template (if available) or create a blank issue
4. Fill in the required information using the template below

### 2. Issue Title Format

Use the following format for your issue title:
```
[wn-ts-node] Brief description of the issue
```

Examples:
- `[wn-ts-node] Bug: Database query returns incorrect results`
- `[wn-ts-node] Feature Request: Add support for custom synonyms`
- `[wn-ts-node] Performance: Slow initialization on large datasets`

**Note**: The `[wn-ts-node]` prefix helps identify this is for the `wn-ts-node` package in the monorepo.

### 3. Bug Report Template

Use this template when filing a bug report:

```markdown
## Description
[Clear description of the issue]

## Version
- wn-ts-node version: [e.g., 0.8.0]
- Node.js version: [e.g., 18.16.0]
- Operating System: [e.g., macOS 13.4, Ubuntu 22.04]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Additional steps...]

## Minimal Code Example
\`\`\`typescript
// Your minimal reproduction code here
\`\`\`

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Additional Context
[Any additional information, screenshots, logs, or context]
```

### 4. Labels (if available)

Add relevant labels to help categorize your issue:
- `bug` - For bugs and errors
- `enhancement` - For feature requests
- `documentation` - For documentation improvements
- `performance` - For performance issues
- `question` - For questions about usage

### 5. What to Include

Make sure your bug report includes:

- **Clear description**: What is the problem?
- **Version information**: Package version, Node.js version, OS
- **Minimal reproduction**: Smallest code example that reproduces the issue
- **Expected vs Actual**: What you expected vs what happened
- **Environment details**: Any relevant system or configuration details
- **Error messages**: Full error stack traces if applicable
- **Screenshots**: Visual evidence if relevant

## Alternative: Contact Maintainer

If you can't find the repository or prefer direct contact:

1. Check npm package page for maintainer email
2. Look for contact information in package README
3. Check if there's a Discord/Slack community mentioned

## Follow-up

After submitting your issue:

1. **Monitor the issue**: Check for responses or questions from maintainers
2. **Provide additional info**: Be responsive if maintainers ask for more details
3. **Test fixes**: If a fix is provided, test it and report back with results
4. **Close when resolved**: Close the issue once it's fixed or resolved

## Best Practices

- **Search first**: Before creating a new issue, search existing issues to avoid duplicates
- **One issue per report**: Don't combine multiple unrelated issues in one report
- **Be specific**: Provide concrete examples and avoid vague descriptions
- **Be respectful**: Maintainers are often volunteers; be patient and courteous
- **Update if needed**: If you discover new information, add it to the issue

## Related Documentation

- [Main README](./README.md) - Package documentation
- [CHANGELOG](./CHANGELOG.md) - Version history and changes
- [GitHub Issues](https://github.com/fustilio/wordnet-playground/issues) - View existing issues

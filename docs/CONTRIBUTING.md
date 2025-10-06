# Contributing to Documentation

Guidelines for maintaining high-quality documentation.

## Core Principles

1. **One source of truth**: [api-reference.md](./api/api-reference.md) is definitive
2. **Working code**: All examples must run without modification
3. **Consistent terminology**: Follow [terminology.md](./terminology.md)
4. **Progressive complexity**: Simple → Advanced
5. **Test your docs**: Actually run the commands you document

---

## Documentation Standards

### File Naming

```
✅ Good:
- quick-start.md (guides)
- API_REFERENCE.md (reference)
- what-is-wordnet.md (concepts)

❌ Bad:
- QuickStart.md (PascalCase)
- api_reference.md (snake_case for docs)
- WhatIsWordNet.md (inconsistent)
```

### Link Format

**VitePress uses relative links**:

```markdown
✅ Correct:
- [Quick Start](./quick-start.md)
- [API Reference](./api/api-reference.md)
- [Examples](../examples/hello-world/)

❌ Wrong:
- [Quick Start](/quick-start.md)         # Absolute paths don't work in VitePress
- [API Reference](docs/api/reference.md) # Wrong path
- [Examples](examples)                   # Missing trailing slash
```

### Code Examples

All code must be:
1. **Complete**: Include imports and full context
2. **Tested**: Actually run the code before documenting
3. **Current**: Use latest API (check API_REFERENCE.md)

```typescript
// ✅ Good - Complete and current
import { createWordnet } from 'wn-ts-node';

const wn = createWordnet('oewn:2024');
await wn.initialize();
const results = await wn.synsets('computer');
await wn.close();

// ❌ Bad - Incomplete and outdated
const results = await wordnet.search('computer');
// Where does 'wordnet' come from?
// What API is this?
```

### Markdown Structure

```markdown
# Page Title

Brief description (1-2 sentences).

## Main Section

Content here.

### Subsection

More specific content.

## Examples

\`\`\`typescript
// Working code
\`\`\`

## Next Steps

- [Link to next doc](./path)
```

**Rules**:
- Use `#` for page title (once per file)
- Use `##` for main sections
- Use `###` for subsections only
- Never use `####` or deeper
- Always include "Next Steps" section

### Writing Style

```markdown
✅ Good:
- "Use createWordnet() to initialize"
- "Run pnpm install first"
- "Search for nouns with pos: 'n'"

❌ Bad:
- "You might want to use createWordnet()"
- "Dependencies should be installed"
- "Nouns can be searched by using the pos parameter"
```

**Rules**:
- Active voice
- Imperative mood
- Specific, not vague
- Present tense

---

## Adding Examples

### Checklist

Before submitting an example, ensure:

- [ ] **Runs without modification**: Fresh clone, `pnpm install`, it works
- [ ] **No hardcoded paths**: Use `tmpdir()`, `homedir()`, or relative paths
- [ ] **Clear README**: What it demonstrates, how to run, what you learn
- [ ] **Consistent naming**: Follow existing patterns
- [ ] **Minimal dependencies**: Only install what's needed
- [ ] **Error handling**: Try-catch with clear messages
- [ ] **Cleanup**: Close connections, explain data storage

### Example Template

```typescript
/**
 * [Example Name]
 * 
 * Demonstrates: [Key features]
 * Use case: [Real-world application]
 */

import { createWordnet } from 'wn-ts-node';

async function main() {
  // 1. Initialize
  const wn = createWordnet('oewn:2024');
  await wn.initialize();
  
  try {
    // 2. Core functionality
    const results = await wn.synsets('computer');
    
    // 3. Display results
    console.log(`Found ${results.length} synsets`);
    results.forEach(s => {
      console.log(`- ${s.id}: ${s.definitions[0]?.text}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // 4. Always close
    await wn.close();
  }
}

main().catch(console.error);
```

### README Template

```markdown
# [Example Name]

[One sentence description of what this demonstrates]

## What This Demonstrates

- Feature 1
- Feature 2
- Feature 3

## Quick Start

\`\`\`bash
pnpm install
pnpm start
\`\`\`

## The Code

[Walk through the key code sections]

## What You Learn

1. How to [do thing 1]
2. How to [do thing 2]
3. How to [do thing 3]

## Next Steps

- [Related Example](../path) - What it adds
- [Platform Guide](../../docs/platforms/) - Deep dive
- [API Reference](../../docs/api/api-reference.md) - All methods
```

---

## Updating API Documentation

### When to Update API_REFERENCE.md

Update when:
- New method added
- Method signature changes
- Parameter options change
- Return type changes
- Behavior changes

### How to Update

1. **Update [api-reference.md](./api/api-reference.md)** first (source of truth)
2. **Update platform-specific docs** (platforms/web/, platforms/node/)
3. **Update examples** to match new API
4. **Add to changelog** section in api-reference.md
5. **Test all examples** to ensure they still work

### Version Numbers

When documenting version-specific features:

```markdown
## Method Name

Available in: v0.7.0+

\`\`\`typescript
const result = await wn.newMethod();
\`\`\`

**Previous versions**: Use `oldMethod()` instead (deprecated in v0.7.0)
```

---

## Documentation Review Checklist

Before submitting documentation changes:

### Content
- [ ] All code examples are complete (include imports)
- [ ] All code examples are tested (actually run them)
- [ ] All commands are tested (copy-paste and verify)
- [ ] All links work (click every link)
- [ ] Terminology is consistent (check terminology.md)
- [ ] API matches api-reference.md

### Structure
- [ ] Page has clear title (`#`)
- [ ] Sections are organized (`##`)
- [ ] Subsections are minimal (`###` only when needed)
- [ ] "Next Steps" section at end
- [ ] Code has syntax highlighting

### Style
- [ ] Active voice, imperative mood
- [ ] No emoji overload (max 2 per section)
- [ ] Professional tone
- [ ] Clear and concise
- [ ] Specific, not vague

### Testing
- [ ] Run in fresh environment
- [ ] Test on Windows, Mac, Linux
- [ ] Test with VitePress dev server
- [ ] Verify all relative links

---

## Common Mistakes

### ❌ Mistake 1: Absolute Links

```markdown
❌ [Examples](/examples/hello-world)
✅ [Examples](../examples/hello-world/)
```

**Why**: VitePress routing differs in dev vs build

### ❌ Mistake 2: Outdated API

```typescript
❌ import { useWordNet } from 'wn-ts-web';
✅ import { useWordNetContext } from 'wn-ts-web/react';
```

**Fix**: Always check api-reference.md first

### ❌ Mistake 3: Incomplete Examples

```typescript
❌ const results = await search('computer');
   // Where does 'search' come from?

✅ import { createWordnet } from 'wn-ts-node';
   const wn = createWordnet('oewn:2024');
   await wn.initialize();
   const results = await wn.synsets('computer');
```

**Fix**: Include all imports and setup

### ❌ Mistake 4: Untested Commands

```bash
❌ cd examples/node/basic-demo     # Directory doesn't exist!
✅ cd examples/node/wn-ts-node-demo
```

**Fix**: Run every command in a fresh shell

### ❌ Mistake 5: Emoji Overload

```markdown
❌ ## 🚀 Quick Start 🎯
   ### 💡 What You'll Learn 🎓
   - 📝 Feature 1 ✨
   - 🔍 Feature 2 🎉

✅ ## Quick Start
   ### What You'll Learn
   - Feature 1
   - Feature 2
```

**Fix**: Max 1-2 emoji per major section

---

## Review Process

### Self-Review

1. Read your changes out loud
2. Click every link you added
3. Run every command you documented
4. Check API_REFERENCE.md for current API
5. Check TERMINOLOGY.md for correct terms

### Peer Review

When reviewing PRs:
1. Check for broken links
2. Test all code examples
3. Verify API consistency
4. Check terminology
5. Ensure examples run

---

## Questions?

- **Style questions**: Check this guide
- **API questions**: Check [api-reference.md](./api/api-reference.md)
- **Term questions**: Check [terminology.md](./terminology.md)
- **Unsure**: Ask in PR comments

---

**Follow these guidelines to maintain documentation quality. When in doubt, prioritize clarity over cleverness.**


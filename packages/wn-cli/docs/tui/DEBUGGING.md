# TUI Debugging Guide

## The Problem

TUI (Text User Interface) applications don't naturally end - they run continuously until the user exits. This makes debugging challenging because:

1. **No natural exit**: The app keeps running until manually stopped
2. **Interactive input**: The app waits for user input
3. **Terminal capture**: Output is buffered and may not show immediately
4. **Process management**: Need to handle process lifecycle properly

## Recent Fixes

### Input Field Focus Management (Fixed)

**Issue**: Global shortcuts (like 'h' for help) were interfering with input fields, preventing users from typing 'h' in search boxes.

**Solution**: Implemented focus management system that:
- Tracks when input fields are focused
- Only applies global shortcuts when no input field is focused
- Allows normal typing in input fields
- Still permits Ctrl+C for emergency exit and Escape for navigation

**Test the fix**:
```bash
# Start TUI and navigate to Word Search
node dist/cli.js --tui --chain down enter

# Now you can type 'h' in the search field without triggering help
# The 'h' key will be captured by the input field instead of the global handler
```

## Debugging Tools & Strategies

### 1. Debug Panel (Built-in)

The TUI includes a built-in debug panel that can be toggled with `Ctrl+D`:

```bash
# Start the TUI
pnpm cli --tui

# Press Ctrl+D to toggle debug panel
# Press Enter to expand/collapse debug info
```

The debug panel shows:
- Current view/component
- Terminal dimensions
- Lexicon and language settings
- Timestamp
- Available lexicons/languages count
- **Input focus state** (new)

### 2. Layout System Test Tool

A specialized tool for testing and debugging layout calculations:

```bash
# Run the layout test tool
pnpm layout-test
```

This tool allows you to:
- Test different terminal dimensions (40x15 to 150x40)
- Test different scenarios (with/without error, debug panel)
- Test all component types (menu, data-manager, search, settings, help)
- View detailed layout calculations
- Navigate between scenarios with arrow keys
- Toggle detailed JSON output with 'd' key

**Navigation:**
- `← →` : Change scenario
- `↑ ↓` : Change component type
- `d` : Toggle detailed output
- `q` : Exit

### 3. Chainable Command Automation (`--chain` flag)

You can now automate TUI flows using the `--chain` flag:

```bash
pnpm cli --tui --chain down down enter up right
```
- This simulates the keypresses in sequence: two downs, enter, up, right.
- The TUI will process these, update the UI, and then exit automatically.
- Useful for scripting, regression tests, and AI-driven debugging.

**Supported commands:**
- `down`, `up`, `left`, `right`, `enter`, `esc`, `tab`, `backspace`, `q`, `h`, and any single character for text input.

**Example: Automate a menu selection and exit**
```bash
pnpm cli --tui --chain down enter q
```

**Example: Test input field behavior**
```bash
# Navigate to Word Search and type 'hello'
pnpm cli --tui --chain down enter h e l l o enter q
```

### 4. Test Scripts

#### Quick TUI Test
```bash
# Test TUI for 5 seconds and capture output
pnpm test:tui
```

#### Layout System Test
```bash
# Test the layout system with different scenarios
pnpm layout-test

# Run layout test tool tests
pnpm test:layout
```

#### Component Tests
```bash
# Run component unit tests
pnpm test:component
```

#### Type Checking
```bash
# Check for TypeScript errors
pnpm type-check
```

#### Linting
```bash
# Check for code style issues
pnpm lint
```

### 5. Debug Mode

#### Node.js Inspector
```bash
# Start with Node.js debugger
pnpm debug:tui

# Then open Chrome DevTools at chrome://inspect
# Or use VS Code debugger
```

#### VS Code Debugging
Add this to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TUI",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/cli.js",
      "args": ["--tui"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 6. Manual Testing Strategies

#### Timeout Testing
```bash
# Run for 10 seconds then kill
timeout 10s pnpm cli --tui || true
```

#### Input Simulation
```bash
# Send input to the TUI
echo -e "1\nq" | pnpm cli --tui
```

#### Output Capture
```bash
# Capture output to file
pnpm cli --tui > output.log 2>&1 &
sleep 5
kill %1
cat output.log
```

### 7. Development Workflow

#### 1. Build and Test Cycle
```bash
# Build the CLI
pnpm build

# Test TUI functionality
pnpm test:tui

# Run component tests
pnpm test:component

# Check for issues
pnpm type-check
pnpm lint
```

#### 2. Interactive Development
```bash
# Start in debug mode
pnpm debug:tui

# Use debug panel (Ctrl+D) to inspect state
# Use browser devtools or VS Code debugger
```

#### 3. Component Testing
```bash
# Test specific components
pnpm test:component -- --grep "Menu"
pnpm test:component -- --grep "WordSearch"
```

### 8. Common Issues & Solutions

#### Issue: TUI doesn't start
**Symptoms**: No output, process hangs
**Solutions**:
- Check if `dist/cli.js` exists: `pnpm build`
- Check for TypeScript errors: `pnpm type-check`
- Check for missing dependencies: `pnpm install`

#### Issue: Menu doesn't respond
**Symptoms**: Arrow keys don't work, no selection
**Solutions**:
- Check if `@inkjs/ui` Select component is working
- Verify input handling in Menu component
- Check terminal compatibility

#### Issue: Components not rendering
**Symptoms**: Blank screen, missing UI elements
**Solutions**:
- Check component imports
- Verify JSX syntax
- Check for runtime errors in debug panel

#### Issue: Performance problems
**Symptoms**: Slow rendering, laggy input
**Solutions**:
- Check for infinite re-renders
- Verify component memoization
- Check for expensive operations in render

#### Issue: Global shortcuts interfere with input (FIXED)
**Symptoms**: Can't type 'h' in search fields, help appears instead
**Solutions**:
- ✅ Fixed with focus management system
- Input fields now properly capture all keystrokes when focused
- Global shortcuts only work when no input field is focused

### 9. Debugging Checklist

Before reporting issues, check:

- [ ] `pnpm build` completes without errors
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:tui` shows expected output
- [ ] Debug panel (Ctrl+D) shows current state
- [ ] Terminal supports colors and special characters
- [ ] Node.js version is >= 16
- [ ] Input focus state is working correctly (new)

### 10. Useful Commands

```bash
# Full development cycle
pnpm build && pnpm test:tui && pnpm test:component

# Quick validation
pnpm type-check && pnpm lint && pnpm test:tui

# Debug with output capture
pnpm test:tui 2>&1 | tee debug.log

# Interactive debugging
pnpm debug:tui

# Test input field behavior
node dist/cli.js --tui --chain down enter h e l l o enter q
```

### 11. Environment Variables

Set these for debugging:

```bash
# Force colors
export FORCE_COLOR=1

# Enable debug logging
export DEBUG=*

# Disable buffering
export NODE_OPTIONS="--no-buffering"
```

### 12. Getting Help

If you're still having issues:

1. **Check the debug panel** (Ctrl+D) for current state
2. **Run the test script** and share output: `pnpm test:tui`
3. **Check for TypeScript errors**: `pnpm type-check`
4. **Verify terminal compatibility**: Try different terminal emulators
5. **Check Node.js version**: `node --version` (should be >= 16)
6. **Test input field behavior**: Use chain commands to simulate typing

## Example Debug Session

```bash
# 1. Build the project
pnpm build

# 2. Test basic functionality
pnpm test:tui

# 3. Test layout system
pnpm layout-test

# 4. Test input field behavior
node dist/cli.js --tui --chain down enter h e l l o enter q

# 5. If issues found, start debug mode
pnpm debug:tui

# 6. In another terminal, check process
ps aux | grep cli

# 7. Check logs
tail -f debug.log

# 8. Test specific components
pnpm test:component -- --grep "Menu"
```

This approach ensures you can debug the TUI effectively without getting stuck in infinite loops! 
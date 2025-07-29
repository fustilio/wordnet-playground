# Layout System Documentation

## Overview

The layout system ensures that all TUI components account for both app-level and component-level UI elements, dynamically adjusting to terminal size and available space. This prevents focused rows from scrolling out of view, ensures components use available space effectively, and supports robust, responsive design.

---

## Key Principles

- **Single Source of Truth:** All space allocation is calculated via the layout system, not ad-hoc in components.
- **Dynamic Reserved Lines:** Both app-level and component-level reserved lines are dynamically reduced if the terminal is too small.
- **Conditional Rendering:** Components must conditionally render headers, footers, and panels based on the layout values provided.
- **SOLID Design:** The system is modular, extensible, and testable, following SOLID principles (see below).

---

## App-Level vs. Component-Level Reserved Lines

- **App-Level Reserved Lines:**
  - Header (2 lines)
  - Error display (0-2 lines, conditional)
  - Status bar (2 lines)
  - Debug panel (0-8 lines, conditional)
- **Component-Level Reserved Lines:**
  - Calculated per component type (e.g., menu header, controls, table headers, etc.)
  - Dynamically reduced if space is limited (e.g., drop padding, controls, or headers as needed)

**Total output lines = app-level reserved lines + component reserved lines + content height**

---

## Dynamic Reserved Line Reduction

When the terminal is too small, the layout system reduces or removes non-essential UI elements in a stepwise fashion:
- First, drop padding/margins
- Then, drop controls/help lines
- Then, drop headers
- Finally, drop borders or set all reserved lines to zero

This ensures the app never renders more lines than the terminal can display.

---

## Conditional Rendering in Components

Components **must** check the layout values before rendering UI elements:

```tsx
{layout.menuHeaderLines > 0 && (
  <Box>...</Box>
)}
{layout.menuControlsLines > 0 && (
  <Box>...</Box>
)}
{layout.contentHeight <= 0 && (
  <Text color="red">Terminal too small to display ...</Text>
)}
```

This pattern applies to all major components (Menu, DataManager, Settings, Help, etc.).

---

## Test Integration & Troubleshooting

- The layout system is tested with a harness that simulates both app-level and component-level reserved lines.
- If tests fail with errors like `expected 37 to be less than or equal to 15`, check that:
  - Components are using the latest layout values for conditional rendering
  - The test harness is simulating both app-level and component-level reserved lines
  - No hardcoded line counts remain in any component
- Use the layout test tool (`pnpm layout-test`) to debug scenarios interactively.

---

## SOLID Design Principles in the Layout System

- **Single Responsibility:**
  - `useLayoutContext` provides terminal and app-level context only.
  - `calculateComponentLayout` computes component-specific layout only.
  - Components render only what the layout allows.
- **Open/Closed:**
  - New component types can be added to `calculateComponentLayout` without modifying existing logic.
- **Liskov Substitution:**
  - All components use the same layout interface and can be swapped in the layout system.
- **Interface Segregation:**
  - Layout context and component layout interfaces are focused and separate.
- **Dependency Inversion:**
  - Components depend on layout abstractions, not on concrete calculations or terminal APIs.

---

## Best Practices for Extending the Layout System

1. **Always Use Layout Context**
   - Never calculate available space manually in a component.
2. **Add New Component Types Carefully**
   - Add a new case to `calculateComponentLayout` for your component.
   - Define all reserved lines and how they should be reduced if space is limited.
3. **Conditional Rendering**
   - Only render UI elements if the corresponding layout value is > 0.
4. **Pagination**
   - Use `calculatePaginationWindow` for lists to ensure the selected item is always visible.
5. **Testing**
   - Add integration tests for new component types and edge cases.
   - Use the layout test tool for manual verification.

---

## Example: Menu Component (Updated)

```tsx
const Menu: React.FC<MenuProps> = ({ onSelect }) => {
  const layoutContext = useLayoutContext();
  const layout = calculateComponentLayout(layoutContext, 'menu');

  if (layout.contentHeight <= 0) {
    return <Text color="red">Terminal too small to display menu</Text>;
  }

  return (
    <Box flexDirection="column" height="100%">
      {layout.menuHeaderLines > 0 && (
        <Box>...</Box>
      )}
      <Box flexGrow={1} height={layout.contentHeight}>
        <Select visibleOptionCount={layout.menuOptionRows} />
      </Box>
      {layout.menuControlsLines > 0 && (
        <Box>...</Box>
      )}
    </Box>
  );
};
```

---

## Example: DataManager Component (Updated)

```tsx
const DataManager: React.FC<DataManagerProps> = ({ onBack }) => {
  const layoutContext = useLayoutContext(!!error, false);
  const layout = calculateComponentLayout(layoutContext, 'data-manager');

  if (layout.contentHeight <= 0) {
    return <Text color="red">Terminal too small to display data manager</Text>;
  }

  return (
    <Box flexDirection="column" height="100%">
      {layout.reservedLines > 0 && <ViewHeader ... />}
      {message && layout.contentHeight > 3 && <Alert ... />}
      {/* ... */}
      <Box flexGrow={1}>
        {layout.contentHeight > 2 && <Box>Table Header</Box>}
        {/* ... */}
      </Box>
      {layout.contentHeight > 6 && <NavigationHelp ... />}
    </Box>
  );
};
```

---

## Example: Settings Component (Updated)

```tsx
const Settings: React.FC<SettingsProps> = (props) => {
  const layoutContext = useLayoutContext();
  const layout = calculateComponentLayout(layoutContext, 'settings');

  if (layout.contentHeight <= 0) {
    return <Text color="red">Terminal too small to display settings</Text>;
  }

  return (
    <Box flexDirection="column" height={layout.contentHeight}>
      {layout.reservedLines > 0 && <Box>Header</Box>}
      {layout.contentHeight > 4 && <Text>Help text</Text>}
      {/* ... */}
    </Box>
  );
};
```

---

## Example: Help View (Updated)

```tsx
case 'help':
  const helpLayoutContext = useLayoutContext();
  const helpLayout = calculateComponentLayout(helpLayoutContext, 'help');
  if (helpLayout.contentHeight <= 0) {
    return <Text color="red">Terminal too small to display help</Text>;
  }
  return (
    <Box flexDirection="column" padding={1} height={helpLayout.contentHeight}>
      {helpLayout.reservedLines > 0 && <Box>Header</Box>}
      {helpLayout.contentHeight > 3 && <Text>Shortcuts</Text>}
      {helpLayout.contentHeight > 8 && <Box>Features</Box>}
      {helpLayout.contentHeight > 10 && <Box>Footer</Box>}
    </Box>
  );
```

---

## Troubleshooting

- **Component not using full height:**
  - Ensure you use the correct component type in `calculateComponentLayout`.
  - Use the returned `contentHeight` for your main content area.
- **Test failures about line count:**
  - Make sure both app-level and component-level reserved lines are simulated in tests.
  - Ensure all conditional rendering is based on layout values.
- **Adding new UI elements:**
  - Always add new reserved lines to the layout calculation and conditionally render them.

---

## Conclusion

The layout system now provides a robust, SOLID-compliant foundation for TUI development:
- All space is dynamically and accurately allocated
- Components are modular and easy to extend
- Responsive design and pagination are built-in
- Tests and troubleshooting are straightforward

**Always use the layout system for any new component or UI element!** 
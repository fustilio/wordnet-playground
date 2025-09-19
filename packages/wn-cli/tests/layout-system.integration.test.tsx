import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { calculateComponentLayout } from '../src/utils/layout-helpers.js';

// Minimal test harness to simulate layout for a component type and terminal size
function LayoutHarness({ columns, rows, componentType, hasError = false, hasDebugPanel = false }) {
  // App-level reserved lines
  const appHeaderHeight = 2;
  const errorDisplayHeight = hasError ? 2 : 0;
  const statusBarHeight = 2;
  const debugPanelHeight = hasDebugPanel ? 8 : 0;
  const availableHeight = rows - appHeaderHeight - errorDisplayHeight - statusBarHeight - debugPanelHeight;
  const availableWidth = columns;
  const isWide = columns >= 100;
  const isMedium = columns >= 80;
  const isSmall = columns < 80;
  const layoutContext = {
    columns,
    rows,
    availableWidth,
    availableHeight,
    isWide,
    isMedium,
    isSmall,
    appHeaderHeight,
    errorDisplayHeight,
    statusBarHeight,
    debugPanelHeight,
  };
  const layout = calculateComponentLayout(layoutContext, componentType as any);

  // Debug output
  // eslint-disable-next-line no-console
  console.log(`SCENARIO: ${columns}x${rows} | ${componentType} | error:${hasError} debug:${hasDebugPanel}`);
  // eslint-disable-next-line no-console
  console.log(`  reservedLines: ${layout.reservedLines}, contentHeight: ${layout.contentHeight}, total: ${layout.reservedLines + layout.contentHeight}`);

  // Calculate total lines to render (app-level + component-level)
  const totalReserved = appHeaderHeight + errorDisplayHeight + statusBarHeight + debugPanelHeight + layout.reservedLines;
  const totalLines = totalReserved + layout.contentHeight;

  // Simulate app-level reserved lines
  const appReserved = Array.from({ length: appHeaderHeight + errorDisplayHeight + statusBarHeight + debugPanelHeight }).map((_, i) => (
    <div key={`app${i}`}>{'='.repeat(Math.min(layout.contentWidth || columns, columns))}</div>
  ));
  
  // Simulate component-level reserved lines (headers, footers, etc.)
  const componentReserved = Array.from({ length: layout.reservedLines }).map((_, i) => (
    <div key={`comp${i}`}>{'='.repeat(Math.min(layout.contentWidth || columns, columns))}</div>
  ));
  
  // Simulate content area
  const content = Array.from({ length: layout.contentHeight }).map((_, i) => (
    <div key={`c${i}`}>{' '.repeat(Math.min(layout.contentWidth || columns, columns))}</div>
  ));
  
  return (
    <>
      {appReserved}
      {componentReserved}
      {content}
    </>
  );
}

const componentTypes = ['menu', 'data-manager', 'search', 'settings', 'help'];
const terminalSizes = [
  { name: 'Very Small', columns: 40, rows: 15 },
  { name: 'Small', columns: 60, rows: 20 },
  { name: 'Medium', columns: 80, rows: 24 },
  { name: 'Large', columns: 120, rows: 30 },
  { name: 'Very Large', columns: 150, rows: 40 },
];
const scenarios = [
  { hasError: false, hasDebugPanel: false },
  { hasError: true, hasDebugPanel: false },
  { hasError: false, hasDebugPanel: true },
  { hasError: true, hasDebugPanel: true },
];

describe('Layout system integration', () => {
  for (const { name, columns, rows } of terminalSizes) {
    for (const componentType of componentTypes) {
      for (const scenario of scenarios) {
        const label = `${name} (${columns}x${rows}) | ${componentType} | error:${scenario.hasError} debug:${scenario.hasDebugPanel}`;
        it(label, () => {
          const { lastFrame } = render(
            <LayoutHarness
              columns={columns}
              rows={rows}
              componentType={componentType}
              hasError={scenario.hasError}
              hasDebugPanel={scenario.hasDebugPanel}
            />
          );
          // Recalculate layout for assertion
          const appHeaderHeight = 2;
          const errorDisplayHeight = scenario.hasError ? 2 : 0;
          const statusBarHeight = 2;
          const debugPanelHeight = scenario.hasDebugPanel ? 8 : 0;
          const availableHeight = rows - appHeaderHeight - errorDisplayHeight - statusBarHeight - debugPanelHeight;
          const availableWidth = columns;
          const isWide = columns >= 100;
          const isMedium = columns >= 80;
          const isSmall = columns < 80;
          const layoutContext = {
            columns,
            rows,
            appHeaderHeight,
            errorDisplayHeight,
            statusBarHeight,
            debugPanelHeight,
            availableHeight,
            availableWidth,
            isWide,
            isMedium,
            isSmall,
          };
          const layout = calculateComponentLayout(layoutContext, componentType as 'menu' | 'data-manager' | 'search' | 'settings' | 'help');
          const output = lastFrame() || '';
          const lines = output.split('\n');
          const maxLineWidth = Math.max(...lines.map(line => line.length));
          // The output should not exceed the simulated terminal size
          expect(lines.length).toBeLessThanOrEqual(rows);
          expect(maxLineWidth).toBeLessThanOrEqual(columns);
          // The sum of all reserved lines and contentHeight should not exceed rows
          const totalReserved = appHeaderHeight + errorDisplayHeight + statusBarHeight + debugPanelHeight + layout.reservedLines;
          expect(totalReserved + layout.contentHeight).toBeLessThanOrEqual(rows);
        });
      }
    }
  }
}); 
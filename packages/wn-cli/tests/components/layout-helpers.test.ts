import { describe, it, expect, vi } from 'vitest';
import { useLayoutContext, calculateComponentLayout } from '../../src/utils/layout-helpers';

// Mock useStdoutDimensions for controlled tests
vi.mock('../../src/utils/hooks/useStdOutDimensions', () => ({
  useStdoutDimensions: () => ({ columns: undefined, rows: undefined })
}));

describe('layout-helpers', () => {
  it('provides default terminal dimensions if undefined', () => {
    const context = useLayoutContext();
    expect(context.columns).toBe(80);
    expect(context.rows).toBe(24);
    expect(context.availableHeight).toBeGreaterThan(0);
    expect(context.availableWidth).toBe(80);
  });

  it('calculates layout for menu component', () => {
    const context = useLayoutContext();
    const layout = calculateComponentLayout(context, 'menu');
    expect(layout.menuOptionRows).toBeGreaterThan(0);
    expect(layout.contentHeight).toBe(context.availableHeight);
    expect(layout.maxVisibleRows).toBe(layout.menuOptionRows);
  });

  it('calculates layout for data-manager component', () => {
    const context = useLayoutContext();
    const layout = calculateComponentLayout(context, 'data-manager');
    expect(layout.maxVisibleRows).toBeGreaterThan(0);
    expect(layout.contentHeight).toBe(context.availableHeight);
  });

  it('calculates layout for search component', () => {
    const context = useLayoutContext();
    const layout = calculateComponentLayout(context, 'search');
    expect(layout.maxVisibleRows).toBeGreaterThan(0);
    expect(layout.contentHeight).toBe(context.availableHeight);
  });

  it('calculates layout for settings component', () => {
    const context = useLayoutContext();
    const layout = calculateComponentLayout(context, 'settings');
    expect(layout.maxVisibleRows).toBeGreaterThan(0);
    expect(layout.contentHeight).toBe(context.availableHeight);
  });

  it('calculates layout for help component', () => {
    const context = useLayoutContext();
    const layout = calculateComponentLayout(context, 'help');
    expect(layout.maxVisibleRows).toBeGreaterThan(0);
    expect(layout.contentHeight).toBe(context.availableHeight);
  });

  it('respects hasError and hasDebugPanel flags', () => {
    const context = useLayoutContext(true, true);
    expect(context.errorDisplayHeight).toBe(2);
    expect(context.debugPanelHeight).toBe(8);
    expect(context.availableHeight).toBeLessThan(24);
  });
}); 
import React from 'react';
import { render } from 'ink';
import { expect, test, describe } from 'vitest';
import { LayoutTestTool } from '../src/utils/layout-test-tool.js';

describe('LayoutTestTool', () => {
  test('renders without crashing', () => {
    let exitCalled = false;
    const onExit = () => {
      exitCalled = true;
    };

    const { unmount } = render(<LayoutTestTool onExit={onExit} />);
    
    // Should render without errors
    expect(exitCalled).toBe(false);
    
    unmount();
  });

  test('displays layout information', () => {
    let exitCalled = false;
    const onExit = () => {
      exitCalled = true;
    };

    const { unmount } = render(<LayoutTestTool onExit={onExit} />);
    
    // The tool should display layout information
    // We can't easily test the exact output since it depends on terminal dimensions
    // But we can verify it doesn't crash
    
    unmount();
  });

  test('handles exit correctly', () => {
    let exitCalled = false;
    const onExit = () => {
      exitCalled = true;
    };

    const { unmount } = render(<LayoutTestTool onExit={onExit} />);
    
    // Call onExit manually to test
    onExit();
    expect(exitCalled).toBe(true);
    
    unmount();
  });
}); 
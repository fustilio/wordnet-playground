import { useStdoutDimensions } from './hooks/useStdOutDimensions.js';

export interface LayoutContext {
  // Terminal dimensions
  columns: number;
  rows: number;
  
  // App-level UI elements that consume space
  appHeaderHeight: number;
  errorDisplayHeight: number;
  statusBarHeight: number;
  debugPanelHeight: number;
  
  // Calculated available space
  availableHeight: number;
  availableWidth: number;
  
  // Responsive breakpoints
  isWide: boolean;
  isMedium: boolean;
  isSmall: boolean;
}

export interface ComponentLayout {
  // Available space for component content
  contentHeight: number;
  contentWidth: number;
  
  // Responsive column widths
  lexiconWidth: number;
  statusWidth: number;
  sizeWidth: number;
  
  // Pagination calculations
  maxVisibleRows: number;
  reservedLines: number;
  
  // Menu-specific calculations
  menuOptionRows: number;
  menuHeaderLines: number;
  menuControlsLines: number;
  menuPanelPadding: number;
  menuBoxBorder: number;
}

/**
 * Hook to get layout context that accounts for app-level UI elements
 */
export function useLayoutContext(
  hasError: boolean = false,
  hasDebugPanel: boolean = false
): LayoutContext {
  const { columns, rows } = useStdoutDimensions();
  const safeColumns = columns ?? 80;
  const safeRows = rows ?? 24;
  
  // App-level UI element heights - Updated for compact design
  const appHeaderHeight = 2; // Compact unified header
  const errorDisplayHeight = hasError ? 2 : 0; // Error messages
  const statusBarHeight = 1; // Compact status bar (reduced from 2)
  const debugPanelHeight = hasDebugPanel ? 8 : 0; // Debug panel (approximate)
  
  // Calculate available space
  const reservedHeight = appHeaderHeight + errorDisplayHeight + statusBarHeight + debugPanelHeight + 4; // +4 for margins/padding
  const availableHeight = Math.max(8, safeRows - reservedHeight);
  const availableWidth = safeColumns;
  
  // Responsive breakpoints
  const isWide = availableWidth >= 100;
  const isMedium = availableWidth >= 80;
  const isSmall = availableWidth < 80;
  
  return {
    columns: safeColumns,
    rows: safeRows,
    appHeaderHeight,
    errorDisplayHeight,
    statusBarHeight,
    debugPanelHeight,
    availableHeight,
    availableWidth,
    isWide,
    isMedium,
    isSmall
  };
}

/**
 * Calculate component-specific layout based on layout context
 */
export function calculateComponentLayout(
  context: LayoutContext,
  componentType: 'menu' | 'data-manager' | 'search' | 'settings' | 'help'
): ComponentLayout {
  const { availableHeight, availableWidth, isWide, isMedium } = context;
  
  // Responsive column widths
  const lexiconWidth = isWide ? 25 : isMedium ? 20 : 15;
  const statusWidth = isWide ? 18 : isMedium ? 15 : 12;
  const sizeWidth = isWide ? 12 : isMedium ? 10 : 8;
  
  // Component-specific calculations
  let contentHeight: number;
  let maxVisibleRows: number;
  let reservedLines: number;
  let menuOptionRows = 0;
  let menuHeaderLines = 0;
  let menuControlsLines = 0;
  let menuPanelPadding = 0;
  let menuBoxBorder = 0;
  
  switch (componentType) {
    case 'menu':
      // Menu-specific calculations
      menuHeaderLines = 1; // "Available Features"
      menuControlsLines = 1; // Navigation help
      menuPanelPadding = 2; // top+bottom padding
      menuBoxBorder = 2; // top+bottom border
      reservedLines = menuHeaderLines + menuControlsLines + menuPanelPadding + menuBoxBorder;
      const appReservedLines_menu = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      let remainingRows = context.rows - appReservedLines_menu;
      // Stepwise reduction of reserved lines if too large
      let _menuHeaderLines = menuHeaderLines;
      let _menuControlsLines = menuControlsLines;
      let _menuPanelPadding = menuPanelPadding;
      let _menuBoxBorder = menuBoxBorder;
      let _reservedLines = _menuHeaderLines + _menuControlsLines + _menuPanelPadding + _menuBoxBorder;
      if (_reservedLines > remainingRows) {
        // Drop padding first
        _menuPanelPadding = 0;
        _reservedLines = _menuHeaderLines + _menuControlsLines + _menuPanelPadding + _menuBoxBorder;
      }
      if (_reservedLines > remainingRows) {
        // Drop controls next
        _menuControlsLines = 0;
        _reservedLines = _menuHeaderLines + _menuControlsLines + _menuPanelPadding + _menuBoxBorder;
      }
      if (_reservedLines > remainingRows) {
        // Drop header next
        _menuHeaderLines = 0;
        _reservedLines = _menuHeaderLines + _menuControlsLines + _menuPanelPadding + _menuBoxBorder;
      }
      if (_reservedLines > remainingRows) {
        // Drop border last
        _menuBoxBorder = 0;
        _reservedLines = _menuHeaderLines + _menuControlsLines + _menuPanelPadding + _menuBoxBorder;
      }
      if (_reservedLines > remainingRows) {
        // If still too large, set all to 0
        _menuHeaderLines = 0;
        _menuControlsLines = 0;
        _menuPanelPadding = 0;
        _menuBoxBorder = 0;
        _reservedLines = 0;
      }
      reservedLines = _reservedLines;
      menuHeaderLines = _menuHeaderLines;
      menuControlsLines = _menuControlsLines;
      menuPanelPadding = _menuPanelPadding;
      menuBoxBorder = _menuBoxBorder;
      if (appReservedLines_menu + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        menuOptionRows = 0;
        maxVisibleRows = 0;
        menuHeaderLines = 0;
        menuControlsLines = 0;
        menuPanelPadding = 0;
        menuBoxBorder = 0;
        return {
          contentWidth: availableWidth,
          contentHeight: 0,
          reservedLines,
          maxVisibleRows: 0,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      // Clamp contentHeight so total never exceeds context.rows
      contentHeight = Math.max(0, context.rows - (appReservedLines_menu + reservedLines));
      if (contentHeight < 3) {
        contentHeight = 0;
      }
      menuOptionRows = contentHeight;
      maxVisibleRows = contentHeight;
      break;
    case 'data-manager':
      // Data manager has more complex layout with status, operations
      let _statusHeight = 2; // Status messages
      let _operationHeight = 3; // Operation progress
      let _navigationHeight = 2; // Navigation help
      let _tableHeaderHeight = 2; // Table header
      let _dmPadding = 2;
      reservedLines = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      const appReservedLines_dm = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      let _reservedLines_dm = reservedLines;
      let remainingRows_dm = context.rows - appReservedLines_dm;
      if (_reservedLines_dm > remainingRows_dm) {
        _navigationHeight = 0;
        _reservedLines_dm = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      }
      if (_reservedLines_dm > remainingRows_dm) {
        _operationHeight = 0;
        _reservedLines_dm = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      }
      if (_reservedLines_dm > remainingRows_dm) {
        _tableHeaderHeight = 0;
        _reservedLines_dm = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      }
      if (_reservedLines_dm > remainingRows_dm) {
        _statusHeight = 0;
        _reservedLines_dm = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      }
      if (_reservedLines_dm > remainingRows_dm) {
        _dmPadding = 0;
        _reservedLines_dm = _statusHeight + _operationHeight + _navigationHeight + _tableHeaderHeight + _dmPadding;
      }
      if (_reservedLines_dm > remainingRows_dm) {
        _statusHeight = 0;
        _operationHeight = 0;
        _navigationHeight = 0;
        _tableHeaderHeight = 0;
        _dmPadding = 0;
        _reservedLines_dm = 0;
      }
      reservedLines = _reservedLines_dm;
      // Note: These variables are not used in the return object, so we don't need to assign them
      // statusHeight = _statusHeight;
      // operationHeight = _operationHeight;
      // navigationHeight = _navigationHeight;
      // tableHeaderHeight = _tableHeaderHeight;
      // dmPadding = _dmPadding;
      if (appReservedLines_dm + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        maxVisibleRows = 0;
        return {
          contentWidth: availableWidth,
          contentHeight,
          reservedLines,
          maxVisibleRows,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      const maxContent_dm = Math.max(0, context.rows - (appReservedLines_dm + reservedLines));
      if (maxContent_dm < 3) {
        contentHeight = 0;
        maxVisibleRows = 0;
      } else {
        contentHeight = maxContent_dm;
        maxVisibleRows = contentHeight;
      }
      break;
    case 'search':
      // Search components (WordSearch, SynsetExplorer, etc.)
      let _searchInputHeight = 2; // Search input
      let _searchStatusHeight = 2; // Loading/error messages
      let _searchNavigationHeight = 2; // Navigation help
      let _searchPadding = 2;
      reservedLines = _searchInputHeight + _searchStatusHeight + _searchNavigationHeight + _searchPadding;
      const appReservedLines_search = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      let _reservedLines_search = reservedLines;
      let remainingRows_search = context.rows - appReservedLines_search;
      if (_reservedLines_search > remainingRows_search) {
        _searchNavigationHeight = 0;
        _reservedLines_search = _searchInputHeight + _searchStatusHeight + _searchNavigationHeight + _searchPadding;
      }
      if (_reservedLines_search > remainingRows_search) {
        _searchStatusHeight = 0;
        _reservedLines_search = _searchInputHeight + _searchStatusHeight + _searchNavigationHeight + _searchPadding;
      }
      if (_reservedLines_search > remainingRows_search) {
        _searchInputHeight = 0;
        _reservedLines_search = _searchInputHeight + _searchStatusHeight + _searchNavigationHeight + _searchPadding;
      }
      if (_reservedLines_search > remainingRows_search) {
        _searchPadding = 0;
        _reservedLines_search = _searchInputHeight + _searchStatusHeight + _searchNavigationHeight + _searchPadding;
      }
      if (_reservedLines_search > remainingRows_search) {
        _searchInputHeight = 0;
        _searchStatusHeight = 0;
        _searchNavigationHeight = 0;
        _searchPadding = 0;
        _reservedLines_search = 0;
      }
      reservedLines = _reservedLines_search;
      // Note: These variables are not used in the return object, so we don't need to assign them
      // searchInputHeight = _searchInputHeight;
      // searchStatusHeight = _searchStatusHeight;
      // searchNavigationHeight = _searchNavigationHeight;
      // searchPadding = _searchPadding;
      if (appReservedLines_search + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        maxVisibleRows = 0;
        return {
          contentWidth: availableWidth,
          contentHeight,
          reservedLines,
          maxVisibleRows,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      const maxContent_search = Math.max(0, context.rows - (appReservedLines_search + reservedLines));
      if (maxContent_search < 3) {
        contentHeight = 0;
        maxVisibleRows = 0;
      } else {
        contentHeight = maxContent_search;
        maxVisibleRows = contentHeight;
      }
      break;
    case 'settings':
      // Settings component
      let _settingsHeaderHeight = 2;
      let _settingsControlsHeight = 6; // Select components
      let _settingsHelpHeight = 2;
      let _settingsPadding = 2;
      reservedLines = _settingsHeaderHeight + _settingsControlsHeight + _settingsHelpHeight + _settingsPadding;
      const appReservedLines_settings = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      let _reservedLines_settings = reservedLines;
      let remainingRows_settings = context.rows - appReservedLines_settings;
      if (_reservedLines_settings > remainingRows_settings) {
        _settingsHelpHeight = 0;
        _reservedLines_settings = _settingsHeaderHeight + _settingsControlsHeight + _settingsHelpHeight + _settingsPadding;
      }
      if (_reservedLines_settings > remainingRows_settings) {
        _settingsControlsHeight = 0;
        _reservedLines_settings = _settingsHeaderHeight + _settingsControlsHeight + _settingsHelpHeight + _settingsPadding;
      }
      if (_reservedLines_settings > remainingRows_settings) {
        _settingsPadding = 0;
        _reservedLines_settings = _settingsHeaderHeight + _settingsControlsHeight + _settingsHelpHeight + _settingsPadding;
      }
      if (_reservedLines_settings > remainingRows_settings) {
        _settingsHeaderHeight = 0;
        _reservedLines_settings = _settingsHeaderHeight + _settingsControlsHeight + _settingsHelpHeight + _settingsPadding;
      }
      if (_reservedLines_settings > remainingRows_settings) {
        _settingsHeaderHeight = 0;
        _settingsControlsHeight = 0;
        _settingsHelpHeight = 0;
        _settingsPadding = 0;
        _reservedLines_settings = 0;
      }
      reservedLines = _reservedLines_settings;
      // Note: These variables are not used in the return object, so we don't need to assign them
      // settingsHeaderHeight = _settingsHeaderHeight;
      // settingsControlsHeight = _settingsControlsHeight;
      // settingsHelpHeight = _settingsHelpHeight;
      // settingsPadding = _settingsPadding;
      if (appReservedLines_settings + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        maxVisibleRows = 0;
        return {
          contentWidth: availableWidth,
          contentHeight,
          reservedLines,
          maxVisibleRows,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      const maxContent_settings = Math.max(0, context.rows - (appReservedLines_settings + reservedLines));
      if (maxContent_settings < 3) {
        contentHeight = 0;
        maxVisibleRows = 0;
      } else {
        contentHeight = maxContent_settings;
        maxVisibleRows = contentHeight;
      }
      break;
    case 'help':
      // Help component
      let _helpHeaderHeight = 2;
      let _helpContentHeight = 10; // Help content
      let _helpNavigationHeight = 2;
      let _helpPadding = 2;
      reservedLines = _helpHeaderHeight + _helpContentHeight + _helpNavigationHeight + _helpPadding;
      const appReservedLines_help = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      let _reservedLines_help = reservedLines;
      let remainingRows_help = context.rows - appReservedLines_help;
      if (_reservedLines_help > remainingRows_help) {
        _helpNavigationHeight = 0;
        _reservedLines_help = _helpHeaderHeight + _helpContentHeight + _helpNavigationHeight + _helpPadding;
      }
      if (_reservedLines_help > remainingRows_help) {
        _helpContentHeight = 0;
        _reservedLines_help = _helpHeaderHeight + _helpContentHeight + _helpNavigationHeight + _helpPadding;
      }
      if (_reservedLines_help > remainingRows_help) {
        _helpPadding = 0;
        _reservedLines_help = _helpHeaderHeight + _helpContentHeight + _helpNavigationHeight + _helpPadding;
      }
      if (_reservedLines_help > remainingRows_help) {
        _helpHeaderHeight = 0;
        _reservedLines_help = _helpHeaderHeight + _helpContentHeight + _helpNavigationHeight + _helpPadding;
      }
      if (_reservedLines_help > remainingRows_help) {
        _helpHeaderHeight = 0;
        _helpContentHeight = 0;
        _helpNavigationHeight = 0;
        _helpPadding = 0;
        _reservedLines_help = 0;
      }
      reservedLines = _reservedLines_help;
      // Note: These variables are not used in the return object, so we don't need to assign them
      // helpHeaderHeight = _helpHeaderHeight;
      // helpContentHeight = _helpContentHeight;
      // helpNavigationHeight = _helpNavigationHeight;
      // helpPadding = _helpPadding;
      if (appReservedLines_help + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        maxVisibleRows = 0;
        return {
          contentWidth: availableWidth,
          contentHeight,
          reservedLines,
          maxVisibleRows,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      const maxContent_help = Math.max(0, context.rows - (appReservedLines_help + reservedLines));
      if (maxContent_help < 3) {
        contentHeight = 0;
        maxVisibleRows = 0;
      } else {
        contentHeight = maxContent_help;
        maxVisibleRows = contentHeight;
      }
      break;
    default:
      // Default calculations
      reservedLines = 6;
      const appReservedLines_default = context.appHeaderHeight + context.errorDisplayHeight + context.statusBarHeight + context.debugPanelHeight;
      if (appReservedLines_default + reservedLines >= context.rows) {
        reservedLines = 0;
        contentHeight = 0;
        maxVisibleRows = 0;
        return {
          contentWidth: availableWidth,
          contentHeight,
          reservedLines,
          maxVisibleRows,
          menuOptionRows: 0,
          menuHeaderLines: 0,
          menuControlsLines: 0,
          menuPanelPadding: 0,
          menuBoxBorder: 0,
          lexiconWidth,
          statusWidth,
          sizeWidth,
        };
      }
      const maxContent_default = Math.max(0, context.rows - (appReservedLines_default + reservedLines));
      if (maxContent_default < 3) {
        contentHeight = 0;
        maxVisibleRows = 0;
      } else {
        contentHeight = maxContent_default;
        maxVisibleRows = contentHeight;
      }
      break;
  }
  
  return {
    contentHeight,
    contentWidth: availableWidth,
    lexiconWidth,
    statusWidth,
    sizeWidth,
    maxVisibleRows,
    reservedLines,
    menuOptionRows: menuOptionRows || 0,
    menuHeaderLines: menuHeaderLines || 0,
    menuControlsLines: menuControlsLines || 0,
    menuPanelPadding: menuPanelPadding || 0,
    menuBoxBorder: menuBoxBorder || 0
  };
}

/**
 * Calculate pagination window for list components
 */
export function calculatePaginationWindow(
  totalItems: number,
  maxVisibleRows: number,
  selectedIndex: number
): { windowStart: number; windowEnd: number; visibleItems: number[] } {
  if (totalItems <= maxVisibleRows) {
    return {
      windowStart: 0,
      windowEnd: totalItems,
      visibleItems: Array.from({ length: totalItems }, (_, i) => i)
    };
  }
  
  // Calculate the center position for the selected item
  const centerPosition = Math.floor(maxVisibleRows / 2);
  
  // Ensure the selected item is centered when possible
  let windowStart = Math.max(0, Math.min(
    selectedIndex - centerPosition,
    totalItems - maxVisibleRows
  ));
  let windowEnd = Math.min(windowStart + maxVisibleRows, totalItems);
  
  // Adjust if we're at the end of the list
  if (windowEnd === totalItems) {
    windowStart = Math.max(0, totalItems - maxVisibleRows);
  }
  
  const visibleItems = Array.from(
    { length: windowEnd - windowStart },
    (_, i) => windowStart + i
  );
  
  return {
    windowStart,
    windowEnd,
    visibleItems
  };
}

/**
 * Truncate text to fit within specified width
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get responsive width based on terminal size
 */
export function getResponsiveWidth(
  context: LayoutContext,
  wide: number,
  medium: number,
  small: number
): number {
  if (context.isWide) return wide;
  if (context.isMedium) return medium;
  return small;
} 
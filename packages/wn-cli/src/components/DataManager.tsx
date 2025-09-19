import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner, Alert, Badge, ProgressBar, StatusMessage } from "@inkjs/ui";
import { LexiconHelper } from "../utils/lexicon-helpers.js";
import {
  useLayoutContext,
  calculateComponentLayout,
  calculatePaginationWindow,
  truncateText,
} from "../utils/layout-helpers.js";
import NavigationHelp from "./shared/NavigationHelp.js";
import { useTheme } from "../contexts/ThemeContext.js";

interface DataManagerProps {
  onBack: () => void;
  onExploreLexicon?: (lexicon: string) => void;
}

interface DataStatus {
  lexicon: string;
  downloaded: boolean;
  size?: string;
  lastModified?: string;
  downloading?: boolean;
  deleting?: boolean;
  progress?: number;
  error?: string;
}

interface OperationState {
  type: "download" | "delete" | "refresh" | null;
  lexicon: string;
  progress: number;
  message: string;
}

export const DataManager: React.FC<DataManagerProps> = ({
  onBack,
  onExploreLexicon,
}) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dataStatus, setDataStatus] = useState<DataStatus[]>([]);
  const [operation, setOperation] = useState<OperationState>({
    type: null,
    lexicon: "",
    progress: 0,
    message: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Use the new layout system that accounts for app-level UI elements
  const layoutContext = useLayoutContext(!!error, false);
  const layout = calculateComponentLayout(layoutContext, "data-manager");

  // Mock data status - in real implementation, this would check actual files
  useEffect(() => {
    LexiconHelper.getAllAvailableLexicons().then((lexicons) => {
      const status: DataStatus[] = lexicons.map((lexicon) => ({
        lexicon,
        downloaded: Math.random() > 0.5, // Mock: randomly show as downloaded
        size:
          Math.random() > 0.5
            ? `${Math.floor(Math.random() * 100 + 50)}MB`
            : undefined,
        lastModified:
          Math.random() > 0.5 ? new Date().toLocaleDateString() : undefined,
      }));
      setDataStatus(status);
    });
  }, []);

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onBack();
    } else if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(dataStatus.length - 1, prev + 1));
    } else if (key.return) {
      const selected = dataStatus[selectedIndex];
      if (selected.downloaded && onExploreLexicon) {
        onExploreLexicon(selected.lexicon);
      } else {
        handleAction();
      }
    } else if (input === "d") {
      handleDownload();
    } else if (input === "x") {
      handleDelete();
    } else if (input === "r") {
      handleRefresh();
    }
  });

  const handleAction = () => {
    const selected = dataStatus[selectedIndex];
    if (selected.downloaded) {
      handleDelete();
    } else {
      handleDownload();
    }
  };

  const handleDownload = async () => {
    const selected = dataStatus[selectedIndex];
    if (selected.downloaded) return;

    setOperation({
      type: "download",
      lexicon: selected.lexicon,
      progress: 0,
      message: "Initializing download...",
    });

    try {
      // Simulate download with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setOperation((prev) => ({
          ...prev,
          progress: i,
          message:
            i === 0
              ? "Initializing download..."
              : i === 100
              ? "Finalizing..."
              : `Downloading... ${i}%`,
        }));
      }

      setDataStatus((prev) =>
        prev.map((item) =>
          item.lexicon === selected.lexicon
            ? {
                ...item,
                downloaded: true,
                size: "75MB",
                lastModified: new Date().toLocaleDateString(),
              }
            : item
        )
      );

      setMessage(
        `Downloaded ${LexiconHelper.getLexiconName(
          selected.lexicon
        )} successfully!`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        `Failed to download ${LexiconHelper.getLexiconName(selected.lexicon)}`
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setOperation({ type: null, lexicon: "", progress: 0, message: "" });
    }
  };

  const handleDelete = async () => {
    const selected = dataStatus[selectedIndex];
    if (!selected.downloaded) return;

    setOperation({
      type: "delete",
      lexicon: selected.lexicon,
      progress: 0,
      message: "Preparing to delete...",
    });

    try {
      // Simulate deletion with progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        setOperation((prev) => ({
          ...prev,
          progress: i,
          message:
            i === 0
              ? "Preparing to delete..."
              : i === 100
              ? "Cleaning up..."
              : `Deleting... ${i}%`,
        }));
      }

      setDataStatus((prev) =>
        prev.map((item) =>
          item.lexicon === selected.lexicon
            ? {
                ...item,
                downloaded: false,
                size: undefined,
                lastModified: undefined,
              }
            : item
        )
      );

      setMessage(
        `Deleted ${LexiconHelper.getLexiconName(
          selected.lexicon
        )} successfully!`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        `Failed to delete ${LexiconHelper.getLexiconName(selected.lexicon)}`
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setOperation({ type: null, lexicon: "", progress: 0, message: "" });
    }
  };

  const handleRefresh = async () => {
    setOperation({
      type: "refresh",
      lexicon: "",
      progress: 0,
      message: "Refreshing data status...",
    });

    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("Data status refreshed successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setError("Failed to refresh data status");
      setTimeout(() => setError(""), 5000);
    } finally {
      setOperation({ type: null, lexicon: "", progress: 0, message: "" });
    }
  };

  // Use layout system for responsive design and pagination
  const totalRows = dataStatus.length;
  const { windowStart, windowEnd, visibleItems } = calculatePaginationWindow(
    totalRows,
    layout.maxVisibleRows,
    selectedIndex
  );
  const visibleRows = dataStatus.slice(windowStart, windowEnd);

  const navigationShortcuts = [
    { key: "↑↓", description: "Navigate" },
    { key: "Enter", description: "Action" },
    { key: "D", description: "Download" },
    { key: "X", description: "Delete" },
    { key: "R", description: "Refresh" },
    { key: "Q/Esc", description: "Back" },
  ];

  // If no content height available, render minimal content
  if (layout.contentHeight <= 0) {
    return (
      <Box flexDirection="column" height="100%">
        <Text color="red">Terminal too small to display data manager</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Status Messages - only render if there's space */}
      {message && layout.contentHeight > 3 && (
        <Box marginBottom={1}>
          <Alert variant="success">
            <Text>{message}</Text>
          </Alert>
        </Box>
      )}

      {error && layout.contentHeight > 3 && (
        <Box marginBottom={1}>
          <Alert variant="error">
            <Text>{error}</Text>
          </Alert>
        </Box>
      )}

      {/* Operation Progress - only render if there's space */}
      {operation.type && layout.contentHeight > 5 && (
        <Box marginBottom={1} flexDirection="column">
          <Box marginBottom={1}>
            <Spinner label={operation.message} />
          </Box>
          {operation.type !== "refresh" && (
            <Box marginTop={1}>
              <ProgressBar value={operation.progress} />
            </Box>
          )}
        </Box>
      )}

      {/* Data Table */}
      <Box flexDirection="column" flexGrow={1}>
        {/* Table Header - only render if there's space */}
        {layout.contentHeight > 2 && (
          <Box
            borderStyle="single"
            borderColor={theme.colors.primary}
            padding={1}
            marginBottom={1}
          >
            <Box width={layout.lexiconWidth}>
              <Text bold color={theme.colors.primary}>
                Lexicon
              </Text>
            </Box>
            <Box width={layout.statusWidth}>
              <Text bold color={theme.colors.primary}>
                Status
              </Text>
            </Box>
            <Box width={layout.sizeWidth}>
              <Text bold color={theme.colors.primary}>
                Size
              </Text>
            </Box>
            {layoutContext.isMedium && (
              <Text bold color={theme.colors.primary}>
                Last Modified
              </Text>
            )}
          </Box>
        )}

        {/* Pagination Info - only render if there's space */}
        {totalRows > layout.maxVisibleRows && layout.contentHeight > 4 && (
          <Box marginBottom={1}>
            <Text color={theme.colors.muted} italic>
              Showing {windowStart + 1}-{windowEnd} of {totalRows} items
              {selectedIndex >= 0 && (
                <Text> (Selected: {selectedIndex + 1})</Text>
              )}
            </Text>
          </Box>
        )}

        {/* Table Rows */}
        <Box flexDirection="column" flexGrow={1}>
          {/* Scroll indicator for items above - only render if there's space */}
          {windowStart > 0 && layout.contentHeight > 3 && (
            <Box marginBottom={1} justifyContent="center">
              <Text color={theme.colors.muted} italic>
                ↑ More items above
              </Text>
            </Box>
          )}

          {visibleRows.map((item, idx) => {
            const actualIndex = windowStart + idx;
            const isSelected = actualIndex === selectedIndex;
            const isOperating =
              operation.type && operation.lexicon === item.lexicon;

            return (
              <Box
                key={item.lexicon}
                borderStyle={isSelected ? "round" : "single"}
                borderColor={
                  isSelected ? theme.colors.primary : theme.colors.muted
                }
                padding={1}
                marginBottom={1}
              >
                <Box width={layout.lexiconWidth}>
                  <Text
                    color={
                      isSelected ? theme.colors.primary : theme.colors.text
                    }
                    bold={isSelected}
                  >
                    {isSelected ? "▶ " : "  "}
                    {truncateText(
                      LexiconHelper.getLexiconName(item.lexicon),
                      layout.lexiconWidth - 2
                    )}
                  </Text>
                </Box>
                <Box width={layout.statusWidth}>
                  {isOperating ? (
                    <Spinner
                      label={
                        operation.type === "download"
                          ? "Downloading"
                          : "Deleting"
                      }
                    />
                  ) : item.downloaded ? (
                    <Badge color="green">✓ Downloaded</Badge>
                  ) : (
                    <Badge color="red">✗ Not Downloaded</Badge>
                  )}
                </Box>
                <Box width={layout.sizeWidth}>
                  <Text color={theme.colors.muted}>{item.size || "-"}</Text>
                </Box>
                {layoutContext.isMedium && (
                  <Text color={theme.colors.muted}>
                    {item.lastModified || "-"}
                  </Text>
                )}
              </Box>
            );
          })}

          {/* Scroll indicator for items below - only render if there's space */}
          {windowEnd < totalRows && layout.contentHeight > 3 && (
            <Box marginTop={1} justifyContent="center">
              <Text color={theme.colors.muted} italic>
                ↓ More items below
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation Help - only render if there's space */}
      {layout.contentHeight > 6 && (
        <NavigationHelp shortcuts={navigationShortcuts} />
      )}
    </Box>
  );
};

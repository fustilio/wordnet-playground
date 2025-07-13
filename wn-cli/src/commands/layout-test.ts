import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { LayoutTestTool } from "../utils/layout-test-tool.js";

export default function registerLayoutTestCommand(program: Command) {
  program
    .command("layout-test")
    .description("Test the layout system with different terminal dimensions and scenarios")
    .option("--snapshot", "Enable snapshot mode for testing")
    .action(async () => {
      try {
        render(
          React.createElement(LayoutTestTool, {
            onExit: () => {
              // The render function in ink will keep the process alive, so we don't need to exit here.
              // It will exit when the component unmounts.
            }
          })
        );
      } catch (error) {
        console.error("Error running layout test:", error);
        process.exit(1);
      }
    });
} 

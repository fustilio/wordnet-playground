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
              // This onExit callback is a prop for the component. The component itself
              // is responsible for calling it, which will then allow the process to exit naturally
              // as Ink relinquishes control of stdout.
            }
          })
        );
      } catch (error) {
        console.error("Error running layout test:", error);
        process.exit(1);
      }
    });
} 

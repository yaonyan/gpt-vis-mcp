#!/usr/bin/env -S deno run -A
/**
 * GPT-Vis MCP Server Entry Point
 *
 * Supports both MCP stdio mode and HTTP server mode
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./app.ts";
import { startHttpServer } from "./http.server.ts";

const MODE = Deno.env.get("MODE") || "mcp";

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
🌟 GPT-Vis MCP Server

Usage:
  deno run -A server.ts [mode]

Modes:
  mcp     Start MCP stdio server (default)
  http    Start HTTP server
  help    Show this help message

Environment Variables:
  MODE                     Server mode: "mcp" or "http" (default: mcp)
  PORT                     HTTP server port (default: 3000)
  RENDERED_IMAGE_PATH      Directory for chart images 
  RENDERED_IMAGE_HOST_PATH Base URL for image access
  VIS_REQUEST_SERVER       External GPT-Vis-SSR server URL (future use)

Examples:
  # Start MCP server (for Claude Desktop integration)
  deno run -A server.ts mcp
  
  # Start HTTP server
  deno run -A server.ts http
  
  # Using environment variables
  MODE=http PORT=8080 deno run -A server.ts
`);
}

/**
 * Start MCP stdio server
 */
async function startMcpServer() {
  console.log("🌟 Starting GPT-Vis MCP Server in stdio mode...");
  console.log(
    "📁 Image directory:",
    Deno.env.get("RENDERED_IMAGE_PATH") || "system temp",
  );
  console.log(
    "🌐 Image host:",
    Deno.env.get("RENDERED_IMAGE_HOST_PATH") || "local",
  );
  console.log("🔌 Ready for MCP connections via stdio");

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Main entry point
 */
async function main() {
  const args = Deno.args;
  const mode = args[0] || MODE;

  switch (mode.toLowerCase()) {
    case "mcp":
    case "stdio":
      await startMcpServer();
      break;

    case "http":
    case "server":
      await startHttpServer();
      break;

    case "help":
    case "--help":
    case "-h":
      showUsage();
      break;

    default:
      console.error(`❌ Unknown mode: ${mode}`);
      showUsage();
      Deno.exit(1);
  }
}

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  Deno.exit(0);
});

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    Deno.exit(1);
  }
}

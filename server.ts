#!/usr/bin/env -S deno run --allow-all

/**
 * Simple server entry point that supports stdio, http, or sse modes
 */

import { parseArgs } from "@std/cli";

const args = parseArgs(Deno.args, {
  string: ["transport", "port", "host"],
  boolean: ["help"],
  default: {
    transport: "stdio",
    port: Deno.env.get("PORT") || "3000",
    host: Deno.env.get("HOST") || "127.0.0.1"
  },
  alias: {
    t: "transport",
    p: "port",
    h: "host",
    "?": "help"
  }
});

if (args.help) {
  console.log(`
GPT-Vis MCP Server

Usage: server.ts [options]

Options:
  -t, --transport <mode>    Transport mode: stdio or sse (default: stdio)
  -p, --port <port>         Port number for sse mode (default: 3000)
  -h, --host <host>         Host address for sse mode (default: 127.0.0.1)
  -?, --help                Show this help message

Transport modes:
  stdio                     Direct MCP protocol communication via stdin/stdout
  sse                       Server-Sent Events HTTP server (mcp-proxy provides SSE endpoint)

Note: 
  mcp-proxy only supports SSE server mode when running as a server.
  The --transport option in mcp-proxy is for client connections to remote servers.

Examples:
  server.ts                           # Start stdio server (default)
  server.ts -t sse -p 3000            # Start SSE server on port 3000
  server.ts --transport sse --port 3001 --host localhost  # Start SSE server
  `);
  Deno.exit(0);
}

const transport = args.transport;
const port = parseInt(args.port);
const host = args.host;

// Validate transport mode
if (!["stdio", "sse"].includes(transport)) {
  console.error(`❌ Invalid transport mode: ${transport}`);
  console.error("Valid options: stdio, sse");
  console.error("Use --help for more information");
  Deno.exit(1);
}

// Validate port
if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`❌ Invalid port number: ${args.port}`);
  console.error("Port must be a number between 1 and 65535");
  Deno.exit(1);
}

console.log(`🚀 Starting ${transport} server on ${host}:${port}...`);

if (transport === "stdio") {
  await startStdio();
} else if (transport === "sse") {
  await startProxy(transport, port, host);
}

async function startStdio() {
  await import("./stdio.server.ts");
}

async function startProxy(transport: string, port: number, host: string) {
  const args = [
    "--port", port.toString(),
    "--host", host,
    "--allow-origin", "*",
    "--", "deno", "run", "--allow-all", import.meta.url, "stdio"
  ];

  const process = new Deno.Command("mcp-proxy", { args });
  const child = process.spawn();
  
  Deno.addSignalListener("SIGINT", () => child.kill());
  Deno.addSignalListener("SIGTERM", () => child.kill());
  
  await child.status;
}

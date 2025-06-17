// deno install --allow-scripts=npm:canvas@2.11.2
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./app.ts";

const transport = new StdioServerTransport();
await server.connect(transport);

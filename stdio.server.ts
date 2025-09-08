import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { cleanupClients, server } from "./app.ts";

const transport = new StdioServerTransport();

transport.onclose = async () => {
  await cleanupClients();
  console.log("🔌 Transport closed, cleaning up dependent clients...");
};

await server.connect(transport);

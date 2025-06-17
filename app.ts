import { generateId, jsonSchema } from "ai";
import { composeMcpDepTools, ComposableMCPServer } from "@mcpc/core";
import { CHART_TYPE_MAP, CHART_TYPE_UNSUPPORTED } from "./constant.ts";
import { render } from "@antv/gpt-vis-ssr";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdir } from "node:fs/promises";

const RENDERED_IMAGE_PATH =
  process.env.RENDERED_IMAGE_PATH ?? join("/tmp", tmpdir());

// Ensure directory exists at startup
try {
  await mkdir(RENDERED_IMAGE_PATH, { recursive: true });
} catch (error) {
  console.error(`Failed to create directory ${RENDERED_IMAGE_PATH}:`, error);
  process.exit(1);
}

const tools = await composeMcpDepTools({
  mcpServers: {
    "mcp-server-chart": {
      command: "npx",
      args: ["-y", "@antv/mcp-server-chart"],
    },
  },
});

export const server = new ComposableMCPServer(
  {
    name: "gpt-vis-mcp",
    version: "0.1.0",
  },
  { capabilities: { tools: {} } }
);

const registerToolWithNewExcuter = (tool: any) => {
  const { name, description, inputSchema } = tool;

  server.tool(
    name,
    description,
    jsonSchema(inputSchema),
    async ({ data }: any) => {
      try {
        const type = CHART_TYPE_MAP[name as keyof typeof CHART_TYPE_MAP];
        const options = {
          type,
          data,
        };

        const vis = await render(options as any);
        const id = generateId(8);
        const path = join(RENDERED_IMAGE_PATH, `${id}.png`);

        await vis.exportToFile(path, {});

        return {
          isError: false,
          content: [
            {
              type: "text",
              text: `Generated image saved to ${path}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
};

Object.values(tools)
  .filter((tool) => !CHART_TYPE_UNSUPPORTED.includes(tool))
  .forEach(registerToolWithNewExcuter);

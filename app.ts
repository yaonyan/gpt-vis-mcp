/**
 * GPT-Vis MCP Server
 *
 * A local wrapper for antvis/mcp-server-chart that generates charts locally
 * without external server dependencies.
 */

import { render } from "@antv/gpt-vis-ssr";
import { ComposableMCPServer, composeMcpDepTools } from "@mcpc/core";
import { generateId, jsonSchema } from "ai";
import { access, constants, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { CHART_TYPE_MAP, CHART_TYPE_UNSUPPORTED } from "./constant.ts";

/**
 * Configuration for the chart rendering service
 */
interface ServerConfig {
  /** Directory path where generated images will be saved */
  renderedImagePath: string;
  /** Base URL for accessing images via web server (optional) */
  renderedImageHostPath?: string;
}

/**
 * Chart generation options
 */
interface ChartOptions {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Chart generation result
 */
interface ChartResult {
  isError: boolean;
  content: Array<{
    type: "text";
    text: string;
  }>;
}

/**
 * MCP Tool definition
 */
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// Server configuration with environment variable support
const config: ServerConfig = {
  renderedImagePath: process.env.RENDERED_IMAGE_PATH ??
    join(tmpdir(), "gpt-vis-charts"),
  renderedImageHostPath: process.env.RENDERED_IMAGE_HOST_PATH,
};

/**
 * Initialize the chart generation directory
 */
async function initializeImageDirectory(): Promise<void> {
  try {
    // Check if directory exists
    await access(config.renderedImagePath, constants.F_OK);
  } catch {
    // Directory doesn't exist, create it
    try {
      await mkdir(config.renderedImagePath, { recursive: true });
    } catch (error) {
      console.error(
        `❌ Failed to create directory ${config.renderedImagePath}:`,
        error,
      );
      throw new Error(
        `Failed to initialize image directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

// Initialize directory at startup
try {
  await initializeImageDirectory();
} catch (error) {
  console.error("❌ Startup failed:", error);
  process.exit(1);
}

/**
 * Compose MCP tools from the upstream chart server
 */
const tools = await composeMcpDepTools({
  mcpServers: {
    "mcp-server-chart": {
      command: "npx",
      args: ["-y", "@antv/mcp-server-chart"],
    },
  },
});

/**
 * Create the MCP server instance
 */
export const server = new ComposableMCPServer(
  {
    name: "gpt-vis-mcp",
    version: "0.1.0",
  },
  { capabilities: { tools: {} } },
);

/**
 * Generate a unique filename for the chart image
 */
function generateImageFilename(): string {
  const id = generateId(8);
  const timestamp = Date.now();
  return `chart_${timestamp}_${id}.png`;
}

/**
 * Generate the appropriate response URL/path for the generated image
 */
function generateImageResponse(filename: string): string {
  const fullPath = join(config.renderedImagePath, filename);

  if (config.renderedImageHostPath) {
    return `${config.renderedImageHostPath}/${filename}`;
  }

  return fullPath;
}

/**
 * Generate a chart with the given options
 */
async function generateChart(options: ChartOptions): Promise<ChartResult> {
  try {
    // Render the chart using GPT-Vis SSR
    const vis = await render(options);

    // Generate filename and full path
    const filename = generateImageFilename();
    const fullPath = join(config.renderedImagePath, filename);

    // Export chart to file
    await vis.exportToFile(fullPath, {});

    const imageUrl = generateImageResponse(filename);

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: config.renderedImageHostPath
            ? `Chart generated successfully! Access it at: ${imageUrl}`
            : `Chart generated and saved to: ${imageUrl}`,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Chart generation failed:`, errorMessage);

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Failed to generate chart: ${errorMessage}`,
        },
      ],
    };
  }
}

/**
 * Register a tool with custom chart generation executor
 */
const registerToolWithLocalExecutor = (tool: MCPTool): void => {
  const { name, description, inputSchema } = tool;

  // Check if this chart type is supported
  if (CHART_TYPE_UNSUPPORTED.includes(name)) {
    return;
  }

  server.tool(
    name,
    description,
    jsonSchema(inputSchema),
    async (context: unknown): Promise<ChartResult> => {
      try {
        // Extract data from context
        const { data } = context as { data: Record<string, unknown> };

        // Map the tool name to chart type
        const type = CHART_TYPE_MAP[name as keyof typeof CHART_TYPE_MAP];

        if (!type) {
          throw new Error(`Unknown chart type for tool: ${name}`);
        }

        const options: ChartOptions = {
          type,
          data,
        };

        return await generateChart(options);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.error(`❌ Tool execution failed for ${name}:`, errorMessage);

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
        };
      }
    },
  );
};

// Register all supported tools
const supportedTools = Object.values(tools).filter(
  (tool: MCPTool) => !CHART_TYPE_UNSUPPORTED.includes(tool.name),
);

supportedTools.forEach(registerToolWithLocalExecutor);

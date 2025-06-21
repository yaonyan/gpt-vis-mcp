/**
 * HTTP Server for GPT-Vis MCP
 *
 * Provides HTTP API endpoint compatible with GPT-Vis-SSR service
 * while maintaining the same local chart generation capabilities.
 */

import { render } from "@antv/gpt-vis-ssr";
import { generateId } from "ai";
import { access, constants, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

/**
 * HTTP API Request body
 */
interface ChartRequest {
  type: string;
  data: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties
}

/**
 * HTTP API Response
 */
interface ChartResponse {
  success: boolean;
  resultObj?: string;
  errorMessage?: string;
}

/**
 * Server configuration
 */
interface ServerConfig {
  renderedImagePath: string;
  renderedImageHostPath?: string;
  port: number;
}

// Configuration
const config: ServerConfig = {
  renderedImagePath:
    process.env.RENDERED_IMAGE_PATH ?? join(tmpdir(), "gpt-vis-charts"),
  renderedImageHostPath: process.env.RENDERED_IMAGE_HOST_PATH,
  port: parseInt(process.env.PORT ?? "3000", 10),
};

/**
 * Initialize the chart generation directory
 */
async function initializeImageDirectory(): Promise<void> {
  try {
    await access(config.renderedImagePath, constants.F_OK);
  } catch {
    try {
      await mkdir(config.renderedImagePath, { recursive: true });
    } catch (error) {
      console.error(
        `❌ Failed to create directory ${config.renderedImagePath}:`,
        error
      );
      throw new Error(
        `Failed to initialize image directory: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

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
  if (config.renderedImageHostPath) {
    return `${config.renderedImageHostPath}/${filename}`;
  }

  // For HTTP server mode, return relative URL
  return `/charts/${filename}`;
}

/**
 * Generate a chart with the given request
 */
async function generateChart(request: ChartRequest): Promise<ChartResponse> {
  try {
    const { type, data, ...restOptions } = request;

    // Validate chart type
    if (!type) {
      throw new Error("Chart type is required");
    }

    // Prepare render options
    const options = {
      type,
      data,
      ...restOptions,
    };

    console.log(`🎨 Starting chart generation: type=${type}`);
    // Render the chart using GPT-Vis SSR
    const vis = await render(options);

    // Generate filename and full path
    const filename = generateImageFilename();
    const fullPath = join(config.renderedImagePath, filename);

    // Export chart to file
    await vis.exportToFile(fullPath, {});

    const resultObj = generateImageResponse(filename);

    return {
      success: true,
      resultObj,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Chart generation failed:`, errorMessage);

    return {
      success: false,
      errorMessage,
    };
  }
}

/**
 * Start the HTTP server
 */
export async function startHttpServer(): Promise<void> {
  // Initialize directory
  await initializeImageDirectory();

  const server = Deno.serve({ port: config.port }, async (request: Request) => {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (url.pathname === "/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Chart generation endpoint
    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        const requestBody = (await request.json()) as ChartRequest;
        const result = await generateChart(requestBody);

        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        return new Response(
          JSON.stringify({
            success: false,
            errorMessage: `Invalid request: ${errorMessage}`,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    // Serve generated chart images
    if (url.pathname.startsWith("/charts/") && request.method === "GET") {
      const filename = url.pathname.replace("/charts/", "");
      const filePath = join(config.renderedImagePath, filename);

      try {
        const file = await Deno.open(filePath, { read: true });
        const fileInfo = await file.stat();

        return new Response(file.readable, {
          headers: {
            "Content-Type": "image/png",
            "Content-Length": fileInfo.size.toString(),
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders,
          },
        });
      } catch {
        return new Response("Image not found", {
          status: 404,
          headers: corsHeaders,
        });
      }
    }

    // API documentation endpoint
    if (url.pathname === "/" && request.method === "GET") {
      const docs = `
<!DOCTYPE html>
<html>
<head>
    <title>GPT-Vis MCP HTTP Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { color: #007acc; font-weight: bold; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>GPT-Vis MCP HTTP Server</h1>
    <p>Local chart generation service compatible with GPT-Vis-SSR API</p>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /generate</h3>
        <p>Generate a chart from the provided data</p>
        <pre>{
  "type": "line",
  "data": [
    { "time": "2025-05", "value": 512 },
    { "time": "2025-06", "value": 1024 }
  ]
}</pre>
        <p><strong>Response:</strong></p>
        <pre>{
  "success": true,
  "resultObj": "/charts/chart_1640000000000_abc12345.png"
}</pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">GET</span> /charts/:filename</h3>
        <p>Serve generated chart images</p>
    </div>

    <div class="endpoint">
        <h3><span class="method">GET</span> /health</h3>
        <p>Health check endpoint</p>
    </div>

    <h2>Environment Variables</h2>
    <ul>
        <li><code>PORT</code>: Server port (default: 3000)</li>
        <li><code>RENDERED_IMAGE_PATH</code>: Directory for chart images</li>
        <li><code>RENDERED_IMAGE_HOST_PATH</code>: Base URL for image access</li>
    </ul>
</body>
</html>`;

      return new Response(docs, {
        headers: {
          "Content-Type": "text/html",
          ...corsHeaders,
        },
      });
    }

    // 404 for all other routes
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  });

  console.log(`🌟 GPT-Vis MCP HTTP Server started!`);
  console.log(`📊 Port: ${config.port}`);
  console.log(`📁 Image directory: ${config.renderedImagePath}`);
  console.log(`🌐 Image host: ${config.renderedImageHostPath || "local"}`);
  console.log(`🚀 API docs: http://localhost:${config.port}/`);
  console.log(`💚 Health check: http://localhost:${config.port}/health`);

  // Keep the server running
  await server.finished;
}

// Start server if this file is run directly
if (import.meta.main) {
  try {
    await startHttpServer();
  } catch (error) {
    console.error("❌ Failed to start HTTP server:", error);
    Deno.exit(1);
  }
}

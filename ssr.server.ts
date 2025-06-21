/**
 * HTTP Server for GPT-Vis MCP
 *
 * Provides HTTP API endpoint compatible with GPT-Vis-SSR service
 * while maintaining the same local chart generation capabilities.
 */

import { join } from "node:path";
import {
  type ChartOptions,
  type ServerConfig,
  config,
  generateChartForHttp,
  initializeImageDirectory,
} from "./app.ts";

/**
 * HTTP API Request body
 */
interface ChartRequest extends ChartOptions {
  [key: string]: unknown; // Allow additional properties
}

/**
 * Server configuration for HTTP mode
 */
interface HttpServerConfig extends ServerConfig {
  port: number;
}

// HTTP server specific configuration
const httpConfig: HttpServerConfig = {
  ...config,
  port: parseInt(Deno.env.get("PORT") ?? "3000", 10),
};

/**
 * Start the HTTP server
 */
export async function startHttpServer(): Promise<void> {
  // Initialize directory
  await initializeImageDirectory();

  const server = Deno.serve({ port: httpConfig.port }, async (request: Request) => {
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
        const result = await generateChartForHttp(requestBody);

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
      const filePath = join(httpConfig.renderedImagePath, filename);

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
  console.log(`📊 Port: ${httpConfig.port}`);
  console.log(`📁 Image directory: ${httpConfig.renderedImagePath}`);
  console.log(`🌐 Image host: ${httpConfig.renderedImageHostPath || "local"}`);
  console.log(`🚀 API docs: http://localhost:${httpConfig.port}/`);
  console.log(`💚 Health check: http://localhost:${httpConfig.port}/health`);

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

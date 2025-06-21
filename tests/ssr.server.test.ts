/// <reference lib="deno.ns" />
/**
 * Tests for SSR HTTP Server functionality
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { startHttpServer } from "../ssr.server.ts";

// Test configuration
const TEST_PORT = 3000;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Mock test data
const testChartData = [
  { category: "销售", value: 45 },
  { category: "市场", value: 25 },
  { category: "研发", value: 30 },
];

const testLineData = [
  { time: "2023-01", value: 100 },
  { time: "2023-02", value: 120 },
  { time: "2023-03", value: 150 },
];

// Server instance for testing
let serverController: AbortController;
let serverStarted = false;

/**
 * Start test server
 */
async function startTestServer(): Promise<void> {
  if (serverStarted) return;

  serverController = new AbortController();

  // Set test environment
  Deno.env.set("PORT", TEST_PORT.toString());
  Deno.env.set(
    "RENDERED_IMAGE_PATH",
    await Deno.makeTempDir({ prefix: "gpt-vis-test-" }),
  );

  // Start server in background
  const _serverPromise = startHttpServer();

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test if server is responding
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      serverStarted = true;
      console.log("✅ Test server started successfully");
    }
  } catch (error) {
    throw new Error(`Failed to start test server: ${error}`);
  }
}

/**
 * Stop test server
 */
function stopTestServer(): void {
  if (serverController) {
    serverController.abort();
    serverStarted = false;
    console.log("🛑 Test server stopped");
  }
}

// Test suite
Deno.test({
  name: "SSR Server - Health Check",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.status, "ok");
    assertExists(data.timestamp);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - CORS Headers",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/health`);

    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(
      response.headers.get("Access-Control-Allow-Methods"),
      "GET, POST, OPTIONS",
    );
    assertEquals(
      response.headers.get("Access-Control-Allow-Headers"),
      "Content-Type",
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - OPTIONS Request (CORS Preflight)",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "OPTIONS",
    });

    assertEquals(response.status, 204);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Generate Pie Chart",
  async fn() {
    await startTestServer();

    const requestBody = {
      type: "pie",
      data: testChartData,
      title: "测试饼图",
    };

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, true);
    assertExists(result.resultObj);
    assert(result.resultObj.includes("/charts/"));
    assert(result.resultObj.includes(".png"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Generate Line Chart",
  async fn() {
    await startTestServer();

    const requestBody = {
      type: "line",
      data: testLineData,
      title: "测试折线图",
      axisXTitle: "时间",
      axisYTitle: "数值",
    };

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, true);
    assertExists(result.resultObj);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Invalid Chart Type",
  async fn() {
    await startTestServer();

    const requestBody = {
      type: "invalid_chart_type",
      data: testChartData,
    };

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, false);
    assertExists(result.errorMessage);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Missing Chart Type",
  async fn() {
    await startTestServer();

    const requestBody = {
      data: testChartData,
    };

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, false);
    assertExists(result.errorMessage);
    assert(result.errorMessage.includes("Chart type is required"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Invalid JSON Request",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "invalid json",
    });

    const result = await response.json();

    assertEquals(response.status, 400);
    assertEquals(result.success, false);
    assertExists(result.errorMessage);
    assert(result.errorMessage.includes("Invalid request"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Serve Generated Chart Image",
  async fn() {
    await startTestServer();

    // First, generate a chart
    const requestBody = {
      type: "pie",
      data: testChartData,
      title: "测试图表",
    };

    const generateResponse = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const generateResult = await generateResponse.json();
    assertEquals(generateResult.success, true);

    // Then, try to fetch the generated image
    const imageUrl = generateResult.resultObj;
    const imageResponse = await fetch(`${BASE_URL}${imageUrl}`);

    assertEquals(imageResponse.status, 200);
    assertEquals(imageResponse.headers.get("Content-Type"), "image/png");
    assertExists(imageResponse.headers.get("Content-Length"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Serve Non-existent Image",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/charts/nonexistent.png`);

    assertEquals(response.status, 404);
    assertEquals(await response.text(), "Image not found");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - API Documentation Page",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/`);
    const content = await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "text/html");
    assert(content.includes("GPT-Vis MCP HTTP Server"));
    assert(content.includes("/generate"));
    assert(content.includes("/health"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - 404 for Unknown Routes",
  async fn() {
    await startTestServer();

    const response = await fetch(`${BASE_URL}/unknown-route`);

    assertEquals(response.status, 404);
    assertEquals(await response.text(), "Not Found");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "SSR Server - Complex Chart with All Options",
  async fn() {
    await startTestServer();

    const requestBody = {
      type: "column",
      data: [
        { category: "北京", value: 825, group: "销售" },
        { category: "上海", value: 720, group: "销售" },
        { category: "广州", value: 650, group: "销售" },
        { category: "北京", value: 400, group: "市场" },
        { category: "上海", value: 350, group: "市场" },
        { category: "广州", value: 300, group: "市场" },
      ],
      title: "城市销售数据",
      axisXTitle: "城市",
      axisYTitle: "数值（万）",
      width: 800,
      height: 500,
      group: true,
      stack: false,
      theme: "default",
    };

    const response = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, true);
    assertExists(result.resultObj);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Cleanup after all tests
Deno.test({
  name: "Cleanup - Stop Test Server",
  fn() {
    stopTestServer();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

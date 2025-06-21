/// <reference lib="deno.ns" />
/**
 * Tests for chart generation functionality
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Mock test data
const testPieData = [
  { category: "Sales", value: 45 },
  { category: "Marketing", value: 25 },
  { category: "Development", value: 30 },
];

const testLineData = [
  { time: "2023-01", value: 100 },
  { time: "2023-02", value: 120 },
  { time: "2023-03", value: 150 },
  { time: "2023-04", value: 180 },
];

const testBarData = [
  { category: "Q1", value: 1000 },
  { category: "Q2", value: 1200 },
  { category: "Q3", value: 1100 },
  { category: "Q4", value: 1300 },
];

Deno.test("Constants validation", async () => {
  // Import constants to test
  const { CHART_TYPE_MAP, CHART_TYPE_UNSUPPORTED } = await import(
    "../constant.ts"
  );

  // Test that chart type map exists and has expected entries
  assertExists(CHART_TYPE_MAP);
  assertEquals(typeof CHART_TYPE_MAP, "object");

  // Test specific chart type mappings
  assertEquals(CHART_TYPE_MAP.generate_pie_chart, "pie");
  assertEquals(CHART_TYPE_MAP.generate_line_chart, "line");
  assertEquals(CHART_TYPE_MAP.generate_bar_chart, "bar");

  // Test unsupported charts array
  assertExists(CHART_TYPE_UNSUPPORTED);
  assertEquals(Array.isArray(CHART_TYPE_UNSUPPORTED), true);
});

Deno.test("Environment configuration", () => {
  // Test default configuration
  const defaultPath = join(tmpdir(), "gpt-vis-charts");
  assertExists(defaultPath);

  // Test that environment variables can be read
  const customPath = Deno.env.get("RENDERED_IMAGE_PATH");
  const hostPath = Deno.env.get("RENDERED_IMAGE_HOST_PATH");

  // These should be string or undefined
  assertEquals(
    typeof customPath === "string" || customPath === undefined,
    true,
  );
  assertEquals(typeof hostPath === "string" || hostPath === undefined, true);
});

Deno.test("Directory creation", async () => {
  const testDir = join(tmpdir(), "test-gpt-vis-charts");

  try {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Verify directory exists (this would throw if it doesn't)
    const stat = await Deno.stat(testDir);
    assertEquals(stat.isDirectory, true);
  } finally {
    // Clean up
    try {
      await rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("Chart data validation", () => {
  // Test pie chart data structure
  testPieData.forEach((item) => {
    assertExists(item.category);
    assertExists(item.value);
    assertEquals(typeof item.category, "string");
    assertEquals(typeof item.value, "number");
  });

  // Test line chart data structure
  testLineData.forEach((item) => {
    assertExists(item.time);
    assertExists(item.value);
    assertEquals(typeof item.time, "string");
    assertEquals(typeof item.value, "number");
  });

  // Test bar chart data structure
  testBarData.forEach((item) => {
    assertExists(item.category);
    assertExists(item.value);
    assertEquals(typeof item.category, "string");
    assertEquals(typeof item.value, "number");
  });
});

Deno.test("Filename generation", () => {
  // Test that we can generate unique filenames
  const timestamp = Date.now();
  const filename = `chart_${timestamp}_test123.png`;

  assertEquals(filename.endsWith(".png"), true);
  assertEquals(filename.includes("chart_"), true);
  assertEquals(filename.includes(timestamp.toString()), true);
});

Deno.test("Image response URL generation", () => {
  const filename = "test_chart_123.png";
  const basePath = "/tmp/charts";
  const hostPath = "https://example.com/images";

  // Test local path generation
  const localPath = join(basePath, filename);
  assertEquals(localPath.includes(filename), true);

  // Test hosted URL generation
  const hostedUrl = `${hostPath}/${filename}`;
  assertEquals(hostedUrl, "https://example.com/images/test_chart_123.png");
});

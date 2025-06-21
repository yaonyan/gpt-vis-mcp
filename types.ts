/**
 * Type definitions for GPT-Vis MCP Server
 *
 * This file contains all the TypeScript type definitions used throughout
 * the project to ensure type safety and better developer experience.
 */

/**
 * Configuration for the chart rendering service
 */
export interface ServerConfig {
  /** Directory path where generated images will be saved */
  renderedImagePath: string;
  /** Base URL for accessing images via web server (optional) */
  renderedImageHostPath?: string;
}

/**
 * Chart generation options passed to the renderer
 */
export interface ChartOptions {
  /** The type of chart to generate (e.g., "pie", "bar", "line") */
  type: string;
  /** The data to visualize in the chart */
  data: Record<string, unknown>;
  /** Optional configuration for chart appearance */
  config?: ChartConfig;
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Chart title */
  title?: string;
  /** Theme configuration */
  theme?: "default" | "academy";
  /** Custom color palette */
  colors?: string[];
}

/**
 * Result of chart generation operation
 */
export interface ChartResult {
  /** Whether an error occurred during generation */
  isError: boolean;
  /** Array of content items (usually text messages) */
  content: ChartContent[];
}

/**
 * Content item in chart result
 */
export interface ChartContent {
  /** Type of content (currently only "text" is supported) */
  type: "text";
  /** The actual content text */
  text: string;
}

/**
 * MCP Tool definition structure
 */
export interface MCPTool {
  /** Unique name identifier for the tool */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON schema defining the expected input parameters */
  inputSchema: Record<string, unknown>;
}

/**
 * Context passed to tool execution handlers
 */
export interface ToolContext {
  /** The data provided for chart generation */
  data: Record<string, unknown>;
}

/**
 * Error types that can occur during chart generation
 */
export type ChartError =
  | "INVALID_CHART_TYPE"
  | "INVALID_DATA_FORMAT"
  | "RENDERING_FAILED"
  | "FILE_SYSTEM_ERROR"
  | "DEPENDENCY_ERROR";

/**
 * Chart data structures for different chart types
 */

/** Data structure for pie charts */
export interface PieChartData {
  category: string;
  value: number;
}

/** Data structure for line/area charts */
export interface LineChartData {
  time: string;
  value: number;
  group?: string;
}

/** Data structure for bar/column charts */
export interface BarChartData {
  category: string;
  value: number;
  group?: string;
}

/** Data structure for scatter charts */
export interface ScatterChartData {
  x: number;
  y: number;
  group?: string;
}

/** Data structure for radar charts */
export interface RadarChartData {
  name: string;
  value: number;
  group?: string;
}

/** Data structure for sankey charts */
export interface SankeyChartData {
  source: string;
  target: string;
  value: number;
}

/** Data structure for funnel charts */
export interface FunnelChartData {
  category: string;
  value: number;
}

/** Data structure for treemap charts */
export interface TreemapChartData {
  name: string;
  value: number;
  children?: TreemapChartData[];
}

/** Data structure for network graphs */
export interface NetworkGraphData {
  nodes: Array<{ name: string }>;
  edges: Array<{
    source: string;
    target: string;
    name?: string;
  }>;
}

/** Data structure for mind maps */
export interface MindMapData {
  name: string;
  children?: MindMapData[];
}

/** Data structure for organization charts */
export interface OrgChartData {
  name: string;
  description?: string;
  children?: OrgChartData[];
}

/** Data structure for word clouds */
export interface WordCloudData {
  text: string;
  value: number;
}

/** Data structure for boxplot/violin charts */
export interface BoxplotData {
  category: string;
  value: number;
  group?: string;
}

/** Data structure for histogram charts */
export interface HistogramData extends Array<number> {}

/** Data structure for venn diagrams */
export interface VennChartData {
  label?: string;
  value: number;
  sets: string[];
}

/** Data structure for dual axes charts */
export interface DualAxesChartData {
  categories: string[];
  series: Array<{
    type: "column" | "line";
    data: number[];
    axisYTitle?: string;
  }>;
}

/** Data structure for liquid charts */
export interface LiquidChartData {
  percent: number; // 0 to 1
}

/**
 * Union type for all possible chart data structures
 */
export type ChartData =
  | PieChartData[]
  | LineChartData[]
  | BarChartData[]
  | ScatterChartData[]
  | RadarChartData[]
  | SankeyChartData[]
  | FunnelChartData[]
  | TreemapChartData[]
  | NetworkGraphData
  | MindMapData
  | OrgChartData
  | WordCloudData[]
  | BoxplotData[]
  | HistogramData
  | VennChartData[]
  | DualAxesChartData
  | LiquidChartData
  | Record<string, unknown>;

/**
 * Environment variables configuration
 */
export interface EnvironmentConfig {
  /** Path where generated images are stored */
  RENDERED_IMAGE_PATH?: string;
  /** Base URL for accessing hosted images */
  RENDERED_IMAGE_HOST_PATH?: string;
  /** Deno directory for caching */
  DENO_DIR?: string;
  /** Log level for debugging */
  LOG_LEVEL?: "debug" | "info" | "warn" | "error";
}

/**
 * Server status and health information
 */
export interface ServerStatus {
  /** Whether the server is running */
  running: boolean;
  /** Number of charts generated since startup */
  chartsGenerated: number;
  /** Server start time */
  startTime: Date;
  /** Available disk space for image storage */
  availableSpace?: string;
  /** Number of supported chart types */
  supportedChartTypes: number;
}

/**
 * Chart generation statistics
 */
export interface ChartStats {
  /** Total number of charts generated */
  totalGenerated: number;
  /** Number of successful generations */
  successful: number;
  /** Number of failed generations */
  failed: number;
  /** Most frequently used chart types */
  popularChartTypes: Record<string, number>;
  /** Average generation time in milliseconds */
  averageGenerationTime: number;
}

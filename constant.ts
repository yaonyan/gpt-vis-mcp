/**
 * Chart Type Mappings and Constants
 *
 * This file contains the mappings between MCP tool names and their corresponding
 * chart types in the GPT-Vis library. These mappings are essential for the
 * local chart generation functionality.
 *
 * @credit https://github.com/antvis/mcp-server-chart/blob/main/src/utils/callTool.ts
 * @author Yao
 */

/**
 * Mapping of MCP tool names to GPT-Vis chart types
 *
 * Each key represents a tool name that can be called via the MCP protocol,
 * and each value represents the corresponding chart type in GPT-Vis.
 *
 * @example
 * ```typescript
 * const chartType = CHART_TYPE_MAP.generate_pie_chart; // Returns "pie"
 * ```
 */
export const CHART_TYPE_MAP = {
  // Statistical Charts
  generate_area_chart: "area",
  generate_bar_chart: "bar",
  generate_column_chart: "column",
  generate_line_chart: "line",
  generate_pie_chart: "pie",
  generate_scatter_chart: "scatter",
  generate_histogram_chart: "histogram",

  // Distribution Charts
  generate_boxplot_chart: "boxplot",
  generate_violin_chart: "violin",

  // Relationship Charts
  generate_radar_chart: "radar",
  generate_sankey_chart: "sankey",
  generate_funnel_chart: "funnel",
  generate_venn_chart: "venn",

  // Hierarchical Charts
  generate_treemap_chart: "treemap",
  generate_mind_map: "mind-map",
  generate_organization_chart: "organization-chart",

  // Flow and Process Charts
  generate_flow_diagram: "flow-diagram",
  generate_fishbone_diagram: "fishbone-diagram",
  generate_network_graph: "network-graph",

  // Specialized Charts
  generate_dual_axes_chart: "dual-axes",
  generate_liquid_chart: "liquid",
  generate_word_cloud_chart: "word-cloud",

  // Geographic Charts
  generate_district_map: "district-map",
  generate_path_map: "path-map",
  generate_pin_map: "pin-map",
} as const;

/**
 * Type definition for all supported chart types
 */
export type ChartType = typeof CHART_TYPE_MAP[keyof typeof CHART_TYPE_MAP];

/**
 * Type definition for all supported tool names
 */
export type ToolName = keyof typeof CHART_TYPE_MAP;

/**
 * Array of unsupported chart types
 *
 * These chart types exist in the upstream MCP server but are not currently
 * supported by this local wrapper. This might be due to:
 * - Missing dependencies
 * - Licensing restrictions
 * - Implementation complexity
 * - Deprecation in the source library
 *
 * @deprecated These chart types may be added in future versions
 */
export const CHART_TYPE_UNSUPPORTED: string[] = [
  "geographic_district_map",
  "geographic_path_map",
  "geographic_pin_map",
];

/**
 * Chart categories for documentation and organization
 */
export const CHART_CATEGORIES = {
  STATISTICAL: [
    "generate_area_chart",
    "generate_bar_chart",
    "generate_column_chart",
    "generate_line_chart",
    "generate_pie_chart",
    "generate_scatter_chart",
    "generate_histogram_chart",
  ],

  DISTRIBUTION: [
    "generate_boxplot_chart",
    "generate_violin_chart",
  ],

  RELATIONSHIP: [
    "generate_radar_chart",
    "generate_sankey_chart",
    "generate_funnel_chart",
    "generate_venn_chart",
  ],

  HIERARCHICAL: [
    "generate_treemap_chart",
    "generate_mind_map",
    "generate_organization_chart",
  ],

  FLOW_PROCESS: [
    "generate_flow_diagram",
    "generate_fishbone_diagram",
    "generate_network_graph",
  ],

  SPECIALIZED: [
    "generate_dual_axes_chart",
    "generate_liquid_chart",
    "generate_word_cloud_chart",
  ],

  GEOGRAPHIC: [
    "generate_district_map",
    "generate_path_map",
    "generate_pin_map",
  ],
} as const;

/**
 * Get chart category for a given tool name
 *
 * @param toolName - The MCP tool name
 * @returns The category name or undefined if not found
 *
 * @example
 * ```typescript
 * const category = getChartCategory("generate_pie_chart"); // Returns "STATISTICAL"
 * ```
 */
export function getChartCategory(
  toolName: ToolName,
): keyof typeof CHART_CATEGORIES | undefined {
  for (const [category, tools] of Object.entries(CHART_CATEGORIES)) {
    if ((tools as readonly string[]).includes(toolName)) {
      return category as keyof typeof CHART_CATEGORIES;
    }
  }
  return undefined;
}

/**
 * Check if a chart type is supported
 *
 * @param toolName - The MCP tool name to check
 * @returns True if the chart type is supported, false otherwise
 *
 * @example
 * ```typescript
 * const isSupported = isChartSupported("generate_pie_chart"); // Returns true
 * const isNotSupported = isChartSupported("geographic_district_map"); // Returns false
 * ```
 */
export function isChartSupported(toolName: string): toolName is ToolName {
  return toolName in CHART_TYPE_MAP &&
    !CHART_TYPE_UNSUPPORTED.includes(toolName);
}

/**
 * Get all supported chart types
 *
 * @returns Array of all supported chart type values
 */
export function getSupportedChartTypes(): ChartType[] {
  return Object.values(CHART_TYPE_MAP);
}

/**
 * Get all supported tool names
 *
 * @returns Array of all supported MCP tool names
 */
export function getSupportedToolNames(): ToolName[] {
  return Object.keys(CHART_TYPE_MAP) as ToolName[];
}

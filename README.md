# Private/standalone MCP Server Chart Wrapper

This project provides a **private standalone wrapper** for [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart), featuring:

- No external server dependency
- Local execution via Model Context Protocol (MCP)
- Direct integration with [GPT-Vis](https://github.com/antvis/GPT-Vis) visualization framework

## Installation

```json
{
  "mcpServers": {
    "gpt-vis-mcp": {
      "command": "npx",
      "args": ["@jsr2npm/yao__gpt-vis-mcp@0.0.1"]
    }
  }
}
```

## Configuration

The server supports the following environment variables for configuring image rendering:

### `RENDERED_IMAGE_PATH`

- **Description**: Directory path where generated chart images will be saved
- **Default**: `/tmp` + system temporary directory (e.g., `/tmp/var/folders/...`)
- **Example**: 
  ```bash
  export RENDERED_IMAGE_PATH="/home/user/charts"
  ```

### `RENDERED_IMAGE_HOST_PATH`

- **Description**: Base URL or path prefix for accessing generated images from a web server or host
- **Default**: `undefined` (when not set, returns the local file path)
- **Example**: 
  ```bash
  export RENDERED_IMAGE_HOST_PATH="https://example.com/images"
  ```

When `RENDERED_IMAGE_HOST_PATH` is set, the server will return URLs like `https://example.com/images/{id}.png` instead of local file paths. This is useful when:
- Serving images through a web server
- Accessing images from a different host or domain

## Credits

- [GPT-Vis](https://github.com/antvis/GPT-Vis) visualization framework
- [MCP server chart](https://github.com/antvis/mcp-server-chart) protocol integration

> This repo is using [jsr2npm](https://github.com/yaonyan/jsr2npm) to port jsr package to npm.

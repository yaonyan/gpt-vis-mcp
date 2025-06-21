# GPT-Vis MCP Server

A **local/private-favored wrapper** for
[antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart) that
generates charts locally without external server dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@jsr2npm/yao__gpt-vis-mcp.svg)](https://www.npmjs.com/package/@jsr2npm/yao__gpt-vis-mcp)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-Compatible-blue.svg)](https://modelcontextprotocol.io/)

## ✨ Features

- 🔒 **Private & Secure**: Local chart generation, no external dependencies
- 🚀 **Easy Setup**: One command installation for Claude Desktop
- 🎨 **Rich Charts**: 25+ chart types (pie, line, bar, radar, maps, etc.)
- 📊 **Enterprise Ready**: Perfect for secure environments

## 🚀 Usage

### Claude Desktop (Recommended)

Add to your Claude Desktop MCP settings:

**Option 1: NPX (Recommended)**

```json
{
  "mcpServers": {
    "gpt-vis-mcp": {
      "command": "npx",
      "args": ["@jsr2npm/yao__gpt-vis-mcp@latest"]
    }
  }
}
```

You may experience `canvas` dependencies issue when using npx, if so, try option
2

**Option 2: Docker**

```json
{
  "mcpServers": {
    "gpt-vis-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "ghcr.io/yaonyan/gpt-vis-mcp:latest-mcp"]
    }
  }
}
```

Set environment variables as needed:

| Variable                   | Description                   | Default     |
| -------------------------- | ----------------------------- | ----------- |
| `RENDERED_IMAGE_PATH`      | Chart images directory        | system temp |
| `RENDERED_IMAGE_HOST_PATH` | Base URL for accessing images | (optional)  |

### Docker SSR Server

```bash
# Run SSR API server
docker run -p 3000:3000 ghcr.io/yaonyan/gpt-vis-mcp:latest-http

# Test the SSR API
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "pie", "data": [{"category": "A", "value": 30}, {"category": "B", "value": 70}]}'
```

### Binary

```bash
# Download binary from releases
curl -L https://github.com/yaonyan/gpt-vis-mcp/releases/latest/download/gpt-vis-mcp -o gpt-vis-mcp
chmod +x gpt-vis-mcp
./gpt-vis-mcp
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup.

## 📄 License

MIT License - see [LICENSE](LICENSE)

# Contributing to GPT-Vis MCP Server

## 🚀 Development Setup

### Prerequisites

- **Deno**: v2.3.\*
  ([Install](https://deno.land/manual/getting_started/installation))
- **Node.js**: v18+ (for canvas dependencies)

### Quick Start

```bash
git clone https://github.com/yaonyan/gpt-vis-mcp.git
cd gpt-vis-mcp
deno task compile

# Start development
deno run -A --watch ssr.server.ts     # SSR mode
deno run -A --watch stdio.server.ts   # MCP mode
```

## 🛠️ Development Commands

```bash
# Testing
deno test --allow-all
deno test --allow-all --coverage

# Code Quality
deno fmt && deno lint

# Build binary
deno compile --allow-scripts=npm:canvas@3.1.0 --allow-net --allow-read --allow-write --allow-env --output bin/gpt-vis-mcp-ssr ssr.server.ts
deno compile --allow-scripts=npm:canvas@3.1.0 --allow-net --allow-read --allow-write --allow-env --output bin/gpt-vis-mcp-stdio stdio.server.ts
```

## 🐳 Docker Development

```bash
# Build images
docker build -f Dockerfile.mcp -t gpt-vis-mcp:mcp .
docker build -f Dockerfile.ssr -t gpt-vis-mcp:ssr .

# Test
docker run -p 3000:3000 gpt-vis-mcp:ssr
curl http://localhost:3000/health

# Or use docker-compose
docker-compose --profile ssr up     # SSR mode
docker-compose --profile mcp up     # MCP mode
```

### Offline Environment Support

The Docker images are designed to work in offline/air-gapped environments. During the build phase, all dependencies are cached:

```bash
# The build process caches all dependencies
docker build -f Dockerfile.mcp -t gpt-vis-mcp:mcp .
```

The `DENO_CACHED_ONLY` environment variable is set to `true` by default in the Docker image, ensuring that:
- No network requests are made at runtime
- All dependencies must be cached during build
- SSE mode spawned processes also run in cached-only mode

To test offline behavior locally:
```bash
# Build the image with network access
docker build -f Dockerfile.mcp -t gpt-vis-mcp:mcp .

# Run without network access to verify offline capability
docker run --network none -p 3000:3000 gpt-vis-mcp:mcp --transport sse --port 3000 --host 0.0.0.0
```

## 📁 Project Structure

```
gpt-vis-mcp/
├── app.ts              # MCP server logic
├── stdio.server.ts     # MCP stdio server
├── ssr.server.ts       # SSR HTTP server
├── constant.ts         # Chart mappings
├── tests/              # Test files
├── Dockerfile.mcp      # MCP container
├── Dockerfile.ssr      # SSR container
└── docker-compose.yml  # Compose config
```

## 🤝 Contributing Process

1. **Fork & Branch**

   ```bash
   git clone https://github.com/YOUR_USERNAME/gpt-vis-mcp.git
   git checkout -b feature/my-feature
   ```

2. **Make Changes**

   - Follow existing code style
   - Add tests for new features
   - Ensure all tests pass

3. **Submit PR**
   ```bash
   deno fmt && deno lint
   deno test --allow-all
   git push origin feature/my-feature
   ```

## 🧪 Testing

```bash
# Run all tests
deno test --allow-all

# Test specific file
deno test --allow-all tests/chart.test.ts

# Write tests
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("chart generation", async () => {
  const result = await generateChart("pie", mockData);
  assertEquals(result.success, true);
});
```

## 🐛 Common Issues

1. **Canvas Dependencies**

   ```bash
   deno install --allow-scripts=npm:canvas@3.2.0
   ```

2. **Permissions**

   ```bash
   deno run --allow-all ssr.server.ts
   ```

3. **Docker Cache**
   ```bash
   docker system prune -f
   ```

## 📋 Guidelines

### Code Style

- Use TypeScript with strict mode
- Follow Deno formatting (`deno fmt`)
- Add JSDoc for public APIs

### Commit Messages

```
feat: add radar chart support
fix: resolve canvas dependency
docs: update API documentation
```

### PR Checklist

- [ ] Tests pass
- [ ] Code formatted
- [ ] No lint errors
- [ ] Documentation updated

---

Thank you for contributing! 🎉

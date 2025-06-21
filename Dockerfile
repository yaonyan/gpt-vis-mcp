# Use official Deno image with Debian base for better canvas support
FROM denoland/deno:2.3.6

# Set image metadata
LABEL name="gpt-vis-mcp"
LABEL version="${TAG:-latest}"
LABEL maintainer="gpt-vis-mcp-team"
LABEL description="GPT-Vis MCP Server with local chart generation"

# Build argument for tag
ARG TAG=latest

# Install system dependencies for canvas and Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
    python3-pip \
    curl \
    unzip \
    locales \
    fonts-noto-cjk \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Configure locales for Chinese support
RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    echo "zh_CN.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen && \
    fc-cache -fv

# Install Node.js (latest LTS) and node-gyp - required for canvas
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g node-gyp

# Set working directory
WORKDIR /app

# Copy dependency files first to leverage Docker caching
COPY deno.json deno.lock* ./

# Set environment variables
ENV RENDERED_IMAGE_PATH=/tmp/gpt-vis-charts \
    DENO_DIR=/deno-dir \
    DENO_INSTALL_ROOT=/deno-dir/install-root \
    LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8

# Create necessary directories
RUN mkdir -p $DENO_DIR $RENDERED_IMAGE_PATH

# Copy source code
COPY . .

# Install and cache dependencies
RUN deno install --allow-scripts=npm:canvas@3.1.0 && \
    cp -rf node_modules/.deno/canvas@3.1.0/node_modules node_modules/.deno/canvas@2.11.2/ 2>/dev/null || true && \
    deno cache --allow-scripts=npm:canvas@3.1.0 server.ts

# Create start script that supports both modes
RUN echo '#!/bin/bash\n\
    set -e\n\
    \n\
    # Default mode is MCP if not specified\n\
    MODE=${MODE:-mcp}\n\
    \n\
    echo "🐳 GPT-Vis MCP Server starting..."\n\
    echo "📂 Working directory: $(pwd)"\n\
    echo "📁 Image directory: $RENDERED_IMAGE_PATH"\n\
    echo "🎯 Mode: $MODE"\n\
    \n\
    case "$MODE" in\n\
    "http"|"server")\n\
    echo "🌐 Starting HTTP server mode..."\n\
    echo "🚀 Port: ${PORT:-3000}"\n\
    deno run --allow-all server.ts http\n\
    ;;\n\
    "mcp"|"stdio"|*)\n\
    echo "🔌 Starting MCP stdio mode..."\n\
    deno run --allow-all server.ts mcp\n\
    ;;\n\
    esac' > /start.sh

# Make the start script executable
RUN chmod +x /start.sh

# Labels for image identification
LABEL org.opencontainers.image.source="https://github.com/yaonyan/gpt-vis-mcp"
LABEL org.opencontainers.image.title="gpt-vis-mcp"
LABEL org.opencontainers.image.description="Local wrapper for antvis/mcp-server-chart"

# Expose port (if needed for web interface)
EXPOSE 3000

# Set the entrypoint
CMD ["/start.sh"]

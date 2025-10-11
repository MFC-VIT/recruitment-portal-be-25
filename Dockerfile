# syntax=docker/dockerfile:1.7

# -------- Base builder stage: install dependencies (with build tools for native modules like bcrypt)
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install build tools only in builder to compile native deps if needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# Only copy dependency manifests first to maximize layer caching
COPY package*.json ./

# Install production dependencies
# Use npm ci for reproducible builds; omit dev deps for smaller runtime
RUN npm ci --omit=dev

# -------- Runtime stage: copy app and run as non-root
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

# Install a tiny tool for healthchecks
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed node_modules from builder
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Use an unprivileged user provided by the base image
USER node

# Expose the port the app listens on
EXPOSE 5000

# Optional healthcheck hits /ping endpoint defined in index.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/ping || exit 1

# Use node directly (avoid nodemon in production)
CMD ["node", "index.js"]

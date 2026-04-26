# ────────────────────────────────────────────────
# Predelix Backend — Cloud Run Dockerfile
# Multi-stage build for optimized container image
# ────────────────────────────────────────────────

# Stage 1: Dependencies
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Security: run as non-root user (required for Cloud Run best practices)
RUN chown -R node:node /app
USER node

# Copy node_modules from builder
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

# Cloud Run expects PORT env variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "src/index.js"]

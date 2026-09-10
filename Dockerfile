# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Base image: Node.js 24 Alpine with npm 12
# ------------------------------------------------------------------------------
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat && npm install -g npm@12

# ------------------------------------------------------------------------------
# Dependencies layer (cached)
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# ------------------------------------------------------------------------------
# Development target
# Configurable port via PORT environment variable or build-arg
# ------------------------------------------------------------------------------
FROM base AS dev
ARG PORT=3000
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${PORT}

CMD ["sh", "-c", "npm run dev -- -H 0.0.0.0 -p ${PORT}"]

# ------------------------------------------------------------------------------
# Production builder target
# Optimized for low-resource VPS (1-2GB RAM) & network-isolated environments
# ------------------------------------------------------------------------------
FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_CPU_COUNT=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run production build (Next.js static export -> /app/out)
RUN npm run build || (echo "=== BUILD ERROR LOGS ===" && cat /root/.npm/_logs/* 2>/dev/null && exit 1)

# Default container action: export /app/out to /export volume mount
VOLUME /export
CMD ["sh", "-c", "mkdir -p /export && cp -a /app/out/. /export/ && echo 'Static build files exported successfully.'"]

# ------------------------------------------------------------------------------
# Direct BuildKit artifact exporter target
# Usage: docker build --target exporter --output type=local,dest=out .
# ------------------------------------------------------------------------------
FROM scratch AS exporter
COPY --from=builder /app/out /

# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Base image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

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
ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${PORT}

CMD ["sh", "-c", "npm run dev -- -H 0.0.0.0 -p ${PORT}"]

# ------------------------------------------------------------------------------
# Production builder target
# ------------------------------------------------------------------------------
FROM base AS builder
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run production build (Next.js static export -> /app/out)
RUN npm run build

# Default container action: export /app/out to /export volume mount
VOLUME /export
CMD ["sh", "-c", "mkdir -p /export && cp -a /app/out/. /export/ && echo 'Static build files exported successfully.'"]

# ------------------------------------------------------------------------------
# Direct BuildKit artifact exporter target
# Usage: docker build --target exporter --output type=local,dest=out .
# ------------------------------------------------------------------------------
FROM scratch AS exporter
COPY --from=builder /app/out /

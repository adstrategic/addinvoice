# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1

WORKDIR /app

# Copy root workspace files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json of each workspace member used by the agent
COPY packages/db/package.json ./packages/db/
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/agent/package.json ./apps/agent/

# Install all workspace deps from the root lockfile
RUN pnpm install --frozen-lockfile

# Copy source for workspace packages and the agent
COPY packages/db/ ./packages/db/
COPY packages/schemas/ ./packages/schemas/
COPY apps/agent/ ./apps/agent/

# Build dependencies in order, then the agent
RUN pnpm --filter @addinvoice/db build
RUN pnpm --filter @addinvoice/schemas build
RUN pnpm --filter @addinvoice/agent build

# Create non-root user
ARG UID=10001
RUN adduser --disabled-password --gecos "" --home "/app" --shell "/sbin/nologin" --uid "${UID}" appuser

# Deploy production bundle (includes built dist/ and resolved workspace deps)
RUN pnpm --filter @addinvoice/agent --prod deploy --legacy /app-prod && chown -R appuser:appuser /app-prod

USER appuser
WORKDIR /app-prod

# Set HOME to /app-prod so HuggingFace cache writes to a directory appuser owns
ENV HOME=/app-prod

# Download model files — cache lands in /app-prod/.cache/huggingface/
RUN node dist/main.js download-files

ENV NODE_ENV=production

CMD ["pnpm", "start"]
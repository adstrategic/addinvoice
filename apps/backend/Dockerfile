# syntax=docker/dockerfile:1
# Backend, worker, and cron all use this image; override start command per Railway service.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1

WORKDIR /app

# Copy root workspace files (.npmrc enables pnpm v10 deploy without --legacy)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy only workspace members needed by the backend
COPY packages/db/package.json ./packages/db/
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

COPY packages/db/ ./packages/db/
COPY packages/schemas/ ./packages/schemas/
COPY apps/backend/ ./apps/backend/

RUN pnpm --filter @addinvoice/db build
RUN pnpm --filter @addinvoice/schemas build
RUN pnpm --filter @addinvoice/backend build

# Deploy production bundle (inject-workspace-packages from .npmrc; no --legacy)
RUN pnpm --filter @addinvoice/backend --prod deploy /app-prod

WORKDIR /app-prod
ENV NODE_ENV=production

# Default: run the API server. Override on Railway for worker or cron.
# Worker: Custom start command = node dist/worker.js
# Cron:   Custom start command = node dist/run-cron.js, and set Cron Schedule (e.g. 0 0 * * *)
CMD ["node", "dist/server.js"]

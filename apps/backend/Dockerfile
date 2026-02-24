# Turborepo-style Dockerfile: one per service, turbo prune, Railway builds from repo.
# Build from repo root: docker build -f apps/backend/Dockerfile .
# Refs: https://turborepo.dev/docs/guides/tools/docker

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

# ---
FROM base AS prepare
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @addinvoice/backend --docker

# ---
FROM base AS builder
WORKDIR /app

# Install dependencies (layer only invalidated when this app's deps change)
COPY --from=prepare /app/out/json/ .
# COPY --from=prepare /app/out/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build

# Production bundle for backend (and worker/cron use same image, different CMD)
RUN pnpm --filter @addinvoice/backend --prod deploy /app-prod

# ---
FROM node:${NODE_VERSION}-slim AS runner

RUN addgroup --system --gid 1001 backend 
RUN adduser --system --uid 1001 backend
USER backend

COPY --from=builder --chown=backend:backend /app-prod ./

ENV NODE_ENV=production

# Default: API server. Override on Railway: worker = node dist/worker.js, cron = node dist/run-cron.js
CMD ["node", "dist/server.js"]

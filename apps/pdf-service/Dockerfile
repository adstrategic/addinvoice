# Turborepo-style Dockerfile: one per service, turbo prune, Railway builds from repo.
# Build from repo root: docker build -f apps/pdf-service/Dockerfile .
# Refs: https://turborepo.dev/docs/guides/tools/docker

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

# ---
FROM base AS base-pdf
RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    ca-certificates \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ---
FROM base AS prepare
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @addinvoice/pdf-service --docker

# ---
FROM base AS builder
WORKDIR /app

COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ .

RUN pnpm turbo build

RUN pnpm --filter @addinvoice/pdf-service --prod deploy /app-prod

# ---
FROM base-pdf AS runner

RUN addgroup --system --gid 1001 pdfsvc 
RUN adduser --system --uid 1001 pdfsvc
USER pdfsvc

COPY --from=builder --chown=pdfsvc:pdfsvc /app-prod ./
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]

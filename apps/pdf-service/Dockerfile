# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Chromium and dependencies for Puppeteer (headless PDF generation)
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
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Use system Chromium; app reads PUPPETEER_EXECUTABLE_PATH at runtime
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm install -g pnpm@10.30.1

WORKDIR /app

# Copy root workspace files (.npmrc for consistent pnpm v10 deploy)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/pdf-service/package.json ./apps/pdf-service/

RUN pnpm install --frozen-lockfile

COPY apps/pdf-service/ ./apps/pdf-service/

RUN pnpm --filter @addinvoice/pdf-service build
RUN pnpm --filter @addinvoice/pdf-service --prod deploy /app-prod

# Run as non-root (best practice)
ARG UID=10001
RUN adduser --disabled-password --gecos "" --uid "${UID}" appuser \
  && chown -R appuser:appuser /app-prod

WORKDIR /app-prod
ENV NODE_ENV=production
USER appuser

CMD ["node", "dist/server.js"]

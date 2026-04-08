# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

pnpm + Turbo monorepo with four apps and two shared packages:

- **apps/backend** — Express.js REST API (port 4000), auth via Clerk, BullMQ for background jobs
- **apps/frontend** — Next.js 16 SPA (port 3000), React Query for server state, Shadcn UI + Tailwind
- **apps/agent** — LiveKit voice AI agent (Node.js ≥22), handles invoice/expense creation via voice
- **apps/pdf-service** — Puppeteer-based microservice for PDF generation
- **packages/db** — Prisma schema + generated client (PostgreSQL)
- **packages/schemas** — Shared Zod schemas between backend and frontend

## Commands

```bash
# Dev (requires Docker for Postgres + Redis first)
docker compose -f compose.dev.yml up -d
pnpm dev                    # all apps
pnpm dev:backend            # backend only
pnpm dev:frontend           # frontend only
pnpm dev:agent              # agent only

# Build / lint
pnpm build
pnpm lint

# Testing
pnpm test                                           # all
pnpm --filter @addinvoice/backend test:unit         # backend unit tests
pnpm --filter @addinvoice/backend test:integration  # backend integration tests (needs .env.test + DB)
pnpm --filter @addinvoice/agent test                # agent tests

# Run a single test file
pnpm --filter @addinvoice/backend vitest run src/features/invoices/__tests__/invoices.unit.test.ts

# Database
pnpm db:migrate:dev         # create + apply migration (dev)
pnpm db:migrate:deploy      # apply migrations (prod)
pnpm --filter @addinvoice/db studio   # Prisma Studio UI

# Agent one-time setup (download VAD + turn detector models)
pnpm --filter @addinvoice/agent run download-files
```

## Architecture

### Backend (`apps/backend/src/`)

Feature-based structure: each feature has `schemas.ts` → `repository.ts` → `service.ts` → `controller.ts` → `routes.ts`.

**Request flow:** Route (zod-express-middleware validation) → Controller → Service → Repository (Prisma) → Response

**Middleware chain:** Helmet → CORS → Clerk auth → rate limit → workspace verification → subscription guard → business check

Key infrastructure:
- `core/auth.ts` — Clerk middleware + workspace/business verification helpers
- `queue/queues.ts` + `queue/workers.ts` — BullMQ jobs (email reminders, PDF generation)
- `worker.ts` — separate process that runs BullMQ workers
- `routes/livekit.routes.ts` — generates LiveKit access tokens with workspace metadata

### Frontend (`apps/frontend/`)

Feature modules live under `features/<feature>/` with `components/`, `forms/`, `hooks/`, `service/`, `schema/`. Pages in `app/(main)/` are protected; `app/estimate/accept/` is public (quote signing).

State pattern: React Query for server state, React Hook Form + Zod for forms, Clerk for auth.

The `proxy.ts` is Clerk's Next.js middleware — it enforces auth on all routes except `/sign-in`, `/sign-up`, and `/estimate/accept`.

### Agent (`apps/agent/src/`)

LiveKit Agents workflow-based architecture. The root agent dispatches to sub-workflows (invoice, estimate, payment, expense, client, insight). Each workflow has its own system prompt (in `prompts/`) and tools (in `tools/`).

Voice pipeline: Deepgram STT → OpenAI GPT-4.1-mini → Cartesia TTS, with Silero VAD. Supports 5 languages (en, es, fr, pt, de) — language is passed in the LiveKit token metadata from the backend.

Agent tests use Vitest; when modifying agent instructions or tools, follow TDD (write failing test first, then implement).

### Inter-service Communication

| From | To | How |
|------|----|-----|
| Frontend | Backend | REST/JSON via Axios; Bearer token from Clerk |
| Frontend | Agent | WebSocket via LiveKit SDK; token from backend `/api/v1/livekit` |
| Backend | PDF Service | HTTP POST with `PDF_SERVICE_SECRET` header |
| Backend | External | Clerk webhooks (user sync), Stripe webhooks (subscriptions), Resend (email), Cloudinary (images) |
| Backend → Queue | Worker | BullMQ over Redis |

## Code Conventions

### Naming
- Files/directories: `kebab-case`
- Classes/interfaces/components: `PascalCase`
- Functions/variables/hooks: `camelCase`
- Booleans: verb prefix (`isLoading`, `hasError`, `canDelete`)
- Event handlers: `handle` prefix (`handleSubmit`)
- Custom hooks: `use` prefix

### Backend patterns
- Repository layer maps DB fields to domain types — never expose raw Prisma results if field names differ from the domain schema
- Use `zod-express-middleware`'s `processRequest()` for request validation in routes
- Wrap async route handlers with `asyncHandler()`
- Use specific error types from `errors/EntityErrors.ts`
- Functions should be <20 lines; use early returns

### Frontend patterns
- Feature service files use Axios and return typed responses matching `packages/schemas`
- Components use Shadcn UI primitives; style with Tailwind utility classes
- Tabs for indentation, single quotes, no semicolons (frontend code style)

## TDD Workflow

**No production code without a failing test first.** For every feature, refactor, or bug fix:

1. Choose test level: E2E (Playwright) for critical user paths → integration (API + service + DB) for multi-layer → unit for isolated logic
2. Write one failing test (RED) and confirm it fails for the expected reason
3. Write minimal code to pass (GREEN)
4. Refactor with all tests green

Backend/agent tests use **Vitest** + `vitest-mock-extended` for Prisma mocking. E2E uses **Playwright** — use role-based locators (`getByRole`, `getByLabel`), avoid hardcoded timeouts.

## LiveKit Agent Development

The `apps/agent/` directory has its own `AGENTS.md` (delegates to `CLAUDE.md` → `AGENTS.md`). For LiveKit-specific documentation, add the LiveKit MCP server:

```bash
claude mcp add --transport http livekit-docs https://docs.livekit.io/mcp
```

Use handoffs (workflows) rather than long monolithic prompts — keeps latency low by limiting irrelevant context per LLM call.

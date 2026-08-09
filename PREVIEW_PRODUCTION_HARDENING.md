# Document Image Preview — Production Hardening TODO

Status: the image-based document preview feature is **deployed and safe for normal load**.
Send/email and PDF download are unaffected, and auth/IDOR is sound.

This document lists the follow-up work to do **before the feature takes serious or heavy
public traffic**, ranked from most important to least important. Do them top-to-bottom.

Related code:
- `apps/pdf-service/src/rasterize-pdf.ts`, `apps/pdf-service/src/server.ts`
- `apps/backend/src/core/cache.ts`, `apps/backend/src/features/_shared/document-preview.ts`
- `apps/backend/src/queue/connection.ts`

---

## 1. Redis memory & isolation (HIGHEST PRIORITY)

**Problem.** Rendered page images are stored (currently as **base64**, ~33% larger than raw
bytes) in the **same Redis instance used by BullMQ** (`getCache()` in
`apps/backend/src/core/cache.ts` reuses `getProducerConnectionOptions()`). On a busy
workspace this cache can grow quickly and, depending on `maxmemory-policy`, could **evict
BullMQ job data** (breaking email/reminder jobs) — or the images get evicted constantly,
which defeats the cache.

**Do this.**
- Decide the Redis `maxmemory` and `maxmemory-policy` consciously (e.g. `allkeys-lru` vs
  `volatile-lru`), and document it.
- Prefer **isolating preview images** from BullMQ: a separate Redis DB index or a separate
  Redis instance, so image caching can never evict queue data.
- Store **binary Buffers instead of base64** in Redis to cut ~33% memory and CPU
  (`document-preview.ts` caching path).
- Re-evaluate the **TTL** (currently ~1h). Longer TTL = higher hit rate but more memory.

**Done when:** preview caching cannot evict queue data, memory usage is bounded and
observable, and images are stored as binary.

---

## 2. Verify the production container image (MOST LIKELY TO BREAK IN PROD)

**Problem.** The feature added native dependencies that must be compiled for the **actual
runtime platform**:
- `sharp` (WebP encode) — native binary; glibc vs **musl/Alpine** and arm64 vs x64
  mismatches are the classic "works locally, crashes in prod."
- `pdf-to-img` + `@napi-rs/canvas` — native binaries with the same platform constraints.
- pdf-service also needs **Chrome + fonts** available for Puppeteer; missing fonts render
  text as boxes/tofu in the rasterized image.

**Do this.**
- Verify the `apps/pdf-service` Dockerfile installs the correct native deps for the target
  base image (watch out for Alpine/musl).
- Ensure **Chrome and a font package** are present (and `PUPPETEER_EXECUTABLE_PATH` is set
  if using system Chrome).
- Run **one visual smoke test inside the real container** (compare a rendered preview page
  against the PDF) to catch missing fonts / native-dep issues.

**Done when:** a preview renders correctly (text and logo intact) from the production image.

---

## 3. Render concurrency limit + single-flight de-duplication

**Problem.** On a cache miss there is **no single-flight lock**: N concurrent viewers of the
same document each trigger a **full Puppeteer render + rasterization**. For a popular public
document this multiplies expensive work. There is also **no concurrency cap** on pdf-service
— each request calls `newPage()` on the shared browser, and rasterization (canvas + sharp)
is CPU-heavy. Under load this can exhaust CPU/memory and block the event loop enough to fail
`/health`, which can get the container killed by the orchestrator.

**Do this.**
- Add a **per-key single-flight lock** (render once, concurrent callers await the same
  result) around the render+cache path in `document-preview.ts`.
- Add a **concurrency queue/limit** for renders in pdf-service (cap simultaneous Puppeteer
  pages / rasterizations).
- Consider offloading rasterization to a **worker thread** so it never blocks the event loop
  / health check.

**Done when:** duplicate concurrent requests for the same doc render once, and pdf-service
stays responsive (health check passes) under load.

---

## 4. Pre-warm the browser on startup (fixes observed cold start)

**Problem.** The slowness observed right after the app starts is the **cold Puppeteer/Chrome
launch** on the first request (`getBrowser()` in `apps/pdf-service/src/invoice-pdf.ts`).

**Do this.**
- **Launch the browser at service startup** (or warm it from the health check) so the first
  user request doesn't pay the launch cost.

**Done when:** the first preview after a deploy/restart is not noticeably slower than
subsequent ones.

---

## 5. Observability (metrics & logging)

**Problem.** There is no visibility into how the pipeline behaves in production.

**Do this.**
- Log/emit **render duration** (Puppeteer vs rasterize), **cache hit rate**, and **error
  rate** for preview generation.
- Add alerts on elevated error rate or render latency.

**Done when:** you can see cache hit rate and render latency in your dashboards/logs.

---

## 6. Rate limiting on public preview endpoints

**Problem.** Each cache miss is expensive, so unauthenticated preview endpoints are a
potential abuse/DoS vector.

**Do this.**
- Verify the **public preview routes** (`/api/v1/public/documents/:slug/preview[/:page]`,
  `.../public/estimates/accept/:token/preview[/:page]`,
  `.../public/proposals/accept/:token/preview[/:page]`) are covered by rate limiting like the
  existing public PDF routes; add limits if not.

**Done when:** public preview endpoints are rate limited.

---

## 7. Guardrail for very large documents

**Problem.** All rendered pages are held in memory as a single JSON payload between
pdf-service and backend (base64). A pathologically large document could spike memory.

**Do this.**
- Add a **max page cap** (or streaming) for preview rendering, with a graceful fallback
  (e.g. fall back to the existing PDF viewer/download for oversized docs).

**Done when:** an unusually large document cannot OOM the services.

---

## 8. Integration / E2E + visual regression tests (LOWEST PRIORITY)

**Problem.** Current coverage is unit-level only (rasterizer, cache helper, viewer).

**Do this.**
- Add an **integration test** hitting the real preview endpoints (metadata shape, cache-hit
  path, `preview/:page` bytes + `ETag`, 404 for out-of-range page), asserting `/pdf` and
  `/send` are unchanged.
- Add a **golden-image visual regression** check for one document per type.

**Done when:** preview endpoints and visual output are covered by automated tests.

---

## Suggested order

1. Redis memory & isolation (#1)
2. Verify production container image (#2)
3. Render concurrency limit + single-flight (#3)
4. Pre-warm browser on startup (#4)
5. Observability (#5)
6. Rate limiting on public preview endpoints (#6)
7. Large-document guardrail (#7)
8. Integration / E2E + visual tests (#8)

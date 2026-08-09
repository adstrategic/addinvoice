# ADDINVOICES Mobile App — Implementation Plan

## Context

`apps/frontend` is a Next.js 16 SPA covering 13 modules (invoices, estimates, proposals, advances,
clients, catalog, expenses, payments, dashboard, voice, reputation, ask-me-how, configuration). The
backend at `apps/backend` is a plain REST API behind Clerk with **no workspace header** — the workspace
is derived server-side from `clerkId === userId` (`apps/backend/src/core/auth.ts:verifyWorkspaceAccess`).
That makes the API trivially consumable from a native client: a Clerk Bearer token is the entire auth
contract.

The goal is a React Native / Expo app that mirrors the web app's structure closely enough that a
developer can navigate both codebases with one mental model, reusing `@addinvoice/schemas` (verified
pure-zod, no Prisma imports) as the single source of truth for domain types. **No backend changes are
required for v1**; a short list of optional backend improvements is in Open Questions.

**Decided scope (confirmed with the product owner):**

| Decision | Choice |
|---|---|
| Repo layout | `apps/mobile` inside the existing pnpm + Turbo monorepo |
| v1 scope | Auth + funnel, Dashboard, Invoices, Estimates, Clients, Expenses (camera receipt), Payments, Catalog, Businesses/Settings |
| Deferred | Proposals, Advances, Ask-Me-How/Tour, public accept pages, Reputation, Logo-AI |
| Styling | NativeWind v4 |
| Billing | Web-only purchase; `FREE_TRIAL` activates in-app. No IAP, no in-app checkout (App Store 3.1.1) |
| Voice | `from-voice-audio` recording endpoints in v1; LiveKit realtime assistant in v2 |

---

## Stack

- **Expo SDK (latest stable)** — pin whatever `npx create-expo-app@latest` resolves at init; do not
  hand-pick a version
- **Expo Router** (file-based, App Router style — mirrors `apps/frontend/app/`)
- **React Native** + **TypeScript** (strict, extending `@addinvoice/typescript-config`)
- **Same API backend as web — no backend changes.** Base URL `${EXPO_PUBLIC_API_URL}/api/v1`
- **`@clerk/clerk-expo`** + **`expo-secure-store`** token cache (web uses `@clerk/nextjs`)
- **`@tanstack/react-query` v5** — same query-key factories and `staleTime: 30s / gcTime: 5m` config as
  `apps/frontend/components/providers/query-provider.tsx`
- **`axios`** — direct port of `apps/frontend/lib/api/client.ts`
- **`@addinvoice/schemas`** (workspace dep) + **`zod` 3.25.x** + **`react-hook-form`** +
  **`@hookform/resolvers`** — form layer ports almost unchanged
- **`nativewind` v4** + `tailwindcss` — Tailwind classnames in RN
- **`zustand`** — client/UI state. The RN skill rules prescribe Zustand selectors over React Context
  specifically inside list items (`list-performance-item-expensive`, `list-performance-function-references`)
- **`@shopify/flash-list`** — every scrollable list (`list-performance-virtualize`)
- **`expo-image`** — all images (`ui-expo-image`)
- **`react-native-reanimated`** + **`react-native-gesture-handler`**
- **`expo-image-picker`** / **`expo-camera`** — receipt capture, logo upload
- **`expo-audio`** — voice-capture recorder for `from-voice-audio` endpoints
- **`expo-file-system`** + **`expo-sharing`** — authenticated PDF download/share
- **`expo-web-browser`** — help/legal/support links only. **Not** for billing (App Store 3.1.1)
- **`date-fns`** — already used on web
- **`react-native-svg`** + **`victory-native`** *or* **`react-native-gifted-charts`** — dashboard area
  chart (web uses `recharts`, which has no RN build)
- **v2 only:** `@livekit/react-native`, `@livekit/react-native-webrtc`

**Explicitly not ported:** `pdfjs-dist`, `html2canvas`, `jspdf`, `resend`, `recharts`, all `@radix-ui/*`,
`vaul`, `cmdk`, `@tiptap/*`, `react-signature-canvas`. Rationale per feature below.

---

## Project Structure

```
apps/mobile/
  app/                                  # Expo Router — mirrors apps/frontend/app/
    _layout.tsx                         # ClerkProvider + QueryProvider + GestureHandlerRootView + theme
    index.tsx                           # funnel resolver → redirects to the right step
    (auth)/
      _layout.tsx
      sign-in.tsx
      sign-up.tsx
      sso-callback.tsx                  # OAuth redirect landing
    (funnel)/                           # pre-app gates — mirrors app/onboarding, /subscribe, /setup
      _layout.tsx
      onboarding.tsx
      subscribe.tsx
      setup.tsx
    (main)/                             # authenticated shell — mirrors app/(main)/
      _layout.tsx                       # <NativeTabs> + FunnelGuard
      (dashboard)/index.tsx
      invoices/
        index.tsx  [sequence].tsx  [sequence]/edit.tsx  create.tsx
      estimates/
        index.tsx  [sequence].tsx  [sequence]/edit.tsx  create.tsx
      clients/
        index.tsx  [sequence].tsx  create.tsx  [sequence]/edit.tsx
      catalog/
        index.tsx  [sequence].tsx  create.tsx  [sequence]/edit.tsx
      expenses/
        index.tsx  [sequence].tsx  create.tsx  [sequence]/edit.tsx
      payments/
        index.tsx  [id].tsx
      configuration/
        index.tsx  company.tsx  payments.tsx  invoices.tsx  general.tsx  account.tsx
      more.tsx                          # overflow nav (mirrors bottom-nav.tsx More drawer)

  features/                             # 1:1 with apps/frontend/features/
    <feature>/
      components/                       # list cards, filters, stats, actions
      forms/                            # RHF forms + form-fields/
      hooks/                            # React Query hooks — ported verbatim where possible
      service/                          # axios calls — ported verbatim
      schema/                           # local zod, only where not in @addinvoice/schemas
      index.ts                          # barrel, same convention as web

  components/
    ui/                                 # design-system barrel (imports-design-system-folder)
      view.tsx text.tsx button.tsx input.tsx card.tsx sheet.tsx
      badge.tsx skeleton.tsx spinner.tsx select.tsx switch.tsx
      date-picker.tsx image.tsx pressable.tsx list.tsx
    shared/                             # mirrors apps/frontend/components/shared/
      ListCard.tsx  DocumentStatusBadge.tsx  ClientSelector.tsx
      BusinessSelector.tsx  MerchantSelector.tsx  WorkCategorySelector.tsx
      EntityDeleteModal.tsx  EntityVoidModal.tsx  VoiceCreateFab.tsx
      ModuleHeader.tsx  ModuleStatusTabs.tsx  EmptyState.tsx
    guards/
      FunnelGuard.tsx  SubscriptionGuard.tsx  BusinessGuard.tsx
    providers/
      query-provider.tsx  clerk-token-provider.tsx  upgrade-sheet-provider.tsx
    voice/
      VoiceAudioRecorder.tsx  VoicePromptSheet.tsx

  lib/
    api/
      client.ts          # authenticated axios (port of frontend lib/api/client.ts)
      public-client.ts   # unauthenticated axios
      types.ts           # ApiSuccessResponse, ApiErrorCode, PaginationMeta
    errors/
      handler.ts         # ApiError + handleApiError — port verbatim
      handle-error.ts    # toast + RHF setError + upgrade-sheet dispatch
    upgrade/store.ts     # zustand replacement for lib/upgrade-dialog/store.ts
    document-status-styles.ts
    document-void.ts
    is-document-public-issued.ts
    feature-colors.ts
    funnel.ts            # port verbatim (FUNNEL_PATHS dashboard target becomes "/(main)/clients")
    tiptap.ts            # plainText <-> TipTap JSON (see Rich-Text Strategy)
    format.ts            # hoisted Intl formatters (js-hoist-intl)
    utils.ts             # cn, formatDateOnly, normalizeDateFromDb
    download.ts          # authenticated PDF fetch → cache → share

  hooks/
    use-subscription.ts  use-limit-guard.ts  use-onboarding-funnel.ts
    use-has-business.ts  use-debounced-value.ts  use-dirty-values.ts
    use-form-error-handler.ts  use-pagination-params.ts  use-haptics.ts

  store/                               # zustand slices
    filters.store.ts  draft.store.ts  ui.store.ts

  assets/                              # fonts (Geist), icons, splash
  app.json  eas.json  metro.config.js  tailwind.config.js
  babel.config.js  tsconfig.json  package.json  .env.example
```

**Naming**: kebab-case files/dirs, PascalCase components, `use*` hooks, `handle*` handlers,
`is/has/can` booleans — identical to `CLAUDE.md`. One deliberate divergence: the web app uses tabs +
single quotes + no semicolons in frontend code; keep that formatting in `apps/mobile` so shared
snippets are diff-friendly.

---

## Shared Code Strategy

**Monorepo, `apps/mobile` inside the existing pnpm + Turbo workspace.** `pnpm-workspace.yaml` already
globs `apps/*`, so the app is picked up with no config change.

### What is shared (verified)

| Package | Mobile-safe? | Evidence |
|---|---|---|
| `@addinvoice/schemas` | **Yes** | All 31 source files import only `zod`. Prisma enums are deliberately duplicated in `packages/schemas/src/enums.ts` ("Defined here so @addinvoice/schemas has no dependency on @addinvoice/db (avoids pg in frontend bundle)") |
| `@addinvoice/db` | **No** | Depends on `@prisma/client`, `@prisma/adapter-pg`, `pg` — Node `net`/`tls`, will not run in Hermes |
| `@addinvoice/typescript-config` | Yes | Extend `react-library.json`, override `moduleResolution` to `bundler` |
| `@addinvoice/eslint-config` | Partially | Extend `base`, add `eslint-plugin-react-native` + `react/jsx-no-leaked-render` |

Mobile therefore consumes **only** `@addinvoice/schemas` and talks to `apps/backend` over HTTP.

### Two prerequisite cleanups (do these first — they are cheap and unblock everything)

1. **Remove the stale `"@addinvoice/db": "workspace:*"` dependency from
   `packages/schemas/package.json:17`.** Nothing in `packages/schemas/src` imports it. Left in place,
   pnpm pulls `@prisma/client` + `pg` into the mobile resolution graph and Metro will attempt to
   resolve Node builtins.
2. **Add a `types` condition to the schemas `exports` map.** It is currently the string form
   `{ ".": "./dist/index.js" }` (`packages/schemas/package.json:8-10`), which only resolves types via
   the legacy `main`/`types` fields. Change to:
   ```json
   "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }
   ```

### What is *not* shared and must be duplicated

The backend keeps several schemas outside the shared package — **invoices, payments, catalog,
workspace, and dashboard** live only in `apps/backend/src/features/*/*.schemas.ts`. Critically,
`invoices.schemas.ts` imports `InvoiceStatus` from `@addinvoice/db`, which blocks a straight lift.

**Recommended (optional, high leverage):** promote these into `packages/schemas/src/` and mirror
`InvoiceStatus`, `SubscriptionPlan`, `SubscriptionStatus`, `PaymentMethodType`, `AdvanceStatus` into
`packages/schemas/src/enums.ts` alongside the existing `EstimateStatus`/`ProposalStatus`. This is the
single highest-value prep task and benefits the web app too.

**If skipped:** define local mirrors in `apps/mobile/features/*/schema/*.ts`, matching the field names
in `apps/backend/src/features/invoices/invoices.schemas.ts` exactly, and add a comment pointing at the
backend source.

### Turbo / Metro wiring

- `apps/mobile/package.json` adds `"@addinvoice/schemas": "workspace:*"`; turbo's existing
  `build.dependsOn: ["^build"]` ensures `packages/schemas/dist` exists before the mobile build.
- `metro.config.js` must set `watchFolders = [monorepoRoot]`, `nodeModulesPaths = [app/node_modules,
  root/node_modules]`, and `resolver.unstable_enableSymlinks = true` — pnpm's default isolated linker
  uses symlinks and Metro will not follow them otherwise.
- **`monorepo-native-deps-in-app`** (CRITICAL): every package with native code
  (`expo-image`, `expo-camera`, `react-native-reanimated`, `@shopify/flash-list`, later
  `@livekit/react-native-webrtc`) must be listed in `apps/mobile/package.json` directly. Autolinking
  only scans the app's `node_modules`.
- **`monorepo-single-dependency-versions`** (MEDIUM): `zod` is currently `^3.25.67` in
  `packages/schemas` and `^3.25.76` in the agent. Pin one exact version across the workspace via
  root `pnpm.overrides` (the block already exists for `@livekit/protocol`) and add `syncpack` to CI.

---

## Cross-Cutting Strategies

These decisions apply to several features; each feature section references them rather than repeating.

### API client (port of `apps/frontend/lib/api/client.ts`)

Keep the module-level token-getter indirection — it is what lets plain service functions stay
React-free:

```ts
let getTokenFn: (() => Promise<string | null>) | null = null
export function setClerkTokenGetter(fn: () => Promise<string | null>) { getTokenFn = fn }

const client = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  // NOTE: no withCredentials — native uses Bearer only
})
```

`ClerkTokenProvider` calls `setClerkTokenGetter(() => getToken())` once `isLoaded`. The web app
documents a race here (child effects fire before the parent provider's effect); mirror the fix —
`useOnboardingFunnel` must gate every funnel query on `useAuth().isLoaded`.

The response interceptor is the one real rewrite. Web does `window.location.href = …`; mobile uses
`expo-router`:

| Status + code | Web | Mobile |
|---|---|---|
| `401` | `→ /sign-in` | `signOut()` then `router.replace('/(auth)/sign-in')` |
| `403 BUSINESS_REQUIRED` | `→ /setup` | `router.replace('/(funnel)/setup')` |
| `402 SUBSCRIPTION_REQUIRED` (`readOnly !== true`) | `→ /subscribe` | `router.replace('/(funnel)/subscribe')` |
| `402` limit codes | upgrade dialog | upgrade **bottom sheet** via zustand store |

Limit codes to intercept (from `apps/backend/src/core/middleware.ts`): `TRIAL_MODULE_LIMIT`,
`TRIAL_EMAIL_LIMIT`, `VOICE_MONTHLY_LIMIT`, `TRIAL_NOT_AVAILABLE`, `ADVANCES_PLAN_REQUIRED`.
Error envelope is always `{ code, message, statusCode, fields?, redirectTo?, readOnly?, details? }`.

### Rich-text (TipTap) strategy — affects invoices, estimates, catalog, expenses, businesses

Several fields are stored as **TipTap ProseMirror JSON**, not strings: `InvoiceItem.description`,
`Invoice.notes`, `Invoice.terms`, the same on estimates, `Catalog.description`, `Business.defaultNotes`,
`Business.defaultTerms`, `Advance.workCompleted`. There is no TipTap for React Native.

**Approach:** plain-text editing on mobile, with lossless-enough round-tripping.

- **Reading:** port `apps/frontend/lib/rich-text-plain.ts:plainTextFromTipTapJson` into
  `lib/tiptap.ts` and render with `<Text>`.
- **Writing:** a `textToTipTapDoc(text)` helper producing
  `{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }`, one paragraph
  per newline. **`apps/agent/src/lib/tiptap.ts` already does exactly this** — copy it rather than
  re-deriving; the agent proves the backend accepts these documents.
- **Editing an existing doc:** flatten to plain text, edit, re-serialize. Document in the UI that
  mobile editing flattens web formatting. `git log` shows a recent
  "feat: add TipTap normalization utilities for rich-text fields" commit — check whether those
  normalizers can be promoted to `packages/schemas` before writing a mobile copy.

### PDF strategy

Every PDF endpoint returns raw binary with `Content-Disposition: attachment`, and the authenticated
ones require the Bearer header — so `Linking.openURL` will not work. Single `lib/download.ts` helper:

```ts
// FileSystem.createDownloadResumable(url, cacheUri, { headers: { Authorization: `Bearer ${token}` } })
// → Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' })
```

For in-app preview (`InvoicePdfPreview` etc. on web use `pdfjs-dist`), use `react-native-pdf` on the
downloaded local file, or ship v1 with download-and-share only and add inline preview in v2.

Endpoints: `GET /invoices/:sequence/pdf`, `/estimates/:sequence/pdf`, `/payments/:id/receipt`
(v1); `/proposals/:sequence/pdf`, `/advances/:sequence/pdf` (deferred).

### Money and dates

- All money is Prisma `Decimal(10,2)` and arrives as string-or-number. Normalize at the service
  boundary with the response zod schema; never do float math on a raw response field.
- `@db.Date` columns (`issueDate`, `dueDate`, `expenseDate`, `advanceDate`) are UTC-midnight.
  **Reuse `fixedDateFromPrisma` from `@addinvoice/schemas` shared** — without it dates render one day
  off. Also port `formatDateOnly` / `normalizeDateFromDb` from `apps/frontend/lib/utils.ts`.
- Currency formatting: web hardcodes `USD`/`en-US` in `lib/utils.ts:formatCurrency`. Per **`js-hoist-intl`**,
  build a module-scope `Map<string, Intl.NumberFormat>` keyed by `currency+locale` in `lib/format.ts` —
  this app formats currency in every list row across 5 locales, and constructing `Intl` objects in
  `renderItem` is the exact anti-pattern the rule calls out.

### List rendering contract (applies to every `index.tsx`)

Non-negotiable, from the CRITICAL/HIGH rules:

- `FlashList` with `estimatedItemSize` — never `ScrollView` + `.map()` (`list-performance-virtualize`)
- **Do not `.map()`/`.filter()` the query result before passing it to the list.** Pass the raw array
  and transform inside the item. Object reference stability is what makes recycling work
  (`list-performance-function-references`)
- Item components take **primitive props only** (`id`, `name`, `total`, `status`) so `memo()` shallow
  compare works (`list-performance-item-memo`)
- One `handlePress(id)` callback created at list root; items call it with their id
  (`list-performance-callbacks`)
- No inline object or style literals in `renderItem`; hoist static styles to module scope
  (`list-performance-inline-objects`)
- No `useQuery` inside items — the parent fetches, items are pure render functions
  (`list-performance-item-expensive`)
- `expo-image` with `recyclingKey` and CDN-resized Cloudinary URLs at 2× display size
  (`list-performance-images`, `ui-expo-image`)
- **`rendering-no-falsy-and`** (CRITICAL — prevents production crash): this codebase is full of
  `{invoice.total && …}` / `{items.length && …}` patterns. `0` and `''` render as bare text outside
  `<Text>` and hard-crash release builds. Use `!!value &&`, ternary-with-`null`, or an early return.
  Enable `react/jsx-no-leaked-render` in ESLint from day one.
- Scroll position never in `useState` — `useSharedValue` + `useAnimatedScrollHandler`
  (`scroll-position-no-state`)

### Navigation contract

- **`navigation-native-navigators`** (HIGH): `NativeTabs` from `expo-router/unstable-native-tabs`
  (or `react-native-bottom-tabs`). Never `@react-navigation/bottom-tabs`. Stacks are expo-router's
  default `Stack` (already native-stack); never `@react-navigation/stack`.
- Prefer native header options (`title`, `headerLargeTitleEnabled`, `headerSearchBarOptions`) over
  custom header components — the web app's per-module search inputs map directly to
  `headerSearchBarOptions`.
- **`ui-native-modals`** (HIGH): the web app leans heavily on Radix `Dialog`/`Sheet`/`Drawer`
  (~15 dialogs). Port these as native form sheets —
  `options={{ presentation: 'formSheet', sheetAllowedDetents: 'fitToContents' }}` — not a JS bottom
  sheet library.
- **`ui-safe-area-scroll`**: `contentInsetAdjustmentBehavior="automatic"` on root ScrollViews. Do not
  wrap in `SafeAreaView` or add `insets.top` padding manually.

### Tab bar mapping

Web mobile bottom nav (`components/bottom-nav.tsx`) is Home / Invoices / Estimates / Clients / More.
Mirror it exactly, with in-scope items only in the More screen:

| Tab | Route | SF Symbol |
|---|---|---|
| Home | `/(main)/(dashboard)` | `house.fill` |
| Invoices | `/(main)/invoices` | `doc.text.fill` |
| Estimates | `/(main)/estimates` | `checkmark.seal.fill` |
| Clients | `/(main)/clients` | `person.2.fill` |
| More | `/(main)/more` | `ellipsis` |

More screen (gradient tiles, reuse `lib/feature-colors.ts`): Expenses, Payments, Catalog,
Configuration. Voice assistant, Proposals, Advances, Reputation, Ask Me How appear here in later phases.

The web app hides its bottom nav on `app:form-open` / `app:form-close` window events — on mobile the
equivalent is simply pushing full-screen form routes onto the stack; no event bus needed.

### Deep-link / URL-state parity

Web uses `?action=create` on `/invoices`, `/clients`, `/advances`, `/estimates` as UI state. On mobile,
promote these to real routes (`invoices/create`) and register `addinvoices://` + a universal link so
web links open the right screen.

---

## Features

---

### Feature: Auth & Onboarding Funnel

**Web app screens/routes involved:**
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `app/onboarding/page.tsx` (3-question quiz)
- `app/subscribe/page.tsx`, `app/subscribe/success/page.tsx`, `app/subscribe/cancelled/page.tsx`
- `app/setup/page.tsx` (first business creation)
- `proxy.ts` (Clerk middleware)
- `components/guards/funnel-guard.tsx`, `components/guards/subscription-guard.tsx`, `components/BusinessGuard.tsx`
- `hooks/use-onboarding-funnel.ts`, `lib/funnel.ts`

**Domain models:**
- `FunnelStep = "onboarding" | "subscribe" | "setup" | "dashboard"`, `FunnelState` (`lib/funnel.ts`)
- `SubscriptionStatusResponse` — `{ hasEverPaid, isActive, plan, status, trialUsage?, voiceUsage? }`
- `SubscriptionPlan = FREE_TRIAL | MINIMUM | ESSENTIAL | LIFETIME`
- `SubscriptionStatus = ACTIVE | CANCELED | PAST_DUE | UNPAID | INCOMPLETE | INCOMPLETE_EXPIRED | TRIALING`
- `CreateBusinessDTO` / `BusinessResponse` (`@addinvoice/schemas` businesses)

**API endpoints used:**
- `GET /api/v1/workspace/onboarding` · `POST /api/v1/workspace/onboarding`
- `GET /api/v1/subscription/status`
- `POST /api/v1/subscription/trial/activate`
- ~~`GET /api/v1/subscription/plans`~~ · ~~`POST /api/v1/subscription/checkout`~~ ·
  ~~`POST /api/v1/subscription/portal`~~ — **deliberately unused on mobile** (App Store 3.1.1)
- `GET /api/v1/businesses` · `POST /api/v1/businesses` · `PATCH /api/v1/businesses/:id/default`
- `POST /api/v1/businesses/:id/logo` (multipart, field `logo`, 5 MB)

**Mobile screens to build:**
- `SignInScreen` — Clerk email/password + OAuth (Google/Apple)
- `SignUpScreen` — Clerk sign-up + email code verification
- `SSOCallbackScreen` — OAuth redirect landing
- `OnboardingScreen` — 3-question quiz, submits `{ answers }`
- `TrialActivationScreen` — activates `FREE_TRIAL`; **no pricing, no checkout** (see App Store Compliance)
- `SubscriptionRequiredScreen` — neutral dead-end shown when the trial is exhausted or the plan lapsed
- `SetupScreen` — first business form + logo upload
- `SplashGateScreen` (`app/index.tsx`) — resolves the funnel step and redirects

**Expo Router file structure:**
```
app/
  index.tsx                    — resolves funnel step, redirects (no UI beyond splash)
  (auth)/
    _layout.tsx                — redirects to /(main) if already signed in
    sign-in.tsx                — email/password + OAuth
    sign-up.tsx                — sign-up + verification code step
    sso-callback.tsx           — OAuth completion handler
  (funnel)/
    _layout.tsx                — requires Clerk session, no tab bar
    onboarding.tsx             — 3-question quiz
    trial.tsx                  — activate FREE_TRIAL (no prices, no checkout)
    subscription-required.tsx  — neutral "manage your plan on the web" dead-end
    setup.tsx                  — create first business
```

**Components to build:**
- `FunnelGuard` — mirrors `components/guards/funnel-guard.tsx`; takes `requiredStep`, redirects via
  `router.replace` when `resolveFunnelStep(state) !== requiredStep`
- `OnboardingQuestion` — single-question card with option tiles
- `TrialUsageMeter` — renders `trialUsage[module] = { limit, used }`
- **Not built:** `PlanCard`. The web `app/subscribe/page.tsx` plan cards are deliberately **not**
  ported — rendering prices is what triggers Guideline 3.1.1.

**Hooks / logic to port:**
- `lib/funnel.ts` — **port verbatim**; only change `FUNNEL_PATHS.dashboard` from `"/clients"` to
  `"/(main)/clients"`
- `hooks/use-onboarding-funnel.ts` — same composition of `useOnboardingStatus` + `useSubscription` +
  `useHasBusiness`; must gate on `useAuth().isLoaded`
- `hooks/use-subscription.ts` — port `subscriptionKeys`, `useSubscription`, `useActivateTrial` only.
  **Do not port `useSubscriptionPlans`, `useCreateCheckout`, or `useCreatePortalSession`** — each one
  exists to sell or change a plan, which is the exact thing that must not happen in-app.
- `hooks/use-limit-guard.ts` — client-side pre-check against cached subscription; opens the upgrade sheet
- `hooks/useHasBusiness.ts`
- `features/onboarding/service/onboarding.service.ts`, `features/subscriptions/service/subscriptions.service.ts`,
  `features/subscriptions/lib/subscription-access.ts` (`hasVoiceAccess`, `planAllowsAdvances`, `isSubscriptionActive`)

**Mobile-specific considerations:**
- **Token cache is mandatory.** `@clerk/clerk-expo` needs an `expo-secure-store` token cache or the
  user is signed out on every cold start.
- **Apple Sign-In is an App Store requirement** if any other third-party OAuth is offered. Configure
  Google + Apple in the Clerk dashboard and add `expo-apple-authentication`.
- **App Store Compliance — DECIDED: web-only purchase, in-app free trial.** This is a hard constraint
  on this feature, not a preference.

  App Store Guideline **3.1.1** requires digital subscriptions consumed in-app to use In-App Purchase.
  Guideline **3.1.3(b) (Multiplatform Services)** permits an app to *honor* a subscription purchased on
  your website. Activating `FREE_TRIAL` involves no money, so it is account provisioning, not a
  purchase — it stays in the app. Paid conversion moves to the web.

  **Allowed in-app:**
  - Sign up, onboarding, `POST /subscription/trial/activate`, setup, and full use of the app
  - `GET /subscription/status` and showing `trialUsage` / `voiceUsage` meters
  - Plain factual text: *"Your trial limit has been reached."*

  **Forbidden in-app — every one of these is a rejection trigger:**
  - Rendering prices or plan tiers (so: no `GET /subscription/plans` call at all)
  - Any button, link, or `WebBrowser` call that reaches Stripe Checkout or the billing portal
  - Any wording that steers toward buying elsewhere (*"subscribe on our website"*, *"cheaper on the
    web"*). Apple treats steering language as a violation independently of the link itself.
  - Deep-linking to `${FRONTEND_URL}/subscribe`

  The safe wording for `SubscriptionRequiredScreen` and the upgrade sheet states the account status and
  stops: *"Your trial limit has been reached. Your plan can be managed from your account on
  addinvoices.com."* Naming the domain as a fact is materially different from a tappable link, but if
  App Review pushes back, drop the domain too and leave only the status.

  The funnel therefore becomes: `onboarding → trial → setup → dashboard`, with
  `subscription-required` as a terminal state rather than a step. `FunnelStep` gains no new member —
  `subscribe` is simply resolved differently on mobile.

  This is also the highest-margin option: conversions stay on Stripe at ~2.9% rather than Apple at
  15–30%.
- **Guidelines shift.** Re-read the current text of 3.1.1 and 3.1.3 before submitting, and use App
  Review's resolution center for a written pre-submission answer if anything is ambiguous.
- Onboarding answers are `Json`; keep the same question shape as
  `app/onboarding/page.tsx` so web and mobile analytics stay comparable.
- Logo upload on `setup` uses `expo-image-picker` → `FormData` with `{ uri, name, type }`.
- Deep link scheme `addinvoices://` registered in `app.json` for Clerk OAuth redirect.

**Implementation steps:**
1. Install `@clerk/clerk-expo` + `expo-secure-store`; wire `ClerkProvider` with the token cache in
   `app/_layout.tsx`; add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
2. Build `(auth)/sign-in.tsx` and `(auth)/sign-up.tsx` with Clerk's `useSignIn`/`useSignUp` hooks
   (custom UI — there is no drop-in `<SignIn/>` on native).
3. Add Google + Apple OAuth via `useOAuth` + `sso-callback.tsx`; register the deep-link scheme.
4. Port `lib/funnel.ts` and build `FunnelGuard`.
5. Build `app/index.tsx` as the funnel resolver + splash.
6. Port `features/onboarding` service + hooks; build `OnboardingScreen`.
7. Port `features/subscriptions` service, keeping only `getStatus` and `activateTrial`; build
   `TrialActivationScreen` and `SubscriptionRequiredScreen`.
8. Port `features/businesses` service; build `SetupScreen` with logo upload.
9. Verify the full cold-start path: signed-out → sign-in → onboarding → trial → setup → dashboard.
10. **Compliance audit before submission:** grep the whole app for `subscription/plans`,
    `subscription/checkout`, `subscription/portal`, `openBrowserAsync`, and `openAuthSessionAsync` —
    none may appear on a billing path. Confirm no screen renders a price.

**Estimated effort:** 4–6 days solo *(down from 5–7 — the plan picker and checkout flow are gone)*

---

### Feature: Dashboard

**Web app screens/routes involved:**
- `app/(main)/page.tsx` (773 lines — dashboard + `ShortcutInterface` first-visit surface)
- `components/dashboard-business-filter.tsx`, `components/shortcut-interface.tsx`
- `features/dashboard/`

**Domain models:**
- `features/dashboard/types/dashboard.types.ts` — response of `GET /dashboard/stats`:
  `{ chartSeries[], overdueInvoices, paidInvoices, pendingInvoices, recentInvoices[], recentEstimates[], thisMonthInvoices, thisWeekInvoices, totalInvoices, totalOutstanding, totalRevenue }`
- `ExpenseDashboardStatsResponse`, `MonthlyExpense` (`@addinvoice/schemas` expense)

**API endpoints used:**
- `GET /api/v1/dashboard/stats?businessId&period=7d|30d|6m|12m`
- `GET /api/v1/expenses/stats?workCategoryId&period=7d|30d|6m|12m`
- `GET /api/v1/businesses` (for the business filter)

**Mobile screens to build:**
- `DashboardScreen` — KPI tiles, revenue area chart with period switcher, recent invoices/estimates,
  business filter
- `QuickActionsSheet` — mobile equivalent of `ShortcutInterface` (create invoice / estimate / client /
  expense)

**Expo Router file structure:**
```
app/(main)/(dashboard)/
  index.tsx        — KPI tiles + revenue chart + recent activity + business filter
```

**Components to build:**
- `StatTile` — one KPI (label, value, delta); primitive props only
- `RevenueChart` — area chart over `chartSeries`; mirrors the web `ChartContainer` + recharts `AreaChart`
- `PeriodSwitcher` — `7d | 30d | 6m | 12m` segmented control
- `BusinessFilterSheet` — mirrors `components/dashboard-business-filter.tsx`
- `RecentActivityList` — recent invoices + estimates, reuses `ListCard`
- `QuickActionsGrid` — gradient tiles from `lib/feature-colors.ts`

**Hooks / logic to port:**
- `features/dashboard/hooks/useDashboard.ts` → `useDashboardStats`
- `features/expenses/hooks/useExpenseDashboardStats.ts`
- `lib/feature-colors.ts` — `FEATURE_COLORS`, `getFeatureColors()`
- `lib/utils.ts:formatCurrency` → rebuilt as hoisted formatters in `lib/format.ts`

**Mobile-specific considerations:**
- **recharts does not run on RN.** Use `victory-native` (Skia, best perf) or
  `react-native-gifted-charts` (simplest API). Recommend `victory-native` given this is the only chart
  in v1 and it is on the home tab.
- Pull-to-refresh via `RefreshControl` → `queryClient.invalidateQueries`.
- **`ui-styling`**: gradients use `experimental_backgroundImage: 'linear-gradient(...)'`, not a
  `<LinearGradient>` dependency; shadows use the `boxShadow` string syntax; add
  `borderCurve: 'continuous'` wherever `borderRadius` is set.
- Web gates `ShortcutInterface` on `sessionStorage`. On mobile use a persisted zustand slice
  (`AsyncStorage`) or simply always show quick actions as a section of the dashboard — recommend the
  latter, since the sessionStorage gate is a web-onboarding artifact.
- **`js-hoist-intl`**: currency/percent formatters at module scope.

**Implementation steps:**
1. Port `features/dashboard/service` + `hooks`.
2. Build `StatTile` and the KPI grid.
3. Add the chart library; build `RevenueChart` + `PeriodSwitcher` against `chartSeries`.
4. Build `BusinessFilterSheet` (native form sheet) wired to `useBusinesses()`.
5. Build `RecentActivityList` on `FlashList` using the shared `ListCard`.
6. Add `QuickActionsGrid` and pull-to-refresh.

**Estimated effort:** 3–4 days solo

---

### Feature: Clients

**Web app screens/routes involved:**
- `app/(main)/clients/page.tsx`, `app/(main)/clients/[sequence]/page.tsx`
- `features/clients/` (components, forms + `form-fields/`, hooks, schema, service)

**Domain models:** (all in `@addinvoice/schemas` clients — reuse directly)
- `ClientBase`, `CreateClientDTO`, `UpdateClientDTO`, `ClientResponse`, `ClientListStats`,
  `ListClientsResponse`
- `PHONE_REGEX = /^\+[1-9]\d{1,14}$/`

**API endpoints used:**
- `GET /api/v1/clients?limit(1–30)&page&search`
- `GET /api/v1/clients/:sequence`
- `POST /api/v1/clients` · `PATCH /api/v1/clients/:id` · `DELETE /api/v1/clients/:id`
- `POST /api/v1/clients/:id/logo` (multipart `logo`, image/*, 5 MB)
- `POST /api/v1/clients/from-voice-audio` (multipart `audio`, 10 MB)
- `GET /api/v1/clients/:clientId/pending-advances` *(deferred with Advances)*

**Mobile screens to build:**
- `ClientsListScreen` — search, pagination, stats header, FAB
- `ClientDetailScreen` — profile, contact actions, related invoices, edit/delete
- `ClientFormScreen` — create/edit (basic info, contact, business terms, reminders, logo)

**Expo Router file structure:**
```
app/(main)/clients/
  index.tsx              — searchable client list + stats + create FAB
  create.tsx             — new-client form (native formSheet presentation)
  [sequence].tsx         — client detail
  [sequence]/edit.tsx    — edit form
```

**Components to build:**
- `ClientCard` — mirrors `features/clients/components/ClientCard.tsx`; primitive props only
- `ClientStats` — mirrors `ClientStats.tsx`
- `ClientForm` + `form-fields/`: `BasicInfoFields`, `ContactFields`, `BusinessTermsFields`,
  `ReminderFields`, `LogoUploadField` — 1:1 with the web `form-fields/` directory
- `PhoneInputField` — replaces `components/phone-input/`; use `libphonenumber-js` (already transitively
  present via `react-phone-number-input`) with a native country picker
- `ClientSelector` — shared; used by invoices, estimates, expenses

**Hooks / logic to port:**
- `useClients`, `useClientActions`, `useClientDelete`, `useClientFormManager` — port near-verbatim
- `components/shared/hooks/useClientSelector.ts`
- `hooks/useDebouncedTableParams.ts` → mobile variant driving infinite scroll instead of page buttons
- `lib/utils/client-stats.ts:calculateClientStats` (marked TODO-move-to-backend on web — keep parity,
  do not fix here)

**Mobile-specific considerations:**
- Replace numbered pagination with `FlashList` + `useInfiniteQuery` `onEndReached`. Note the API caps
  clients at `limit: 30`.
- Native contact actions: `Linking.openURL('tel:…' | 'mailto:…' | 'sms:…')`; consider
  `expo-contacts` import as a v2 nicety.
- `KeyboardAvoidingView` / `react-native-keyboard-controller` on the form — this is the app's first
  long form; get the pattern right here and reuse it.
- Logo upload: `expo-image-picker` → `FormData` `{ uri, name, type }`.
- **This is the reference feature.** Build it first among the CRUD modules; every other module
  (catalog, expenses, invoices, estimates) reuses its list/detail/form skeleton.

**Implementation steps:**
1. Port `features/clients/service/clients.service.ts` unchanged (swap the axios import).
2. Port `useClients` + query-key factory.
3. Build `ClientCard` and `ClientsListScreen` on `FlashList` + `useInfiniteQuery`.
4. Add native `headerSearchBarOptions` search wired to `useDebouncedValue`.
5. Build `ClientDetailScreen` with contact actions and `EntityDeleteModal`.
6. Build `ClientForm` with all five `form-fields` components + `PhoneInputField`.
7. Add logo upload via `expo-image-picker`.
8. Extract `ClientSelector` into `components/shared/` for downstream features.

**Estimated effort:** 4–5 days solo

---

### Feature: Catalog

**Web app screens/routes involved:**
- `app/(main)/catalog/page.tsx`
- `features/catalog/` (components, forms, hooks, schema, service)

**Domain models:**
- Catalog item: `{ id, businessId, name, description (TipTap JSON), price, quantityUnit, sequence }`
- `QuantityUnit = DAYS | HOURS | UNITS` (`@addinvoice/schemas` enums)
- Request/response schemas live in `apps/backend/src/features/catalog/catalog.schemas.ts` — **not
  shared**; mirror locally or promote

**API endpoints used:**
- `GET /api/v1/catalog?businessId&limit(1–30)&page&search&sortBy=sequence|name|price&sortOrder=asc|desc`
- `GET /api/v1/catalog/:sequence`
- `POST /api/v1/catalog` · `PATCH /api/v1/catalog/:id` · `DELETE /api/v1/catalog/:id`
- `POST /api/v1/catalog/from-voice-audio` (multipart `audio` + `businessId`)

**Mobile screens to build:**
- `CatalogListScreen` — search, sort, stats, FAB
- `CatalogFormScreen` — create/edit product or service
- `CatalogSelectionSheet` — multi-select picker used by invoice/estimate item entry

**Expo Router file structure:**
```
app/(main)/catalog/
  index.tsx              — product/service list with search + sort
  create.tsx             — new catalog item
  [sequence]/edit.tsx    — edit catalog item
```
(No standalone detail screen — the web app edits in a modal; mobile pushes straight to edit.)

**Components to build:**
- `CatalogCard` — mirrors `features/catalog/components/CatalogCard.tsx`
- `CatalogStats`, `CatalogSortSheet`
- `CatalogForm` — name, description (plain text → TipTap JSON), price, quantity unit, business
- `CatalogSelectionSheet` — mirrors `features/invoices/components/CatalogSelectionModal.tsx`;
  **shared with invoices and estimates**

**Hooks / logic to port:**
- `useCatalogs`, `useCatalogActions`, `useCatalogDelete`, `useCatalogFormManager`
- `lib/tiptap.ts` for the description field

**Mobile-specific considerations:**
- Numeric price entry: `keyboardType="decimal-pad"` + a currency-masked input (RN has no
  `react-number-format`; a small `lib/format.ts` mask is enough).
- `CatalogSelectionSheet` presented as a native form sheet with `sheetAllowedDetents: [0.5, 1]`.
- Sort control fits naturally in the native header's right action → `ActionSheetIOS` /
  `@react-native-menu/menu` (`ui-menus`).

**Implementation steps:**
1. Mirror the backend catalog schemas locally (or promote them to `packages/schemas`).
2. Port service + `useCatalogs`.
3. Build `CatalogCard` + `CatalogListScreen` with search and sort.
4. Build `CatalogForm` including plain-text→TipTap description handling.
5. Build `CatalogSelectionSheet` as a shared component (multi-select, quantity per line).

**Estimated effort:** 2–3 days solo

---

### Feature: Invoices

The largest feature. Everything in the money loop converges here.

**Web app screens/routes involved:**
- `app/(main)/invoices/page.tsx`
- `app/(main)/invoices/[sequence]/page.tsx` (270 lines)
- `app/(main)/invoices/[sequence]/edit/page.tsx`
- `features/invoices/` — 13 components, `forms/InvoiceForm.tsx` + 7 `form-fields/`, 11 hooks, lib, schemas, service, types
- `components/send-invoice-dialog.tsx`, `components/receive-payment-dialog.tsx`,
  `components/share-link-dialog.tsx`, `components/mass-reminder-dialog.tsx`

**Domain models:**
- Backend-only (`apps/backend/src/features/invoices/invoices.schemas.ts`): `createInvoiceSchema`,
  `updateInvoiceSchema`, `createInvoiceItemSchema`, `updateInvoiceItemSchema`,
  `invoiceEntityWithRelationsSchema`, `InvoiceStatusEnum`. **Imports `InvoiceStatus` from
  `@addinvoice/db` — must be mirrored for mobile.**
- `InvoiceStatus = DRAFT | SENT | VIEWED | PAID | OVERDUE | VOIDED`
- `TaxMode = BY_PRODUCT | BY_TOTAL | NONE`, `DiscountType = PERCENTAGE | FIXED | NONE`,
  `QuantityUnit = DAYS | HOURS | UNITS` — all in `@addinvoice/schemas` enums
- Money fields: `subtotal`, `totalTax`, `discount`, `total`, `balance` (`Decimal(10,2)`)
- Dates: `issueDate`, `dueDate` (`@db.Date` — needs `fixedDateFromPrisma`)
- Rich text: `notes`, `terms`, `InvoiceItem.description` (TipTap JSON)

**API endpoints used:**
- `GET /api/v1/invoices?businessId&clientId&limit(1–50)&page&search&status`
- `GET /api/v1/invoices/:sequence` · `GET /api/v1/invoices/next-number?businessId`
- `POST /api/v1/invoices` · `PATCH /api/v1/invoices/:invoiceId` · `DELETE /api/v1/invoices/:invoiceId`
- `POST /api/v1/invoices/:invoiceId/void`
- `POST|PATCH|DELETE /api/v1/invoices/:invoiceId/items[/:itemId]`
- `PATCH /api/v1/invoices/:invoiceId/payment-method` — `{ selectedPaymentMethodId: number | null }`
- `POST /api/v1/invoices/:sequence/send` — `{ email, subject, message }` (BullMQ)
- `PATCH /api/v1/invoices/:invoiceId/send` — mark sent
- `GET /api/v1/invoices/:sequence/pdf`
- `POST /api/v1/invoices/:sequence/share-link` → `{ publicSlug }`
- `POST|PATCH|DELETE /api/v1/invoices/:invoiceId/payments[/:paymentId]`
- `POST /api/v1/invoices/from-voice-audio` (multipart `audio`)
- `POST /api/v1/invoices/from-voice-transcript` — `{ businessId, clientId, transcript }`
- *(deferred with Advances: `/pending-advances`, `/link-advances`)*

**Mobile screens to build:**
- `InvoicesListScreen` — status tabs, search, filters, stats, FAB
- `InvoiceDetailScreen` — summary, line items, payments, actions (send/share/PDF/void/delete/payment method)
- `InvoiceFormScreen` — multi-step create/edit
- `InvoiceItemSheet` — add/edit one line item
- `SendInvoiceSheet` — email/subject/message composer
- `PaymentFormSheet` — record a payment against the invoice
- `ShareLinkSheet` — generate + copy/share the public slug URL

**Expo Router file structure:**
```
app/(main)/invoices/
  index.tsx              — status-tabbed, searchable invoice list + stats
  create.tsx             — multi-step create flow (business → client → items → totals → review)
  [sequence].tsx         — invoice detail with action bar
  [sequence]/edit.tsx    — edit form (same component as create, mode="edit")
```

**Components to build:**
- `InvoiceCard` — mirrors `features/invoices/components/InvoiceCard.tsx`; primitive props
- `InvoiceStats`, `InvoiceStatusTabs` (mirrors `components/shared/module-ui.tsx:ModuleStatusTabs`),
  `InvoiceFilterSheet`
- `InvoiceForm` + form-fields, 1:1 with web: `HeaderSection`, `ClientSection`, `ProductsSection`,
  `DiscountsVATSection`, `NotesSection`, `TermsSection`, `PaymentsSection`
- `InvoiceItemRow` / `InvoiceItemSheet`
- `PaymentMethodTiles` — mirrors `features/invoices/components/PaymentMethodTiles.tsx`
- `ChangePaymentMethodSheet`, `SendInvoiceSheet`, `PaymentFormSheet`, `ShareLinkSheet`
- `DocumentStatusBadge` (shared) driven by `lib/document-status-styles.ts`

**Hooks / logic to port:**
- `useInvoices`, `useInvoiceActions`, `useInvoiceDelete`, `useInvoiceVoid`, `useInvoiceItems`,
  `useInvoiceFormManager`, `useInvoiceDraftFormState`, `useInvoiceAutofill`, `usePayments`,
  `usePaymentDialog`
- `useDownloadInvoicePDF` → rewritten on `lib/download.ts`
- `features/invoices/lib/utils.ts` — **totals math (subtotal, per-item tax, discount, VAT, balance).
  Port with the greatest care; this is the highest-risk logic in the app.** Recommend copying it
  byte-for-byte and adding a small vitest suite that cross-checks against the backend's calculation for
  a handful of fixtures.
- `features/invoices/lib/editor-mappers.ts` — adapt for the plain-text TipTap strategy
- `lib/document-void.ts:canVoidInvoice`, `lib/is-document-public-issued.ts` (`canSendInvoice`,
  `canChangePaymentMethod`, `isInvoicePublicIssued`)

**Mobile-specific considerations:**
- **The form is the hard part.** The web `InvoiceForm` is a single long page with 7 sections. On mobile,
  split into a stack-based multi-step flow (business → client → items → discounts/tax → notes/terms →
  review) with a persisted draft in zustand so a backgrounded app does not lose work.
- Line-item entry needs a dedicated sheet, not inline table rows.
- **`react-state-fallback`**: hydrate form defaults from `GET /businesses` (`defaultTaxMode`,
  `defaultTaxName`, `defaultTaxPercentage`, `defaultNotes`, `defaultTerms`) using
  `const value = _value ?? business.defaultX` so server refetches update untouched fields —
  the rule's exact pattern.
- `GET /invoices/next-number?businessId` must be called on create; do not compute client-side.
- Money inputs: `decimal-pad`, masked; never `parseFloat` a `Decimal` string without normalizing.
- PDF: `lib/download.ts` (authenticated binary + share sheet).
- Share link: `POST /:sequence/share-link` → build the URL via a port of
  `lib/public-document-url.ts:buildPublicDocumentUrl` → native `Share`.
- **`rendering-no-falsy-and`**: this feature has the most `{value && …}` sites (`balance`, `discount`,
  `taxPercentage` are all legitimately `0`). Audit every one.
- **`list-performance-item-types`**: if the detail screen renders items + payments + totals in one
  `FlashList`, give each row a `type` discriminant and pass `getItemType`.
- Trial limit: `MODULE_TRIAL_LIMIT = 4` per module — `useLimitGuard` must pre-check before opening the
  create flow so users are not 20 fields deep before a 402.

**Implementation steps:**
1. Mirror the backend invoice schemas locally (or promote to `packages/schemas` + mirror
   `InvoiceStatus` into `enums.ts`).
2. Port `invoices.service.ts` and `useInvoices` + query keys.
3. Build `InvoiceCard`, `InvoiceStatusTabs`, `InvoicesListScreen` (FlashList + infinite scroll + search).
4. Build `InvoiceDetailScreen`: header, line items, totals, payments section, action bar.
5. Port `features/invoices/lib/utils.ts` totals math + add fixture tests against backend output.
6. Build the multi-step `InvoiceForm` with the zustand draft store and business-default hydration.
7. Build `InvoiceItemSheet` and wire `CatalogSelectionSheet`.
8. Build `SendInvoiceSheet`, `ShareLinkSheet`, `ChangePaymentMethodSheet`.
9. Build `PaymentFormSheet` (`POST /:invoiceId/payments`) and invoice void/delete.
10. Wire `lib/download.ts` for PDF download + share.

**Estimated effort:** 8–11 days solo

---

### Feature: Estimates

Structurally a superset of invoices — same items/totals model plus descriptive items, exclusions,
timeline, and signature requirement.

**Web app screens/routes involved:**
- `app/(main)/estimates/page.tsx`, `[sequence]/page.tsx` (281 lines), `[sequence]/edit/page.tsx`
- `features/estimates/` — 9 components + `components/calculator/`, `forms/EstimateForm.tsx` + 8
  `form-fields/`, 10 hooks, lib, schemas, 2 services, types
- `components/convert-to-proposal-dialog.tsx`, `components/send-estimate-dialog.tsx`

**Domain models:** (all in `@addinvoice/schemas` estimates — **reuse directly, no mirroring needed**)
- `EstimateBase`, `EstimateItemBase`, `EstimateDescriptiveItemBase`
- `CreateEstimateDTO`, `UpdateEstimateDTO`, `CreateEstimateItemDTO`, `UpdateEstimateItemDTO`,
  `CreateEstimateDescriptiveItemDTO`, `UpdateEstimateDescriptiveItemDTO`
- `EstimateResponse`, `EstimateItemResponse`, `EstimateDescriptiveItemResponse`,
  `EstimateDashboardResponse`, `PublicEstimateSummary`
- `EstimateStatus = DRAFT | SENT | VIEWED | ACCEPTED | REJECTED | INVOICED | PROPOSAL | VOIDED`
- Estimate-specific fields: `summary`, `timelineStartDate`, `timelineEndDate`, `exclusions`,
  `requireSignature` (default `false`)

**API endpoints used:**
- `GET /api/v1/estimates?businessId&clientId&limit(1–50)&page&search&status`
- `GET /api/v1/estimates/:sequence` · `GET /api/v1/estimates/next-number?businessId`
- `POST /api/v1/estimates` · `PATCH /api/v1/estimates/:estimateId` · `DELETE /api/v1/estimates/:estimateId`
- `POST /api/v1/estimates/:estimateId/void` · `PATCH /api/v1/estimates/:estimateId/accept`
- `POST|PATCH|DELETE /api/v1/estimates/:estimateId/items[/:itemId]`
- `POST|PATCH|DELETE /api/v1/estimates/:estimateId/descriptive-items[/:descriptiveItemId]`
- `POST /api/v1/estimates/:sequence/convert-to-invoice`
- `PATCH /api/v1/estimates/:estimateId/send` · `POST /api/v1/estimates/:sequence/send`
- `GET /api/v1/estimates/:sequence/pdf` · `POST /api/v1/estimates/:sequence/share-link`
- `POST /api/v1/estimates/from-voice-audio`

**Mobile screens to build:**
- `EstimatesListScreen` — status tabs, search, filters, stats
- `EstimateDetailScreen` — summary, items, descriptive items, exclusions, timeline, actions
- `EstimateFormScreen` — multi-step create/edit
- `DescriptiveItemSheet` — title + rich-text description block
- `SendEstimateSheet`, `CleaningCalculatorSheet`

**Expo Router file structure:**
```
app/(main)/estimates/
  index.tsx              — status-tabbed estimate list + stats
  create.tsx             — multi-step create (reuses the invoice form skeleton)
  [sequence].tsx         — estimate detail + actions (send, accept, convert, void, PDF, share)
  [sequence]/edit.tsx    — edit form
```

**Components to build:**
- `EstimateCard`, `EstimateStats`, `EstimateStatusTabs`, `EstimateFilterSheet`
- `EstimateForm` + form-fields 1:1 with web: `HeaderSection`, `ClientSection`, `ProductsSection`,
  `DescriptiveItemsSection`, `ExclusionsSection`, `DiscountsVATSection`, `NotesSection`, `TermsSection`
- `DescriptiveItemSheet`, `SendEstimateSheet`
- `CleaningCalculatorSheet` — port of `features/estimates/components/calculator/CleaningCalculatorDialog.tsx`
  + `cleaning-calculator.ts` (pure logic, ports unchanged)
- `ConvertToInvoiceConfirm`

**Hooks / logic to port:**
- `useEstimates`, `useEstimateActions`, `useEstimateDelete`, `useEstimateVoid`, `useEstimateItems`,
  `useEstimateFormManager`, `useEstimateDraftFormState`, `useEstimateAutofill`
- `useDownloadEstimatePDF` → `lib/download.ts`
- `features/estimates/lib/utils.ts` (totals) + `editor-mappers.ts`
- `lib/document-void.ts:canVoidEstimate`, `lib/is-document-public-issued.ts:canSendEstimate`
- `cleaning-calculator.ts` — pure TS, port verbatim

**Mobile-specific considerations:**
- Reuse the invoice multi-step form skeleton — build invoices first, then generalize. Consider a shared
  `components/shared/document-form/` once the second one lands, rather than up front.
- Descriptive items are ordered (`sortOrder`) — needs drag-to-reorder; `react-native-reanimated` +
  `react-native-gesture-handler` (or `react-native-draggable-flatlist`).
- Timeline dates use a native date picker (`@react-native-community/datetimepicker` via
  `expo-datepicker` wrapper); remember `fixedDateFromPrisma` on read.
- `requireSignature` is a switch; the actual signing happens on the **public web accept page**, which
  is out of v1 scope — mobile only sets the flag and shares the link.
- `convert-to-invoice` should navigate to the resulting invoice detail on success.
- The Cleaning Calculator is a differentiated feature and mobile-native-friendly — worth prioritizing
  inside this feature rather than deferring.

**Implementation steps:**
1. Port `estimates.service.ts` + `useEstimates`; import types straight from `@addinvoice/schemas`.
2. Build `EstimateCard`, `EstimateStatusTabs`, `EstimatesListScreen`.
3. Build `EstimateDetailScreen` with the full action bar.
4. Generalize the invoice form skeleton; add `DescriptiveItemsSection` and `ExclusionsSection`.
5. Build `DescriptiveItemSheet` with drag-to-reorder.
6. Add timeline date pickers and the `requireSignature` switch.
7. Port `cleaning-calculator.ts` and build `CleaningCalculatorSheet`.
8. Wire send, share-link, PDF download, void, accept, convert-to-invoice.

**Estimated effort:** 6–8 days solo

---

### Feature: Expenses (with camera receipt capture)

The most mobile-native feature in the app — receipt scanning is genuinely better on a phone than on the
web.

**Web app screens/routes involved:**
- `app/(main)/expenses/page.tsx`, `app/(main)/expenses/[sequence]/page.tsx`
- `features/expenses/` (7 components, 2 forms, 6 hooks, schema, service)
- `features/merchants/`, `features/work-categories/`

**Domain models:** (`@addinvoice/schemas` expense / merchant / work-categories — reuse directly)
- `CreateExpenseDTO`, `UpdateExpenseDTO`, `CreateExpenseBaseDTO`, `ListExpensesQuery`
- `ReceiptScanResult` — `{ total, tax, expenseDate, description }`
- `ExpenseDashboardStatsResponse`, `MonthlyExpense`, `ExpenseStatsQuery`
- `CreateMerchantInput`, `ListMerchantsQuery`, `CreateWorkCategoryDTO`, `ListWorkCategoriesQuery`
- **There is no `ExpenseStatus` enum** — expenses have no status field
- `merchantId` convention: `>0` existing · `0`/`null` none · `-1` create new (then `merchantName` required)

**API endpoints used:**
- `GET /api/v1/expenses?merchantId&workCategoryId&dateFrom&dateTo&limit(1–30)&page&search`
- `GET /api/v1/expenses/:sequence` · `GET /api/v1/expenses/stats?workCategoryId&period`
- `POST /api/v1/expenses` (**JSON**, receipt URL passed as `image`) · `PATCH /api/v1/expenses/:id` ·
  `DELETE /api/v1/expenses/:id`
- `POST /api/v1/expenses/upload-receipt` (multipart `receipt`, 5 MB, images + PDF) → `{ data: { url } }`
- `POST /api/v1/expenses/scan-receipt` (multipart `receipt`) → `ReceiptScanResult` (Claude Vision, not stored)
- `GET /api/v1/merchants?search&limit&page` · `POST /api/v1/merchants` — `{ name }`
- `GET /api/v1/work-categories?search&limit&page` · `POST /api/v1/work-categories` — `{ name, icon? }`

**Mobile screens to build:**
- `ExpensesListScreen` — search, date-range and category filters, stats
- `ExpenseDetailScreen` — receipt image, amounts, merchant, category, edit/delete
- `ExpenseFormScreen` — create/edit
- `ReceiptCaptureScreen` — full-screen camera → scan → prefilled form

**Expo Router file structure:**
```
app/(main)/expenses/
  index.tsx              — expense list + stats + filters
  scan.tsx               — full-screen camera capture → scan-receipt → prefill
  create.tsx             — manual expense form
  [sequence].tsx         — expense detail with receipt viewer
  [sequence]/edit.tsx    — edit form
```

**Components to build:**
- `ExpenseCard`, `ExpenseStats`, `ExpenseFilterSheet` (merchant, work category, date range)
- `ExpenseForm` — merchant selector, work category selector, date, total, tax, description, receipt
- `ReceiptCamera` — `expo-camera` viewfinder with a document-shaped frame guide
- `ReceiptPreview` — `expo-image` with pinch-zoom (or `Galeria` per `ui-image-gallery`)
- `MerchantSelector` (shared) — searchable, supports the `-1` create-new convention
- `WorkCategorySelector` (shared) — reuse `features/work-categories/work-category-icons.tsx` icon map
- `ExpenseCategoryChart` — category breakdown for the stats header

**Hooks / logic to port:**
- `useExpenses`, `useExpenseActions`, `useExpenseDelete`, `useExpenseFormManager`,
  `useExpenseDashboardStats`
- `useReceiptScan` — the two-step flow: `scan-receipt` (prefill) then `upload-receipt` (persist URL)
  then `POST /expenses` with `image: url`
- `useMerchants`, `useCreateMerchant`, `useWorkCategories`
- `components/shared/hooks/useMerchantSelector.ts`, `useWorkCategorySelector.ts`

**Mobile-specific considerations:**
- **Permissions (declare in `app.json`):** `NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription`, Android `CAMERA` + `READ_MEDIA_IMAGES`. Handle denial gracefully —
  fall back to library picker, then to manual entry.
- **Two-step upload is the intended path** and it is easy to get wrong: `scan-receipt` does **not**
  store the file. You must call `upload-receipt` separately to get a persistent Cloudinary URL, then
  send that URL as `image` in the JSON `POST /expenses`. Expense create/update are JSON, not multipart,
  despite the backend route comments.
- Compress before upload — `expo-image-manipulator` to ≤2000 px / ~1 MB. The endpoint caps at 5 MB and
  Cloudinary limits to 2000×2000 anyway.
- Scanning is a Claude Vision round-trip: show a determinate-feeling progress state and always allow
  "enter manually" as an escape hatch. Never block the form on a failed scan.
- Consider `expo-file-system` queueing of captured receipts for offline capture → deferred upload.
  Flagged in Open Questions.
- **`ui-image-gallery`**: use Galeria for the receipt lightbox rather than a hand-rolled modal.

**Implementation steps:**
1. Port merchants + work-categories services and hooks; build `MerchantSelector` and
   `WorkCategorySelector` into `components/shared/`.
2. Port `expenses.service.ts` + `useExpenses`; build `ExpenseCard` + `ExpensesListScreen`.
3. Build `ExpenseFilterSheet` (date range + category + merchant).
4. Build the manual `ExpenseForm` end-to-end and confirm create/edit/delete.
5. Add `expo-camera` + permission flow; build `ReceiptCaptureScreen`.
6. Wire `POST /expenses/scan-receipt` → prefill the form with `ReceiptScanResult`.
7. Wire `POST /expenses/upload-receipt` → `image` URL → `POST /expenses`.
8. Build `ExpenseDetailScreen` with the receipt viewer and the stats header chart.

**Estimated effort:** 5–7 days solo

---

### Feature: Payments

Read-only on the web plus receipt sending; payment *creation* lives inside the invoice feature.

**Web app screens/routes involved:**
- `app/(main)/payments/page.tsx`, `app/(main)/payments/[id]/page.tsx`
- `features/payments/` (5 components, hooks, schemas, service)
- `components/send-receipt-dialog.tsx`
- *(Note: `app/(main)/payments/methods/page.tsx` uses a local mock type with no backend service —
  real payment-method config lives under Configuration → `/workspace/payment-methods`. Do not port the
  mock screen.)*

**Domain models:**
- `Payment` — `{ id, workspaceId, invoiceId, amount, paymentMethod (free string: cash | bank_transfer |
  check | stripe | …), transactionId?, details?, paidAt }`
- Schemas in `apps/backend/src/features/payments/payments.schemas.ts` — **not shared**; mirror locally

**API endpoints used:**
- `GET /api/v1/payments?businessId&dateFrom&dateTo&limit(1–50)&page&search`
- `GET /api/v1/payments/:id`
- `GET /api/v1/payments/:id/receipt` → PDF
- `POST /api/v1/payments/:id/send-receipt` — `{ email, subject, message }`
- Creation/edit via invoices: `POST|PATCH|DELETE /api/v1/invoices/:invoiceId/payments[/:paymentId]`

**Mobile screens to build:**
- `PaymentsListScreen` — search, date-range filter, stats
- `PaymentDetailScreen` — amount, method, invoice link, receipt download, send receipt

**Expo Router file structure:**
```
app/(main)/payments/
  index.tsx      — payment list + totals + date filter
  [id].tsx       — payment detail, receipt download, send receipt
```

**Components to build:**
- `PaymentCard`, `PaymentStats`, `PaymentFilterSheet`
- `SendReceiptSheet` — mirrors `components/send-receipt-dialog.tsx`

**Hooks / logic to port:**
- `features/payments/hooks/usePayments.ts` (`usePayments`, `usePaymentById`)
- `features/invoices/hooks/usePayments.ts` (invoice-scoped mutations)
- `lib/download.ts` for the receipt PDF

**Mobile-specific considerations:**
- Smallest feature in v1 — good candidate to build immediately after invoices, since the
  invoice-scoped payment mutations are already done there.
- Tapping the invoice reference deep-links to `/(main)/invoices/[sequence]`.
- Receipt PDF is an authenticated binary — `lib/download.ts`, not `Linking.openURL`.

**Implementation steps:**
1. Mirror the backend payment schemas locally.
2. Port `payments.service.ts` + `usePayments` / `usePaymentById`.
3. Build `PaymentCard` + `PaymentsListScreen` with date-range filter and totals.
4. Build `PaymentDetailScreen` with the invoice deep link.
5. Wire receipt PDF download and `SendReceiptSheet`.

**Estimated effort:** 2–3 days solo

---

### Feature: Businesses & Configuration

**Web app screens/routes involved:**
- `app/(main)/configuration/[[...rest]]/page.tsx` (**1449 lines** — tabs: user, company, payments,
  invoices, general)
- `features/businesses/` (4 components, 2 hooks, schema, service)
- `features/workspace/` (hooks, schema, service)
- `components/business-selection-dialog.tsx`, `components/subscription/subscription-manager.tsx`

**Domain models:**
- `BusinessBase`, `CreateBusinessDTO`, `UpdateBusinessDTO`, `BusinessResponse` (`@addinvoice/schemas`
  businesses) — `name`, `email`, `nit?`, `address`, `phone`, `logo?`, `defaultTaxMode?`,
  `defaultTaxName?`, `defaultTaxPercentage?`, `defaultNotes?`, `defaultTerms?`
- `PaymentMethodType = PAYPAL | VENMO | ZELLE | NEQUI | STRIPE`
- `AgentLanguage = es | en | fr | pt | de`
- Workspace invoice defaults: `invoiceNumberPrefix`, `defaultCurrency`, `defaultPaymentTerms`,
  `defaultTaxRate`, `invoiceFooterText`, `invoiceColor`

**API endpoints used:**
- `GET|POST /api/v1/businesses` · `GET|PATCH|DELETE /api/v1/businesses/:id`
- `PATCH /api/v1/businesses/:id/default`
- `POST|DELETE /api/v1/businesses/:id/logo` (multipart `logo`, 5 MB)
- `GET /api/v1/workspace/payment-methods`
- `PUT /api/v1/workspace/payment-methods/:type` — `{ handle?, isEnabled, stripeSecretKey? }`
- `PUT /api/v1/workspace/payment-methods/default` — `{ paymentMethodId: number | null }`
- `GET|PUT /api/v1/workspace/language` — `{ language }`
- `GET /api/v1/subscription/status` — read-only
- ~~`POST /api/v1/subscription/portal`~~ — **not used on mobile.** The Stripe billing portal lets a
  user change plan and payment method, which is purchase functionality (App Store 3.1.1).

**Mobile screens to build:**
- `ConfigurationScreen` — settings index (grouped list, not tabs)
- `AccountScreen` — Clerk profile, email, sign out, delete account
- `CompaniesScreen` — business list, set default, add
- `CompanyFormScreen` — create/edit a business incl. logo and tax/notes/terms defaults
- `PaymentMethodsScreen` — enable/disable + handle per `PaymentMethodType`, pick default
- `InvoiceDefaultsScreen` — prefix, currency, payment terms, tax rate, footer, color
- `GeneralScreen` — agent language, theme, app version
- `SubscriptionScreen` — **read-only**: current plan name, status, and usage meters. No portal link,
  no prices, no upgrade button (App Store 3.1.1 — see the Auth feature's compliance rules)

**Expo Router file structure:**
```
app/(main)/configuration/
  index.tsx        — grouped settings list (native list-group style)
  account.tsx      — Clerk profile + sign out
  company.tsx      — business list, set default, add/edit entry point
  payments.tsx     — workspace payment methods
  invoices.tsx     — invoice numbering/currency/tax/footer defaults
  general.tsx      — agent language, theme, about
  subscription.tsx — plan + usage meters, READ-ONLY (no billing actions)
app/(main)/businesses/
  create.tsx  [id]/edit.tsx
```

**Components to build:**
- `SettingsGroup` / `SettingsRow` — native grouped-list primitives (the single biggest visual
  divergence from the web's tabbed page; do not port tabs)
- `CompanyCard` — mirrors `features/businesses/components/CompanyCard.tsx`
- `CompanyForm` — mirrors `CreateCompanyForm.tsx`, plus tax/notes/terms defaults
- `PaymentMethodRow` — per-type toggle + handle input
- `LanguagePicker` — 5 languages
- `SubscriptionManager` — mirrors `components/subscription/subscription-manager.tsx`, **minus every
  billing action**. Displays plan, status, and usage; the web version's upgrade and manage-billing
  buttons are dropped.
- `BusinessSelector` (shared) — used across invoices, estimates, catalog, dashboard

**Hooks / logic to port:**
- `useBusinesses`, `useBusinessDelete`, `useCreateBusiness`, `useSetDefaultBusiness`, `useUploadLogo`
- `features/workspace/hooks/useWorkspace.ts` — payment methods + agent language
- `components/shared/hooks/useBusinessSelector.ts`
- `hooks/use-subscription.ts` (shared with the funnel feature)
- `lib/tiptap.ts` for `defaultNotes` / `defaultTerms`

**Mobile-specific considerations:**
- **Do not port the tabbed 1449-line page.** Native settings are a grouped list drilling into
  sub-screens; that is the whole reason this feature is cheap on mobile despite the web page's size.
- Clerk has no `<UserProfile/>` on native — build `AccountScreen` from `useUser()` primitives
  (avatar via `expo-image-picker` → `user.setProfileImage`, email, password change, sign out).
- **`stripeSecretKey` must never be echoed back or logged.** The backend AES-256-GCM encrypts it; on
  mobile render it as a write-only masked field.
- Agent language is a workspace setting (`PUT /workspace/language`), not per-session — the voice
  features read it server-side. Consider defaulting it from `expo-localization` on first launch.
- Theme: port `components/theme-provider.tsx` onto `AsyncStorage` + `useColorScheme`, keeping the
  `defaultTheme: "light"` behaviour.
- **Business defaults are load-bearing** — invoice and estimate forms hydrate from them
  (`react-state-fallback`). Get `CompanyFormScreen` correct before finishing the document forms.

**Implementation steps:**
1. Port `businesses.service.ts` + hooks; build `CompaniesScreen` and `CompanyCard`.
2. Build `CompanyFormScreen` with logo upload and tax/notes/terms defaults.
3. Extract `BusinessSelector` into `components/shared/`.
4. Build `SettingsGroup`/`SettingsRow` primitives and `ConfigurationScreen`.
5. Build `AccountScreen` on Clerk primitives + sign out.
6. Port `features/workspace`; build `PaymentMethodsScreen` and `GeneralScreen` (language picker).
7. Build `InvoiceDefaultsScreen`.
8. Build the read-only `SubscriptionScreen` — plan, status, usage meters. No billing actions.

**Estimated effort:** 5–6 days solo

---

### Feature: Voice Capture (audio → AI entity creation) — v1

The non-realtime voice path. Records audio locally and posts it to per-module endpoints that transcribe
(Whisper) and extract (Claude). **Distinct from the LiveKit realtime assistant**, which is v2.

**Web app screens/routes involved:**
- `components/voice-agent/VoiceAudioRecorder.tsx` (240 lines — MediaRecorder, 5-min cap, 28-bar waveform)
- `components/shared/VoiceCreateFab.tsx`
- `features/invoices/components/VoiceInvoicePromptDialog.tsx`
- `features/estimates/components/VoiceEstimatePromptDialog.tsx`
- `features/clients/components/VoiceClientPromptDialog.tsx`
- `features/catalog/components/VoiceCatalogPromptDialog.tsx`

**Domain models:**
- Request: `multipart/form-data`, field `audio`, mimetype must start with `audio/`, 10 MB cap
- Response: a normal create response for the target entity (invoice / estimate / client / catalog)
- `AgentLanguage = es | en | fr | pt | de` — read server-side from `Workspace.language`

**API endpoints used:**
- `POST /api/v1/invoices/from-voice-audio` (multipart `audio`)
- `POST /api/v1/invoices/from-voice-transcript` — `{ businessId, clientId, transcript (8–16000) }`
- `POST /api/v1/estimates/from-voice-audio` (+ `{ businessId, clientId }`)
- `POST /api/v1/clients/from-voice-audio`
- `POST /api/v1/catalog/from-voice-audio` (+ `{ businessId }`)
- `GET /api/v1/subscription/status` → `voiceUsage: { limit, used, windowEnd }`

**Mobile screens to build:**
- `VoiceCaptureSheet` — record → waveform → stop → upload → review, presented over any module screen

**Expo Router file structure:**
No routes of its own — a shared sheet component mounted from each module's FAB. Optionally a
`app/(main)/voice-capture.tsx` modal route if a global entry point is wanted.

**Components to build:**
- `VoiceAudioRecorder` — port of the web component: `expo-audio` recording, elapsed timer, 5-minute
  cap, 28-bar amplitude waveform from metering
- `VoiceCreateFab` — mirrors `components/shared/VoiceCreateFab.tsx`
- `VoicePromptSheet` — per-module prompt copy + record + upload + result review

**Hooks / logic to port:**
- `useWorkspaceLanguage`, `useUpsertWorkspaceLanguage` (`features/workspace`)
- The `from-voice-audio` service functions already exist in
  `features/{invoices,estimates,clients,catalog}/service/*.service.ts` — port as-is
- `hooks/use-limit-guard.ts` for `VOICE_MONTHLY_LIMIT` (`MINIMUM_VOICE_MONTHLY_LIMIT = 25`, rolling
  window anchored to billing day-of-month)

**Mobile-specific considerations:**
- **Permission:** `NSMicrophoneUsageDescription` (iOS) and `RECORD_AUDIO` (Android) in `app.json`.
- **Format:** record to `m4a`/`aac` and send `type: 'audio/m4a'`. The backend filter requires the
  mimetype to start with `audio/`; `expo-audio` defaults differ per platform — set the recording
  options explicitly and verify both platforms.
- iOS requires an audio session category change to record; `expo-audio` handles it, but it must be
  reset afterward or subsequent playback is silenced.
- 10 MB cap + 5-minute recording limit — enforce client-side with a visible countdown, as the web does.
- Show the AI-extracted result for confirmation before persisting. On a phone, a bad extraction is far
  more annoying to fix than on desktop.
- `VOICE_MONTHLY_LIMIT` is a 402 — pre-check with `useLimitGuard` and surface remaining quota in the
  sheet from `voiceUsage`.
- Keep the screen awake during recording (`expo-keep-awake`).
- **Native surface is small** — `expo-audio` only. This is why it ships in v1 while LiveKit does not.

**Implementation steps:**
1. Add `expo-audio` + microphone permission config; build the permission request flow.
2. Build `VoiceAudioRecorder` with metering-driven waveform, timer, and the 5-minute cap.
3. Build `VoicePromptSheet` with upload state, error handling, and quota display.
4. Wire `POST /clients/from-voice-audio` first (simplest response shape) and verify end-to-end.
5. Wire catalog, then estimates, then invoices (each needs `businessId` / `clientId` context).
6. Add `VoiceCreateFab` to each module's list screen.
7. Add the language picker link in `configuration/general.tsx`.

**Estimated effort:** 3–4 days solo

---

## Deferred Features (post-v1)

Documented so the boundary is explicit and later phases have a starting point.

| Feature | Web routes | Why deferred | Notes for later |
|---|---|---|---|
| **LiveKit Voice Assistant** | `app/voice/*`, `components/agents-ui/*` | Largest native dependency in the project; forces an EAS dev build. Full spec in the next section. | v2, highest-value deferred item |
| **Proposals** | `app/(main)/proposals/*` | Created only by converting an estimate; lower mobile urgency. No `forms/` on web either. | Endpoints and `@addinvoice/schemas` proposals types are all ready; mirrors the estimate detail screen |
| **Advances** | `app/(main)/advances/*` | Plan-gated (`requireAdvancesAccess`; MINIMUM excluded); multi-image attachment sync is a large sub-feature | `POST /advances/:id/attachments/sync` (multipart, ≤20 files, 10 MB each) is very mobile-friendly — good v2 candidate |
| **Public accept / share pages** | `app/estimate/accept/[token]`, `app/proposal/accept/[token]`, `app/public/[slug]` | These are the *client's* experience, not the *user's*. They stay on the web; mobile only generates and shares the links. | Do not port. `POST /:sequence/share-link` + native `Share` is the mobile surface |
| **Ask Me How / Tour** | `app/(main)/ask-me-how`, `components/tour/*` | The tour is DOM-rect-overlay based (`data-tour-id`) with no RN equivalent — needs a full redesign, not a port | Rebuild on `react-native-copilot` or a bespoke measured overlay using `onLayout` (`ui-measure-views` — never `measure()`) |
| **Reputation** | `app/(main)/reputation` | Fully local state, no API on web | Blocked on a backend contract |
| **Logo AI** | `app/(main)/logo-ai` | Not in web navigation; `localStorage` draft only | Blocked on a backend contract |
| **`/payments/methods`** | `app/(main)/payments/methods` | Local mock type, no service | Real payment-method config is covered by Configuration → `/workspace/payment-methods` |

### Deferred detail: LiveKit Voice Assistant (v2 work order)

Recorded now because it affects native-build planning.

**Client contract is minimal.** STT (Deepgram nova-3), LLM (GPT-4.1-mini), TTS (Cartesia sonic-3),
Silero VAD, multilingual turn detection, and background-voice cancellation **all run server-side** in
the agent worker (`apps/agent/src/main.ts`). The client publishes a mic track and subscribes to the
agent's audio track. No on-device audio processing.

- `POST /api/v1/livekit/token` → **HTTP 201** `{ participant_token, server_url }`
- Optional body: `{ agent_name?, participant_identity?, participant_name?, room_config? }`
- `workspaceId` and `language` are **entirely server-derived** — read from the workspace row and
  embedded in `RoomConfiguration.agents[].metadata`. The mobile client sends no metadata.
- Room name is baked into the JWT grant and is not returned.
- Gates: `403 SUBSCRIPTION_INACTIVE` (status not ACTIVE/TRIALING), `403 VOICE_PLAN_REQUIRED`
  (`hasVoiceAccess`). Mirror `app/voice/voice-plan-gate.tsx` client-side.
- Agent workflows reachable via the root agent's `routeToWorkflow` tool: `invoice`, `estimate`,
  `client`, `catalog`, `payment`, `expense`, `insights`.

**Native SDK considerations:**
- `@livekit/react-native` + `@livekit/react-native-webrtc` — **cannot run in Expo Go**; requires an EAS
  development build and a config plugin.
- `registerGlobals()` must be called before any LiveKit import.
- **Permissions:** `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS`.
- **Background audio:** iOS `UIBackgroundModes: ["audio"]` if the session should survive
  backgrounding; otherwise end the session on `AppState` change to `background`.
- iOS audio session must be configured for `playAndRecord` with the speaker as default output, or the
  agent's voice routes to the earpiece.
- Handle interruptions (incoming call, Siri) — `AppState` + LiveKit room disconnect events.
- Add `livekit-client` to root `pnpm.overrides` alongside the existing `@livekit/protocol` pin.
- All web voice UI (`components/agents-ui/*` — visualizers, control bar, transcript, and a 917-line
  WebGL shader) needs RN equivalents. Build the audio visualizer on **Reanimated shared values driven
  by the audio level, animating only `transform`/`opacity`** (`animation-gpu-properties`,
  `animation-derived-value`). Do not attempt to port `react-shader-toy.tsx`.
- Transcripts arrive over LiveKit's transcription channel (`useTranscriptions` / room events), not HTTP.

**Estimated effort:** 6–9 days solo (v2)

---

## Implementation Order

1. **Global infra** — nothing can be built without the app shell, API client, and design-system
   primitives. See the next section.
2. **Auth & Onboarding Funnel** — everything else is gated behind it, and the funnel (onboarding →
   trial → setup) must exist before any authenticated screen renders.
3. **Configuration → Businesses** *(the `CompanyForm` + `BusinessSelector` half only)* — invoice and
   estimate forms hydrate their tax/notes/terms defaults from the business record, and every document
   requires a `businessId`. Building this early prevents rework in the two biggest features.
4. **Clients** — the reference CRUD feature. Establishes the list/detail/form skeleton, `ListCard`,
   infinite scroll, search, `KeyboardAvoidingView` patterns, and image upload that every later module
   reuses. It is also a hard dependency of invoices and estimates.
5. **Catalog** — small, and produces `CatalogSelectionSheet`, which invoices and estimates both need.
6. **Invoices** — the core product. Delivers the document-form skeleton, totals math, PDF download,
   send/share flows, and payment mutations.
7. **Payments** — cheap immediately after invoices, since the invoice-scoped payment mutations are
   already written.
8. **Estimates** — generalizes the invoice form skeleton; adds descriptive items, exclusions, timeline,
   and the Cleaning Calculator.
9. **Dashboard** — deliberately late. It aggregates data from every prior module, so building it last
   means the chart and KPI tiles are validated against real ported data instead of stubs.
10. **Expenses** — self-contained and the most native-feeling. Placed here because camera + permissions
    + the two-step upload is a focused chunk best done without competing for attention.
11. **Configuration → remaining screens** — payment methods, invoice defaults, general, subscription,
    account. Polish pass once every setting has a consumer.
12. **Voice Capture (audio)** — layers onto four already-finished modules; needs their create flows to
    exist so the AI-extracted result has somewhere to land.

*(v2: LiveKit Voice Assistant → Advances → Proposals → Tour/Ask-Me-How.)*

---

## Global Infra to set up before features

**Repo prerequisites — ✅ DONE, verified with `pnpm install && pnpm build` (6/6 tasks passing):**
- ✅ Removed the stale `"@addinvoice/db": "workspace:*"` from `packages/schemas/package.json`. Nothing
  in `packages/schemas/src` imported it — all 21 external imports are `zod`. pnpm had been creating a
  live symlink at `packages/schemas/node_modules/@addinvoice/db`; that is now gone.
- ✅ Added the `types` condition to the schemas `exports` map.
- ✅ Pinned `zod` to exactly `3.25.76` in all five workspace packages (`schemas`, `backend`, `frontend`,
  `agent`, `pdf-service`). **Deliberately not a root `pnpm.overrides` entry** — an unscoped `zod`
  override also rewrites third-party *peer* ranges in the lockfile (e.g. `@ai-sdk/provider-utils`
  `^3.25.76 || ^4.1.8` → `3.25.76`), which would silently force zod 3 on a future dep that needs zod 4.
  `monorepo-single-dependency-versions` calls overrides a last resort and prefers exact versions.
- **Web impact: none.** No source file changed; the package's public API is byte-identical. 116
  frontend / 82 backend / 3 agent files import `@addinvoice/schemas` and all still build. `pnpm lint`
  fails on `@addinvoice/pdf-service` — confirmed **pre-existing** by re-running against a stashed tree
  (unused `puppeteer` import + `perfectionist/sort-imports`, unrelated to this change).

**Still outstanding (optional, high leverage):**
- Promote invoice / payment / catalog / workspace / dashboard schemas into `packages/schemas` and
  mirror `InvoiceStatus`, `SubscriptionPlan`, `SubscriptionStatus`, `PaymentMethodType` into
  `packages/schemas/src/enums.ts`. Until then the mobile app keeps local mirrors that can drift.
- Add `syncpack` to CI so version drift can't reappear.

**Expo project init:**
- `npx create-expo-app@latest apps/mobile --template default` (TypeScript, Expo Router)
- `apps/mobile/package.json` name `@addinvoice/mobile`; add `dev` / `build` / `lint` scripts so Turbo
  picks them up; add `dev:mobile` to the root `package.json` scripts alongside the existing
  `dev:backend` / `dev:frontend`
- `tsconfig.json` extends `@addinvoice/typescript-config/react-library.json`, overriding
  `moduleResolution` to `bundler`

**Metro + monorepo:**
- `metro.config.js`: `watchFolders = [monorepoRoot]`; `resolver.nodeModulesPaths = [app/node_modules,
  root/node_modules]`; `resolver.unstable_enableSymlinks = true`; `resolver.disableHierarchicalLookup = true`
- **`resolver.blockList` is the load-bearing one.** `watchFolders = [monorepoRoot]` makes Metro crawl
  the entire repo, including `packages/db/src/generated` (2.7 MB of generated Prisma client) and the
  other apps' build output. Block `packages/db`, `apps/*/dist`, `apps/frontend/.next`, and
  `apps/*/node_modules`. No `.node` engine binaries live outside `node_modules`, so this is startup
  cost rather than a crash — but it compounds on every file-watch cycle.
- Verify `import { EstimateStatus } from '@addinvoice/schemas'` resolves in a scratch screen **before**
  writing any feature code

**Expo Router setup:**
- Root `_layout.tsx`: `GestureHandlerRootView` → `ClerkProvider` → `QueryProvider` →
  `ClerkTokenProvider` → `UpgradeSheetProvider` → `Stack`
- Route groups `(auth)`, `(funnel)`, `(main)` matching the web's `(auth)` / `(main)` groups
- `NativeTabs` in `(main)/_layout.tsx` (`navigation-native-navigators`)
- Deep-link scheme `addinvoices://` + universal links in `app.json`

**Auth SDK:**
- `@clerk/clerk-expo` + `expo-secure-store` token cache
- Google + Apple OAuth in the Clerk dashboard; `expo-apple-authentication`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

**API client:**
- `lib/api/client.ts` — port of `apps/frontend/lib/api/client.ts` (module-level token getter, Bearer
  header, `expo-router` redirects replacing `window.location.href`)
- `lib/api/public-client.ts`, `lib/api/types.ts`
- `lib/errors/handler.ts` + `lib/errors/handle-error.ts` — port verbatim
- `lib/upgrade/store.ts` — zustand replacement for `lib/upgrade-dialog/store.ts`
- `components/providers/query-provider.tsx` — mirror the web QueryClient config exactly
  (`staleTime 30s`, `gcTime 5m`, retry skips 429/401/403, mutations `retry: 1`)

**Shared UI primitives (`components/ui/`):**
- Re-export barrel per `imports-design-system-folder` — app code imports `@/components/ui`, never
  `react-native` or `expo-image` directly
- `View`, `Text`, `Button`, `Input`, `Card`, `Badge`, `Sheet`, `Select`, `Switch`, `Skeleton`,
  `Spinner`, `DatePicker`, `Image` (expo-image), `Pressable`, `List` (FlashList wrapper)
- `components/shared/ListCard.tsx` — port of `components/shared/list-card.tsx`, the app's most-reused
  compound component
- `DocumentStatusBadge` driven by a port of `lib/document-status-styles.ts`
- **`ui-styling`**: `borderCurve: 'continuous'` with every `borderRadius`; `gap` not margins;
  `experimental_backgroundImage` for gradients; `boxShadow` string syntax; avoid multiple font sizes —
  vary weight and color

**Styling:**
- NativeWind v4 + `tailwind.config.js`; port the design tokens from
  `apps/frontend/app/globals.css` (Tailwind v4 `@theme`) into the config
- `babel.config.js` with the NativeWind preset and `react-native-reanimated/plugin` **last**

**Navigation shell:**
- 5 native tabs with SF Symbols (mapping table above), `(main)/more.tsx` overflow screen
- Native stack headers with `headerLargeTitleEnabled` and `headerSearchBarOptions`
- Native form sheets for every dialog (`ui-native-modals`)

**Fonts (`fonts-config-plugin`):**
- Embed Geist / Geist Mono at build time via the `expo-font` config plugin in `app.json` — **not**
  `useFonts` / `Font.loadAsync`. Requires `npx expo prebuild` after adding.

**Environment config:**
- `.env` / `.env.example` with `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, and (v2)
  `EXPO_PUBLIC_LIVEKIT_AGENT_NAME`. Note that Expo inlines `EXPO_PUBLIC_*` into the bundle — never put
  a secret there.
- **`apps/frontend/.env.local` is committed with live Clerk test keys.** Do not repeat that in
  `apps/mobile`; gitignore `.env` and commit only `.env.example`.
- EAS: `eas.json` with `development` (dev client), `preview` (internal distribution), `production`
  profiles. A dev build is needed as soon as any non-Expo-Go native module lands.

**Lint / quality gates:**
- ESLint extending `@addinvoice/eslint-config/base` + `eslint-plugin-react-native`
- **Enable `react/jsx-no-leaked-render` from day one** (`rendering-no-falsy-and` — CRITICAL,
  prevents production crashes in an app full of numeric fields that are legitimately `0`)
- Optionally enable the React Compiler; if on, `memo`/`useCallback` become unnecessary but object
  reference stability in list data still matters

---

## Verification

Verification is manual and end-to-end, per the project's testing preference. The one exception is
noted below.

**Per-feature manual verification (run on a physical device, not just the simulator):**
1. `docker compose -f compose.dev.yml up -d` then `pnpm dev:backend`
2. `EXPO_PUBLIC_API_URL` → your machine's LAN IP (`http://192.168.x.x:4000`), **not** `localhost`
3. `pnpm dev:mobile` → open in Expo Go (or the dev build once native modules land)
4. Exercise the feature's full CRUD path and confirm the data appears in the web app at
   `localhost:3000` — cross-checking against web is the fastest correctness signal available
5. Confirm the create path against `pnpm --filter @addinvoice/db studio`

**One automated exception — invoice/estimate totals.** `features/{invoices,estimates}/lib/utils.ts`
computes subtotal, per-item tax, discounts, VAT, and balance. A silent divergence here produces wrong
money on real documents and will not be caught by eyeballing a screen. Add a small vitest suite in
`apps/mobile` with ~8 fixtures (per-product tax, by-total tax, no tax; percentage vs fixed discount;
VAT on/off; mixed quantity units) asserting the mobile port matches what
`POST /api/v1/invoices` returns for the same input.

**Cross-cutting checks before each phase is considered done:**
- **Funnel:** delete the app, reinstall, sign up fresh — verify onboarding → trial → setup →
  dashboard, and that killing the app mid-funnel resumes at the right step
- **App Store compliance (before every submission):** grep the app for `subscription/plans`,
  `subscription/checkout`, `subscription/portal`, `openBrowserAsync`, `openAuthSessionAsync`, and any
  currency symbol in a billing-related screen. None may appear on a billing path. Then walk the app as
  a trial user who has hit `MODULE_TRIAL_LIMIT` and confirm there is no route to a payment page
- **Error interception:** force a `401` (revoke the session in the Clerk dashboard), a `403
  BUSINESS_REQUIRED` (delete all businesses via Studio), and a `402 TRIAL_MODULE_LIMIT` (create 5 of
  any module on a trial workspace) — confirm each produces the right redirect or upgrade sheet
- **Dates:** create an invoice dated the 1st of a month and confirm it does not render as the last day
  of the previous month (the `fixedDateFromPrisma` regression)
- **Release build:** run `eas build --profile preview` at the end of each phase and smoke-test on
  device. `rendering-no-falsy-and` crashes only surface in release, not in dev
- **Permissions:** test camera, photo library, and microphone with permission **denied** — every path
  must degrade to manual entry, never dead-end
- **Performance:** with 200+ invoices seeded, scroll the list and confirm no dropped frames
  (React DevTools profiler / Perf Monitor). If items re-render on scroll, the cause is almost always a
  `.map()`/`.filter()` in the parent (`list-performance-function-references`)

---

## Resolved Decisions

1. **Apple In-App Purchase — RESOLVED: web-only purchase, in-app free trial.** `FREE_TRIAL` activation
   involves no money and stays in the app, so mobile-first signup still works end to end; paid
   conversion happens on the web under Guideline 3.1.3(b). No IAP, no in-app checkout, no billing
   portal, no prices rendered anywhere. Full rules and forbidden patterns are in
   **Feature: Auth & Onboarding Funnel → Mobile-specific considerations**. Costs ~1 day *less* than the
   original plan and keeps conversions on Stripe (~2.9%) rather than Apple (15–30%).

   *Revisit if mobile-first paid conversion becomes a real acquisition channel* — the fallback is
   RevenueCat on iOS, which costs ~4–6 days of backend work because App Store Server Notifications
   become a second writer to `Workspace.subscriptionPlan` / `subscriptionStatus`, alongside the
   existing Stripe webhook.

2. **`packages/schemas` prerequisites — RESOLVED and applied.** See Global Infra → Repo prerequisites.
   Verified with a full monorepo build; no web impact.

---

## Open Questions

**Decide before implementation:**

3. **Promote backend schemas to `packages/schemas`?** Invoice, payment, catalog, workspace, and
   dashboard schemas are backend-only, and `invoices.schemas.ts` imports `InvoiceStatus` from
   `@addinvoice/db`. Promoting them is ~half a day and eliminates a permanent duplication tax. Skipping
   it means mobile mirrors drift silently from the backend contract.

4. **Rich text on mobile.** Confirm that flattening TipTap JSON to plain text on edit is acceptable
   product behaviour. Formatting authored on the web is lost if the same field is edited on mobile.
   Alternative: make those fields read-only on mobile with an "edit on web" affordance.

5. **Offline support.** Currently none, on either platform. Options: (a) none — require connectivity;
   (b) React Query persistence (`@tanstack/query-async-storage-persister`) for read-only offline
   browsing; (c) full offline mutation queue. Recommend (b) for v1 — it is a few hours of work and
   covers the common "on a job site with bad signal" case. Receipt capture is the strongest candidate
   for a real offline queue.

6. **Push notifications.** Not present on web. Natural triggers exist server-side (invoice viewed,
   payment received, estimate accepted, reminder due — the BullMQ `email-reminders` worker already
   fires on these). Would need a new backend endpoint for device-token registration and a push
   dispatch step. Out of v1 scope but worth deciding now, since it affects the `app.json` and EAS
   credential setup.

7. **Expo Web target?** `apps/backend` CORS is single-origin
   (`origin: process.env.FRONTEND_URL ?? "http://localhost:3000"`, `src/server.ts`). Expo Web on
   `localhost:8081` will be blocked. If web is a target, add a separate allowlist env var — do **not**
   repurpose `FRONTEND_URL`, which also builds Stripe return URLs and outbound email links.

8. **In-app PDF preview vs download-and-share.** v1 assumes download + native share sheet.
   Inline preview needs `react-native-pdf` (native module, dev build). Confirm whether users expect to
   read invoices in-app or just forward them.

9. **Chart library.** `victory-native` (Skia-backed, better performance, heavier setup) vs
   `react-native-gifted-charts` (pure RN, simpler). Only one chart exists in v1 but it is on the home
   tab. Recommend `victory-native`.

10. **App identity.** Bundle identifier, App Store / Play Store listing names, icon and splash assets,
   and whether the mobile app ships under the ADDINVOICES or ADSTRATEGIC brand (the web app shows
   both — `addinvoices-icon.png` in the sidebar header, `addstrategic-blanco.png` in the footer).

11. **Draft persistence policy.** The web app keeps invoice/estimate drafts in component state and
    `localStorage`. On mobile, apps are backgrounded and killed constantly. Confirm the expected
    behaviour: persist drafts indefinitely, expire after N days, or discard on app kill.

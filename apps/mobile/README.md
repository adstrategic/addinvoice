# @addinvoice/mobile

Expo (SDK 57) React Native client for ADDINVOICES. Talks to `apps/backend` over
the same REST API the web app uses — a Clerk Bearer token is the whole auth
contract, and no backend changes are required.

## Running it

The whole stack, Metro included, runs under compose:

```bash
docker compose -f compose.dev.yml up -d
docker compose -f compose.dev.yml logs -f mobile   # QR code prints here
```

Set `LAN_IP` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the **repo-root `.env`**
— compose substitutes them into the `mobile` service. If scanning is awkward,
type `exp://<LAN_IP>:8081` into Expo Go directly.

The bundle runs on a phone, not in the Docker network, so `EXPO_PUBLIC_API_URL`
must be the host's LAN address. Pointing it at `http://backend:4000` cannot work
— the phone can't resolve compose service names.

Two things behave differently than a host-run Metro: the interactive keys
(`r` to reload, `m` for the menu) need `docker compose attach mobile`, and file
changes arrive via compose watch, so start it with `--watch` if you want live
reload:

```bash
docker compose -f compose.dev.yml up -d --watch
```

### Running Metro on the host instead

```bash
cd apps/mobile && pnpm dev
```

Uses `apps/mobile/.env` rather than the root one. Faster feedback and full CLI
interactivity, at the cost of differing from the containerised setup.

### `EXPO_PUBLIC_API_URL` on WSL

This machine's `.wslconfig` sets `networkingMode=mirrored`, so WSL shares the
Windows host's network interfaces — `hostname -I` and the Windows adapter report
the same address, and a phone on the same LAN can reach both Metro (8081) and
the backend (4000) directly. No portproxy or tunnel needed.

If a connection times out, the cause is almost always Windows Firewall rather
than the address. From an elevated PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Expo Metro"  -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "AddInvoices API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

Without mirrored networking (a different machine, or the setting removed), the
WSL address is NAT'd and unreachable — then you need `netsh interface portproxy`
rules or `expo start --tunnel`.

`localhost` never works from a device. `EXPO_PUBLIC_*` values are inlined at
bundle time, so restart Metro after changing them.

## Things that will bite

- **`@addinvoice/schemas` must be built.** It ships compiled ESM from `dist/`.
  `pnpm dev:mobile` builds it first (`turbo.json` → `dev.dependsOn: ["^build"]`),
  but a bare `expo start` does not.
- **Metro keeps hierarchical lookup on.** pnpm's isolated linker puts each
  package's dependencies under `node_modules/.pnpm/<pkg>/node_modules`, and
  Metro only finds them by walking up. Do not set `disableHierarchicalLookup`.
- **Transitive deps must be declared directly.** Anything the app's own source
  imports needs to be in this `package.json`, even if it arrives transitively —
  `react-native-css-interop` is here for exactly that reason. Native modules
  need it too, since autolinking only scans the app's `node_modules`
  (`monorepo-native-deps-in-app`).
- **Tailwind is v3 here, v4 on the web.** NativeWind requires v3, and the design
  tokens are hand-converted from `apps/frontend/app/globals.css` (oklch, which
  RN cannot parse) into hex in `tailwind.config.js`. Editors configured for the
  web's v4 will flag `@tailwind` directives in `src/global.css` — that warning is
  wrong for this package.
- **Fonts need a dev build.** Geist is embedded via the `expo-font` config
  plugin, not `useFonts`, so it only appears after `expo prebuild` / a dev build.
  In Expo Go text falls back to the system font.
- **`pnpm approve-builds`** after adding native dependencies — pnpm 10 blocks
  postinstall scripts, and the failure shows up at runtime, not at install.

## App Store compliance (Guideline 3.1.1)

Paid conversion happens on the web under Guideline 3.1.3(b). Activating
`FREE_TRIAL` moves no money, so it is account provisioning and stays in the app.

The app must never contain: a price or plan tier, a call to
`subscription/plans`, `subscription/checkout` or `subscription/portal`, a link
to Stripe or the billing portal, or wording that steers the user to purchase
elsewhere. Before every submission:

```bash
grep -rnE "subscription/(plans|checkout|portal)" src/    # must be empty
grep -rnE "openBrowserAsync|openAuthSessionAsync" src/   # only Clerk SSO
```

## Structure

```
src/
  app/            Expo Router routes — (auth), (funnel), (main)
  components/     ui/ design-system barrel, providers, guards, feature widgets
  features/       onboarding, subscriptions, businesses (service + hooks)
  hooks/          use-onboarding-funnel, use-subscription, use-has-business
  lib/            api client, errors, funnel, format, upgrade store
```

App code imports primitives from `@/components/ui`, never from `react-native` or
`expo-image` directly (`imports-design-system-folder`).

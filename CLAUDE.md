# Twitch Radar — CLAUDE.md

Production browser extension (Chrome Web Store + Firefox Add-ons) that tracks the
user's followed Twitch streamers, shows who is live, and sends per-streamer
desktop notifications. Real users depend on it — **nothing may break**.

- Chrome Web Store ID: `fcjbgobfppjggabcbbnngehhefllbllm`
- Firefox add-on ID (gecko): `twitch-radar@nikita0x`
- Local unpacked Chrome dev ID (pinned via `key` in `wxt.config.ts`, dev server only): `anejamjbmgpekamgljajekmgnbppnjao`

## How to work with me (owner's rules — most important section)

- **Senior developer + mentor, not a vibe-coder.** The owner has ~3 years of
  commercial frontend experience and wants to level up in **system design**.
- **Discuss architecture before writing code.** For any non-trivial feature:
  1. Describe the problem and constraints (Chrome vs Firefox, MV3 service worker
     lifecycle, storage limits, Twitch API limits, Cloudflare free tier).
  2. Propose 2–3 options with trade-offs and a recommendation.
  3. Wait for the owner to confirm the approach. Only then implement.
- **Teach while doing:** explain *why* (patterns, browser APIs, pitfalls), not
  just *what*. Point out problems in existing code when relevant.
- Small, reviewable changes. Run `npm run check` after changes.
- Communication with the owner is in Russian; code, comments, and commits in English.

## Release checklist (remind the owner EVERY release)

1. Bump `version` in `wxt.config.ts` (manifest version).
2. Add a new entry at the top of the `CHANGELOG` array in
   `src/screens/changelog/ChangelogScreen.vue` (users see it in-app).
3. `npm run build` / `npm run build:firefox`, then `npm run zip` / `npm run zip:firefox`.
4. If `worker/` changed: `cd worker && npx wrangler deploy` (and apply D1
   migrations to remote if any were added — see below).
5. Upload to the stores.
6. ⚠️ **Add the extension's `browser.runtime.id` / redirect URL to the Twitch
   Developer Console (OAuth Redirect URLs)** after publishing. If it's missing,
   users **cannot log in**. Always remind the owner about this step.
7. If a new Chrome ID appears, also add it to `CHROME_EXTENSION_ID` in
   `worker/wrangler.jsonc` (CORS allowlist) and redeploy the worker.

## Stack

- [WXT](https://wxt.dev) 0.21 (extension framework), Vue 3 + Pinia, TypeScript.
- Chrome builds MV3 (`.output/chrome-mv3`), Firefox builds MV2 (`.output/firefox-mv2`).
- Backend: Cloudflare Worker + D1 (free tier) in `worker/` (separate npm package, wrangler).
- Formatting: Prettier (`npm run format`), tabs.

## Commands

```sh
npm run dev            # WXT dev server + HMR (Chrome) — owner loads extension and watches changes
npm run dev:firefox    # same for Firefox
npm run prod           # dev server with .env.production (real deployed worker URL)
npm run check          # vue-tsc type check
npm run build          # check + production build (Chrome)
npm run build:firefox  # check + production build (Firefox)
npm run zip / zip:firefox   # store packages

cd worker
npx wrangler dev       # local worker (secrets in worker/.dev.vars, gitignored)
npx wrangler deploy    # deploy worker
npx wrangler d1 migrations apply <db> --remote   # apply migrations to prod D1
npm test               # vitest (CORS allowlist tests)
npx wrangler types     # regenerate Env types after changing bindings
```

Env: `WXT_WORKER_URL` in `.env` (dev) / `.env.production` — exposed as `import.meta.env.WXT_WORKER_URL`.

## Architecture

```
src/
  entrypoints/
    background.ts      # service worker (MV3) / background page (MV2): alarm polling, notifications, OAuth, uninstall URL
    popup/             # main UI (App.vue), 500x600
    options/           # options page (Options.vue)
  screens/             # popup "pages": favorites, settings, streamer-settings, changelog, testing
  stores/              # Pinia: twitch (auth + Twitch data), user-settings, storage, navigation
  services/            # storage.service (browser.storage), twitch-api, auth, badge, cloudflare (settings sync)
  types/result.ts      # Result<T> type + request() fetch wrapper — no throwing for HTTP errors
  constants.ts         # Twitch CLIENT_ID, alarm name
shared/                # types shared between extension and worker (alias @shared)
worker/src/index.ts    # Cloudflare Worker: /uninstall (HTML survey), /feedback (→ Telegram), /settings (D1 sync)
```

### Key flows

- **Auth:** popup builds Twitch implicit-grant URL (`response_type=token`,
  scope `user:read:follows`, redirect `browser.identity.getRedirectURL()`) and
  sends `OAUTH_LOGIN` to background, which runs `identity.launchWebAuthFlow`
  (so it survives the popup closing). Token is stored in `storage.local` `auth`.
- **Polling:** `browser.alarms` every 30s (`periodic-notification`). Background
  fetches `/helix/streams/followed`, updates the badge, compares with
  `runtime.previousStreams` snapshot and fires live / title-change /
  category-change notifications per streamer settings (optionally `tabs.create`
  to auto-open the stream).
- **Navigation:** no router — `navigation.store` holds `currentScreen`, App.vue
  maps it to a component.
- **Storage:** `browser.storage.local` with three independent top-level keys
  `auth`, `userSettings`, `runtime` — never write them back as one blob (lost
  updates between popup and background). Always save via the targeted
  `save*()` functions. `toPlain()` strips Vue proxies (Firefox rejects them).
- **Cloud sync (v1.6.0):** on login `syncSettings()` — remote settings win if
  present, otherwise local are uploaded. Every settings change PUTs the full
  settings to the worker. D1 table `user_settings(user_id PK, settings JSON TEXT, updated_at)`.
- **Uninstall feedback:** `runtime.setUninstallURL` → worker `/uninstall` page
  → `/feedback` → Telegram bot (secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
- **Worker CORS:** allows listed Chrome IDs and any `moz-extension://` origin
  (Firefox UUIDs are random per profile).

### Chrome vs Firefox differences (branch with `import.meta.env.FIREFOX`)

- Notifications: Firefox doesn't support `buttons` / `priority` (throws) — click
  on notification body opens the stream instead.
- Badge: Firefox MV2 has `browserAction`, no `setBadgeTextColor` → use `setBadge()` in `badge.service.ts`.
- Storage: Firefox structured-clone rejects reactive proxies → `toPlain()`.
- Firefox needs `browser_specific_settings.gecko` (fixed ID + `data_collection_permissions`).
- Any new browser API: check support in both browsers before using it.

## Product content

- **Changelog tab:** add an object to `CHANGELOG` in `ChangelogScreen.vue` —
  it renders automatically (supports `icon`, `description`, `bullets`, `preview` component, `link`).
- **Ideas tab:** `IDEAS` array in the same file — public roadmap for users.
- Backlog / ideas also live in `TODO.md` and `FEATURES.md`; release notes in `RELEASE.md`.

## Known issues / tech debt (discuss before touching)

- `/settings` auth: client sends `Authorization: Bearer <twitch token>`, worker
  resolves `user_id` via `https://id.twitch.tv/oauth2/validate` (+ checks
  `client_id`) on every request. Never trust `user_id`/Origin from the request.
  Request body (settings JSON) is **not validated yet** — TS interfaces don't
  exist at runtime.
- No token validation/expiry handling: Twitch requires validating tokens
  (`/oauth2/validate`) and implicit tokens expire; a 401 currently just logs.
- Errors are only `console.error` — no user-facing error UI (see TODO.md).
- Settings sync is last-write-wins with full-object PUTs; on login remote overwrites local.
- `TestingScreen.vue` is a dev playground.

# Mono — agent notes

Minimal private app base: Next.js 16 (App Router) + Appwrite. TypeScript strict, zod everywhere, no `any`.

## Verify

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
npm run build       # next build (needs .env present; Appwrite is not called at build time)
```

`npm run check` runs all four. `npm run setup` creates/verifies the Appwrite tables (idempotent). `npm run telegram:webhook <origin>` registers the bot's webhook (read-only check: `info`). `npm run telegram:menu <origin>` sets the Mini App menu button (read-only check: `info`).

Toasts: `import { toast } from "sonner"` — `<Toaster />` is mounted in the root layout. Vercel Analytics is mounted too (no config needed).

## Hard rules

- Imports use `@/*` (repo root). **`@/src/` and `@/app/components/` do not exist** — they were the old layout and all such imports were removed.
- `components/interface/*` = composed client experiences; `components/ui/*` = primitives; pages in `app/(app)/` are server components wrapped in `<Suspense>` (the app uses `cacheComponents`).
- `features/<name>/{service,store,schemas,client-api,data,types}.ts` — services are server-only (`import "server-only"`), take explicit ids, never read cookies. Client state lives in `store.ts` (zustand) and talks to `/api/*` via `client-api.ts`.
- **Table/attribute names: one lowercase word.** Never add snake_case or camelCase columns. Appwrite system fields (`$id`, `$createdAt`) excepted.
- API route shape: `isSameOrigin` (mutations) → `getAuthAccount` → zod `safeParse` (`.strict()`) → service → `NextResponse`. Errors: `logFailure(...)` + `jsonError(status, CODE, msg)`.
- `notify(recipient, actor, type, ref?)` in `features/notifications/service.ts` is the one-call public API every app feature uses to notify. It skips self-notifications and best-effort forwards to Telegram.
- Notifications `type` is a past-tense verb phrase ("followed you"); render as `${actorName} ${type}`.
- Auth = Appwrite email token (6-digit code). Session cookie name is `a_session_<APPWRITE_PROJECT_ID>`; `proxy.ts` redirects unauthenticated page views to `/auth`.

## Gotchas

- `app/(app)/` route group holds the authenticated chrome — sticky full-width top bar on desktop (back · Mono · bell · account dropdown), slim top bar + bottom thumb bar on mobile (Notifications · Settings only; sign out lives on a mobile-only settings row). `/auth` intentionally renders without it — do not move `auth` into the group. Keep links non-duplicated between the two chromes.
- Base UI dropdown: `DropdownMenuLabel` renders `Menu.GroupLabel` and **must** sit inside `<DropdownMenuGroup>`, or the app throws `MenuGroupContext is missing` when the menu opens.
- Settings page edits `users.name` (rowId = account id), not the Appwrite auth name. `/api/auth/me` still returns the auth account as-is.
- Telegram tables are `telegram` (connections) and `codes` (one-time link codes, sha256 hashed). Renaming either breaks the link flow.
- `features/instants` was removed; anything referencing it is stale.

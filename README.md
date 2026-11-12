# Mono

A minimal, private base for your next app — Next.js 16 (App Router, React 19, Tailwind 4) with an Appwrite backend, email-code auth, a generic notifications system, and a Telegram connection. Clone it, rename it, ship your idea.

## Stack

- **Next.js 16** · App Router · React Server Components · `cacheComponents`
- **React 19** · **TypeScript** (strict)
- **Tailwind CSS 4** · shadcn-style UI (`components/ui`)
- **Appwrite** (node-appwrite) · tables, storage, auth via email token
- **Zod** · input validation · **Vitest** · unit tests · **Zustand** · client state · **sonner** · toasts · **@vercel/analytics** · usage metrics

## Quickstart

```sh
cp .env.example .env    # fill in your Appwrite project values
npm install
npm run setup           # creates the Appwrite tables (idempotent)
npm run dev
```

Scripts: `dev` · `build` · `start` · `lint` · `typecheck` · `test` · `check` (all four) · `setup` (idempotent table setup) · `telegram:webhook` (register the webhook) · `telegram:menu` (set the Mini App menu button).

Routes: `/auth` (sign in), `/` (home), `/notifications`, `/settings` (name · Telegram · sessions).

## Wiring notifications into your features

Notifications ship generic but **dormant** — your app decides when to notify. The one-call public API is `notify()` from `features/notifications/service.ts`:

```ts
import { notify } from "@/features/notifications/service";

// In any feature's server-side service — e.g. after someone follows you:
await notify(followingId, currentUserId, "followed you", followRowId);
//          ^recipient  ^actor         ^type            ^ref (optional)
```

- **`type`** is a past-tense verb phrase written with the recipient as the implied subject. Clients render `${actorName} ${type}` — no special-casing per notification kind.
- Self-notifications are skipped automatically; same actor+type within 24h collapses into one grouped row.
- If the recipient connected Telegram (Settings → Connect), a one-line summary is delivered there best-effort — failures never break the caller.
- Rows are stored in `notifications` (`recipient`, `actor`, `type`, `ref`, `read`) with a `recipient` index.

## Telegram

1. Create a bot with [@BotFather](https://t.me/BotFather), put `TELEGRAM_BOT_USERNAME` and `TELEGRAM_BOT_TOKEN` in `.env`, and generate a webhook secret: `openssl rand -hex 32` → `TELEGRAM_WEBHOOK_SECRET`.
2. Deploy (or expose locally), then register the webhook **once per environment**:
   ```sh
   npm run telegram:webhook https://your-app.example.com
   npm run telegram:webhook info   # see what's currently registered
   ```
3. Then point the bot's persistent menu button at the app (the Mini App button next to the input field):
   ```sh
   npm run telegram:menu https://your-app.example.com
   npm run telegram:menu info      # show current menu button
   ```
   Opening the bot now shows a **Mono** button that launches the full app as a Telegram Mini App. Bare `/start` also replies with an inline `Open Mono` button.
   The webhook URL is always `<origin>/api/telegram/webhook`; the secret is verified server-side with a timing-safe compare.

## Layout

```
app/
  (app)/            # authenticated area (sticky top bar desktop · floating pill mobile)
    page.tsx        # home
    notifications/  # notifications page
    settings/       # account, telegram, sessions
  api/              # route handlers (thin: auth check → service call)
  auth/             # public sign-in screen
  error.tsx         # branded global error screen
  not-found.tsx     # branded 404 screen
components/
  ui/               # design system primitives (button, card, input…)
  interface/        # composed experiences (settings, notifications, shell…)
features/
  auth/             # email-code sign-in, session helpers, zod schemas
  users/            # users row: email + name (rowId = auth account id)
  notifications/    # generic notifications: notify(), list, mark-read
  telegram/         # telegram link/unlink + webhook + delivery
scripts/
  setup-appwrite.mjs # one-shot idempotent table setup (npm run setup)
  telegram-webhook.mjs # register/inspect the webhook (npm run telegram:webhook)
  telegram-menu.mjs    # set the Mini App menu button (npm run telegram:menu)
lib/
  http.ts           # jsonError, isSameOrigin, getAuthAccount, logFailure
  appwrite/
    server.ts       # admin/account clients, cookie helpers
    tables.ts       # getTables, getDatabaseId, runTransaction
```

## Conventions

- **Import alias** `@/*` → repo root. Server-only code imports `"server-only"`.
- **Tables & attributes are one lowercase word** (`users`, `notifications`, `telegram`, `codes`; attrs like `recipient`, `actor`, `ref`, `read`). No snake_case, no multi-word columns — that includes future tables.
- **`users` row id = the auth account `$id`**. One-to-one, no join table.
- **Notifications `type`** is a past-tense verb phrase ("followed you", "liked your post"): clients render `${actorName} ${type}`. Grouping collapses same actor+type within 24h.
- **API routes** stay thin: `getAuthAccount` → zod parse → service → `jsonError` on failure. Services never read cookies; they take explicit ids.
- **shadcn primitives first** — `components/ui` for primitives, Tailwind for the rest; keep one-off pixel values to a minimum and prefer theme tokens (`surface-card`, `--color-*`, `--shadow-*`).
- **Env names stay as Appwrite docs define them** — see `.env.example`.

## Appwrite tables

| Table | Attributes | Indexes |
|---|---|---|
| `users` | `email` · `name` | — (rowId = account id) |
| `notifications` | `recipient` · `actor` · `type` · `ref` · `read` | `recipient` |
| `telegram` | `user` · `member` · `chat` · `created` | `user`, `member` (unique) |
| `codes` | `user` · `hash` · `expires` · `used` | `hash` |

Create these with `npm run setup` (idempotent), or AppwriteException 404 at runtime until you do.

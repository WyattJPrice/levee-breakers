# Levee Breakers

New Orleans distance running coaching site — dark/light theme, built with Next.js 15 App Router.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **CSS Modules** — component-scoped styles
- **CSS Variables** — theming (`data-theme="dark"` / `data-theme="light"`)
- **Wix Headless** — auth, memberships, pricing plans
- **Appwrite** — athlete profile submissions (TablesDB) + photo storage
- **Telegram Bot** — coach approval notifications
- **Bebas Neue + Syne + DM Mono** via Google Fonts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Domain Transfer Checklist (levee.wyattprice.dev → leveebreakers.com)

### 1. DNS (Wix → Vercel)
- [ ] In Wix dashboard: **Domains → Manage → DNS Records**
- [ ] In Vercel: **Project Settings → Domains → Add `leveebreakers.com`**
- [ ] Vercel will provide an A record and CNAME — add both in Wix DNS
- [ ] Wait for propagation (minutes to a few hours) — Vercel shows green when live
- [ ] SSL is automatic once DNS resolves

### 2. Vercel Environment Variables
Update all of these in **Vercel → Project → Settings → Environment Variables**:

- [ ] `NEXT_PUBLIC_BASE_URL` → `https://leveebreakers.com`
- [ ] `NEXT_PUBLIC_WIX_CLIENT_ID` → from Jarrett's Wix project OAuth app
- [ ] `NEXT_PUBLIC_WIX_PLAN_MONTHLY` → Jarrett's monthly plan ID
- [ ] `NEXT_PUBLIC_WIX_PLAN_CONSULTATION` → Jarrett's consultation plan ID
- [ ] `WIX_API_KEY` → new API key generated from Jarrett's Wix project

To find these: Wix dashboard → **Headless Settings** → OAuth Apps (for client ID + API key) and **Pricing Plans** (for plan IDs).

### 3. Wix Headless — Authorized Domains
Auth redirects will break if the new domain isn't whitelisted.
- [ ] Wix dashboard → **Headless Settings → OAuth Apps → your app**
- [ ] Add `https://leveebreakers.com` to allowed redirect URIs / authorized domains
- [ ] Remove or keep `levee.wyattprice.dev` (safe to leave during transition)

### 4. Code — Update Hardcoded URLs
- [ ] `app/layout.tsx` — `alternates.canonical`, `openGraph.url`, all OG image URLs
- [ ] `app/yourstory/page.tsx` — `alternates.canonical`

### 5. Telegram Submission Notification
- New pending submissions now fire the Telegram approve/reject message **inline** from the
  submission API routes (`lib/telegram.ts` → `notifyNewSubmission`). There is no database
  webhook to configure — this replaced the former Supabase Database Webhook.

### 6. Telegram Webhook
- [ ] Re-register via browser or curl:
  ```
  https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://leveebreakers.com/api/telegram-webhook
  ```
- [ ] Verify: `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo`

### 7. Smoke Test After Cutover
- [ ] Home page loads, theme toggle works
- [ ] Sign in / sign out flow completes (Wix auth redirect)
- [ ] Plans page and checkout work
- [ ] Monthly member sees "Share Your Story" button
- [ ] `/yourstory` direct submission form submits
- [ ] Telegram receives notification with Approve/Reject buttons
- [ ] Approve/Reject updates Appwrite and edits the Telegram message
- [ ] OG preview correct — paste URL into [opengraph.xyz](https://www.opengraph.xyz)
- [ ] 404 page renders with nav

---

## Environment Variables Reference

| Variable | Where set | Notes |
|---|---|---|
| `NEXT_PUBLIC_WIX_CLIENT_ID` | Vercel + `.env.local` | Wix OAuth app client ID |
| `NEXT_PUBLIC_BASE_URL` | Vercel + `.env.local` | Current domain with https |
| `NEXT_PUBLIC_WIX_PLAN_MONTHLY` | Vercel + `.env.local` | Wix pricing plan ID |
| `NEXT_PUBLIC_WIX_PLAN_CONSULTATION` | Vercel + `.env.local` | Wix pricing plan ID |
| `WIX_API_KEY` | Vercel only | Server-side Wix API key |
| `APPWRITE_ENDPOINT` | Vercel + `.env.local` | Region endpoint, e.g. `https://nyc.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | Vercel + `.env.local` | Appwrite project ID |
| `APPWRITE_API_KEY` | Vercel only | Server key (databases + storage scopes). Never expose to browser |
| `CRON_SECRET` | Vercel only | Optional — protects `/api/keep-alive` from public calls |
| `TELEGRAM_BOT_TOKEN` | Vercel + `.env.local` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Vercel + `.env.local` | Comma-separated for multiple recipients |

## Appwrite

Data lives in one Appwrite database (`main`) with three tables — `athlete_profiles`,
`coach_stats`, `bot_pending` — plus a public-read `athlete-photos` storage bucket.

- **Provision schema:** `npm run appwrite:setup` (idempotent)
- **Migrate data from Supabase:** `npm run appwrite:migrate` (idempotent; re-uploads photos)
- **Keep-alive:** a daily Vercel Cron (`vercel.json`) hits `/api/keep-alive`, doing a tiny
  Appwrite read so the Free-plan project never hibernates from inactivity.

Both scripts read credentials from `.env.local` (`APPWRITE_*`, and for migration `SUPABASE_*`).

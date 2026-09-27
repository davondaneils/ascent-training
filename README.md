# Ascent

A personal, phone-first training app for one user: open it, see today's session, do one exercise at a time, log weight and reps, and let it handle rest timers and progression. It runs cardio with minimal logging and keeps history in the cloud.

The product spec lives in [`docs/`](docs) (start with `00-OVERVIEW.md`, then `01-PRD.md`). `docs/07-ACCEPTANCE.md` is the definition of done.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui · Motion · Supabase (Auth + Postgres) · Vercel · PWA.

---

## Local setup

Requires **Node 24+**. There's no Docker or Supabase CLI: the app talks to a hosted Supabase project.

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run db:push              # create tables, RLS, and seed Phase 1
npm run dev                  # http://localhost:3000
```

### 1. Supabase project
1. Create a project at supabase.com and save the database password.
2. **Project Settings → API Keys**: copy the Project URL, the anon/publishable key and the service_role/secret key into `.env.local`.
3. **Connect → Session pooler**: copy the URI into `SUPABASE_DB_URL` and fill in your password. This is only used by `npm run db:push`.
4. **Authentication → Users → Add user**: create your account (auto-confirm).
5. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
6. **Authentication → URL Configuration**: set the Site URL to your app URL and add `<app-url>/**` to Redirect URLs (plus `http://localhost:3000/**` for development).
7. *(Recommended)* Set up custom SMTP (e.g. Resend) so you can edit **Emails → Magic Link** to include `{{ .Token }}`. That gives you a 6-digit code, which is the reliable way to sign in inside the installed iPhone app, because magic links open in Safari instead.

### 2. Environment variables

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | E2E setup only. **Never** exposed to the browser or used by the app |
| `ALLOWED_EMAIL` | the one address the login form will send codes to |
| `NEXT_PUBLIC_APP_URL` | magic-link redirect base (`http://localhost:3000` or your Vercel URL) |
| `SUPABASE_DB_URL` | `npm run db:push` only |
| `E2E_EMAIL` | E2E only: a separate test account, never your real one |

### 3. First run
Sign in, pick the Phase 1 start date (it defaults to next Monday), and you're in. The start date is set once.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. The framework preset is Next.js; keep the defaults.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAIL`, and `NEXT_PUBLIC_APP_URL` (your production URL, e.g. `https://ascent-xyz.vercel.app`). Vercel doesn't need the service-role key or `SUPABASE_DB_URL`.
4. Deploy.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to the production URL and add `https://<your-domain>/**` to Redirect URLs.
6. On your phone, open the URL in Safari, tap **Share → Add to Home Screen**, and launch Ascent from the icon.

Schema changes: add a new SQL file under `supabase/migrations/` and run `npm run db:push` (it only applies files it hasn't applied yet, then re-runs the idempotent seed).

---

## Scripts

```bash
npm run dev               # dev server
npm run build             # production build
npm run test              # unit tests (Vitest): training domain, progression, timers, offline sync
npm run test:e2e          # critical flows (Playwright) against Supabase as E2E_EMAIL
npm run typecheck
npm run lint
npm run db:push           # apply migrations + seed
npm run db:seed:generate  # regenerate supabase/seed/phase-1.sql from the program definition
npm run media:fetch       # rebuild exercise illustrations (already committed)
```

E2E prerequisites: `npx playwright install chromium` and `E2E_EMAIL` set to a pre-created test user. The suite builds and starts a production server on port 3100 (with the test-only clock override enabled), then resets and cleans up only that account's data.

### Dev-only tools (disabled in production)
- `/dev/gallery`: every key screen rendered from fixtures, plus all exercise illustrations. No login needed in dev.
- `/dev/time?at=2026-09-28T09:00:00-04:00`: pretend it's another day, to exercise any program day; `/dev/time?clear=1` resets. A banner shows while it's active.

---

## How the code is organised

Training logic is kept separate from persistence and UI:

- `lib/training/`: the Phase 1 program definition, schedule (week/day in America/Toronto), deload rules, workout-session state machine, cardio state machine, timers, metrics. All pure.
- `lib/progression/`: next-load recommendations (double progression, assistance reduction, bodyweight). Pure.
- `lib/data/`: Supabase queries mapped to domain types.
- `lib/offline/`: local workout snapshot, durable write outbox (idempotent upserts keyed by client ids), merge-on-reload.
- `app/`, `components/`: screens.

The program is data. `lib/training/programs/phase-1.ts` generates `supabase/seed/phase-1.sql`, and the app reads the seeded tables. A later phase means new seed data, not new screens.

## Credits

Exercise illustrations by [Everkinetic](https://github.com/everkinetic/data), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (modified: recoloured and combined into loops). See `public/exercise-media/ATTRIBUTION.md`.

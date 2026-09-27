# 06 — Build Specification

## Stack

- Next.js latest stable App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Supabase JS client
- Supabase Auth
- Supabase Postgres
- Vercel
- GitHub
- PWA support

---

# Project structure

Suggested:

```text
/app
  /(auth)
    /login
  /(app)
    /today
    /workout/[workoutId]
    /progress
    /plan
    /settings
  /api

/components
  /ui
  /workout
  /cardio
  /progress
  /plan
  /shared

/lib
  /supabase
  /training
  /progression
  /dates
  /offline
  /utils

/types

/supabase
  /migrations
  /seed

/public
  /exercise-media

/docs
```

---

# Routing

Authenticated default route:

```text
/ → /today
```

Core:

```text
/today
/workout/[workoutId]
/progress
/plan
/settings
```

---

# Auth

Use Supabase Auth email magic-link / OTP.

Requirements:

- minimal login screen;
- no open marketing registration flow;
- authenticated app routes protected;
- session refresh handled correctly.

Because this is a personal app, configuration may restrict allowed email address through an environment variable if convenient.

Example:

```text
ALLOWED_EMAIL=user@example.com
```

Do not hardcode the real email into source control.

---

# Supabase

Create migrations for schema in `05-DATA.md`.

Create seed script/data for full Phase 1.

Use:

- server-side Supabase client where appropriate;
- browser client for realtime/authenticated interactions where needed.

Follow current recommended Next.js + Supabase SSR patterns.

---

# State

Do not introduce Redux unless necessary.

Recommended:

- server data via Supabase;
- React state for active UI;
- small client store/context for active workout if useful;
- localStorage/IndexedDB for resumable unsynced workout state.

Active workout state should survive refresh.

---

# Timer implementation

Rest timer must use an absolute end timestamp.

Example:

```text
restEndsAt = Date.now() + restSeconds * 1000
```

UI derives remaining duration from current time.

This prevents background-tab drift.

Store active timer locally.

No need to persist every timer to database.

---

# PWA

Provide:

- manifest;
- icons;
- standalone display;
- theme/background colors;
- installable behavior;
- service worker / supported Next.js PWA approach.

PWA should open directly into app shell.

Do not spend excessive time on advanced offline asset caching.

Priority is:

- installability;
- reliable workout use;
- local in-progress state.

---

# UI component strategy

Use shadcn primitives first.

Likely:

- Button
- Card
- Drawer / Sheet
- Dialog
- Tabs only if genuinely useful
- Progress
- Input
- Select sparingly
- Toast
- Chart primitives
- Separator

Use Motion for:

- set completion;
- timer state;
- exercise transitions;
- overview drawer;
- lightweight chart reveal.

Do not mix multiple component libraries unless needed.

---

# Exercise media

V1 requirement:

- data model + component supports media;
- provide coherent placeholder assets if custom assets are unavailable.

Do not scrape random copyrighted GIFs.

Use local neutral placeholders or properly licensed assets.

The app must still feel polished without a complete production media library.

---

# Date / program logic

User timezone:

- America/Toronto.

Use timezone-aware date handling.

Determine today's program day using local date.

Sunday:

- always Rest / Fast.

Program week determined from enrollment start date.

---

# Starting the program

Because the app may first launch mid-week, support an explicit `program_enrollments.start_date`.

For V1 seed/onboarding:

- allow choosing the Phase 1 start date once;
- default to next Monday if no enrollment exists;
- after enrollment, plan is read-only.

Keep this onboarding minimal.

---

# Workout generation

When opening Today:

1. determine active block;
2. determine current week;
3. determine day of week;
4. fetch day prescription;
5. check if a workout instance already exists for scheduled date;
6. if not, create scheduled workout instance when user taps Start;
7. instantiate `workout_exercises`;
8. calculate recommended starting load from previous completed exercise history.

Do not pre-create months of workouts.

---

# Progression logic

Keep progression functions pure and unit tested.

Examples:

```ts
getDoubleProgressionNextWeight()
getAssistanceProgressionNextWeight()
getPreviousExercisePerformance()
```

UI should display a concise reason if useful:

```text
185 lb
Same load — beat last week's reps
```

or

```text
190 lb
Up 5 lb — all sets reached 6
```

Do not expose complex coaching math.

---

# Cardio

Cardio prescriptions are fetched by:

- block;
- week;
- day of week.

Cardio timer can be simple.

At completion save actual minutes + RPE.

---

# Progress charts

Prefer a small chart library compatible with shadcn/Recharts if already part of shadcn chart implementation.

Do not add a second heavy visualization framework.

Metrics:

- bench trend;
- pull-up / dip trend;
- weekly cardio minutes;
- longest cardio session;
- consistency.

---

# Testing

At minimum:

## Unit tests

- double progression;
- assistance reduction;
- week calculation;
- day prescription selection;
- rest timer timestamp logic.

## Integration / E2E

Use Playwright or equivalent for critical flows:

- auth;
- Today loads correct day;
- start workout;
- log set;
- rest timer starts;
- complete workout;
- data persists after reload;
- cardio completion;
- Sunday state.

---

# Performance

- avoid loading entire history on Today;
- query only required records;
- charts may fetch scoped history;
- optimize exercise images;
- use Next image handling where appropriate.

---

# Environment variables

Expected:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # server only if genuinely needed
ALLOWED_EMAIL=
NEXT_PUBLIC_APP_URL=
```

Never expose service role key to client.

---

# Git / Vercel

Repo should be deployable with:

```text
npm install
npm run dev
npm run build
npm run test
```

Vercel deployment should require only environment-variable configuration plus Supabase migration/seed.

Provide clear setup steps in root README or a small setup section added by implementation.

---

# Completion standard

Do not stop at visually mocked screens.

A successful build has:

- working auth;
- working database;
- seeded Phase 1;
- working workout logging;
- working progression;
- working timers;
- working cardio logging;
- working progress views;
- PWA installability;
- responsive mobile QA;
- tests passing;
- Vercel-ready build.

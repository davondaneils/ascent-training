# Codex Handoff Prompt — Ascent V1

You are implementing a complete personal training PWA called **Ascent**.

## First instruction

Before modifying or creating application code, read these files completely and in this order:

1. `README.md`
2. `docs/01-PRD.md`
3. `docs/02-TRAINING.md`
4. `docs/03-UX.md`
5. `docs/04-DESIGN.md`
6. `docs/05-DATA.md`
7. `docs/06-BUILD.md`
8. `docs/07-ACCEPTANCE.md`
9. `references/README.md`

Treat them as the source of truth.

Do not expand product scope beyond the specification.

If two documents appear to conflict, prioritize:

1. acceptance criteria;
2. PRD;
3. training spec;
4. UX;
5. data/build;
6. design.

## Goal

Build Ascent V1 end-to-end as a production-ready, phone-first PWA.

The app is for one user.

Its core loop is:

```text
Open app
→ Today
→ Start prescribed workout
→ One exercise at a time
→ Log weight + reps
→ Auto-start rest timer
→ Continue
→ Finish workout
→ Complete scheduled cardio later
→ Progress updates automatically
```

## Required stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Supabase Auth
- Supabase Postgres
- Vercel-compatible deployment
- PWA support

Do not substitute a different framework unless the repository already contains a strong reason to do so.

## Build requirements

You must implement, not merely mock:

- authentication;
- Supabase schema and migrations;
- Phase 1 seed data;
- Today screen;
- focused active-workout flow;
- previous-performance display;
- exercise media component;
- weight + reps logging;
- automatic rest timer;
- workout Overview;
- exercise jumping;
- workout completion;
- double-progression logic;
- assisted-movement progression logic;
- cardio prescription and logging;
- Saturday mobility checklist;
- Sunday Rest / Fast state;
- Progress screen;
- Plan screen;
- local in-progress resiliency;
- responsive mobile design;
- PWA manifest/installability;
- tests;
- deployment documentation.

## Training logic

Do not invent training logic.

Use `docs/02-TRAINING.md` exactly.

Keep progression logic in pure domain functions independent from presentation.

The app should calculate recommended next-session loads from previous completed performance.

## Design

Follow `docs/04-DESIGN.md`.

The app should feel:

- light;
- premium;
- calm;
- Apple/WHOOP-inspired;
- performance-oriented;
- minimally dense.

Do not create:

- dark mode;
- neon gym aesthetic;
- excessive gradients;
- glassmorphism;
- gamification;
- social UI;
- marketing landing-page sections.

## Mobile priority

The active workout screen is the most important screen.

Optimize for:

- one-handed phone use;
- large tap targets;
- minimal typing;
- minimal cognitive load;
- obvious current state.

Test the mobile widths listed in acceptance criteria.

## Data

Implement the relational model described in `docs/05-DATA.md`.

Enable RLS.

Do not expose Supabase service-role secrets to the browser.

Include migrations and seed data.

## Exercise media

The component and schema must support:

- image;
- video;
- animation.

If no licensed production exercise media is available in the repo, use clean local placeholders and keep the system ready for asset replacement.

Do not scrape or hotlink random copyrighted exercise GIFs.

## Program enrollment

If no active program enrollment exists:

- present a minimal first-run choice for Phase 1 start date;
- default to next Monday;
- create enrollment;
- then enter normal app flow.

No general workout customization UI.

## Testing

Implement unit tests for at minimum:

- double progression;
- assistance reduction;
- program week calculation;
- day selection;
- rest-timer timestamp behavior.

Implement critical E2E coverage for:

- login;
- Today;
- start workout;
- log set;
- automatic rest;
- workout persistence after reload;
- workout completion;
- cardio completion;
- Sunday state.

Use `docs/07-ACCEPTANCE.md` as the definition of done.

## Work style

1. Inspect the existing repository first.
2. Create a concise implementation plan.
3. Implement in coherent vertical slices.
4. Run lint/typecheck/tests frequently.
5. Fix errors rather than leaving TODOs for core behavior.
6. Do not stop at static mockups.
7. Do not add features not requested.
8. Preserve clear separation between:
   - training domain logic;
   - persistence;
   - UI.
9. Keep code readable enough that future training phases can replace Phase 1 data without rewriting the app.

## Final deliverable

Before considering the task complete:

- ensure `npm run build` succeeds;
- ensure tests pass;
- ensure Supabase migrations and seeds are present;
- ensure `.env.example` exists;
- ensure README contains setup steps;
- ensure Vercel deployment instructions are clear;
- verify the acceptance checklist;
- summarize any unavoidable limitations.

Build the complete V1.

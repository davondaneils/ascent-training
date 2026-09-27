# Ascent

Ascent is a personal, phone-first training app built for one user.

Its job is simple:

> Open the app, see exactly what to do today, perform one exercise at a time, log only weight and reps, let the app handle rest timers and progression, complete cardio with minimal logging, and get out.

V1 is intentionally narrow. It is not a general fitness platform, social app, nutrition tracker, or workout builder.

## Product principles

1. **No decisions during training.** The app already knows today's program.
2. **One thing at a time.** Workout mode focuses on the current exercise and current set.
3. **Minimum logging.** Lifting logs only weight and reps. Cardio logs modality, duration, and RPE.
4. **Progression is automatic.** The user should not calculate what load to use next time.
5. **Phone-first.** The active workout experience must be comfortable one-handed in a gym.
6. **Calm visual design.** Light, premium, restrained, Apple/WHOOP-inspired.
7. **Training logic is separate from UI.** The program is data-driven and can be replaced later without rewriting the app.
8. **Cloud synced.** Workout history must persist across authenticated devices.

## V1 stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- Supabase Auth + Postgres
- Vercel
- GitHub
- PWA support

## Documentation

Read these files in order:

1. `docs/01-PRD.md`
2. `docs/02-TRAINING.md`
3. `docs/03-UX.md`
4. `docs/04-DESIGN.md`
5. `docs/05-DATA.md`
6. `docs/06-BUILD.md`
7. `docs/07-ACCEPTANCE.md`
8. `CODEX-PROMPT.md`

The docs are the source of truth. Do not expand scope beyond them.

## Development

Requires Node 24+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # unit tests (training domain)
npm run typecheck
npm run lint
npm run build
```

Code layout:

- `lib/training` — program definition, schedule, deload, session state machine, timers (pure)
- `lib/progression` — next-load recommendations (pure)
- `lib/dates` — civil-date helpers in America/Toronto

Database, auth, and deployment setup will be documented here as those slices land.

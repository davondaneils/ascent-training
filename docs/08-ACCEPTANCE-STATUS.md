# 08 — Acceptance status

Walkthrough of `07-ACCEPTANCE.md` as of 2026-09-27, against https://ascent-training-pi.vercel.app. Updated after the first full E2E run (18/18 passing).

Legend:
- ✅ **Verified**: tested and observed working. The evidence is noted.
- 🟡 **Partial**: works but not fully proven, or proven only indirectly. The gap is noted.
- ⛔ **Not met**.
- ↪ **Deviation**: intentionally different from the spec, agreed with the owner.

Evidence sources:
- **unit**: Vitest suite, 154 tests;
- **gallery**: `/dev/gallery` fixture screens checked in the browser at 375, 390 and 430 px;
- **owner**: you tested it;
- **prod**: checked on the live site or in the Supabase database;
- **e2e**: Playwright suite, **18/18 passing**, run against a production build as the separate `E2E_EMAIL` test account.

## Authentication
| Criterion | Status | Evidence / gap |
|---|---|---|
| Sign in with email magic link / OTP | ↪ | The magic link works (owner signed in locally; e2e). A 6-digit OTP can't be delivered because Supabase email templates stay locked without custom SMTP. **Password sign-in is the primary method** (owner's choice); the link is the fallback. Owner signed in on prod with a password. |
| Unauthenticated users can't access app routes | ✅ | prod: `/`, `/today`, `/plan`, `/progress`, `/settings` and `/dev/*` all redirect to `/login`; e2e |
| Session survives reload | ✅ | owner; e2e |
| User can sign out | ✅ | e2e (signs out, then app routes redirect to login); also clears cached pages |
| User data protected by RLS | ✅ | prod: RLS enabled on all 12 tables; anonymous REST call returns `42501`; e2e: a signed-in user sees only its own profile, and a write for another user is rejected (`42501`) |

## Today
| Criterion | Status | Evidence / gap |
|---|---|---|
| Today opens by default after sign-in | ✅ | prod redirect `/` → `/today`; owner |
| Week calculated from enrollment start date | ✅ | unit (including mid-week starts, clamping, before start); owner (Week 1) |
| Mon–Sat show the right session | ✅ | unit (all 7 days); gallery; owner (Monday); e2e |
| Sunday shows Rest · Fast | ✅ | unit; gallery |
| Sunday has no Start Workout CTA | ✅ | gallery (no buttons rendered); e2e |
| PM cardio on the correct weeks/days | ✅ | unit (Tue from week 3, Thu from week 5, all 12 weeks); e2e |

## Workout
| Criterion | Status | Evidence / gap |
|---|---|---|
| Start Workout creates or resumes today's workout | ✅ | owner; prod DB (one workout per day, unique key); e2e |
| First exercise opens in focused mode | ✅ | owner; gallery |
| Exercise visual visible | ✅ | gallery. 31 of 45 have illustrations; 14 (mostly mobility and core) use a neutral placeholder. |
| Set count and rep range correct | ✅ | unit (definition checked against `02-TRAINING`); gallery |
| Rest prescription correct | ✅ | unit; gallery (Rest 3:00 on bench). Ranges use the lower bound (agreed). |
| Previous performance shown when available | ✅ | unit; gallery |
| First exposure shows "First session" | ✅ | owner; gallery |
| Enter weight / reps | ✅ | owner; gallery |
| Completing a set saves it | ✅ | owner; prod DB showed the logged set; unit (write mapping) |
| Completing a set auto-starts rest | ✅ | owner; gallery; unit |
| +30 sec changes the timer correctly | ✅ | unit; owner; e2e |
| Skip ends rest immediately | ✅ | unit; owner; e2e |
| Timer accurate after backgrounding | 🟡 | The design is timestamp-based and unit-tested for a frozen tab; restores from local snapshot. **Not yet tried on a locked iPhone.** |
| Completed set stays saved after reload | ✅ | owner; unit (merge); e2e |
| Continue to next exercise after all sets | ✅ | gallery; unit |
| Overview lists all exercises | ✅ | owner; gallery; e2e |
| Jump from Overview | ✅ | owner; unit; e2e |
| Jumping doesn't erase completed work | ✅ | unit; e2e |
| Completed workout stored with completion time | ✅ | e2e (finish from Overview; database row checked: `status=completed`, `completed_at` set); unit |
| Reload after completion shows completed | ✅ | e2e (summary after reload; Today shows "Workout complete") |

## Automatic progression
| Criterion | Status | Evidence / gap |
|---|---|---|
| 185 × 6/6/6/6 → 190 lb | ✅ | unit (exact case); e2e end to end (135 × 6 ×4 → next Monday shows 140 lb, "Up 5 lb — all sets reached 6") |
| 185 × 6/6/5/5 → 185 lb | ✅ | unit (exact case) |
| UI explains "Up 5 lb" / "Same load" | ✅ | unit; gallery ("Up 5 lb — all sets reached 6") |
| Assisted pull-up at top of range → less assistance | ✅ | unit |
| Lower assistance understood as harder | ✅ | unit (reference weight and qualifying sets use lower = harder) |

## Cardio
| Criterion | Status | Evidence / gap |
|---|---|---|
| Correct weekly target appears | ✅ | unit (week-by-week data); owner (Week 2 Monday: 15 min) |
| Timer starts / pause / finish | ✅ | owner; gallery (pause, reload while running and paused, end early) |
| Completion asks for RPE 1–10 | ✅ | owner; gallery |
| Saved row has target, actual, modality, RPE | ✅ | prod DB: `bike, 15, 2, 3` (owner's test, since deleted); e2e (database row checked) |
| Survives reload and another-device login | 🟡 | Reload ✅ (owner). Another device: data lives in Supabase, but **not yet tried on a second device**. |

## Mobility
| Criterion | Status | Evidence / gap |
|---|---|---|
| Saturday list appears | ✅ | unit (8 items); gallery |
| Each item checks independently | ✅ | gallery |
| Timed holds can run a small timer | ✅ | gallery (countdown observed) |
| Completion persists for the day | 🟡 | Implemented (`mobility_logs` upsert per date and exercise). **Not yet observed on prod.** |

## Progress
| Criterion | Status | Evidence / gap |
|---|---|---|
| Bench / pull-up / dip history viewable | ✅ | gallery with 8 weeks of fixtures; unit |
| Weekly aerobic minutes from logs | ✅ | unit; gallery |
| Longest continuous session | ✅ | unit; gallery |
| Lifting and cardio completion counts accurate | ✅ | unit (to-date; never counts sessions after today) |
| Useful empty states | ✅ | gallery (`progress-empty`) |

## Plan
| Criterion | Status | Evidence / gap |
|---|---|---|
| Phase 1 shows 12 weeks | ✅ | owner; e2e |
| Current week highlighted | ✅ | owner; accent marker; e2e |
| All seven days visible | ✅ | owner |
| Tapping a day shows the read-only prescription | ✅ | owner; e2e |
| Plan can't be edited | ✅ | No inputs or edit controls exist; tables aren't writable from the client (grants and RLS). |

## Mobile UX (375×812, 390×844, 430×932)
| Criterion | Status | Evidence / gap |
|---|---|---|
| No horizontal scrolling | ✅ | gallery: `scrollWidth == innerWidth` at 375 and 430 |
| No clipped buttons | ✅ | gallery screenshots |
| Primary workout controls comfortable one-handed | 🟡 | Complete Set is fixed at the bottom and 56 px tall. **Needs the owner's real-gym judgement.** |
| Key tap targets ≥ ~44 px | ✅ | gallery: no interactive element under 44 px on the workout screen at 375 |
| Numeric keyboard for weight/reps | 🟡 | `inputmode="decimal"` / `"numeric"` verified in the DOM. Confirm on the iPhone. |
| Bottom nav usable | ✅ | gallery; owner |
| Active workout not crowded | ✅ | gallery. Owner feedback led to the design pass. |

## Visual design
| Criterion | Status | Evidence / gap |
|---|---|---|
| Light theme only | ✅ | Dark tokens removed; `color-scheme: light` |
| Restrained neutral surfaces | ✅ | Warm off-white page, white cards |
| One accent colour | ✅ | Deep blue, used only for current state, selected rep, rings/progress and focus |
| No neon / glass / unnecessary gradients | ✅ | None used; the translucent nav blur was removed |
| No dashboard-card soup | ✅ | Cards only group real tasks; Progress has 4 sections and 3 charts |
| Charts simple and readable | ✅ | gallery: one line or bar each, minimal axes, plain-language summary |
| Media treatment consistent | ✅ | One illustration style, one frame treatment; placeholders match |
| Animations restrained and functional | ✅ | ≤ 500 ms, state changes only |
| Reduced motion respected | 🟡 | Implemented (`MotionConfig reducedMotion="user"`, still frames, chart and ring animation off, CSS media query in the loops). **Couldn't be simulated in the preview browser.** |

## Cloud / resilience
| Criterion | Status | Evidence / gap |
|---|---|---|
| Workout recovers after refresh | ✅ | owner; unit (merge); gallery (cardio) |
| In-progress set state not lost | ✅ | unit (local snapshot + outbox persisted to localStorage) |
| Failed writes show a subtle syncing state | 🟡 | Implemented ("Syncing…" after 1.2 s, "Offline · saved on phone", "Sign in to sync"); unit (outbox states). **Not yet seen with a real connection drop.** |
| Usable during brief connectivity loss | 🟡 | Optimistic UI plus durable outbox; unit. **Not device-tested.** Starting a workout needs the network. |
| Reconnection syncs pending work | ✅ | unit (retry on `online`, visibility change and a 10 s timer; ordered, idempotent, survives reload) |
| Another device shows completed history | 🟡 | All history is server-side and RLS-scoped. **Not yet tried on a second device.** |

## PWA
| Criterion | Status | Evidence / gap |
|---|---|---|
| Manifest exists | ✅ | prod: `/manifest.webmanifest` |
| Installable from a mobile browser | 🟡 | Criteria met (HTTPS, manifest, icons, service worker registered and activated on a production build). **Confirm Add to Home Screen on the iPhone.** |
| Launches standalone | 🟡 | `display: standalone` plus Apple web-app meta tags. Confirm on the iPhone. |
| Ascent icon | ✅ | prod: 192, 512, maskable and Apple touch icons served |
| Opens into the app shell | ✅ | `start_url: /today` |
| Usable after a normal reload | ✅ | owner |

## Build quality
| Criterion | Status | Evidence / gap |
|---|---|---|
| `npm run build` succeeds | ✅ | local and Vercel |
| Unit tests pass | ✅ | 154/154 |
| Critical E2E tests pass | ✅ | 18/18: auth, Today (every day, Sunday, cardio weeks), Plan, workout (log, auto rest, +30/Skip, reload, Overview jump, finish, completed after reload), next-week progression, cardio |
| No TypeScript errors | ✅ | `npm run typecheck` |
| No obvious console errors | ✅ | Hydration mismatch found and fixed; prod login clean; none in the gallery checks |
| Supabase migrations included | ✅ | `supabase/migrations/` |
| Seed data included | ✅ | `supabase/seed/phase-1.sql`, generated from `phase-1.ts` and kept in sync by a test |
| Setup/deploy instructions | ✅ | `README.md` |
| Vercel deploy succeeds | ✅ | Live at https://ascent-training-pi.vercel.app |

## Summary
- **Not met:** none.
- **Deviation (1):** password sign-in is primary; the magic link is the fallback and OTP codes are unavailable.
- **Partial (11):** all need a real iPhone, a second device, a real network drop, or the reduce-motion setting (iPhone install and standalone launch, numeric keyboards, timer after locking the phone, one-handed feel, offline states, cross-device history, mobility persistence on prod).
- Everything else is verified.

### Found and fixed by the E2E run
- React 19 resets forms after an action, so a failed password attempt (or switching to the link) cleared the typed email. The email now carries across login steps.

### To close the remaining gaps (on the iPhone)
Add to Home Screen and open it standalone. Check the numeric keyboards. Lock the phone mid-rest and come back. Toggle airplane mode mid-workout, log a set, then reconnect. Tick a Saturday mobility item and reload. Sign in on a second device and check that history appears.

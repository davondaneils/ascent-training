# Ascent physical training, five-year implementation

The previous body-part-oriented Phase 1 and repeating 12-week maintenance wave have been superseded **for enrolled users** by 20 physical cycles synchronized with the existing five-year campaign. This is a **planned, conservative curriculum**, not a guarantee that someone can safely perform later prescriptions. Physical readiness, injuries, access to facilities, weather, and recovery always override the calendar.

## New weekly structure

| Day | Session | Purpose |
| --- | --- | --- |
| Monday | Full-body strength A | Squat/press/pull and controlled carries |
| Tuesday | Aerobic development | Cycling and walking first, later optional run/walk or easy running; one weekly quality run once running is continuous |
| Wednesday | Full-body strength B | Hinge, single-leg strength, push and pull, carries |
| Thursday | Aerobic, supervised swimming or mobility | Swimming with supervision when trained and available; otherwise bike or walking |
| Friday | Full-body strength C | Relative strength, grip, carries, modest leg fatigue |
| Saturday | Long easy walk or hike | Gradual distance, later optional very light progressive pack |
| Sunday | Complete rest, worship, family | No prescribed lifting or conditioning |

Strength targets generally sit around 2–3 reps in reserve, never a planned maximal failure. Each 13-week arc has lighter weeks 4 and 8, and week 13 is recovery and assessment. Every session can be postponed or reduced to manage fatigue and symptoms. Individual medical restrictions override this general program.

## Long-term development

- **Year 1: Foundation and transition.** Three 4–5 exercise full-body sessions. Begin with stationary cycling, comfortable walking, and an unloaded daylight hike. Build walk capacity and joint tolerance before any run/walk. Running and supervised swimming appear in later arcs as optional progressions, not mandatory promotion.
- **Year 2: Endurance and sustainable load.** Maintain lifting and introduce more specific aerobic capacity. Only after successful unloaded hikes introduce an empty or very light pack; suggested cycle upper loads are *ceilings to build toward*, never immediate starting weights.
- **Year 3: Durable mixed fitness.** Develop comfortable steady running if tolerated, qualified swim competence, controlled carrying, and long walks/hikes. Reduce or substitute any painful or inaccessible modality.
- **Year 4: Sustain capability under varied demands.** Continue three strength exposures, non-maximal aerobic days, and progressive long hikes. Practice safe consistency, not forced mileage.
- **Year 5: Retest, retain, serve.** Maintain strength, endurance, swim skills and hiking without unsustainable loads. Reassess at the end of each arc.

## Weekly quality run

From the first continuous-run cycle (Year 2, third arc) onward, Tuesday's run becomes the one quality session of the week; Thursday and Saturday stay easy (RPE 2–4). It is never prescribed in recovery weeks 4, 8 or 13, which revert to an easy run. Every quality session starts with 10 minutes of very easy jogging, keeps at least 5 easy minutes to finish, and always fits inside the planned duration.

- First run arc: relaxed 20-second strides (4 → 6 across the arc), RPE 4–5.
- Later arcs alternate weeks: short tempo (2 × 3 min rising slowly to 20 min continuous at RPE 5–6) and short intervals (1-minute, later 2-minute, brisk efforts at RPE 6–7 with 2 minutes easy between, at most 8 × 1 or 6 × 2).
- Notes say to drop to easy running or walking for the rest of the session if anything hurts. The preflight asks for several tolerated easy runs, and choosing an alternative (run/walk, bike, incline walk) shows an easy RPE 2–4 target.

`qualityRun()` in `readiness.ts` generates these; `isQualityRun()` (`lib/training/cardio.ts`) recognises one by a run target above RPE 4.

## Recording carry and pack loads

- Farmer's carry is a `dumbbell` exercise: the set-by-set logger shows an optional "Weight (each)" field beside the unchanged hold timer. The weight is stored in `workout_sets.weight` (reps stay null), prefilled from the last recorded carry, and never auto-increased.
- Loaded hikes ask for an optional pack weight (kg, 0–40) on the rating screen, stored in `cardio_logs.pack_weight_kg` (migration `20261022000001_carry_and_pack_load.sql`, additive and nullable).
- Progress has a Carrying card with the heaviest carry load per hand and the pack weight per loaded hike. Older logs without a load are simply not charted.

## Readiness gates (mandatory behavior)

The calendar **never proves fitness readiness**. Every advanced training screen requires a personal preflight acknowledgement and offers low-impact alternatives:

- Run/walk: able to walk 40 minutes comfortably and currently pain-free. Start with about 1 minute easy jogging followed by 2–3 minutes walking; progress only with symptom-free recovery. If not ready, walk or cycle.
- Continuous run: repeated run/walk sessions are comfortable, with no persistent lower-limb pain or disproportionate fatigue. Otherwise run/walk or walk/cycle.
- Swimming: a supervised pool, qualified instruction as appropriate, and proper water safety. Never swim alone or practice underwater breath-holding. Otherwise use walking or cycling.
- Loaded hike: multiple comfortable unloaded walks/hikes before pack weight; start with an empty or very light load (0–3 kg), increase conservatively, and favor familiar public routes. Never aim immediately at the suggested future load or long duration.

The workout timer is not an appropriate swimming lap or GPS tracker. It tracks **session duration, RPE and (for loaded hikes) optional pack weight**, not distance, elevation or stroke count. Physical benchmark records in Progress supplement these logs; only enter real observed results. Clinical and safety clearance may be needed where appropriate. Severe symptoms, pain, unsafe weather, or unsafe conditions mean stop or change the session.

## Architecture

- `lib/training/programs/readiness.ts` creates 20 **separate** 13-week blocks. It uses `lib/campaign/roadmap.ts` as the immutable index and five-year enrollment anchor.
- `scripts/db.ts` seeds all 20 definitions as **inactive** via `buildSeed(block, false)`. The original 12-week Phase 1 remains the single active onboarding seed for compatibility. Existing enrolled users are shown their current 13-week readiness block immediately after deploying and seeding, without rewriting their one active enrollment row.
- `getAppContext()` returns `enrollment` (five-year campaign anchor) and `trainingEnrollment` (derived current physical arc start) separately.
- All workouts continue storing their original `program_block_id` and immutable exercise prescription references. Viewing an older workout explicitly loads the block that created it.
- Users see the active arc on Today and Plan. Each new arc changes actual exercise prescriptions and aerobic modalities. The original gym timer/rest/offline outbox continues to work.
- `supabase/migrations/20261019000002_physical_training.sql` expands the cardio modality constraint without deleting old rows.
- Deployment must apply both campaign migrations and run the full seed command **before** enabling this branch in Vercel.

## Product limitations to resolve before wider release

- This is structured, nonindividualized long-term programming. It has readiness prompts but no objective auto-promotion gate or coach-reviewed readiness signoff. Progressing by calendar cannot be used as evidence of readiness.
- The cardio timer records minutes, perceived exertion and pack weight, not pace/distance or pool laps.
- Swimming and hiking need live conditions, suitable facilities and qualified supervision when relevant.
- Assessments and physical training are associated by cycle, but an assessment does not automatically generate a tailored future prescription.
- Carry and pack loads are self-reported and optional; there is no automatic load progression for either.
- Quality running is capped at modest volumes (20 min tempo, 6 × 2 min) and has no pace targets.
- There is no barbell back squat, conventional deadlift or overhead press; leg press, RDL and landmine press are the main lower-body and pressing lifts, which limits absolute strength.

Deployed 2026-10-19: both migrations applied and all 20 blocks seeded to the hosted Supabase project (seed SQL now casts nullable columns; the original version failed on a real database).

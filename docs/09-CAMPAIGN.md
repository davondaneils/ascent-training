# Ascent: Five Years to Prepare

The five-year **Christian civilian-readiness campaign** is an extension of the existing one-person gym app, not a replacement. The severe scenario (religious persecution, conflict, extended infrastructure disruption) supplies meaning and stakes, **not a prediction**, and never an excuse to target religious or political opponents.

## Mission

Become physically capable, practically useful, calm under pressure, faithful to Christ, and dependable to family and neighbors. Prepare to protect life, evacuate safely, de-escalate, provide first aid, practice hospitality, and serve people regardless of belief.

## Programming

- 5 calendar years, 4 x approximately 13-week cycles per year = 20 named arcs. Civil anniversary extra days stay in the fourth arc.
- Each arc: concrete competence target, realistic civilian emergency, 13 escalating learning/practice/retest stages, and a Saturday week-13 assessment.
- Mon-Sat: one Scripture/prayer assignment (30 min) plus one practical assignment (20-90 min) from the cycle-specific playbook (`lib/campaign/playbook.ts`, six concrete practices per cycle).
- Sunday: no exercise or mission checklists. Worship, rest, family, hospitality, voluntary prayer and fasting as appropriate.
- Physical training now consists of **20 separate 13-week blocks** aligned with the campaign cycles. Each has actual three-day full-body strength prescriptions, two aerobic/mobility slots, a Saturday longer walk/hike and a Sunday rest. Progressive exercise targets and deloads are specified in `lib/training/programs/readiness.ts`. See [`11-PHYSICAL-PROGRAM.md`](11-PHYSICAL-PROGRAM.md) for readiness gates and limitations. Calendar phase advancement does not prove physical readiness; substitute lower-impact sessions when not prepared.
- Assessments use observed results, a note stating evidence, and either `completed` or `needs_work`; never fabricate a survival probability or moral score.

## Mission domains

Faith, first aid, navigation, household readiness, composure, service, and safe field exercises. Physical performance is tracked separately. The missions are prescribed deterministically by `lib/campaign/schedule.ts` and the arc data in `lib/campaign/roadmap.ts`.

## UX

The existing three-tab navigation stays unchanged. Today adds a campaign brief and actionable mission list beneath the current physical session. Sunday remains calm. Plan links to the entire roadmap. Progress includes completion counts and voluntary standardized physical assessments.

## Data

`mission_logs` stores user-scoped completion/status/evidence. `capability_tests` stores observed performance data by test key. Both use RLS, database checks, and authenticated-only grants. The campaign is anchored to the existing training enrollment date, so existing users are automatically included without a destructive re-onboarding. Mission IDs are deterministic and server-validated. No spiritual rank, game streak, social feed, or private contacts list.

## Safety

All drills are defensive and civilian. No combat, ambush, weapon, insurgency, or confrontation training. Qualified supervision for first aid and swimming. Progressive loading and a proper recovery plan for physical benchmarks. Sunday should not become another quota. A missed assignment should drive reflection and re-planning, not a punitive restart.

## Deploy

Run `npm run db:push` against the intended hosted Supabase database **before deploying**, applying both campaign and physical migrations and seeding all 20 new program blocks. Verify RLS, date rollover, workout logging, offline sync, Sunday rest, safety alternatives, and iPhone layout. A manually applied migration alone will not seed program rows.

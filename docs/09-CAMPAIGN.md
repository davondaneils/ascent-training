# Ascent: Five Years to Prepare

The five-year **Christian civilian-readiness campaign** is an extension of the existing one-person gym app, not a replacement. The severe scenario (religious persecution, conflict, extended infrastructure disruption) supplies meaning and stakes, **not a prediction**, and never an excuse to target religious or political opponents.

## Mission

Become physically capable, practically useful, calm under pressure, faithful to Christ, and dependable to family and neighbors. Prepare to protect life, evacuate safely, de-escalate, provide first aid, practice hospitality, and serve people regardless of belief.

## Programming

- 5 calendar years, 4 x approximately 13-week cycles per year = 20 named arcs. Civil anniversary extra days stay in the fourth arc.
- Each arc: concrete competence target, realistic civilian emergency, 13 escalating learning/practice/retest stages, and a Saturday week-13 assessment.
- Mon-Sat: one Scripture/prayer assignment (30 min) plus one practical assignment (20-90 min) from the cycle-specific playbook (`lib/campaign/playbook.ts`, six concrete practices per cycle).
- Sunday: no exercise or mission checklists. Worship, rest, family, hospitality, voluntary prayer and fasting as appropriate.
- Physical training starts with the existing evidence-based Phase 1. After week 12 it automatically moves to a repeatable 12-week maintenance wave (not a permanent week-12 deload), with established aerobic volume and scheduled deloads. This is an interim bridge, not a claim that the complete five-year physical progression is programmed. A separately designed and evaluated strength/endurance block should replace maintenance once ready. Never jump abruptly to loaded hikes, swimming, running, or intense endurance.
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

Apply `supabase/migrations/20261018000001_campaign.sql` to the existing hosted Supabase instance **before enabling the new app** (per the README's `npm run db:push` flow). Then deploy and verify RLS, logging, Sunday behavior, and the new Progress assessment form.

# 10 — Campaign acceptance and deployment

## Functional

- [ ] The Today screen displays a five-year campaign brief, current arc, and two prescribed assignments on Monday–Saturday.
- [ ] Assignments differ by 20 cycle-specific playbooks and provide observable success standards.
- [ ] Week 13's Saturday crucible presents the arc's civilian scenario and requires a narrative result to record met / needs work.
- [ ] The Sunday screen has no workout or mission completion actions; it invites worship, rest, family, and optional fasting.
- [ ] Plan still shows the original lifting and cardio prescriptions and links to all 20 campaign arcs.
- [ ] The roadmap shows elapsed time as elapsed, **not** as completed competencies.
- [ ] Progress displays current-week recorded mission completions and benchmark trends without a fabricated survival score.
- [ ] A zero strict-pull-up baseline is valid. Other physical benchmarks require positive measured results. Invalid results are rejected on client and server.
- [ ] The Today workout logger, rest timer, mobility checklist, cardio session, and automatic progression continue to work unchanged.

## Data and security

- [ ] Run the full `npm run db:push` with `SUPABASE_DB_URL` to apply **both** campaign and physical training migrations and seed all 20 programs **before deployment**.
- [ ] Verify Supabase RLS and user scoping on `mission_logs` and `capability_tests` using two separate authenticated users.
- [ ] Verify forged mission IDs and historical/future dates cannot be recorded through server actions.
- [ ] Verify a week-13 assessment requires at least 15 characters of evidence and supports `needs_work`.
- [ ] Verify revalidation after an update and persistence on another signed-in device.
- [ ] Confirm the migration does not alter existing workout, cardio, enrollment, or exercise rows.

## Physical training progression

- [ ] In Year 1 Cycle 1, Monday prescribes a different full-body Strength A workout with bench, leg press, assisted pull-ups, row and timed carry. No body-part-split template.
- [ ] Year 1 Cycle 1 has three strength days (Mon/Wed/Fri), three non-strength endurance days (Tue/Thu/Sat), and Sunday rest; its run, swim, and loaded hike modes are absent.
- [ ] All 20 unique 13-week program blocks are available in the database as **inactive**, while the original Phase 1 remains the only active onboarding seed.
- [ ] A single existing campaign enrollment selects the correct physical block and week without modifying enrollment or deleting old workout data.
- [ ] Before the first cycle is complete, run/walk, swim and load options offer clear beginner alternatives; advanced options require a preflight acknowledgement.
- [ ] Verify physical cycle changeover at days 91, 182, 273, annual anniversary, and Year 5.
- [ ] A few extra days at year end stay in the final recovery week; no phantom second wave appears.
- [ ] A historical workout opens with the correct original prescriptions even after several cycle changes, and earlier deload data does not erroneously drive new load increases.
- [ ] Modality logs for bike, incline walking, run/walk, running, supervised swimming, unloaded hiking, and loaded hiking save and replay through offline outbox.
- [ ] Swimming is never encouraged unsupervised; progression is non-maximal and reversible based on symptoms and available equipment.
- [ ] Verify time-based farmer carries work through the existing hold timer without new weight-entry requirements.
- [ ] Verify weekly and 13-week progress/counts accurately reflect the active physical block.
- [ ] No statement implies automatic physical readiness approval simply because the campaign has advanced.

## Device QA

- [ ] Verify iPhone screens at 375/390/430 px with keyboard open and no horizontal overflow.
- [ ] Verify loading, saving, retry, and error messages from mission and benchmark actions.
- [ ] New mission writes currently require network; **do not** imply offline mission logging works.
- [ ] Existing offline workout outbox continues to work as before.
- [ ] Maintain full Sunday rest and no punitive restart.

## Automated verification

`Verify Ascent` CI runs Node 24 TypeScript typecheck, ESLint, and Vitest. Two missing optional @emnapi dependency entries were restored in the committed package lockfile, so CI uses a reproducible `npm ci` without a temporary reconciliation. E2E campaign and physical-cycle integration tests require an isolated Supabase instance with both migrations and seeds applied; they are not part of PR CI.

## Deployment gate

**Do not merge or deploy before the new migration and device QA are ready.** Existing production remains unchanged while this work is on a feature branch.

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

- [ ] Apply `20261018000001_campaign.sql` before deploying the branch.
- [ ] Verify Supabase RLS and user scoping on `mission_logs` and `capability_tests` using two separate authenticated users.
- [ ] Verify forged mission IDs and historical/future dates cannot be recorded through server actions.
- [ ] Verify a week-13 assessment requires at least 15 characters of evidence and supports `needs_work`.
- [ ] Verify revalidation after an update and persistence on another signed-in device.
- [ ] Confirm the migration does not alter existing workout, cardio, enrollment, or exercise rows.

## Training rollover

- [ ] At week 13, training enters Wave 2 Week 1, not a permanent Week 12 deload.
- [ ] On Wave 2, weekly aerobic prescriptions follow established conditioning with scheduled deloads.
- [ ] Weekly and progress counts use the actual current wave, not the first 12 weeks.
- [ ] After week 12, load progression preserves prior exercise history.
- [ ] The Product does not claim that future specialist physical blocks are already available.

## Device QA

- [ ] Verify iPhone screens at 375/390/430 px with keyboard open and no horizontal overflow.
- [ ] Verify loading, saving, retry, and error messages from mission and benchmark actions.
- [ ] New mission writes currently require network; **do not** imply offline mission logging works.
- [ ] Existing offline workout outbox continues to work as before.
- [ ] Maintain full Sunday rest and no punitive restart.

## Automated verification

`Verify Ascent` CI runs Node 24 TypeScript typecheck, ESLint, and Vitest. The workflow reconciles two inherited missing optional dependency lockfile entries in its temporary runner before `npm ci`; this does not commit those changes and should eventually be replaced by refreshing the repository lockfile. E2E campaign tests require an isolated Supabase instance with the new migration applied; they are not part of PR CI.

## Deployment gate

**Do not merge or deploy before the new migration and device QA are ready.** Existing production remains unchanged while this work is on a feature branch.

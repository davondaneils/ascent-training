# 07 — Acceptance Criteria

The build is complete only when these behaviors work.

---

# Authentication

- [ ] User can sign in with email magic link / OTP.
- [ ] Unauthenticated users cannot access app routes.
- [ ] Authenticated session survives reload.
- [ ] User can sign out.
- [ ] User-owned data is protected by RLS.

---

# Today

- [ ] Today opens by default after sign-in.
- [ ] Current Phase 1 week is calculated from enrollment start date.
- [ ] Monday displays Upper Strength.
- [ ] Tuesday displays Lower Strength + Movement.
- [ ] Wednesday displays Upper Hypertrophy.
- [ ] Thursday displays Lower Hypertrophy.
- [ ] Friday displays Upper Specialization.
- [ ] Saturday displays Aerobic + Mobility.
- [ ] Sunday displays Rest · Fast.
- [ ] Sunday has no Start Workout CTA.
- [ ] Scheduled PM cardio appears on the correct weeks/days.

---

# Workout

- [ ] Tapping Start Workout creates or resumes today's workout.
- [ ] First exercise opens in focused mode.
- [ ] Exercise visual is visible.
- [ ] Set count and rep range are correct.
- [ ] Rest prescription is correct.
- [ ] Previous performance is shown when available.
- [ ] First-ever exposure shows `First session`.
- [ ] User can enter weight.
- [ ] User can enter reps.
- [ ] Completing a set saves it.
- [ ] Completing a set automatically starts the rest timer.
- [ ] `+30 sec` changes the timer correctly.
- [ ] `Skip` ends rest immediately.
- [ ] Timer remains accurate after app is backgrounded.
- [ ] Completed set stays saved after page reload.
- [ ] After all sets, user can continue to next exercise.
- [ ] Workout Overview lists all exercises.
- [ ] User can jump to another exercise from Overview.
- [ ] Jumping exercise does not erase completed work.
- [ ] Completed workout is stored with completion time.
- [ ] Reloading after completion shows workout as completed.

---

# Automatic progression

## Bench example

Given prescription:

```text
4 × 4–6
increment +5 lb
```

- [ ] If previous session is `185 × 6/6/6/6`, next recommended load is 190 lb.
- [ ] If previous session is `185 × 6/6/5/5`, next recommended load remains 185 lb.
- [ ] UI may explain `Up 5 lb` or `Same load — beat last performance`.

## Assistance example

- [ ] If assisted pull-up reaches top of range for all sets, next recommendation reduces assistance.
- [ ] App correctly understands that lower assistance is harder.

---

# Cardio

- [ ] Correct weekly cardio target appears.
- [ ] Cardio timer starts.
- [ ] User can pause.
- [ ] User can finish.
- [ ] Completion asks for RPE 1–10.
- [ ] Saved cardio contains target minutes, actual minutes, modality, and RPE.
- [ ] Cardio history survives reload and another-device login.

---

# Mobility

- [ ] Saturday mobility list appears.
- [ ] Each item can be checked independently.
- [ ] Timed holds can optionally run a small timer.
- [ ] Completion persists for the day.

---

# Progress

- [ ] Bench history can be viewed.
- [ ] Pull-up history can be viewed.
- [ ] Dip history can be viewed.
- [ ] Weekly aerobic minutes are calculated from logs.
- [ ] Longest continuous cardio session is calculated.
- [ ] Lifting completion count is accurate.
- [ ] Cardio completion count is accurate.
- [ ] Progress screen has useful empty states before enough data exists.

---

# Plan

- [ ] Phase 1 shows 12 weeks.
- [ ] Current week is highlighted.
- [ ] All seven days are visible.
- [ ] Tapping a day shows correct read-only prescription.
- [ ] Plan cannot be edited from UI.

---

# Mobile UX

Test at minimum around:

- 375 × 812
- 390 × 844
- 430 × 932

Criteria:

- [ ] no horizontal scrolling;
- [ ] no clipped buttons;
- [ ] primary workout controls are comfortable one-handed;
- [ ] key tap targets are approximately 44px or larger;
- [ ] numeric keyboard appears for weight/reps;
- [ ] bottom nav remains usable;
- [ ] active workout does not feel visually crowded.

---

# Visual design

- [ ] light theme only;
- [ ] restrained neutral surfaces;
- [ ] one accent color;
- [ ] no neon fitness styling;
- [ ] no glassmorphism;
- [ ] no unnecessary gradients;
- [ ] no dashboard-card soup;
- [ ] charts are simple and readable;
- [ ] movement media treatment is consistent;
- [ ] animations are restrained and functional;
- [ ] reduced-motion setting is respected.

---

# Cloud / resilience

- [ ] Workout can recover after page refresh.
- [ ] In-progress set state is not lost unnecessarily.
- [ ] Failed network writes surface a subtle syncing state.
- [ ] App remains usable during brief connectivity loss.
- [ ] Successful reconnection syncs pending work where implemented.
- [ ] Signing in on another device shows completed history.

---

# PWA

- [ ] manifest exists;
- [ ] installable from supported mobile browser;
- [ ] launches in standalone display mode;
- [ ] has Ascent icon;
- [ ] opens into app shell;
- [ ] app remains usable after normal browser reload.

---

# Build quality

- [ ] `npm run build` succeeds.
- [ ] unit tests pass.
- [ ] critical E2E tests pass.
- [ ] no TypeScript errors.
- [ ] no obvious console errors in normal use.
- [ ] Supabase migrations are included.
- [ ] seed data is included.
- [ ] repo has deployment/setup instructions.
- [ ] Vercel deployment succeeds after env configuration.

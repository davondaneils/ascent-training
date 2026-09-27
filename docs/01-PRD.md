# 01 — Product Requirements Document

## Product

**Name:** Ascent

**User:** One person only.

**Primary device:** Phone.

**Form factor:** Responsive web app installed as a PWA.

**Primary job-to-be-done:**

> Tell me exactly what training I am doing today, guide me through it with almost no decision-making, log the minimum required data, automatically apply progression, and preserve my history in the cloud.

---

## V1 goals

Ascent V1 must:

- show the correct workout for the current day and current week of the training block;
- guide the user through lifting one exercise at a time;
- display the prescribed sets, rep range, rest period, and exercise visual;
- show previous performance for the same exercise;
- allow logging of weight and reps only;
- automatically start the prescribed rest timer when a set is completed;
- allow `+30 sec` and `Skip` on the timer;
- allow moving to the next exercise after completing the current exercise;
- provide an Overview screen/list for the entire workout;
- allow jumping to another exercise from the Overview if equipment is unavailable;
- automatically determine next-session target load from progression rules;
- guide simple cardio sessions;
- log cardio modality, duration, and RPE;
- show Saturday mobility as a checklist;
- show Sunday as Rest / Fast with no training CTA;
- show training history and a small number of useful progress metrics;
- show the current 12-week plan;
- sync all user training data through Supabase;
- work cleanly as a mobile PWA.

---

## Explicit V1 exclusions

Do not build:

- nutrition tracking;
- calorie tracking;
- macro tracking;
- bodyweight tracking;
- progress photos;
- body measurements;
- social features;
- leaderboards;
- messaging;
- coaching marketplace;
- AI chat or AI coaching;
- custom workout builder;
- user-editable programming;
- exercise-library browsing as a standalone feature;
- Apple Health integration;
- Garmin integration;
- Strava integration;
- WHOOP integration;
- readiness or HRV scoring;
- sleep tracking;
- payments;
- multiple user profiles;
- public sign-up flow;
- native iOS or Android apps.

---

## Information architecture

Bottom navigation:

1. **Today**
2. **Progress**
3. **Plan**

Everything else is contextual.

Settings may live behind a small profile/settings control in the top bar rather than bottom navigation.

---

## Today

Today is the default home screen.

It should show:

- current date;
- current training block;
- current week number;
- today's main session;
- approximate duration;
- number of exercises;
- primary CTA: `Start Workout`;
- later cardio session if scheduled;
- small weekly completion summary.

Example:

```text
Monday

Phase 1 — Foundation
Week 3 of 12

Upper Strength
7 exercises · ~65 min

[ Start Workout ]

Later today
Bike · 20 min · Easy

This week
2 / 5 lifting
1 / 4 cardio
```

Sunday should instead show:

```text
Sunday

Rest · Fast

No training today.
Resume Monday.
```

No training CTA on Sunday.

---

## Active workout

The active workout is the most important screen in the product.

It should show one exercise at a time.

Core information:

- exercise position in workout, e.g. `1 / 7`;
- exercise name;
- exercise visual;
- prescribed sets and rep range;
- prescribed rest time;
- previous performance;
- current set number;
- weight input;
- reps input;
- `Complete Set` CTA.

Example:

```text
1 / 7

Bench Press

[ movement visual ]

4 × 4–6
Rest 3:00

Previous
185 × 6
185 × 5
185 × 5
185 × 4

Set 1 of 4

Weight
[-] 185 lb [+]

Reps
4   5  [6]

[ Complete Set ]
```

After completion:

```text
✓ Set 1 — 185 × 6

REST
2:59

[ +30 sec ]   [ Skip ]

Next set
185 lb · 4–6 reps
```

When all sets are complete:

```text
Bench Press complete

Next
Pull-Up

[ Continue ]
```

---

## Workout Overview

Accessible from active workout.

Must show:

- all exercises in prescribed order;
- completed-set count per exercise;
- current exercise;
- completion state;
- tap any exercise to jump there.

Example:

```text
✓ Bench Press        4/4
→ Pull-Up            1/4
  Incline DB Press   0/3
  Chest-Supported Row 0/3
  Lateral Raise      0/3
  Triceps Extension  0/2
  Incline Curl       0/2
```

The app prescribes the preferred order, but the user may override it.

---

## Exercise visuals

Every exercise data object must support:

- `image_url`
- optional `video_url`
- optional `animation_url`

V1 may ship with static images or local placeholders for some movements, but the UI and data model must be ready for clean looping demonstrations later.

Do not embed YouTube directly in the active workout UI.

Exercise visual behavior:

- visible by default;
- clear enough to identify the movement;
- tap to expand;
- media should not dominate the entire screen;
- keep visual style consistent.

---

## Progress

Progress only includes metrics generated automatically from training.

### Strength

Examples:

- Bench press performance over time;
- estimated 1RM may be shown as secondary, not primary;
- load and rep trend.

### Relative strength

Examples:

- strict pull-up reps;
- weighted pull-up progression later;
- dip progression.

### Cardio

- weekly aerobic minutes;
- longest continuous aerobic session;
- recent cardio RPE.

### Consistency

- lifting sessions completed / scheduled;
- cardio sessions completed / scheduled;
- block completion percentage.

Avoid dense dashboards.

---

## Plan

Shows the current program at a glance.

Example:

```text
Phase 1 — Foundation
Week 3 of 12

Mon — Upper Strength
Tue — Lower Strength + Movement
Wed — Upper Hypertrophy
Thu — Lower Hypertrophy
Fri — Upper Specialization
Sat — Aerobic + Mobility
Sun — Rest · Fast
```

Tap a day to inspect the prescription.

The plan is read-only in V1.

---

## Cardio

Cardio flow should be minimal.

Start card:

```text
Bike

25 min
Easy
Target RPE 2–3

[ Start ]
```

During:

- giant timer;
- pause;
- end early if necessary.

At completion:

```text
How hard?

1 2 [3] 4 5 6 7 8 9 10

[ Save ]
```

Store:

- modality;
- target minutes;
- actual minutes;
- RPE;
- date.

---

## Mobility

Saturday mobility is a checklist, not a complex workout flow.

Example:

```text
○ Knee-to-wall · 2 × 8/side
○ Supported deep squat · 2 × 30–45 sec
○ 90/90 hip rotation · 2 × 6/side
○ Adductor rockback · 2 × 8
○ Thoracic extension · 2 × 6
○ Bench lat stretch · 2 × 8
○ Wall slide · 2 × 8–10
○ Split-stance hold · 2 × 20–30 sec/side
```

Timed items may offer a simple timer.

---

## Authentication

This is a one-user private app.

Use Supabase Auth.

Preferred V1 method:

- email magic link / OTP.

Do not build social OAuth unless needed later.

Protect all app routes except the minimal login screen.

---

## Cloud behavior

Workout history, set logs, cardio logs, and completion state must persist in Supabase.

Expected behavior:

- start workout on phone;
- complete sets;
- reload page;
- progress remains;
- sign in on another device;
- history is present.

---

## Core non-functional requirements

- excellent mobile layout at 375–430px widths;
- large tap targets;
- fast load time;
- no horizontal scrolling;
- no accidental destructive actions;
- timer should continue accurately if the screen is temporarily backgrounded;
- accessible contrast;
- sensible keyboard behavior for numeric inputs;
- cloud data must be user-scoped;
- app should tolerate temporary network loss gracefully and retry writes where practical.

---

## Product philosophy

Ascent should feel like a quiet training instrument.

Do not add features simply because a fitness app “usually has them.”

The V1 quality bar is:

> effortless daily execution of the prescribed plan.

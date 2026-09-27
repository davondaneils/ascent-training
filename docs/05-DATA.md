# 05 — Data Model

## Principles

- Supabase Postgres is the cloud source of truth.
- All user-owned data must be scoped by `user_id`.
- Program definition should be data-driven.
- Training logic should not be embedded directly in UI components.
- Workout history should be reconstructable from stored sets.
- Prefer simple relational structure over premature abstraction.

---

# Tables

## `profiles`

Purpose:

- one row per authenticated user.

Fields:

```text
id uuid primary key references auth.users(id)
email text
weight_unit text default 'lb'
created_at timestamptz
updated_at timestamptz
```

---

## `program_blocks`

Fields:

```text
id uuid primary key
slug text unique
name text
description text
duration_weeks int
is_active boolean
created_at timestamptz
```

Seed:

```text
slug: phase-1-foundation
name: Phase 1 — Foundation
duration_weeks: 12
is_active: true
```

---

## `program_days`

Represents day-of-week structure for a block.

Fields:

```text
id uuid primary key
program_block_id uuid references program_blocks(id)
day_of_week int
name text
session_type text
notes text
sort_order int
```

Convention:

- Monday = 1
- ...
- Sunday = 7

---

## `exercises`

Fields:

```text
id uuid primary key
slug text unique
name text
category text
image_url text nullable
video_url text nullable
animation_url text nullable
instructions text nullable
created_at timestamptz
```

Possible categories:

- strength
- hypertrophy
- mobility
- cardio
- core
- skill-prep

---

## `exercise_prescriptions`

This is the program definition for lifting/mobility exercises.

Fields:

```text
id uuid primary key
program_day_id uuid references program_days(id)
exercise_id uuid references exercises(id)
sort_order int
sets int
rep_min int nullable
rep_max int nullable
duration_seconds int nullable
rest_seconds int nullable
target_rir_min numeric nullable
target_rir_max numeric nullable
progression_type text nullable
load_increment numeric nullable
notes text nullable
is_optional boolean default false
```

Recommended `progression_type` values:

```text
double_progression
assistance_reduction
bodyweight_reps
none
```

---

## `cardio_prescriptions`

Cardio varies by week.

Fields:

```text
id uuid primary key
program_block_id uuid references program_blocks(id)
week_number int
day_of_week int
modality text
target_minutes int
target_rpe_min int
target_rpe_max int
notes text nullable
```

---

## `workouts`

One lifting workout instance.

Fields:

```text
id uuid primary key
user_id uuid references profiles(id)
program_block_id uuid references program_blocks(id)
program_day_id uuid references program_days(id)
week_number int
scheduled_date date
started_at timestamptz nullable
completed_at timestamptz nullable
status text
created_at timestamptz
updated_at timestamptz
```

Status:

```text
scheduled
in_progress
completed
abandoned
```

---

## `workout_exercises`

One exercise instance inside a workout.

Useful because users may change order or partially complete exercises.

Fields:

```text
id uuid primary key
workout_id uuid references workouts(id)
exercise_id uuid references exercises(id)
prescription_id uuid references exercise_prescriptions(id)
planned_order int
actual_order int nullable
status text
completed_at timestamptz nullable
```

---

## `workout_sets`

Fields:

```text
id uuid primary key
user_id uuid references profiles(id)
workout_id uuid references workouts(id)
workout_exercise_id uuid references workout_exercises(id)
exercise_id uuid references exercises(id)
set_number int
weight numeric nullable
reps int nullable
completed_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

Only weight and reps are user-entered in V1.

---

## `cardio_logs`

Fields:

```text
id uuid primary key
user_id uuid references profiles(id)
program_block_id uuid references program_blocks(id)
week_number int
scheduled_date date
modality text
target_minutes int
actual_minutes int
rpe int
completed_at timestamptz
created_at timestamptz
```

---

## `mobility_logs`

Optional but simple.

Fields:

```text
id uuid primary key
user_id uuid references profiles(id)
scheduled_date date
exercise_id uuid references exercises(id)
completed boolean
completed_at timestamptz nullable
```

---

# Program week state

Need a reliable way to know current week.

Recommended profile settings or a small enrollment table.

## `program_enrollments`

Fields:

```text
id uuid primary key
user_id uuid references profiles(id)
program_block_id uuid references program_blocks(id)
start_date date
status text
created_at timestamptz
```

Current week formula:

```text
floor((today - start_date) / 7 days) + 1
```

Clamp to 1–12 for Phase 1.

Sunday remains part of the same program week.

---

# Progression engine

Create a pure domain function independent of UI.

Conceptual signature:

```ts
getNextPrescription({
  exercise,
  prescription,
  previousCompletedSets,
  availableLoadIncrement
}) => {
  recommendedWeight,
  reason
}
```

## Double progression

For `sets = S`, rep range `min–max`:

If every completed working set reached `rep_max`:

```text
next_weight = previous_weight + load_increment
```

Else:

```text
next_weight = previous_weight
```

For dumbbells:

- stored weight should represent per-dumbbell weight;
- UI label should make this clear if necessary.

## Assistance reduction

For assisted pull-up or dip:

If all sets reach rep max:

- reduce assistance by smallest available increment.

Represent assistance consistently.

Simplest option:

- store assisted-machine load as `weight`;
- flag exercise metadata `load_direction = lower_is_harder`.

Then progression engine knows that reducing the number is progression.

## Bodyweight reps

For pure bodyweight movements:

- no load recommendation;
- previous reps shown;
- user aims to improve reps until later phase changes prescription.

---

# Previous performance query

For each active exercise, fetch the most recent completed workout exercise for the same `exercise_id`.

Display its completed sets in order.

If none:

```text
First session
```

---

# RLS

Enable Row Level Security.

User-owned tables:

- profiles
- program_enrollments
- workouts
- workout_exercises through parent ownership
- workout_sets
- cardio_logs
- mobility_logs

Program definition tables may be readable by authenticated user but not editable from client.

Do not expose service-role credentials to browser.

---

# Seed data

Seed all Phase 1 content:

- block;
- 7 program days;
- every exercise;
- every prescription;
- all cardio prescriptions for Weeks 1–12.

The app should work immediately after authentication and program enrollment.

---

# Local resiliency

Use local client cache for in-progress workout state.

At minimum:

- current workout ID;
- current exercise;
- current set;
- unsynced set writes;
- rest timer end timestamp.

If the browser reloads mid-workout:

- recover in-progress workout.

Cloud remains source of truth after sync.

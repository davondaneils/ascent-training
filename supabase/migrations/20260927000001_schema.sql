-- Ascent V1 schema (docs/05-DATA.md).
-- Additions beyond the doc, all needed by agreed decisions:
--   program_blocks.deload_weeks, program_days.full_name,
--   exercises.load_type / load_direction,
--   exercise_prescriptions.key / section / sets_max / duration_seconds_max / per_side,
--   cardio_prescriptions.target_minutes_max,
--   workout_exercises.target_sets / rest_seconds (snapshot, so deload weeks rebuild correctly).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  weight_unit text not null default 'lb' check (weight_unit in ('lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users created before this migration ran.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- program definition (read-only to clients)

create table public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  duration_weeks int not null check (duration_weeks > 0),
  deload_weeks int[] not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_block_id uuid not null references public.program_blocks (id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  name text not null,
  full_name text not null,
  session_type text not null check (session_type in ('lifting', 'aerobic_mobility', 'rest')),
  notes text,
  sort_order int not null,
  unique (program_block_id, day_of_week)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null
    check (category in ('strength', 'hypertrophy', 'mobility', 'cardio', 'core', 'skill-prep')),
  load_type text not null
    check (load_type in ('barbell', 'dumbbell', 'machine', 'cable', 'assisted', 'bodyweight', 'none')),
  load_direction text not null default 'higher_is_harder'
    check (load_direction in ('higher_is_harder', 'lower_is_harder')),
  image_url text,
  video_url text,
  animation_url text,
  instructions text,
  created_at timestamptz not null default now()
);

create table public.exercise_prescriptions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  program_day_id uuid not null references public.program_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  section text not null check (section in ('prep', 'main', 'mobility')),
  sort_order int not null,
  sets int not null check (sets > 0),
  sets_max int,
  rep_min int,
  rep_max int,
  duration_seconds int,
  duration_seconds_max int,
  per_side boolean not null default false,
  rest_seconds int,
  target_rir_min numeric,
  target_rir_max numeric,
  progression_type text not null default 'none'
    check (progression_type in ('double_progression', 'assistance_reduction', 'bodyweight_reps', 'none')),
  load_increment numeric,
  notes text,
  is_optional boolean not null default false
);

create index exercise_prescriptions_day_idx on public.exercise_prescriptions (program_day_id, sort_order);

create table public.cardio_prescriptions (
  id uuid primary key default gen_random_uuid(),
  program_block_id uuid not null references public.program_blocks (id) on delete cascade,
  week_number int not null check (week_number > 0),
  day_of_week int not null check (day_of_week between 1 and 7),
  modality text not null check (modality in ('bike', 'incline_walk')),
  target_minutes int not null check (target_minutes > 0),
  target_minutes_max int,
  target_rpe_min int not null,
  target_rpe_max int not null,
  notes text,
  unique (program_block_id, week_number, day_of_week)
);

-- ---------------------------------------------------------------------------
-- user data

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_block_id uuid not null references public.program_blocks (id),
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create unique index program_enrollments_one_active
  on public.program_enrollments (user_id) where status = 'active';

create table public.workouts (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_block_id uuid not null references public.program_blocks (id),
  program_day_id uuid not null references public.program_days (id),
  week_number int not null,
  scheduled_date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scheduled_date, program_day_id)
);

create index workouts_user_date_idx on public.workouts (user_id, scheduled_date desc);

create trigger workouts_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

create table public.workout_exercises (
  id uuid primary key,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  prescription_id uuid not null references public.exercise_prescriptions (id),
  planned_order int not null,
  actual_order int,
  target_sets int not null,
  rest_seconds int,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  unique (workout_id, prescription_id)
);

create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

create table public.workout_sets (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  set_number int not null check (set_number > 0),
  weight numeric,
  reps int check (reps is null or reps >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);

create index workout_sets_user_exercise_idx on public.workout_sets (user_id, exercise_id, completed_at desc);

create trigger workout_sets_updated_at before update on public.workout_sets
  for each row execute function public.set_updated_at();

create table public.cardio_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_block_id uuid not null references public.program_blocks (id),
  week_number int not null,
  scheduled_date date not null,
  modality text not null check (modality in ('bike', 'incline_walk')),
  target_minutes int not null,
  actual_minutes int not null check (actual_minutes >= 0),
  rpe int not null check (rpe between 1 and 10),
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index cardio_logs_user_date_idx on public.cardio_logs (user_id, scheduled_date desc);

create table public.mobility_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_date date not null,
  exercise_id uuid not null references public.exercises (id),
  completed boolean not null default true,
  completed_at timestamptz,
  unique (user_id, scheduled_date, exercise_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security

alter table public.profiles enable row level security;
alter table public.program_blocks enable row level security;
alter table public.program_days enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_prescriptions enable row level security;
alter table public.cardio_prescriptions enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.cardio_logs enable row level security;
alter table public.mobility_logs enable row level security;

-- Program definition: readable when signed in, never writable from the client.
create policy "program_blocks readable" on public.program_blocks for select to authenticated using (true);
create policy "program_days readable" on public.program_days for select to authenticated using (true);
create policy "exercises readable" on public.exercises for select to authenticated using (true);
create policy "exercise_prescriptions readable" on public.exercise_prescriptions for select to authenticated using (true);
create policy "cardio_prescriptions readable" on public.cardio_prescriptions for select to authenticated using (true);

-- Profiles: own row only; rows are created by the auth trigger.
create policy "profiles select own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Tables with a user_id column.
do $$
declare t text;
begin
  foreach t in array array['program_enrollments', 'workouts', 'workout_sets', 'cardio_logs', 'mobility_logs'] loop
    execute format(
      'create policy "%1$s own rows" on public.%1$I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- workout_exercises: through the parent workout.
create policy "workout_exercises via workout" on public.workout_exercises for all to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Explicit grants (don't rely on project defaults for Data API exposure).

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select on public.program_blocks, public.program_days, public.exercises,
  public.exercise_prescriptions, public.cardio_prescriptions to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.program_enrollments, public.workouts,
  public.workout_exercises, public.workout_sets, public.cardio_logs, public.mobility_logs to authenticated;

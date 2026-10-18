-- Five-year civilian readiness campaign. This adds to, not replaces, training tables.
create table public.mission_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_date date not null,
  mission_id text not null check (char_length(mission_id) between 1 and 120),
  status text not null check (status in ('completed', 'needs_work')),
  evidence text check (evidence is null or char_length(evidence) <= 2000),
  completed_at timestamptz not null default now(),
  unique (user_id, scheduled_date, mission_id)
);
create index mission_logs_user_date_idx on public.mission_logs (user_id, scheduled_date desc);
alter table public.mission_logs enable row level security;
create policy "mission_logs own rows" on public.mission_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.mission_logs to authenticated;

create table public.capability_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_key text not null check (test_key in (
    'run_5k_minutes', 'pullups_strict', 'loaded_hike_15kg_km', 'swim_continuous_m', 'carry_20kg_m'
  )),
  value numeric not null check (value > 0),
  tested_on date not null,
  created_at timestamptz not null default now()
);
create index capability_tests_user_key_date_idx
  on public.capability_tests (user_id, test_key, tested_on desc);
alter table public.capability_tests enable row level security;
create policy "capability_tests own rows" on public.capability_tests for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.capability_tests to authenticated;

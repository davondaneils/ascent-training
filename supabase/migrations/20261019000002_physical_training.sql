-- Expanded civilian endurance modalities. Existing cardio/workout logs are preserved.
alter table public.cardio_logs
  drop constraint if exists cardio_logs_modality_check;
alter table public.cardio_logs
  add constraint cardio_logs_modality_check
  check (modality in ('bike', 'incline_walk', 'run_walk', 'run', 'swim', 'hike', 'loaded_hike'));

-- The 20 program definitions are seeded idempotently by npm run db:push
-- from lib/training/programs/readiness.ts, after this migration.
-- Never delete/replace historical workout rows or their prescription IDs.

-- Expand BOTH program prescriptions and cardio logs, retaining historical rows.
-- A new 20-block readiness program contains running, swimming and hiking.
alter table public.cardio_prescriptions
  drop constraint if exists cardio_prescriptions_modality_check;
alter table public.cardio_prescriptions
  add constraint cardio_prescriptions_modality_check
  check (modality in ('bike', 'incline_walk', 'run_walk', 'run', 'swim', 'hike', 'loaded_hike'));

alter table public.cardio_logs
  drop constraint if exists cardio_logs_modality_check;
alter table public.cardio_logs
  add constraint cardio_logs_modality_check
  check (modality in ('bike', 'incline_walk', 'run_walk', 'run', 'swim', 'hike', 'loaded_hike'));

-- After this migration, npm run db:push seeds all 20 physical program blocks
-- idempotently from the curriculum source. Neither migration deletes logs.

-- Record the pack carried on loaded hikes. Additive only: a nullable column, so every existing
-- cardio log keeps its values and reads as "not recorded".
--
-- Farmer's-carry load needs no schema change: workout_sets.weight already exists and is nullable.
-- npm run db:push re-seeds the farmer-carry exercise row as load_type 'dumbbell' so the logger
-- shows a weight field; historical carry sets keep weight null.
alter table public.cardio_logs
  add column if not exists pack_weight_kg numeric
  check (pack_weight_kg is null or (pack_weight_kg >= 0 and pack_weight_kg <= 40));

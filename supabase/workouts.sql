-- Fit Tracker — расширение таблицы workouts под сессии A/B и цели на след. раз.
-- Выполнить в Supabase → SQL Editor.

alter table public.workouts add column if not exists workout_type text; -- 'A' | 'B'
alter table public.workouts add column if not exists next_target text;  -- (legacy, не используется)

-- Цель на следующий раз — структурно.
alter table public.workouts add column if not exists next_weight numeric(6, 2);
alter table public.workouts add column if not exists next_sets int;
alter table public.workouts add column if not exists next_reps int;

-- Одна строка на (дата, тип, упражнение) — чтобы пересохранение сессии не плодило дубли.
create unique index if not exists workouts_session_exercise_idx
  on public.workouts (user_id, date, workout_type, exercise);

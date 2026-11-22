-- Fit Tracker — свободные тренировки вместо шаблонов A/B.
-- Выполнить в Supabase → SQL Editor ОДИН РАЗ и ДО выкладки версии приложения,
-- в которой тренировка собирается из справочника упражнений.
-- Повторный запуск безопасен.

-- ── Справочник упражнений ─────────────────────────────────
-- category: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'abs' | 'other'
-- is_core: упражнение «Основы» — первая вкладка при добавлении в тренировку.
create table if not exists public.exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  category   text not null default 'other',
  is_core    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.exercises enable row level security;

drop policy if exists own_rows_select on public.exercises;
drop policy if exists own_rows_insert on public.exercises;
drop policy if exists own_rows_update on public.exercises;
drop policy if exists own_rows_delete on public.exercises;
create policy own_rows_select on public.exercises for select using (user_id = auth.uid());
create policy own_rows_insert on public.exercises for insert with check (user_id = auth.uid());
create policy own_rows_update on public.exercises for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows_delete on public.exercises for delete using (user_id = auth.uid());

-- Начальный справочник: всё, что сейчас в тренировках, плюс присед и становая.
-- В SQL Editor auth.uid() пустой, поэтому владелец берётся из уже записанных тренировок.
insert into public.exercises (user_id, name, category, is_core)
select owner.user_id, v.name, v.category, v.is_core
from (select distinct user_id from public.workouts) as owner
cross join (values
  ('Присед', 'legs', true),
  ('Жим лёжа', 'chest', true),
  ('Становая тяга', 'back', true),
  ('Плечи — махи (гантели)', 'shoulders', true),
  ('Плечи — махи (кроссовер)', 'shoulders', true),
  ('Многоповторный жим', 'chest', false),
  ('Наклонный жим штанги', 'chest', false),
  ('Подтягивания', 'back', false),
  ('Тяга верхнего блока', 'back', false),
  ('Тяга нижнего блока', 'back', false),
  ('Задняя дельта — подъём гантелей', 'shoulders', false),
  ('Молотки', 'arms', false),
  ('Гиперэкстензия', 'legs', false),
  ('Отведение бедра (тренажёр)', 'legs', false),
  ('Ноги — перёд бедра', 'legs', false),
  ('Ноги — зад бедра', 'legs', false),
  ('Скручивания на пресс', 'abs', false)
) as v (name, category, is_core)
on conflict (user_id, name) do nothing;

-- ── Тренировки: одна на дату, порядок упражнений ──────────
-- Порядок, в котором упражнения добавлены в тренировку (для истории).
alter table public.workouts add column if not exists position int;

-- Старые тренировки A/B — в порядке их бывших шаблонов.
update public.workouts as w
set position = array_position(array[
  'Жим лёжа', 'Многоповторный жим', 'Наклонный жим штанги', 'Подтягивания',
  'Подтягивания (гравитрон)', 'Тяга верхнего блока', 'Тяга нижнего блока',
  'Ноги — перёд бедра', 'Ноги — зад бедра', 'Задняя дельта — подъём гантелей',
  'Плечи — махи (кроссовер)', 'Плечи — махи (гантели)', 'Плечи — махи', 'Молотки',
  'Гиперэкстензия', 'Отведение бедра (тренажёр)', 'Скручивания на пресс'
], w.exercise)
where w.position is null;

-- Ключ сохранения теперь дата + упражнение (без типа A/B). В старых данных
-- A и B никогда не были в один день, так что индекс создаётся без конфликтов.
create unique index if not exists workouts_date_exercise_idx
  on public.workouts (user_id, date, exercise);
drop index if exists public.workouts_session_exercise_idx;

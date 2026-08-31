-- Fit Tracker — схема Supabase (Postgres).
-- Выполнить в Supabase → SQL Editor один раз.
-- Авторизация встроенная (auth.users). RLS ограничивает данные владельцем.

-- ── Вес (одна запись на дату) ─────────────────────────────
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  weight     numeric(5, 2) not null,
  body_fat   numeric(4, 1),
  note       text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── Замеры (одна запись на дату) ──────────────────────────
create table if not exists public.measurements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  waist      numeric(5, 1),
  chest      numeric(5, 1),
  shoulders  numeric(5, 1),
  arm        numeric(5, 1),
  forearm    numeric(5, 1),
  neck       numeric(5, 1),
  note       text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── Тренировки (много строк на дату) ──────────────────────
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  exercise   text not null,
  weight     numeric(6, 2),
  sets       int,
  reps       int,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_user_date_idx on public.weight_logs (user_id, date desc);
create index if not exists measurements_user_date_idx on public.measurements (user_id, date desc);
create index if not exists workouts_user_date_idx on public.workouts (user_id, date desc);

-- ── RLS: каждый видит и меняет только своё ────────────────
alter table public.weight_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.workouts enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['weight_logs', 'measurements', 'workouts'] loop
    execute format('drop policy if exists own_rows_select on public.%I;', t);
    execute format('drop policy if exists own_rows_insert on public.%I;', t);
    execute format('drop policy if exists own_rows_update on public.%I;', t);
    execute format('drop policy if exists own_rows_delete on public.%I;', t);

    execute format('create policy own_rows_select on public.%I for select using (user_id = auth.uid());', t);
    execute format('create policy own_rows_insert on public.%I for insert with check (user_id = auth.uid());', t);
    execute format('create policy own_rows_update on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
    execute format('create policy own_rows_delete on public.%I for delete using (user_id = auth.uid());', t);
  end loop;
end $$;

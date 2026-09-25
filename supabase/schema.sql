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
-- chest/shoulders/arm/forearm/neck больше не собираются приложением (см.
-- entities/Measurement) — колонки оставлены ради старых записей, не дропаем.
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

-- ── Продукты (личная база БЖУ: базовые продукты и готовые блюда) ──
-- unit='g'  → kcal/protein/fat/carbs заданы НА 100Г
-- unit='piece' → заданы НА 1 ШТУКУ (яйца по категории С0/С1/С2 и т.п.)
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  category   text not null default 'base', -- 'base' | 'dish'
  unit       text not null default 'g',    -- 'g' | 'piece'
  kcal       numeric(6, 1) not null,
  protein    numeric(5, 1) not null,
  fat        numeric(5, 1) not null,
  carbs      numeric(5, 1) not null,
  fiber      numeric(5, 1) not null default 0,
  created_at timestamptz not null default now()
);

-- ── Дневник питания (много строк на дату) ─────────────────
-- kcal/protein/fat/carbs — снапшот на момент записи (не пересчитывается
-- задним числом, если БЖУ продукта потом отредактируют).
create table if not exists public.diary_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date         date not null,
  meal_type    text not null default 'other', -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  amount       numeric(6, 1) not null, -- граммы или штуки, смотря по unit продукта
  kcal         numeric(6, 1) not null,
  protein      numeric(5, 1) not null,
  fat          numeric(5, 1) not null,
  carbs        numeric(5, 1) not null,
  fiber        numeric(5, 1) not null default 0,
  created_at   timestamptz not null default now()
);

-- На случай, если products/diary_entries уже были созданы раньше без этих колонок.
alter table if exists public.diary_entries add column if not exists meal_type text not null default 'other';
alter table if exists public.products add column if not exists fiber numeric(5, 1) not null default 0;
alter table if exists public.diary_entries add column if not exists fiber numeric(5, 1) not null default 0;

-- ── Фото прогресса (метаданные; сами файлы — в Storage-бакете progress-photos) ──
-- angle: 'front' | 'side' | 'back'. Один снимок на ракурс в день (как весы —
-- перезалил тот же день/ракурс, старый файл просто заменяется).
create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date         date not null,
  angle        text not null default 'front',
  storage_path text not null,
  note         text,
  created_at   timestamptz not null default now(),
  unique (user_id, date, angle)
);

create index if not exists weight_logs_user_date_idx on public.weight_logs (user_id, date desc);
create index if not exists measurements_user_date_idx on public.measurements (user_id, date desc);
create index if not exists workouts_user_date_idx on public.workouts (user_id, date desc);
create index if not exists products_user_name_idx on public.products (user_id, name);
create index if not exists diary_entries_user_date_idx on public.diary_entries (user_id, date desc);
create index if not exists progress_photos_user_date_idx on public.progress_photos (user_id, date desc);

-- Приватный бакет под сами файлы — доступ только через RLS storage.objects ниже,
-- никаких публичных ссылок, фото отдаются подписанными URL с коротким сроком.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- ── RLS: каждый видит и меняет только своё ────────────────
alter table public.weight_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.workouts enable row level security;
alter table public.products enable row level security;
alter table public.diary_entries enable row level security;
alter table public.progress_photos enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['weight_logs', 'measurements', 'workouts', 'products', 'diary_entries', 'progress_photos'] loop
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

-- ── RLS для файлов в Storage: путь вида "<user_id>/<...>", доступ только владельцу ──
drop policy if exists progress_photos_owner_select on storage.objects;
drop policy if exists progress_photos_owner_insert on storage.objects;
drop policy if exists progress_photos_owner_update on storage.objects;
drop policy if exists progress_photos_owner_delete on storage.objects;

create policy progress_photos_owner_select on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_owner_insert on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_owner_update on storage.objects for update
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy progress_photos_owner_delete on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

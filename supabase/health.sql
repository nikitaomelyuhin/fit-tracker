-- Fit Tracker — таблицы для данных здоровья (Apple Health через Health Auto Export).
-- Выполнить в Supabase → SQL Editor.

-- Сырые входящие payload'ы (для отладки формата и разбора).
create table if not exists public.health_imports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  received_at timestamptz not null default now(),
  payload     jsonb not null
);

-- Разобранные дневные метрики (гибко: имя метрики + дата + значение).
create table if not exists public.health_metrics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  metric     text not null, -- 'active_energy', 'sleep_hours', 'steps', 'resting_hr', ...
  value      numeric not null,
  unit       text,
  created_at timestamptz not null default now(),
  unique (user_id, date, metric)
);

create index if not exists health_metrics_user_date_idx on public.health_metrics (user_id, date desc);
create index if not exists health_imports_user_idx on public.health_imports (user_id, received_at desc);

-- RLS: читать может только владелец. Запись идёт из Edge Function под service_role (в обход RLS).
alter table public.health_imports enable row level security;
alter table public.health_metrics enable row level security;

drop policy if exists own_select on public.health_imports;
drop policy if exists own_select on public.health_metrics;
create policy own_select on public.health_imports for select using (user_id = auth.uid());
create policy own_select on public.health_metrics for select using (user_id = auth.uid());

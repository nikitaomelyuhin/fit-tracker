-- Разовая пометка читмилов задним числом (3 и 4 октября — записывал от балды,
-- 17 октября — ничего не записывал). Выполнить в Supabase → SQL Editor ПОСЛЕ
-- schema.sql. user_id берётся из существующих записей веса (приложение однопользовательское).
insert into public.cheat_days (user_id, date)
select u.user_id, v.d::date
from (select distinct user_id from public.weight_logs) u
cross join (values ('2026-10-03'), ('2026-10-04'), ('2026-10-17')) as v(d)
on conflict (user_id, date) do nothing;

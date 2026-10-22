-- Fit Tracker — планировщик бэкапа. Выполнить в Supabase → SQL Editor
-- ПОСЛЕ того, как задеплоена функция backup-export и заданы её секреты
-- (BACKUP_WEBHOOK_SECRET, BACKUP_USER_ID, GITHUB_TOKEN, GITHUB_REPO).

-- Расширения для запуска HTTP-запроса по расписанию из БД.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Секрет вебхука — в Vault, а не текстом в джобе. Значение то же, что у функции
--    в BACKUP_WEBHOOK_SECRET. Выполнить один раз; сменить потом:
--    select vault.update_secret(id, '<новый секрет>') from vault.secrets where name = 'backup_webhook_secret';
select vault.create_secret('<BACKUP_WEBHOOK_SECRET>', 'backup_webhook_secret');

-- 2. Ежедневный вызов backup-export в 03:00 UTC. Джоб с тем же именем заменяется,
--    так что повторный запуск этого блока безопасен.
select cron.schedule(
  'fit-tracker-daily-backup',
  '0 3 * * *',
  $$
  select net.http_post(
    -- В панели функция называется backup-export, но её адрес (slug) — rapid-api.
    url := 'https://acvhknhgiaatemoqwtsd.supabase.co/functions/v1/rapid-api',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'backup_webhook_secret')
    ),
    body := '{}'::jsonb,
    -- По умолчанию pg_net ждёт 5 с; функция читает 6 таблиц и дважды ходит в GitHub.
    timeout_milliseconds := 30000
  );
  $$
);

-- Проверить, что джоб создался:
-- select jobname, schedule, active from cron.job;

-- Запуски джоба (здесь только то, ушёл ли запрос):
-- select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;

-- Ответ самой функции (200 — бэкап в GitHub лёг, 401 — не тот секрет, 500 — см. текст):
-- select status_code, content, created from net._http_response order by created desc limit 5;

-- Отменить джоб:
-- select cron.unschedule('fit-tracker-daily-backup');

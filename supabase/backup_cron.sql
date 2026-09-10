-- Fit Tracker — планировщик бэкапа. Выполнить в Supabase → SQL Editor
-- ПОСЛЕ того, как задеплоена функция backup-export и заданы её секреты
-- (BACKUP_WEBHOOK_SECRET, BACKUP_USER_ID, GITHUB_TOKEN, GITHUB_REPO).

-- Расширения для запуска HTTP-запроса по расписанию из БД.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Ежедневный вызов backup-export в 03:00 UTC.
-- Замени <PROJECT_REF> на свой (виден в URL проекта: https://<PROJECT_REF>.supabase.co)
-- и <BACKUP_WEBHOOK_SECRET> на тот же секрет, что задавал функции.
select cron.schedule(
  'fit-tracker-daily-backup',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/backup-export',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<BACKUP_WEBHOOK_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Проверить, что джоб создался:
-- select * from cron.job;

-- Отменить джоб, если что-то не так:
-- select cron.unschedule('fit-tracker-daily-backup');

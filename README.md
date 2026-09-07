# Fit Tracker

Личное веб-приложение (Vue 3 + Vite, SPA) для ежедневного ввода **веса, замеров тела и тренировок**.
Данные — в Supabase, доступны с любого устройства. Ставится как PWA на телефон.

## Запуск локально

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Создать бесплатный проект на [supabase.com](https://supabase.com).
3. В Supabase → **SQL Editor** выполнить `supabase/schema.sql` (создаст таблицы + RLS).
4. Скопировать `.env.example` → `.env` и вписать из Supabase → Project Settings → API:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Запустить:
   ```bash
   npm run dev
   ```

## Деплой

Автодеплой на **GitHub Pages** через GitHub Actions (`.github/workflows/deploy-pages.yml`) — пуш в `main` собирает
проект и публикует `dist/`. Сайт доступен из России без VPN (в отличие от Netlify/Cloudflare Pages, которые
периодически режутся DPI по IP/TLS).

Разовая настройка:

1. Repo → **Settings → Pages → Build and deployment → Source** — выбрать **GitHub Actions**.
2. Repo → **Settings → Secrets and variables → Actions** — добавить секреты `VITE_SUPABASE_URL` и
   `VITE_SUPABASE_ANON_KEY` (те же значения, что в локальном `.env`).
3. Запушить в `main` — через минуту сайт появится на `https://<username>.github.io/<repo>/`.

Дальше каждый пуш в `main` деплоится сам.

## Архитектура

FSD (`app → pages → widgets → features → entities → shared`), логика в Pinia-сторах,
Supabase-запросы только в сторах, CSS-модули + дизайн-токены. Подробности — в `CLAUDE.md`.

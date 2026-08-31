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

`npm run build` → залить папку `dist/` на **Netlify** (или подключить репозиторий: build command `npm run build`, publish dir `dist`).
Переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` задать в настройках Netlify.

## Архитектура

FSD (`app → pages → widgets → features → entities → shared`), логика в Pinia-сторах,
Supabase-запросы только в сторах, CSS-модули + дизайн-токены. Подробности — в `CLAUDE.md`.

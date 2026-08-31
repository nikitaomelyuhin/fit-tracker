import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы — заполни .env. ' +
      'Пока работает заглушка: UI откроется, но данные не сохранятся.',
  )
}

// Валидный плейсхолдер, чтобы createClient не падал до подключения реального проекта.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-anon-key'

/**
 * Инфраструктурный клиент Supabase (только инстанс).
 * Все запросы (select/insert/update/delete) живут в сторах, не здесь.
 */
export const supabase = createClient(url || PLACEHOLDER_URL, anonKey || PLACEHOLDER_KEY)

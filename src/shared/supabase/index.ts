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

const REQUEST_TIMEOUT_MS = 12_000

/**
 * При плохой/заблокированной сети запрос к Supabase может висеть минутами —
 * UI при этом пустой и без ошибки. С таймаутом он падает в ошибку, и экран
 * показывает «Повторить». Загрузку файлов (фото) не ограничиваем — она законно
 * бывает долгой на мобильной сети.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = (init?.method ?? 'GET').toUpperCase()
  const isUpload = requestUrl.includes('/storage/v1/object/') && (method === 'POST' || method === 'PUT')
  if (isUpload) return fetch(input, init)

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal =
    init?.signal && typeof AbortSignal.any === 'function' ? AbortSignal.any([init.signal, timeout]) : init?.signal ?? timeout
  return fetch(input, { ...init, signal })
}

/**
 * Инфраструктурный клиент Supabase (только инстанс).
 * Все запросы (select/insert/update/delete) живут в сторах, не здесь.
 */
export const supabase = createClient(url || PLACEHOLDER_URL, anonKey || PLACEHOLDER_KEY, {
  global: { fetch: fetchWithTimeout },
})

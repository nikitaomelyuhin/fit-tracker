// Supabase Edge Function: полный бэкап данных Fit Tracker → приватный
// репозиторий на GitHub (Contents API). Не зависит от Supabase Storage —
// отдельный сервис, чтобы не терять бэкапы вместе с проблемами у Supabase.
//
// Деплой:  supabase functions deploy backup-export --no-verify-jwt
// Секреты:
//   BACKUP_WEBHOOK_SECRET  — свой секрет для защиты эндпоинта
//   BACKUP_USER_ID         — твой user id (auth.users.id)
//   GITHUB_TOKEN           — fine-grained PAT, права Contents: Read and write,
//                            только на репозиторий бэкапов
//   GITHUB_REPO            — "владелец/репозиторий", например "nikitaomelyuhin/fit-tracker-backups"
// (SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY доступны в рантайме автоматически.)
//
// Триггерится раз в день через pg_cron (см. supabase/backup_cron.sql).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BACKUP_DIR = 'backups'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(req.url)
  const secret = req.headers.get('x-webhook-secret') ?? url.searchParams.get('secret')
  const expected = Deno.env.get('BACKUP_WEBHOOK_SECRET')
  if (!expected || secret !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = Deno.env.get('BACKUP_USER_ID')
  const githubToken = Deno.env.get('GITHUB_TOKEN')
  const githubRepo = Deno.env.get('GITHUB_REPO') // "owner/repo"
  if (!userId || !githubToken || !githubRepo) {
    return new Response('Missing BACKUP_USER_ID / GITHUB_TOKEN / GITHUB_REPO', { status: 500 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const tables = ['weight_logs', 'measurements', 'workouts', 'products', 'diary_entries'] as const
  const snapshot: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    app: 'fit-tracker',
    kind: 'auto-backup',
  }

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId)
    if (error) {
      return new Response(`Failed reading ${table}: ${error.message}`, { status: 500 })
    }
    snapshot[table] = data
  }

  const date = new Date().toISOString().slice(0, 10)
  const path = `${BACKUP_DIR}/fit-tracker-backup-${date}.json`
  const content = JSON.stringify(snapshot, null, 2)

  const githubHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  // Тот же день — обновляем файл (нужен sha существующего), иначе создаём новый.
  let sha: string | undefined
  const existing = await fetch(
    `https://api.github.com/repos/${githubRepo}/contents/${path}`,
    { headers: githubHeaders },
  )
  if (existing.ok) {
    const existingJson = await existing.json()
    sha = existingJson.sha
  }

  const put = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`, {
    method: 'PUT',
    headers: githubHeaders,
    body: JSON.stringify({
      message: `Бэкап Fit Tracker ${date}`,
      content: base64Encode(content),
      sha,
    }),
  })

  if (!put.ok) {
    const text = await put.text()
    return new Response(`GitHub upload failed: ${put.status} ${text}`, { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, path }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

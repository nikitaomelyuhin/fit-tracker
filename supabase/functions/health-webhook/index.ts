// Supabase Edge Function: приёмник вебхука Health Auto Export.
// Деплой:  supabase functions deploy health-webhook --no-verify-jwt
// Секреты: supabase secrets set HEALTH_WEBHOOK_SECRET=... HEALTH_USER_ID=...
// (SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY доступны в рантайме автоматически.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ParsedMetric {
  date: string
  metric: string
  value: number
  unit: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Проверка секрета (URL публичный, поэтому свой токен).
  const url = new URL(req.url)
  const secret = req.headers.get('x-webhook-secret') ?? url.searchParams.get('secret')
  const expected = Deno.env.get('HEALTH_WEBHOOK_SECRET')
  if (!expected || secret !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = Deno.env.get('HEALTH_USER_ID')
  if (!userId) {
    return new Response('HEALTH_USER_ID not configured', { status: 500 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1) Сохраняем сырой payload — чтобы увидеть реальный формат и допилить парсер.
  await supabase.from('health_imports').insert({ user_id: userId, payload })

  // 2) Лучшая-по-возможности разборка (уточним под реальный формат после первого экспорта).
  const metrics = parseMetrics(payload)
  if (metrics.length) {
    const rows = metrics.map((m) => ({
      user_id: userId,
      date: m.date,
      metric: m.metric,
      value: m.value,
      unit: m.unit,
    }))
    await supabase.from('health_metrics').upsert(rows, { onConflict: 'user_id,date,metric' })
  }

  return new Response(JSON.stringify({ ok: true, parsed: metrics.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMetrics(payload: any): ParsedMetric[] {
  // Формат из Apple Shortcuts (мы его контролируем):
  // { "date": "2026-08-31", "metrics": { "active_energy": 512, "steps": 8400, "sleep_hours": 7.2, "resting_hr": 58 } }
  if (payload?.metrics && typeof payload.metrics === 'object' && !Array.isArray(payload.metrics)) {
    const date = String(payload.date ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)
    return Object.entries(payload.metrics)
      .filter(([, value]) => typeof value === 'number')
      .map(([metric, value]) => ({ date, metric, value: value as number, unit: '' }))
  }

  // Фолбэк: формат Health Auto Export { data: { metrics: [ { name, units, data: [ { date, qty } ] } ] } }
  const metrics = payload?.data?.metrics
  if (!Array.isArray(metrics)) return []

  const accumulator = new Map<string, ParsedMetric>()

  for (const metric of metrics) {
    const name: string = metric?.name ?? 'unknown'
    const unit: string = metric?.units ?? ''
    const points = Array.isArray(metric?.data) ? metric.data : []

    for (const point of points) {
      const rawDate = point?.date
      if (!rawDate) continue
      const date = String(rawDate).slice(0, 10) // YYYY-MM-DD

      // Разные метрики хранят значение под разными ключами.
      let value: number | null = null
      if (typeof point?.qty === 'number') value = point.qty
      else if (typeof point?.asleep === 'number') value = point.asleep
      else if (typeof point?.totalSleep === 'number') value = point.totalSleep
      if (value == null) continue

      const key = `${date}|${name}`
      const existing = accumulator.get(key)
      if (existing) existing.value += value // суммируем интервалы за день
      else accumulator.set(key, { date, metric: name, value, unit })
    }
  }

  return [...accumulator.values()]
}

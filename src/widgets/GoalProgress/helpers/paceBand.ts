import type { PaceBand } from '../model/types'

/** Оценка темпа похудения (кг/нед, положительное — вес уходит). */
export function paceBand(ratePerWeek: number | null): PaceBand {
  if (ratePerWeek == null) return { label: 'мало данных', tone: 'muted' }
  if (ratePerWeek > 0.8) return { label: 'быстро — береги мышцы', tone: 'warn' }
  if (ratePerWeek >= 0.4) return { label: 'в целевом коридоре', tone: 'good' }
  if (ratePerWeek >= 0.15) return { label: 'медленновато', tone: 'muted' }
  return { label: 'стоит', tone: 'muted' }
}

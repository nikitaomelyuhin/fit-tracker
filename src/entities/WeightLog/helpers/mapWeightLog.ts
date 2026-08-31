import type { WeightLog, WeightLogRow } from '../model/types'

/** Преобразует строку Supabase (snake_case) в доменную модель. */
export function mapWeightLog(row: WeightLogRow): WeightLog {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    bodyFat: row.body_fat != null ? Number(row.body_fat) : null,
    note: row.note ?? null,
  }
}

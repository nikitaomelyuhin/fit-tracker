export interface WeightLog {
  id: string
  date: string // YYYY-MM-DD
  weight: number
  bodyFat: number | null
  note: string | null
}

export interface WeightLogInput {
  date: string
  weight: number
  bodyFat: number | null
  note: string | null
}

/** Строка из таблицы Supabase weight_logs (snake_case). */
export interface WeightLogRow {
  id: string
  date: string
  weight: number | string
  body_fat: number | string | null
  note: string | null
}

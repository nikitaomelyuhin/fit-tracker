export interface Measurement {
  id: string
  date: string // YYYY-MM-DD
  waist: number | null
  chest: number | null
  shoulders: number | null
  arm: number | null
  forearm: number | null
  neck: number | null
  note: string | null
}

export interface MeasurementInput {
  date: string
  waist: number | null
  chest: number | null
  shoulders: number | null
  arm: number | null
  forearm: number | null
  neck: number | null
  note: string | null
}

/** Строка из таблицы Supabase measurements. */
export interface MeasurementRow {
  id: string
  date: string
  waist: number | string | null
  chest: number | string | null
  shoulders: number | string | null
  arm: number | string | null
  forearm: number | string | null
  neck: number | string | null
  note: string | null
}

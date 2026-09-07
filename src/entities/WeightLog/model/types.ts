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

/** Недельное среднее (неделя: среда → вторник) и его сдвиг к прошлой неделе. */
export interface WeeklyAverage {
  /** ISO-дата среды, с которой начинается неделя. */
  weekStart: string
  averageKg: number
  /** Сколько взвешиваний попало в неделю. */
  entries: number
  /** Изменение к предыдущей неделе с данными (кг): <0 — снижение. */
  deltaKg: number | null
  /** Сколько недель прошло между этой и предыдущей неделей с данными. */
  gapWeeks: number | null
}

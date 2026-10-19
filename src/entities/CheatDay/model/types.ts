export interface CheatDay {
  id: string
  date: string // YYYY-MM-DD
}

/** Строка из таблицы Supabase cheat_days. */
export interface CheatDayRow {
  id: string
  date: string
}

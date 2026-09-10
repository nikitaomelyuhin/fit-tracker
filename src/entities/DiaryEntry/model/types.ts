export interface DiaryEntry {
  id: string
  date: string // YYYY-MM-DD
  productId: string | null
  /** Снапшот имени продукта на момент записи (переживает удаление/переименование продукта). */
  productName: string
  /** Граммы или штуки — смотря по unit продукта, использованного при записи. */
  amount: number
  /** БЖУ — снапшот на момент записи, не пересчитывается, если продукт потом изменят. */
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export interface DiaryEntryInput {
  date: string
  productId: string | null
  productName: string
  amount: number
  kcal: number
  protein: number
  fat: number
  carbs: number
}

/** Строка из таблицы Supabase diary_entries. */
export interface DiaryEntryRow {
  id: string
  date: string
  product_id: string | null
  product_name: string
  amount: number | string
  kcal: number | string
  protein: number | string
  fat: number | string
  carbs: number | string
}

/** Итоги БЖУ за день. */
export interface DailyTotals {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export interface DiaryDayGroup {
  date: string
  entries: DiaryEntry[]
  totals: DailyTotals
}

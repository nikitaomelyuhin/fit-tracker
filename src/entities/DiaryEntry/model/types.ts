import type { MealType } from '@/shared/config/nutrition'

export interface DiaryEntry {
  id: string
  date: string // YYYY-MM-DD
  mealType: MealType
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
  fiber: number
}

export interface DiaryEntryInput {
  date: string
  mealType: MealType
  productId: string | null
  productName: string
  amount: number
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

/** Строка из таблицы Supabase diary_entries. */
export interface DiaryEntryRow {
  id: string
  date: string
  meal_type: string
  product_id: string | null
  product_name: string
  amount: number | string
  kcal: number | string
  protein: number | string
  fat: number | string
  carbs: number | string
  fiber: number | string
}

/** Итоги БЖУ. */
export interface DailyTotals {
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

/** Один приём пищи (время суток) внутри дня, с итогами. */
export interface MealGroup {
  mealType: MealType
  entries: DiaryEntry[]
  totals: DailyTotals
}

/** День целиком: приёмы пищи по времени суток + итог за день. */
export interface DiaryDayGroup {
  date: string
  meals: MealGroup[]
  totals: DailyTotals
}

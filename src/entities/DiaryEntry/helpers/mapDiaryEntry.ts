import { MEAL_TYPES, type MealType } from '@/shared/config/nutrition'
import type { DiaryEntry, DiaryEntryRow } from '../model/types'

function num(value: number | string): number {
  return Number(value)
}

function mealType(value: string): MealType {
  return (MEAL_TYPES as readonly string[]).includes(value) ? (value as MealType) : 'snack'
}

/** Преобразует строку Supabase в доменную модель записи дневника. */
export function mapDiaryEntry(row: DiaryEntryRow): DiaryEntry {
  return {
    id: row.id,
    date: row.date,
    mealType: mealType(row.meal_type),
    productId: row.product_id,
    productName: row.product_name,
    amount: num(row.amount),
    kcal: num(row.kcal),
    protein: num(row.protein),
    fat: num(row.fat),
    carbs: num(row.carbs),
    fiber: num(row.fiber),
  }
}

import type { DiaryEntry, DiaryEntryRow } from '../model/types'

function num(value: number | string): number {
  return Number(value)
}

/** Преобразует строку Supabase в доменную модель записи дневника. */
export function mapDiaryEntry(row: DiaryEntryRow): DiaryEntry {
  return {
    id: row.id,
    date: row.date,
    productId: row.product_id,
    productName: row.product_name,
    amount: num(row.amount),
    kcal: num(row.kcal),
    protein: num(row.protein),
    fat: num(row.fat),
    carbs: num(row.carbs),
  }
}

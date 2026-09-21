import type { Product, ProductRow } from '../model/types'

function num(value: number | string): number {
  return Number(value)
}

/** Преобразует строку Supabase в доменную модель продукта. */
export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category === 'dish' ? 'dish' : 'base',
    unit: row.unit === 'piece' ? 'piece' : 'g',
    kcal: num(row.kcal),
    protein: num(row.protein),
    fat: num(row.fat),
    carbs: num(row.carbs),
    fiber: num(row.fiber),
  }
}

export type ProductCategory = 'base' | 'dish'
export type ProductUnit = 'g' | 'piece'

/**
 * БЖУ заданы на 100г, если unit='g', или на 1 штуку, если unit='piece'
 * (яйца по категории С0/С1/С2, и т.п. — вместо граммов штуки).
 */
export interface Product {
  id: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

export interface ProductInput {
  name: string
  category: ProductCategory
  unit: ProductUnit
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

/** Строка из таблицы Supabase products. */
export interface ProductRow {
  id: string
  name: string
  category: string
  unit: string
  kcal: number | string
  protein: number | string
  fat: number | string
  carbs: number | string
  fiber: number | string
}

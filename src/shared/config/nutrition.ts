export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
}

/** Целевой диапазон клетчатки, г/день. */
export const DAILY_FIBER_RANGE = { min: 25, max: 30 }

/**
 * Условные ккал читмила — сколько реально съедено не знаем и не считаем.
 * Нужна одна цифра, чтобы день был виден на графике и честно сдвигал оценку
 * жира; в средние ккал и план читмилы не попадают.
 */
export const CHEAT_DAY_KCAL = 3500

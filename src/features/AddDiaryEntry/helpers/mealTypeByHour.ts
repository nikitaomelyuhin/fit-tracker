import type { MealType } from '@/shared/config/nutrition'

/** Приём пищи по времени суток — догадка для новой записи, её можно поменять. */
export function mealTypeByHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 17 && hour < 22) return 'dinner'
  return 'snack'
}

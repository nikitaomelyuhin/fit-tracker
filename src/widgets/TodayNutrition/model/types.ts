import type { MealType } from '@/shared/config/nutrition'

/** Где день относительно коридора калорий. */
export type KcalStatus = 'empty' | 'under' | 'inRange' | 'over' | 'cheat'

export interface TodayMeal {
  mealType: MealType
  label: string
  /** null — сегодня в этот приём ещё ничего не записано. */
  kcal: number | null
  /** Названия блюд для подписи строки. */
  names: string[]
  /** Сколько было в этот приём вчера — для «Как вчера»; null — вчера тоже пусто. */
  yesterdayKcal: number | null
}

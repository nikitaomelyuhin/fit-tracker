import { HEIGHT_CM, AGE } from '@/shared/config/profile'
import { ACTIVITY_FACTOR, KCAL_PER_KG } from '@/shared/config/pace'

export interface PacePoint {
  day: number
  weight: number
}

/** Поддерживающие калории для веса (Миффлин × активность). */
export function maintenanceKcal(weight: number): number {
  const bmr = 10 * weight + 6.25 * HEIGHT_CM - 5 * AGE + 5
  return bmr * ACTIVITY_FACTOR
}

/**
 * Симуляция идеального снижения при фиксированном потреблении.
 * По дням: расход падает с весом, дефицит сужается — кривая замедляется.
 */
export function projectIdealPace(
  startWeight: number,
  goalWeight: number,
  dailyKcal: number,
  maxDays = 800,
): PacePoint[] {
  const points: PacePoint[] = [{ day: 0, weight: startWeight }]
  let weight = startWeight

  for (let day = 1; day <= maxDays; day++) {
    const deficit = maintenanceKcal(weight) - dailyKcal
    if (deficit <= 0) break // достигнуто равновесие раньше цели
    weight -= deficit / KCAL_PER_KG
    if (weight <= goalWeight) {
      points.push({ day, weight: goalWeight })
      break
    }
    points.push({ day, weight })
  }

  return points
}

import type { MilestonePoint } from '../model/types'

/**
 * Все отметки пути сверху вниз: основные (и цель) плюс мелкие через каждые
 * `minorStep` кг между самой верхней основной и целью. Мелкие, совпавшие
 * с основной, не дублируются.
 */
export function milestonePoints(main: number[], goal: number, minorStep: number): MilestonePoint[] {
  const mainSet = new Set([...main, goal])
  const points: MilestonePoint[] = [...mainSet].map((weight) => ({ weight, kind: 'main' }))

  const top = Math.max(...mainSet)
  if (minorStep > 0) {
    for (let weight = top - minorStep; weight > goal; weight -= minorStep) {
      const rounded = Math.round(weight * 10) / 10
      if (!mainSet.has(rounded)) points.push({ weight: rounded, kind: 'minor' })
    }
  }

  return points.sort((a, b) => b.weight - a.weight)
}

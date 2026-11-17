export type DayDeltaClass = 'first' | 'down' | 'flat' | 'up' | 'strong'

/**
 * Классифицирует дневное изменение веса. Используется ПП-стриком: класс
 * 'strong' — «чёрная зона», которая ломает серию.
 */
export function classifyDayDelta(delta: number | null): DayDeltaClass {
  if (delta == null) return 'first'
  if (delta <= -0.15) return 'down'
  if (delta < 0.15) return 'flat'
  if (delta < 0.7) return 'up'
  return 'strong'
}

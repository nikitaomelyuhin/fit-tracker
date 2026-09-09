export type TargetDirection = 'up' | 'down'

export interface MetricTarget {
  min: number
  max: number
  /** 'down' — хотим уменьшить (талия, жир). */
  direction: TargetDirection
}

/** Целевой обхват талии (см) из плана. Остальные обхваты больше не отслеживаем. */
export const MEASUREMENT_TARGETS = {
  waist: { min: 82, max: 84, direction: 'down' },
} satisfies Record<string, MetricTarget>

/** Цель по проценту жира. */
export const BODY_FAT_TARGET: MetricTarget = { min: 12, max: 15, direction: 'down' }

/** Погрешность формулы жира (%), расширяет зону «близко». */
export const BODY_FAT_TOLERANCE = 2

/** Зона «близко» для обхватов (см). */
export const MEASUREMENT_TOLERANCE = 3

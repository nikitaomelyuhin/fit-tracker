export type TargetDirection = 'up' | 'down'

export interface MetricTarget {
  min: number
  max: number
  /** 'down' — хотим уменьшить (талия, жир); 'up' — увеличить (плечи, рука). */
  direction: TargetDirection
}

/** Целевые обхваты (см) из плана. */
export const MEASUREMENT_TARGETS = {
  waist: { min: 82, max: 84, direction: 'down' },
  shoulders: { min: 127, max: 132, direction: 'up' },
  chest: { min: 108, max: 112, direction: 'up' },
  arm: { min: 40, max: 42, direction: 'up' },
  forearm: { min: 31, max: 33, direction: 'up' },
} satisfies Record<string, MetricTarget>

/** Цель по проценту жира. */
export const BODY_FAT_TARGET: MetricTarget = { min: 12, max: 15, direction: 'down' }

/** Погрешность формулы жира (%), расширяет зону «близко». */
export const BODY_FAT_TOLERANCE = 2

/** Зона «близко» для обхватов (см). */
export const MEASUREMENT_TOLERANCE = 3

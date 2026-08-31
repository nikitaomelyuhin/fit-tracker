import type { MetricTarget } from '@/shared/config/targets'

export type TargetStatus = 'reached' | 'close' | 'far'

/** Статус метрики относительно цели с учётом направления и допуска. */
export function targetStatus(value: number, target: MetricTarget, tolerance: number): TargetStatus {
  if (target.direction === 'down') {
    if (value <= target.max) return 'reached'
    if (value <= target.max + tolerance) return 'close'
    return 'far'
  }
  if (value >= target.min) return 'reached'
  if (value >= target.min - tolerance) return 'close'
  return 'far'
}

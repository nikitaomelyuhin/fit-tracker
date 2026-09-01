<template>
  <div :class="$style.targets">
    <ul :class="$style.list">
      <li v-for="row in rows" :key="row.label" :class="$style.row">
        <div :class="$style.head">
          <span :class="[$style.dot, $style['dot_' + row.status]]" />
          <span :class="$style.label">{{ row.label }}</span>
          <span :class="[$style.current, $style[row.status]]">{{ row.currentText }}</span>
          <span v-if="row.adjustedText" :class="$style.adjusted">{{ row.adjustedText }}</span>
          <span :class="$style.target">цель {{ row.targetText }}</span>
        </div>
        <div v-if="row.value != null" :class="$style.track">
          <div :class="[$style.fill, $style['fill_' + row.status]]" :style="{ width: row.pct + '%' }" />
        </div>
      </li>
    </ul>
    <p :class="$style.hint">
      Полоска — прогресс к цели (пусто → в зоне). 🟢 в цели · 🟡 близко · 🔴 далеко.
    </p>
    <p v-if="hasAdjust" :class="$style.hint">
      Обхваты «на рост» пересчитаны на сухой вес (поправка на жир сверх цели). Жир — ±{{ fatTolerance }}%.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMeasurementStore } from '@/entities/Measurement'
import { navyBodyFatMale } from '@/shared/lib/bodyfat'
import { targetStatus, type TargetStatus } from '@/shared/lib/target'
import { HEIGHT_CM } from '@/shared/config/profile'
import {
  MEASUREMENT_TARGETS,
  MEASUREMENT_TOLERANCE,
  BODY_FAT_TARGET,
  BODY_FAT_TOLERANCE,
  type MetricTarget,
} from '@/shared/config/targets'

type RowStatus = TargetStatus | 'muted'
type MetricKey = 'fat' | 'waist' | 'shoulders' | 'chest' | 'arm' | 'forearm'

const store = useMeasurementStore()
const fatTolerance = BODY_FAT_TOLERANCE

const latest = computed(() => store.byDateDesc[0] ?? null)

const bodyFat = computed(() => {
  const waist = latest.value?.waist
  const neck = latest.value?.neck
  return waist != null && neck != null ? navyBodyFatMale(waist, neck, HEIGHT_CM) : null
})

const excessFat = computed(() =>
  bodyFat.value != null ? Math.max(0, bodyFat.value - BODY_FAT_TARGET.max) : 0,
)

/** Самое раннее значение каждой метрики — стартовая точка для прогресса. */
const starts = computed<Record<MetricKey, number | null>>(() => {
  const items = store.byDateAsc
  const firstOf = (key: 'waist' | 'shoulders' | 'chest' | 'arm' | 'forearm'): number | null => {
    for (const m of items) {
      const v = m[key]
      if (v != null) return v
    }
    return null
  }
  let fat: number | null = null
  for (const m of items) {
    if (m.waist != null && m.neck != null) {
      fat = navyBodyFatMale(m.waist, m.neck, HEIGHT_CM)
      break
    }
  }
  return {
    fat,
    waist: firstOf('waist'),
    shoulders: firstOf('shoulders'),
    chest: firstOf('chest'),
    arm: firstOf('arm'),
    forearm: firstOf('forearm'),
  }
})

interface Def {
  key: MetricKey
  label: string
  value: number | null
  unit: string
  target: MetricTarget
  tolerance: number
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function progressPct(
  rawCurrent: number,
  start: number | null,
  target: MetricTarget,
  reached: boolean,
): number {
  if (reached) return 100
  if (start == null) return 0
  const goal = target.direction === 'up' ? target.min : target.max
  const total = target.direction === 'up' ? goal - start : start - goal
  const done = target.direction === 'up' ? rawCurrent - start : start - rawCurrent
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (done / total) * 100))
}

const rows = computed(() => {
  const m = latest.value
  const defs: Def[] = [
    { key: 'fat', label: 'Жир', value: bodyFat.value, unit: '%', target: BODY_FAT_TARGET, tolerance: BODY_FAT_TOLERANCE },
    { key: 'waist', label: 'Талия', value: m?.waist ?? null, unit: '', target: MEASUREMENT_TARGETS.waist, tolerance: MEASUREMENT_TOLERANCE },
    { key: 'shoulders', label: 'Плечи', value: m?.shoulders ?? null, unit: '', target: MEASUREMENT_TARGETS.shoulders, tolerance: MEASUREMENT_TOLERANCE },
    { key: 'chest', label: 'Грудь', value: m?.chest ?? null, unit: '', target: MEASUREMENT_TARGETS.chest, tolerance: MEASUREMENT_TOLERANCE },
    { key: 'arm', label: 'Рука', value: m?.arm ?? null, unit: '', target: MEASUREMENT_TARGETS.arm, tolerance: MEASUREMENT_TOLERANCE },
    { key: 'forearm', label: 'Предплечье', value: m?.forearm ?? null, unit: '', target: MEASUREMENT_TARGETS.forearm, tolerance: MEASUREMENT_TOLERANCE },
  ]

  return defs.map((def) => {
    if (def.value == null) {
      return { key: def.key, label: def.label, value: null, status: 'muted' as RowStatus, currentText: '—', adjustedText: '', targetText: rangeText(def), pct: 0 }
    }

    let evalValue = def.value
    let adjustedText = ''
    if (def.target.direction === 'up' && def.target.fatCoef && excessFat.value > 0) {
      const adjusted = round1(def.value - def.target.fatCoef * excessFat.value)
      evalValue = adjusted
      adjustedText = `≈ ${adjusted} сух.`
    }

    const status: RowStatus = targetStatus(evalValue, def.target, def.tolerance)
    const pct = progressPct(def.value, starts.value[def.key], def.target, status === 'reached')

    return {
      key: def.key,
      label: def.label,
      value: def.value,
      status,
      currentText: `${def.value}${def.unit}`,
      adjustedText,
      targetText: rangeText(def),
      pct: Math.round(pct),
    }
  })
})

const hasAdjust = computed(() => rows.value.some((row) => row.adjustedText !== ''))

function rangeText(def: Def): string {
  return `${def.target.min}–${def.target.max}${def.unit}`
}
</script>

<style module>
.targets {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.row {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.head {
  display: flex;
  align-items: baseline;
  gap: var(--space-s);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  align-self: center;
}

.dot_reached {
  background: var(--success);
}
.dot_close {
  background: var(--warning);
}
.dot_far {
  background: var(--danger);
}
.dot_muted {
  background: var(--text-muted);
}

.label {
  color: var(--text-secondary);
  font-size: var(--font-size-m);
  min-width: 76px;
}

.current {
  font-weight: 600;
  font-size: var(--font-size-m);
}

.reached {
  color: var(--success);
}
.close {
  color: var(--warning);
}
.far {
  color: var(--danger);
}
.muted {
  color: var(--text-muted);
}

.adjusted {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.target {
  margin-left: auto;
  color: var(--text-muted);
  font-size: var(--font-size-s);
}

.track {
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: var(--radius-s);
  transition: width 0.3s ease;
}

.fill_reached {
  background: var(--success);
}
.fill_close {
  background: var(--warning);
}
.fill_far {
  background: var(--danger);
}
.fill_muted {
  background: var(--text-muted);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}
</style>

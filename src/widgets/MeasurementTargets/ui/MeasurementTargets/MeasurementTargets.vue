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
        <div v-if="row.bar" :class="$style.track">
          <div
            :class="$style.band"
            :style="{ left: row.bar.bandLeft + '%', width: row.bar.bandWidth + '%' }"
          />
          <div
            :class="[$style.marker, $style['mk_' + row.status]]"
            :style="{ left: row.bar.marker + '%' }"
          />
        </div>
      </li>
    </ul>
    <p :class="$style.hint">
      Полоска — где ты относительно целевой зоны (зелёная). 🟢 в цели · 🟡 близко · 🔴 далеко.
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

interface Bar {
  marker: number
  bandLeft: number
  bandWidth: number
}

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

interface Def {
  label: string
  value: number | null
  unit: string
  target: MetricTarget
  tolerance: number
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function buildBar(value: number, target: MetricTarget): Bar {
  const lo = Math.min(value, target.min)
  const hi = Math.max(value, target.max)
  const pad = (hi - lo) * 0.15 + 1
  const rangeLo = lo - pad
  const span = hi + pad - rangeLo
  const pct = (v: number) => ((v - rangeLo) / span) * 100
  const bandA = pct(target.min)
  const bandB = pct(target.max)
  return {
    marker: pct(value),
    bandLeft: Math.min(bandA, bandB),
    bandWidth: Math.abs(bandB - bandA),
  }
}

const rows = computed(() => {
  const measurement = latest.value
  const defs: Def[] = [
    { label: 'Жир', value: bodyFat.value, unit: '%', target: BODY_FAT_TARGET, tolerance: BODY_FAT_TOLERANCE },
    { label: 'Талия', value: measurement?.waist ?? null, unit: '', target: MEASUREMENT_TARGETS.waist, tolerance: MEASUREMENT_TOLERANCE },
    { label: 'Плечи', value: measurement?.shoulders ?? null, unit: '', target: MEASUREMENT_TARGETS.shoulders, tolerance: MEASUREMENT_TOLERANCE },
    { label: 'Грудь', value: measurement?.chest ?? null, unit: '', target: MEASUREMENT_TARGETS.chest, tolerance: MEASUREMENT_TOLERANCE },
    { label: 'Рука', value: measurement?.arm ?? null, unit: '', target: MEASUREMENT_TARGETS.arm, tolerance: MEASUREMENT_TOLERANCE },
    { label: 'Предплечье', value: measurement?.forearm ?? null, unit: '', target: MEASUREMENT_TARGETS.forearm, tolerance: MEASUREMENT_TOLERANCE },
  ]

  return defs.map((def) => {
    if (def.value == null) {
      return { label: def.label, status: 'muted' as RowStatus, currentText: '—', adjustedText: '', targetText: rangeText(def), bar: null as Bar | null }
    }

    let evalValue = def.value
    let adjustedText = ''
    if (def.target.direction === 'up' && def.target.fatCoef && excessFat.value > 0) {
      const adjusted = round1(def.value - def.target.fatCoef * excessFat.value)
      evalValue = adjusted
      adjustedText = `≈ ${adjusted} сух.`
    }

    const status: RowStatus = targetStatus(evalValue, def.target, def.tolerance)
    return {
      label: def.label,
      status,
      currentText: `${def.value}${def.unit}`,
      adjustedText,
      targetText: rangeText(def),
      bar: buildBar(evalValue, def.target),
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
  position: relative;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.band {
  position: absolute;
  top: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--success) 30%, transparent);
}

.marker {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 12px;
  border-radius: 2px;
  transform: translateX(-50%);
}

.mk_reached {
  background: var(--success);
}
.mk_close {
  background: var(--warning);
}
.mk_far {
  background: var(--danger);
}
.mk_muted {
  background: var(--text-muted);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}
</style>

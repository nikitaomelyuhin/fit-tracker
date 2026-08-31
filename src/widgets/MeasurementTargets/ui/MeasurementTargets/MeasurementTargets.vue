<template>
  <div :class="$style.targets">
    <ul :class="$style.list">
      <li v-for="row in rows" :key="row.label" :class="$style.row">
        <span :class="[$style.dot, $style['dot_' + row.status]]" />
        <span :class="$style.label">{{ row.label }}</span>
        <span :class="[$style.current, $style[row.status]]">
          {{ row.currentText }}<sup v-if="row.fatCaveat">*</sup>
        </span>
        <span :class="$style.arrow">→</span>
        <span :class="$style.target">{{ row.targetText }}</span>
      </li>
    </ul>
    <p :class="$style.hint">
      🟢 в цели · 🟡 близко · 🔴 далеко · ⚪ пока не показатель. Жир — с погрешностью формулы ±{{ fatTolerance }}%.
    </p>
    <p v-if="hasFatCaveat" :class="$style.hint">
      * обхват сейчас раздут жиром — засчитаю в цель, когда станешь сухим (≈{{ fatTargetMax }}%).
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

const store = useMeasurementStore()
const fatTolerance = BODY_FAT_TOLERANCE
const fatTargetMax = BODY_FAT_TARGET.max

const latest = computed(() => store.byDateDesc[0] ?? null)

const bodyFat = computed(() => {
  const waist = latest.value?.waist
  const neck = latest.value?.neck
  return waist != null && neck != null ? navyBodyFatMale(waist, neck, HEIGHT_CM) : null
})

// «Сухой» — когда жир в пределах цели с допуском. До этого обхваты «на рост» раздуты жиром.
const isLean = computed(
  () => bodyFat.value != null && bodyFat.value <= BODY_FAT_TARGET.max + BODY_FAT_TOLERANCE,
)

interface Def {
  label: string
  value: number | null
  unit: string
  target: MetricTarget
  tolerance: number
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
      return { label: def.label, status: 'muted' as RowStatus, currentText: '—', targetText: rangeText(def), fatCaveat: false }
    }

    let status: RowStatus = targetStatus(def.value, def.target, def.tolerance)
    let fatCaveat = false

    // «Растущие» обхваты не засчитываем в цель, пока не сухой: значение раздуто жиром.
    if (def.target.direction === 'up' && !isLean.value && status === 'reached') {
      status = 'muted'
      fatCaveat = true
    }

    return { label: def.label, status, currentText: `${def.value}${def.unit}`, targetText: rangeText(def), fatCaveat }
  })
})

const hasFatCaveat = computed(() => rows.value.some((row) => row.fatCaveat))

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
  gap: var(--space-xs);
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  background: var(--bg-elevated);
  border-radius: var(--radius-m);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
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

.arrow {
  color: var(--text-muted);
}

.target {
  color: var(--text-muted);
  font-size: var(--font-size-s);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}
</style>

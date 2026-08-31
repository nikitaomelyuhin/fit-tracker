<template>
  <div :class="$style.summary">
    <div v-for="tile in tiles" :key="tile.label" :class="$style.tile">
      <span :class="$style.label">{{ tile.label }}</span>
      <span :class="$style.value">{{ tile.value }}</span>
      <span v-if="tile.sub" :class="$style.sub">{{ tile.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { navyBodyFatMale } from '@/shared/lib/bodyfat'
import { HEIGHT_CM } from '@/shared/config/profile'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { MEASUREMENT_TARGETS } from '@/shared/config/targets'

const weightLog = useWeightLogStore()
const measurement = useMeasurementStore()

const weight = computed(
  () => weightLog.currentWeekAverage ?? weightLog.byDateDesc[0]?.weight ?? null,
)
const remaining = computed(() =>
  weight.value != null ? Math.max(0, weight.value - WEIGHT_GOAL_KG) : null,
)

const latestMeasurement = computed(() => measurement.byDateDesc[0] ?? null)
const bodyFat = computed(() => {
  const m = latestMeasurement.value
  return m?.waist != null && m?.neck != null
    ? navyBodyFatMale(m.waist, m.neck, HEIGHT_CM)
    : null
})
const waist = computed(() => latestMeasurement.value?.waist ?? null)

const waistTargetText = `→ ${MEASUREMENT_TARGETS.waist.min}–${MEASUREMENT_TARGETS.waist.max}`

const tiles = computed(() => [
  { label: 'Вес (ср/нед)', value: weight.value != null ? `${weight.value} кг` : '—', sub: '' },
  {
    label: 'До цели',
    value:
      remaining.value != null
        ? remaining.value === 0
          ? 'цель! 🎉'
          : `${remaining.value.toFixed(1)} кг`
        : '—',
    sub: '',
  },
  { label: 'Жир', value: bodyFat.value != null ? `${bodyFat.value}%` : '—', sub: '' },
  { label: 'Талия', value: waist.value != null ? `${waist.value} см` : '—', sub: waistTargetText },
])
</script>

<style module>
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-s);
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-m);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.value {
  font-size: var(--font-size-l);
  font-weight: 700;
  color: var(--text-primary);
}

.sub {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

@media (max-width: 520px) {
  .summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

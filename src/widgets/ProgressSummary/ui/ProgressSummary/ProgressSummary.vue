<template>
  <div :class="$style.progress">
    <div :class="$style.row">
      <span :class="$style.label">Сброшено</span>
      <span :class="$style.value">{{ lostText }}</span>
    </div>
    <div :class="$style.row">
      <span :class="$style.label">Талия</span>
      <span :class="$style.value">{{ waistText }}</span>
    </div>
    <div :class="$style.row">
      <span :class="$style.label">Темп</span>
      <span :class="$style.value">{{ rateText }} <span :class="$style.band">· {{ band }}</span></span>
    </div>
    <div :class="$style.row">
      <span :class="$style.label">vs идеальный темп</span>
      <span :class="[$style.value, $style[paceTone]]">{{ paceText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { projectIdealPace } from '@/shared/lib/pace'
import { daysBetween } from '@/shared/lib/date'

const weightLog = useWeightLogStore()
const measurement = useMeasurementStore()

const first = computed(() => weightLog.byDateAsc[0] ?? null)
const last = computed(() => weightLog.byDateDesc[0] ?? null)
const current = computed(() => weightLog.currentWeekAverage ?? last.value?.weight ?? null)

const span = computed(() =>
  first.value && last.value ? daysBetween(first.value.date, last.value.date) : 0,
)

const lostKg = computed(() =>
  first.value && current.value != null ? first.value.weight - current.value : null,
)

const lostText = computed(() => {
  if (lostKg.value == null || (first.value && weightLog.items.length < 2)) return '—'
  const v = lostKg.value
  return v >= 0 ? `−${v.toFixed(1)} кг` : `+${Math.abs(v).toFixed(1)} кг`
})

const waistText = computed(() => {
  const start = measurement.byDateAsc[0]?.waist
  const now = measurement.byDateDesc[0]?.waist
  if (start == null || now == null || measurement.items.length < 2) return '—'
  const d = start - now
  return d >= 0 ? `−${d.toFixed(1)} см` : `+${Math.abs(d).toFixed(1)} см`
})

const rateWeek = computed(() => {
  if (lostKg.value == null || span.value < 7) return null
  return (lostKg.value / span.value) * 7
})

const rateText = computed(() =>
  rateWeek.value != null ? `−${rateWeek.value.toFixed(2)} кг/нед` : '—',
)

const band = computed(() => {
  const r = rateWeek.value
  if (r == null) return 'мало данных'
  if (r > 0.8) return 'быстро — береги мышцы'
  if (r >= 0.4) return 'в целевом коридоре'
  if (r >= 0.15) return 'медленновато'
  return 'стоит'
})

const idealDays = computed(() => {
  if (first.value == null) return 0
  const ideal = projectIdealPace(first.value.weight, WEIGHT_GOAL_KG, DAILY_KCAL_TARGET)
  return ideal.length ? ideal[ideal.length - 1].day : 0
})

const paceDiff = computed(() => {
  if (rateWeek.value == null || rateWeek.value <= 0 || current.value == null) return null
  const rateDay = rateWeek.value / 7
  const actualEtaDays = (current.value - WEIGHT_GOAL_KG) / rateDay
  return actualEtaDays - idealDays.value // <0 = опережаешь
})

const paceText = computed(() => {
  const d = paceDiff.value
  if (d == null) return 'мало данных'
  if (d < -3) return `опережаешь на ~${Math.round(-d)} дн`
  if (d > 3) return `отстаёшь на ~${Math.round(d)} дн`
  return 'вровень с идеалом'
})

const paceTone = computed(() => {
  const d = paceDiff.value
  if (d == null) return 'muted'
  return d > 3 ? 'warn' : 'good'
})
</script>

<style module>
.progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-m);
}

.label {
  font-size: var(--font-size-m);
  color: var(--text-secondary);
}

.value {
  font-weight: 600;
  color: var(--text-primary);
}

.band {
  font-weight: 400;
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.good {
  color: var(--success);
}

.warn {
  color: var(--warning);
}

.muted {
  color: var(--text-muted);
}
</style>

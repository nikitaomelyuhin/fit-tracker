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
    <p v-if="waterHint" :class="$style.hint">{{ waterHint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'

const weightLog = useWeightLogStore()
const measurement = useMeasurementStore()

const first = computed(() => weightLog.byDateAsc[0] ?? null)
const current = computed(() => weightLog.smoothedWeight)

const lostKg = computed(() =>
  first.value && current.value != null ? first.value.weight - current.value : null,
)

const lostText = computed(() => {
  if (lostKg.value == null || weightLog.items.length < 2) return '—'
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

// Темп считаем по жиру — от «чистой» точки отсчёта, без стартового слива воды.
const rateWeek = computed(() => weightLog.cleanRatePerWeek)

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

const paceDiff = computed(() => weightLog.paceVsPlan?.diffDays ?? null)

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

const waterHint = computed(() => {
  const start = weightLog.cleanStart
  if (!start || start.waterDropKg < 0.3) return null
  return `Из «сброшено» ~${start.waterDropKg.toFixed(1)} кг — вода первых ${start.windowDays} дней, не жир. Темп и план считаются уже без неё.`
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

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}
</style>

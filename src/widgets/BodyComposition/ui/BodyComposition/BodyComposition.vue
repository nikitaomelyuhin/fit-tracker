<template>
  <div :class="$style.body">
    <template v-if="bodyFat != null">
      <div :class="$style.stats">
        <div :class="$style.stat">
          <span :class="$style.label">Жир</span>
          <span :class="$style.value">{{ bodyFat }}%</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.label">Жировая масса</span>
          <span :class="$style.value">{{ fatMass }}</span>
        </div>
        <div :class="$style.stat">
          <span :class="$style.label">Сухая масса</span>
          <span :class="$style.value">{{ leanMass }}</span>
        </div>
      </div>
      <p :class="$style.hint">
        По талии {{ waist }} (рост {{ height }} см). Вес — {{ weightSourceText }}.
      </p>
    </template>
    <p v-else :class="$style.empty">Добавь замер талии и шеи — посчитаю % жира.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMeasurementStore } from '@/entities/Measurement'
import { useWeightLogStore } from '@/entities/WeightLog'
import { estimateBodyFatMale } from '@/shared/lib/bodyfat'
import { HEIGHT_CM } from '@/shared/config/profile'

const measurements = useMeasurementStore()
const weightLog = useWeightLogStore()
const height = HEIGHT_CM

const latest = computed(() => measurements.byDateDesc[0] ?? null)
const waist = computed(() => latest.value?.waist ?? null)

const bodyFat = computed(() =>
  waist.value != null ? estimateBodyFatMale(waist.value, height) : null,
)

const weekAverage = computed(() => weightLog.currentWeekAverage)
const weight = computed(() => weekAverage.value ?? weightLog.byDateDesc[0]?.weight ?? null)

const weightSourceText = computed(() => {
  if (weekAverage.value != null) return `средний за неделю ${weekAverage.value} кг`
  return weight.value != null ? `${weight.value} кг` : '—'
})

const fatMass = computed(() =>
  bodyFat.value != null && weight.value != null
    ? `${((weight.value * bodyFat.value) / 100).toFixed(1)} кг`
    : '—',
)

const leanMass = computed(() =>
  bodyFat.value != null && weight.value != null
    ? `${(weight.value * (1 - bodyFat.value / 100)).toFixed(1)} кг`
    : '—',
)
</script>

<style module>
.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-m);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.label {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.value {
  font-size: var(--font-size-l);
  font-weight: 600;
  color: var(--text-primary);
}

.hint {
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-size-m);
  text-align: center;
  padding: var(--space-l);
}
</style>

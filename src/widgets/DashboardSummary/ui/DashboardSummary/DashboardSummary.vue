<template>
  <div :class="$style.summary">
    <div v-for="tile in tiles" :key="tile.label" :class="$style.tile">
      <span :class="$style.label">{{ tile.label }}</span>
      <span :class="$style.value">{{ tile.value }}</span>
      <span v-if="tile.sub" :class="[$style.sub, $style[tile.tone]]">{{ tile.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useMeasurementStore } from '@/entities/Measurement'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { DAILY_KCAL_RANGE } from '@/shared/config/pace'
import { MEASUREMENT_TARGETS } from '@/shared/config/targets'
import { todayISO } from '@/shared/lib/date'

type Tone = 'good' | 'warn' | 'muted'

const weightLog = useWeightLogStore()
const measurement = useMeasurementStore()
const diaryEntries = useDiaryEntryStore()

const weight = computed(
  () => weightLog.currentWeekAverage ?? weightLog.byDateDesc[0]?.weight ?? null,
)
const remaining = computed(() =>
  weight.value != null ? Math.max(0, weight.value - WEIGHT_GOAL_KG) : null,
)

const bodyFat = computed(() => measurement.latestBodyFatPct)
const waist = computed(() => measurement.latest?.waist ?? null)

const waistTargetText = `цель ${MEASUREMENT_TARGETS.waist.min}–${MEASUREMENT_TARGETS.waist.max}`

/** <0 — метрика идёт вниз (что для веса/жира/талии хорошо). Порог — чтобы не красить шум. */
function downIsGoodTone(delta: number | null, epsilon = 0.05): Tone {
  if (delta == null || Math.abs(delta) < epsilon) return 'muted'
  return delta < 0 ? 'good' : 'warn'
}

function signed(value: number, digits = 1): string {
  const rounded = Math.abs(value).toFixed(digits)
  return value < 0 ? `−${rounded}` : `+${rounded}`
}

const weightDelta = computed(() => weightLog.weekOverWeekDeltaKg)
const weightTone = computed(() => downIsGoodTone(weightDelta.value))
const weightSub = computed(() =>
  weightDelta.value != null ? `${signed(weightDelta.value)} кг за нед` : '',
)

const paceSub = computed(() => {
  if (weightDelta.value == null) return ''
  if (Math.abs(weightDelta.value) < 0.05) return 'без изменений за нед'
  return weightDelta.value < 0
    ? `ближе на ${Math.abs(weightDelta.value).toFixed(1)} кг`
    : `дальше на ${Math.abs(weightDelta.value).toFixed(1)} кг`
})

const bodyFatDelta = computed(() => measurement.bodyFatDeltaPct)
const bodyFatTone = computed(() => downIsGoodTone(bodyFatDelta.value))
const bodyFatSub = computed(() =>
  bodyFatDelta.value != null ? `${signed(bodyFatDelta.value)}% с замера` : '',
)

const waistDelta = computed(() => measurement.waistDeltaCm)
const waistTone = computed(() => downIsGoodTone(waistDelta.value))
const waistSub = computed(() =>
  waistDelta.value != null ? `${signed(waistDelta.value, 0)} см · ${waistTargetText}` : waistTargetText,
)

/** Ккал сегодня — только факт + цель, без цветовой оценки: день может быть ещё не дописан. */
const todayKcal = computed(() => {
  const totals = diaryEntries.totalsForDate(todayISO())
  return totals.kcal > 0 ? totals.kcal : null
})

const tiles = computed(() => [
  {
    label: 'Вес (ср/нед)',
    value: weight.value != null ? `${weight.value} кг` : '—',
    sub: weightSub.value,
    tone: weightTone.value,
  },
  {
    label: 'До цели',
    value:
      remaining.value != null
        ? remaining.value === 0
          ? 'цель! 🎉'
          : `${remaining.value.toFixed(1)} кг`
        : '—',
    sub: paceSub.value,
    tone: weightTone.value,
  },
  {
    label: 'Жир',
    value: bodyFat.value != null ? `${bodyFat.value}%` : '—',
    sub: bodyFatSub.value,
    tone: bodyFatTone.value,
  },
  {
    label: 'Талия',
    value: waist.value != null ? `${waist.value} см` : '—',
    sub: waistSub.value,
    tone: waistTone.value,
  },
  {
    label: 'Ккал сегодня',
    value: todayKcal.value != null ? `${todayKcal.value}` : '—',
    sub: `цель ${DAILY_KCAL_RANGE.min}–${DAILY_KCAL_RANGE.max}`,
    tone: 'muted' as Tone,
  },
])
</script>

<style module>
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

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
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { WEIGHT_GOAL_KG } from '@/shared/config/goals'
import { DAILY_KCAL_RANGE, DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { DAILY_FIBER_RANGE } from '@/shared/config/nutrition'
import { estimateBodyFatPct } from '@/shared/lib/bodyFat'
import { todayISO } from '@/shared/lib/date'

type Tone = 'good' | 'warn' | 'muted'

const weightLog = useWeightLogStore()
const diaryEntries = useDiaryEntryStore()

const weight = computed(
  () => weightLog.currentWeekAverage ?? weightLog.byDateDesc[0]?.weight ?? null,
)
const remaining = computed(() =>
  weight.value != null ? Math.max(0, weight.value - WEIGHT_GOAL_KG) : null,
)

/** <0 — метрика идёт вниз (что для веса хорошо). Порог — чтобы не красить шум. */
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

/** Ккал сегодня — только факт + цель, без цветовой оценки: день может быть ещё не дописан. */
const todayKcal = computed(() => {
  const totals = diaryEntries.totalsForDate(todayISO())
  return totals.kcal > 0 ? totals.kcal : null
})

/** Клетчатка сегодня — как ккал, только факт: день ещё может быть не дописан. */
const todayFiber = computed(() => {
  const totals = diaryEntries.totalsForDate(todayISO())
  return totals.kcal > 0 ? totals.fiber : null
})

/**
 * % жира не по замерам (их больше нет), а по пропорции: сколько жира должно было
 * уйти по дефициту калорий (дневник, а где его нет — эффективное среднее),
 * вычитается из стартовой жировой массы. Так вес отдельно, жир отдельно —
 * а не «весь сброшенный вес = жир», что неверно из-за воды/мышц.
 */
const bodyFatPct = computed(() => {
  const start = weightLog.byDateAsc[0]
  const currentWeight = weightLog.smoothedWeight ?? weightLog.byDateDesc[0]?.weight ?? null
  if (!start || currentWeight == null) return null

  const weightByDate = new Map(weightLog.byDateAsc.map((w) => [w.date, w.weight]))
  const kcalByDate = new Map(diaryEntries.dailyKcalAsc.map((d) => [d.date, d.kcal]))
  const fallbackKcal = diaryEntries.effectiveDailyKcal(DAILY_KCAL_TARGET)

  return estimateBodyFatPct({
    startDate: start.date,
    startWeight: start.weight,
    toDate: todayISO(),
    weightAtTarget: currentWeight,
    weightAt: (date) => weightByDate.get(date) ?? weightLog.smoothedWeight,
    kcalAt: (date) => kcalByDate.get(date) ?? null,
    fallbackKcal,
  })
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
    label: 'Ккал сегодня',
    value: todayKcal.value != null ? `${todayKcal.value}` : '—',
    sub: `цель ${DAILY_KCAL_RANGE.min}–${DAILY_KCAL_RANGE.max}`,
    tone: 'muted' as Tone,
  },
  {
    label: 'Жир (оценка)',
    value: bodyFatPct.value != null ? `${bodyFatPct.value}%` : '—',
    sub: '',
    tone: 'muted' as Tone,
  },
  {
    label: 'Клетчатка сегодня',
    value: todayFiber.value != null ? `${todayFiber.value} г` : '—',
    sub: `цель ${DAILY_FIBER_RANGE.min}–${DAILY_FIBER_RANGE.max}`,
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

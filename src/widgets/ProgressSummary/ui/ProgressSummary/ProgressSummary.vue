<template>
  <div :class="$style.progress">
    <div :class="$style.row">
      <span :class="$style.label">Сброшено</span>
      <span :class="$style.value">{{ lostText }}</span>
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

    <div v-if="checkpoints.length" :class="$style.checkpoints">
      <div :class="$style.checkpointsHead">
        <span />
        <span :class="$style.checkpointsCol">Твой темп</span>
        <span :class="$style.checkpointsCol">Идеальный</span>
      </div>
      <div v-for="cp in checkpoints" :key="cp.weight" :class="$style.checkpointRow">
        <span :class="$style.checkpointWeight">{{ cp.weight }} кг</span>
        <span :class="$style.checkpointDate">{{ cp.actualDate ? formatHuman(cp.actualDate) : '—' }}</span>
        <span :class="$style.checkpointDateMuted">{{ cp.idealDate ? formatHuman(cp.idealDate) : '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWeightLogStore } from '@/entities/WeightLog'
import { useDiaryEntryStore } from '@/entities/DiaryEntry'
import { DAILY_KCAL_TARGET } from '@/shared/config/pace'
import { WEIGHT_GOAL_KG, WEIGHT_MILESTONES_KG } from '@/shared/config/goals'
import { idealDaysTo } from '@/shared/lib/pace'
import { addDays, formatHuman, todayISO } from '@/shared/lib/date'

const weightLog = useWeightLogStore()
const diaryEntries = useDiaryEntryStore()

const effectiveKcal = computed(() => diaryEntries.effectiveDailyKcal(DAILY_KCAL_TARGET))

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

const paceDiff = computed(() => weightLog.paceVsPlan(effectiveKcal.value)?.diffDays ?? null)

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

interface Checkpoint {
  weight: number
  /** По твоему текущему темпу (линейно от текущего веса). null — темп ещё не считается/стоит. */
  actualDate: string | null
  /** По плану от «чистой» точки отсчёта, на реальном среднем ккал. */
  idealDate: string | null
}

/** Ожидаемые даты — только для ещё не пройденных отметок (пройденным дата не нужна). */
const checkpoints = computed<Checkpoint[]>(() => {
  const start = weightLog.cleanStart
  const cur = current.value
  if (!start || !start.ready || cur == null) return []

  const rate = start.ratePerWeek
  const targets = [...WEIGHT_MILESTONES_KG, WEIGHT_GOAL_KG].filter((weight) => weight < cur)

  return targets.map((weight) => {
    const idealDays = idealDaysTo(start.baselineWeight, weight, effectiveKcal.value)
    const idealDate = addDays(start.baselineDate, idealDays)

    let actualDate: string | null = null
    if (rate != null && rate > 0) {
      const daysNeeded = (cur - weight) / (rate / 7)
      actualDate = addDays(todayISO(), Math.round(daysNeeded))
    }

    return { weight, actualDate, idealDate }
  })
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

.checkpoints {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-xs);
  padding-top: var(--space-s);
  border-top: 1px solid var(--border);
}

.checkpointsHead,
.checkpointRow {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-m);
}

.checkpointsHead {
  padding-bottom: var(--space-xs);
}

.checkpointsCol {
  min-width: 76px;
  text-align: right;
  font-size: var(--font-size-s);
  color: var(--text-muted);
}

.checkpointRow {
  padding: 2px 0;
}

.checkpointWeight {
  font-size: var(--font-size-s);
  color: var(--text-secondary);
}

.checkpointDate {
  min-width: 76px;
  text-align: right;
  font-size: var(--font-size-s);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.checkpointDateMuted {
  min-width: 76px;
  text-align: right;
  font-size: var(--font-size-s);
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
